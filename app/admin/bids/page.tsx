'use client'

import { Suspense, useCallback, useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import { useSearchParams } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

type BidStatus = 'pending' | 'contacted' | 'accepted' | 'declined' | 'closed'

interface Bid {
  id: string
  product_id: string | null
  piece_name: string
  name: string
  contact: string
  city_space: string
  bid_amount_inr: number
  spatial_notes: string | null
  status: BidStatus
  created_at: string
  comment_count: number
}

interface BidComment {
  id: string
  inquiry_id: string
  author_email: string | null
  body: string
  created_at: string
}

const STATUS_CONFIG: Record<BidStatus, { label: string; description: string; color: string }> = {
  pending:   { label: 'Pending',   description: 'Not yet reviewed by the studio',      color: 'bg-amber-100 text-amber-700' },
  contacted: { label: 'Contacted', description: 'We have reached out to the bidder',   color: 'bg-blue-100 text-blue-700' },
  accepted:  { label: 'Accepted',  description: 'Offer accepted — piece is placed',     color: 'bg-green-100 text-green-700' },
  declined:  { label: 'Declined',  description: 'Offer was not accepted',               color: 'bg-red-100 text-red-700' },
  closed:    { label: 'Closed',    description: 'No further action required',          color: 'bg-gray-100 text-gray-600' },
}

const STATUS_OPTIONS = Object.keys(STATUS_CONFIG) as BidStatus[]

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/** Email → mailto, otherwise treat as a WhatsApp number. */
function contactHref(contact: string) {
  if (contact.includes('@')) return `mailto:${contact}`
  let digits = contact.replace(/\D/g, '')
  if (digits.length === 10) digits = `91${digits}`
  return digits.length >= 10 ? `https://wa.me/${digits}` : null
}

export default function AdminBidsPage() {
  return (
    <Suspense fallback={<div className="font-sans text-sm text-forest/50">Loading…</div>}>
      <BidsView />
    </Suspense>
  )
}

function BidsView() {
  const supabase = useMemo(() => createClient(), [])
  const searchParams = useSearchParams()
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | BidStatus>('all')
  const [pieceFilter, setPieceFilter] = useState<string>(() => searchParams.get('product') ?? 'all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const getBids = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('one_of_one_inquiries')
      .select('id, product_id, piece_name, name, contact, city_space, bid_amount_inr, spatial_notes, status, created_at, one_of_one_inquiry_comments(count)')
      .order('created_at', { ascending: false })

    if (fetchError) return { rows: null, error: fetchError.message }

    const rows = (data ?? []).map((row) => {
      const { one_of_one_inquiry_comments: c, ...rest } = row as typeof row & {
        one_of_one_inquiry_comments?: { count: number }[]
      }
      return { ...rest, comment_count: c?.[0]?.count ?? 0 } as Bid
    })
    return { rows, error: null }
  }, [supabase])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await getBids()
    if (result.error) setError(result.error)
    else setBids(result.rows ?? [])
    setLoading(false)
  }, [getBids])

  useEffect(() => {
    let active = true
    getBids().then((result) => {
      if (!active) return
      if (result.error) setError(result.error)
      else setBids(result.rows ?? [])
      setLoading(false)
    })
    return () => { active = false }
  }, [getBids])

  const selected = bids.find((b) => b.id === selectedId) ?? null
  const closeDrawer = useCallback(() => setSelectedId(null), [])

  // Per-piece summary: bid count + highest bid
  const pieces = useMemo(() => {
    const map = new Map<string, { key: string; name: string; count: number; highest: number }>()
    for (const b of bids) {
      const key = b.product_id ?? b.piece_name
      const entry = map.get(key) ?? { key, name: b.piece_name, count: 0, highest: 0 }
      entry.count += 1
      entry.highest = Math.max(entry.highest, b.bid_amount_inr)
      map.set(key, entry)
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [bids])

  const pieceScoped = bids.filter((b) => pieceFilter === 'all' || (b.product_id ?? b.piece_name) === pieceFilter)

  const filtered = pieceScoped.filter((b) => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    const q = search.trim().toLowerCase()
    const matchesSearch = !q || [b.name, b.contact, b.city_space, b.piece_name, b.spatial_notes ?? '']
      .some((v) => v.toLowerCase().includes(q))
    return matchesStatus && matchesSearch
  })

  const statusCounts = pieceScoped.reduce<Record<BidStatus, number>>((acc, b) => {
    acc[b.status] += 1
    return acc
  }, { pending: 0, contacted: 0, accepted: 0, declined: 0, closed: 0 })

  async function updateStatus(bid: Bid, status: BidStatus) {
    setUpdating(true)
    setError('')
    const { error: updateError } = await supabase.from('one_of_one_inquiries').update({ status }).eq('id', bid.id)
    if (updateError) setError(updateError.message)
    else setBids((cur) => cur.map((b) => (b.id === bid.id ? { ...b, status } : b)))
    setUpdating(false)
  }

  async function deleteBid(bid: Bid) {
    if (!confirm(`Delete ${bid.name}'s bid of ${inr(bid.bid_amount_inr)} on ${bid.piece_name}? This also deletes its comments and cannot be undone.`)) return
    setUpdating(true)
    setError('')
    const { error: deleteError } = await supabase.from('one_of_one_inquiries').delete().eq('id', bid.id)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      setBids((cur) => cur.filter((b) => b.id !== bid.id))
      setSelectedId(null)
    }
    setUpdating(false)
  }

  const setCommentCount = useCallback((id: string, count: number) => {
    setBids((cur) => cur.map((b) => (b.id === id ? { ...b, comment_count: count } : b)))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-tighter text-forest">One of 1 Bids</h1>
          <p className="mt-1 font-sans text-sm text-forest/50">
            {bids.length} {bids.length === 1 ? 'bid' : 'bids'} across {pieces.length} {pieces.length === 1 ? 'piece' : 'pieces'}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-forest/20 px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.15em] text-forest transition-colors hover:bg-forest hover:text-cream"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Per-piece summary */}
      {pieces.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pieces.map((p) => {
            const active = pieceFilter === p.key
            return (
              <button
                type="button"
                key={p.key}
                onClick={() => setPieceFilter(active ? 'all' : p.key)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  active ? 'border-forest bg-forest text-cream' : 'border-forest/10 bg-cream text-forest hover:border-forest/30'
                }`}
              >
                <span className="block truncate font-sans text-sm font-bold">{p.name}</span>
                <span className={`mt-2 flex items-baseline justify-between gap-3 font-sans text-xs ${active ? 'text-sage' : 'text-forest/50'}`}>
                  <span>{p.count} {p.count === 1 ? 'bid' : 'bids'}</span>
                  <span>Highest <span className={`font-display text-xl tracking-tighter ${active ? 'text-cream' : 'text-forest'}`}>{inr(p.highest)}</span></span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Status counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {STATUS_OPTIONS.map((status) => (
          <button
            type="button"
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              statusFilter === status ? 'border-forest bg-forest text-cream' : 'border-forest/10 bg-cream text-forest hover:border-forest/30'
            }`}
          >
            <span className="block font-display text-3xl tracking-tighter">{statusCounts[status]}</span>
            <span className={`mt-1 block font-sans text-[10px] font-bold uppercase tracking-[0.16em] ${
              statusFilter === status ? 'text-sage' : 'text-forest/45'
            }`}>{STATUS_CONFIG[status].label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Search by name, contact, city, or notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-forest/20 bg-cream px-4 py-2.5 font-sans text-sm text-deep-obsidian placeholder:text-deep-obsidian/30 focus:border-forest focus:outline-none"
        />
        <select
          aria-label="Filter by piece"
          value={pieceFilter}
          onChange={(e) => setPieceFilter(e.target.value)}
          className="rounded-xl border border-forest/20 bg-cream px-4 py-2.5 font-sans text-sm text-deep-obsidian focus:border-forest focus:outline-none"
        >
          <option value="all">All pieces</option>
          {pieces.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
          {pieceFilter !== 'all' && !pieces.some((p) => p.key === pieceFilter) && (
            <option value={pieceFilter}>This piece (no bids)</option>
          )}
        </select>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | BidStatus)}
          className="rounded-xl border border-forest/20 bg-cream px-4 py-2.5 font-sans text-sm text-deep-obsidian focus:border-forest focus:outline-none"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-forest/10 bg-cream">
        {loading ? (
          <div className="py-20 text-center font-sans text-sm text-deep-obsidian/30">Loading bids…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center font-sans text-sm text-deep-obsidian/30">No bids found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forest/10">
                  {['Bid', 'Bidder', 'Piece', 'Status', 'Submitted', ''].map((h) => (
                    <th key={h} className="whitespace-nowrap px-5 py-3 text-left font-sans text-xs font-bold uppercase tracking-[0.15em] text-forest/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedId(b.id)}
                    className="cursor-pointer border-b border-forest/5 transition-colors last:border-0 hover:bg-forest/5"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-display text-xl tracking-tighter text-forest">{inr(b.bid_amount_inr)}</td>
                    <td className="max-w-60 px-5 py-4">
                      <p className="truncate font-sans text-sm font-bold text-deep-obsidian">{b.name}</p>
                      <p className="mt-0.5 truncate font-sans text-xs text-deep-obsidian/40">{b.contact} · {b.city_space}</p>
                    </td>
                    <td className="max-w-48 truncate px-5 py-4 font-sans text-sm text-deep-obsidian/70">{b.piece_name}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 font-sans text-xs font-bold ${STATUS_CONFIG[b.status].color}`}>
                        {STATUS_CONFIG[b.status].label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-sans text-xs text-deep-obsidian/40">{formatDate(b.created_at)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      {b.comment_count > 0 && (
                        <span className="mr-3 font-sans text-xs text-forest/50">💬 {b.comment_count}</span>
                      )}
                      <span className="font-sans text-xs font-bold text-forest">Open →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <BidDrawer
          key={selected.id}
          bid={selected}
          updating={updating}
          onClose={closeDrawer}
          onStatusChange={(s) => updateStatus(selected, s)}
          onDelete={() => deleteBid(selected)}
          onCommentCount={setCommentCount}
        />
      )}
    </div>
  )
}

function BidDrawer({
  bid,
  updating,
  onClose,
  onStatusChange,
  onDelete,
  onCommentCount,
}: {
  bid: Bid
  updating: boolean
  onClose: () => void
  onStatusChange: (s: BidStatus) => void
  onDelete: () => void
  onCommentCount: (id: string, count: number) => void
}) {
  const supabase = useMemo(() => createClient(), [])
  const [comments, setComments] = useState<BidComment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [commentError, setCommentError] = useState('')

  useEffect(() => {
    let active = true
    supabase
      .from('one_of_one_inquiry_comments')
      .select('id, inquiry_id, author_email, body, created_at')
      .eq('inquiry_id', bid.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) setCommentError(error.message)
        else setComments((data ?? []) as BidComment[])
        setLoadingComments(false)
      })
    return () => { active = false }
  }, [supabase, bid.id])

  useEffect(() => {
    const previous = document.body.style.overflow
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  async function addComment(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || saving) return
    setSaving(true)
    setCommentError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('one_of_one_inquiry_comments')
      .insert({ inquiry_id: bid.id, body, author_email: user?.email ?? null })
      .select('id, inquiry_id, author_email, body, created_at')
      .single()
    if (error) {
      setCommentError(error.message)
    } else {
      const next = [...comments, data as BidComment]
      setComments(next)
      onCommentCount(bid.id, next.length)
      setDraft('')
    }
    setSaving(false)
  }

  async function deleteComment(c: BidComment) {
    if (!confirm('Delete this comment?')) return
    const { error } = await supabase.from('one_of_one_inquiry_comments').delete().eq('id', c.id)
    if (error) {
      setCommentError(error.message)
      return
    }
    const next = comments.filter((x) => x.id !== c.id)
    setComments(next)
    onCommentCount(bid.id, next.length)
  }

  const href = contactHref(bid.contact)
  const label = 'mb-2 block font-sans text-xs font-bold uppercase tracking-[0.15em] text-deep-obsidian/40'

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-labelledby="bid-detail-title">
      <button type="button" aria-label="Close bid details" onClick={onClose} className="flex-1 bg-black/45" />
      <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-wool-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-deep-obsidian/10 bg-wool-white px-6 py-5">
          <div className="min-w-0">
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-forest/45">Bid on {bid.piece_name}</p>
            <h2 id="bid-detail-title" className="mt-1 font-display text-4xl tracking-tighter text-forest">{inr(bid.bid_amount_inr)}</h2>
            <p className="font-sans text-sm font-bold text-deep-obsidian">{bid.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-deep-obsidian/40 transition-colors hover:bg-deep-obsidian/5 hover:text-deep-obsidian"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 px-6 py-6">
          <div>
            <label htmlFor="bid-status" className={label}>Status</label>
            <select
              id="bid-status"
              value={bid.status}
              disabled={updating}
              onChange={(e) => onStatusChange(e.target.value as BidStatus)}
              className="w-full rounded-xl border border-forest/15 bg-cream px-4 py-3 font-sans text-sm font-bold text-forest focus:border-forest focus:outline-none disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
            <p className="mt-2 font-sans text-xs text-deep-obsidian/40">{STATUS_CONFIG[bid.status].description}</p>
          </div>

          <div className="rounded-2xl border border-forest/10 bg-cream p-5 space-y-3">
            <p className={label}>Bidder</p>
            <p className="font-sans text-sm font-bold text-deep-obsidian">{bid.name}</p>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="block break-all font-sans text-sm text-forest hover:underline">
                {bid.contact} {href.startsWith('https://wa.me') ? '· WhatsApp ↗' : ''}
              </a>
            ) : (
              <p className="break-all font-sans text-sm text-deep-obsidian/70">{bid.contact}</p>
            )}
            <p className="font-sans text-sm text-deep-obsidian/70">{bid.city_space}</p>
          </div>

          <div className="rounded-2xl border border-forest/10 bg-cream p-5">
            <p className={label}>Spatial notes</p>
            <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-deep-obsidian/70">
              {bid.spatial_notes || 'No spatial notes were provided.'}
            </p>
          </div>

          {/* Internal comments */}
          <div>
            <p className={label}>
              Internal comments <span className="font-normal normal-case tracking-normal text-deep-obsidian/30">— only visible to admins</span>
            </p>
            {loadingComments ? (
              <p className="font-sans text-sm text-deep-obsidian/30">Loading…</p>
            ) : comments.length === 0 ? (
              <p className="font-sans text-sm italic text-deep-obsidian/30">No comments yet.</p>
            ) : (
              <ul className="space-y-2">
                {comments.map((c) => (
                  <li key={c.id} className="group rounded-xl border border-forest/10 bg-cream px-4 py-3">
                    <p className="whitespace-pre-wrap font-sans text-sm text-deep-obsidian/80">{c.body}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="font-sans text-[11px] text-deep-obsidian/35">
                        {c.author_email ?? 'Admin'} · {formatDate(c.created_at)}
                      </p>
                      <button
                        type="button"
                        onClick={() => deleteComment(c)}
                        className="font-sans text-[11px] font-bold text-red-600/70 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={addComment} className="mt-3 space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Add a note for the team…"
                className="w-full resize-y rounded-xl border border-forest/15 bg-white px-4 py-3 font-sans text-sm text-deep-obsidian placeholder:text-deep-obsidian/30 focus:border-forest focus:outline-none"
              />
              <button
                type="submit"
                disabled={saving || !draft.trim()}
                className="w-full rounded-xl bg-forest py-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-sage hover:text-forest disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Add comment'}
              </button>
              {commentError && <p role="alert" className="font-sans text-xs text-red-700">{commentError}</p>}
            </form>
          </div>

          <p className="font-sans text-xs text-deep-obsidian/35">Submitted {formatDate(bid.created_at)}</p>

          <div className="border-t border-forest/10 pt-6">
            <button
              type="button"
              onClick={onDelete}
              disabled={updating}
              className="w-full rounded-xl border border-red-200 bg-red-50 py-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              Delete bid
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
