'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import {
  PARTNER_STATUSES,
  PRACTICE_TYPES,
  PROJECT_FOCUS,
  TIMELINES,
  type PartnerStatus,
} from '@/lib/spatial-partners'

interface Partner {
  id: string
  studio_name: string
  lead_designer: string
  practice_type: keyof typeof PRACTICE_TYPES
  regions: string
  portfolio_url: string
  project_focus: string[]
  timeline: keyof typeof TIMELINES
  email: string
  phone: string
  notes: string | null
  status: PartnerStatus
  created_at: string
}

const STATUS_COLOR: Record<PartnerStatus, string> = {
  pending_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  waitlisted: 'bg-blue-100 text-blue-700',
  declined: 'bg-gray-100 text-gray-600',
}

const STATUS_OPTIONS = Object.keys(PARTNER_STATUSES) as PartnerStatus[]

const label = <T extends Record<string, string>>(map: T, key: string) => map[key as keyof T] ?? key

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminPartnersPage() {
  const supabase = useMemo(() => createClient(), [])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | PartnerStatus>('all')
  const [selected, setSelected] = useState<Partner | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('spatial_partners')
      .select('id, studio_name, lead_designer, practice_type, regions, portfolio_url, project_focus, timeline, email, phone, notes, status, created_at')
      .order('created_at', { ascending: false })
    return { rows: (data ?? []) as Partner[], error: fetchError?.message ?? null }
  }, [supabase])

  useEffect(() => {
    let active = true
    load().then(({ rows, error: e }) => {
      if (!active) return
      if (e) setError(e)
      else setPartners(rows)
      setLoading(false)
    })
    return () => { active = false }
  }, [load])

  useEffect(() => {
    if (!selected) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null) }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', close)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', close)
    }
  }, [selected])

  async function refresh() {
    setLoading(true)
    setError('')
    const { rows, error: e } = await load()
    if (e) setError(e)
    else {
      setPartners(rows)
      setSelected(current => current ? rows.find(r => r.id === current.id) ?? null : null)
    }
    setLoading(false)
  }

  async function updateStatus(partner: Partner, status: PartnerStatus) {
    setUpdating(partner.id)
    setError('')
    const { error: updateError } = await supabase.from('spatial_partners').update({ status }).eq('id', partner.id)
    if (updateError) {
      setError(updateError.message)
    } else {
      setPartners(current => current.map(p => (p.id === partner.id ? { ...p, status } : p)))
      setSelected(current => (current?.id === partner.id ? { ...current, status } : current))
    }
    setUpdating(null)
  }

  const query = search.trim().toLowerCase()
  const filtered = partners.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (!query) return true
    return [p.studio_name, p.lead_designer, p.regions, p.email, p.phone, p.notes ?? '']
      .some(v => v.toLowerCase().includes(query))
  })

  const counts = partners.reduce<Record<PartnerStatus, number>>((acc, p) => {
    acc[p.status] += 1
    return acc
  }, { pending_review: 0, approved: 0, waitlisted: 0, declined: 0 })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-tighter text-forest">Spatial Partners</h1>
          <p className="mt-1 font-sans text-sm text-forest/50">
            {partners.length} registered {partners.length === 1 ? 'practice' : 'practices'}
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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {STATUS_OPTIONS.map(status => (
          <button
            type="button"
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              statusFilter === status ? 'border-forest bg-forest text-cream' : 'border-forest/10 bg-cream text-forest hover:border-forest/30'
            }`}
          >
            <span className="block font-display text-3xl tracking-tighter">{counts[status]}</span>
            <span className={`mt-1 block font-sans text-[10px] font-bold uppercase tracking-[0.16em] ${
              statusFilter === status ? 'text-sage' : 'text-forest/45'
            }`}>{PARTNER_STATUSES[status]}</span>
          </button>
        ))}
      </div>

      <input
        type="search"
        placeholder="Search by studio, designer, region, email, phone or notes…"
        value={search}
        onChange={event => setSearch(event.target.value)}
        className="w-full rounded-xl border border-forest/20 bg-cream px-4 py-2.5 font-sans text-sm text-deep-obsidian placeholder:text-deep-obsidian/30 focus:border-forest focus:outline-none"
      />

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-forest/10 bg-cream">
        {loading ? (
          <div className="py-20 text-center font-sans text-sm text-deep-obsidian/30">Loading partners…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center font-sans text-sm text-deep-obsidian/30">No registrations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forest/10">
                  {['Studio', 'Practice', 'Timeline', 'Status', 'Submitted', 'Action'].map(h => (
                    <th key={h} className="whitespace-nowrap px-5 py-3 text-left font-sans text-xs font-bold uppercase tracking-[0.15em] text-forest/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-forest/5 transition-colors last:border-0 hover:bg-forest/5">
                    <td className="max-w-64 px-5 py-4">
                      <p className="truncate font-sans text-sm font-bold text-deep-obsidian">{p.studio_name}</p>
                      <p className="mt-0.5 truncate font-sans text-xs text-deep-obsidian/40">{p.lead_designer} · {p.regions}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-sans text-sm text-deep-obsidian/70">{label(PRACTICE_TYPES, p.practice_type)}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-sans text-sm text-deep-obsidian/70">{label(TIMELINES, p.timeline)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 font-sans text-xs font-bold ${STATUS_COLOR[p.status]}`}>
                        {PARTNER_STATUSES[p.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-sans text-xs text-deep-obsidian/40">{formatDate(p.created_at)}</td>
                    <td className="px-5 py-4">
                      <button type="button" onClick={() => setSelected(p)} className="font-sans text-xs font-bold text-forest hover:underline">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-labelledby="partner-detail-title">
          <button type="button" aria-label="Close partner details" onClick={() => setSelected(null)} className="flex-1 bg-black/45" />
          <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-wool-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-deep-obsidian/10 bg-wool-white px-6 py-5">
              <div>
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-forest/45">{label(PRACTICE_TYPES, selected.practice_type)}</p>
                <h2 id="partner-detail-title" className="mt-1 font-display text-3xl uppercase tracking-tighter text-deep-obsidian">{selected.studio_name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-deep-obsidian/40 transition-colors hover:bg-deep-obsidian/5 hover:text-deep-obsidian"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-6 px-6 py-6">
              <div>
                <label htmlFor="partner-status" className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.15em] text-deep-obsidian/40">Status</label>
                <select
                  id="partner-status"
                  value={selected.status}
                  disabled={updating === selected.id}
                  onChange={event => updateStatus(selected, event.target.value as PartnerStatus)}
                  className="w-full rounded-xl border border-forest/15 bg-cream px-4 py-3 font-sans text-sm font-bold text-forest focus:border-forest focus:outline-none disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{PARTNER_STATUSES[s]}</option>)}
                </select>
              </div>

              <dl className="space-y-4 rounded-2xl border border-forest/10 bg-cream p-5 font-sans text-sm">
                {[
                  ['Lead designer', selected.lead_designer],
                  ['City / regions', selected.regions],
                  ['Project focus', selected.project_focus.map(f => label(PROJECT_FOCUS, f)).join(', ')],
                  ['Timeline', label(TIMELINES, selected.timeline)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-bold uppercase tracking-[0.15em] text-deep-obsidian/40">{k}</dt>
                    <dd className="mt-1 text-deep-obsidian">{v}</dd>
                  </div>
                ))}
                <div>
                  <dt className="text-xs font-bold uppercase tracking-[0.15em] text-deep-obsidian/40">Portfolio</dt>
                  <dd className="mt-1">
                    <a href={selected.portfolio_url} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-forest hover:underline">
                      {selected.portfolio_url} ↗
                    </a>
                  </dd>
                </div>
              </dl>

              <div className="rounded-2xl border border-forest/10 bg-cream p-5">
                <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.15em] text-deep-obsidian/40">Contact</p>
                <a href={`mailto:${selected.email}`} className="block break-all font-sans text-sm text-forest hover:underline">{selected.email}</a>
                <a href={`tel:${selected.phone}`} className="mt-1 block font-sans text-sm text-forest hover:underline">{selected.phone}</a>
              </div>

              <div className="rounded-2xl border border-forest/10 bg-cream p-5">
                <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.15em] text-deep-obsidian/40">Notes</p>
                <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-deep-obsidian/70">{selected.notes || 'No notes were provided.'}</p>
              </div>

              <p className="font-sans text-xs text-deep-obsidian/35">Registered {formatDate(selected.created_at)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
