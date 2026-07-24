'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type ConsultationStatus = 'pending' | 'contacted' | 'follow_up' | 'converted' | 'closed'

interface Consultation {
  id: string
  name: string
  mobile_number: string
  email: string | null
  image_path: string | null
  image_url: string | null
  notes: string | null
  status: ConsultationStatus
  created_at: string
}

const STATUS_CONFIG: Record<ConsultationStatus, { label: string; description: string; color: string }> = {
  pending: {
    label: 'Pending',
    description: 'Awaiting the first response',
    color: 'bg-amber-100 text-amber-700',
  },
  contacted: {
    label: 'Contacted',
    description: 'Initial contact has been made',
    color: 'bg-blue-100 text-blue-700',
  },
  follow_up: {
    label: 'Follow-up',
    description: 'Needs another conversation',
    color: 'bg-purple-100 text-purple-700',
  },
  converted: {
    label: 'Converted',
    description: 'Consultation became a sale',
    color: 'bg-green-100 text-green-700',
  },
  closed: {
    label: 'Closed',
    description: 'No further action required',
    color: 'bg-gray-100 text-gray-600',
  },
}

const STATUS_OPTIONS = Object.keys(STATUS_CONFIG) as ConsultationStatus[]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminConsultationsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ConsultationStatus>('all')
  const [selected, setSelected] = useState<Consultation | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const getConsultations = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('consultations')
      .select('id, name, mobile_number, email, image_path, notes, status, created_at')
      .order('created_at', { ascending: false })

    if (fetchError) {
      return { rows: null, error: fetchError.message }
    }

    const rows = (data ?? []) as Omit<Consultation, 'image_url'>[]
    const withImages = await Promise.all(rows.map(async (consultation) => {
      if (!consultation.image_path) return { ...consultation, image_url: null }

      const { data: signedImage } = await supabase.storage
        .from('consultation-images')
        .createSignedUrl(consultation.image_path, 3600)

      return { ...consultation, image_url: signedImage?.signedUrl ?? null }
    }))

    return { rows: withImages, error: null }
  }, [supabase])

  const fetchConsultations = useCallback(async () => {
    const result = await getConsultations()
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setConsultations(result.rows ?? [])
    setSelected(current => current ? result.rows?.find(item => item.id === current.id) ?? null : null)
    setLoading(false)
  }, [getConsultations])

  useEffect(() => {
    let active = true
    getConsultations().then(result => {
      if (!active) return
      if (result.error) setError(result.error)
      else setConsultations(result.rows ?? [])
      setLoading(false)
    })

    return () => { active = false }
  }, [getConsultations])

  useEffect(() => {
    if (!selected) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [selected])

  const filtered = consultations.filter(consultation => {
    const matchesStatus = statusFilter === 'all' || consultation.status === statusFilter
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [
      consultation.name,
      consultation.mobile_number,
      consultation.email ?? '',
      consultation.notes ?? '',
    ].some(value => value.toLowerCase().includes(query))

    return matchesStatus && matchesSearch
  })

  const statusCounts = consultations.reduce<Record<ConsultationStatus, number>>((counts, consultation) => {
    counts[consultation.status] += 1
    return counts
  }, { pending: 0, contacted: 0, follow_up: 0, converted: 0, closed: 0 })

  async function updateStatus(consultation: Consultation, status: ConsultationStatus) {
    setUpdating(consultation.id)
    setError('')

    const { error: updateError } = await supabase
      .from('consultations')
      .update({ status })
      .eq('id', consultation.id)

    if (updateError) {
      setError(updateError.message)
      setUpdating(null)
      return
    }

    setConsultations(current => current.map(item => (
      item.id === consultation.id ? { ...item, status } : item
    )))
    setSelected(current => current?.id === consultation.id ? { ...current, status } : current)
    setUpdating(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-tighter text-forest">Consultations</h1>
          <p className="mt-1 font-sans text-sm text-forest/50">
            {consultations.length} consultation {consultations.length === 1 ? 'request' : 'requests'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            setError('')
            fetchConsultations()
          }}
          className="rounded-lg border border-forest/20 px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.15em] text-forest transition-colors hover:bg-forest hover:text-cream"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {STATUS_OPTIONS.map(status => (
          <button
            type="button"
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              statusFilter === status
                ? 'border-forest bg-forest text-cream'
                : 'border-forest/10 bg-cream text-forest hover:border-forest/30'
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
          placeholder="Search by name, mobile, email, or notes…"
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="flex-1 rounded-xl border border-forest/20 bg-cream px-4 py-2.5 font-sans text-sm text-deep-obsidian placeholder:text-deep-obsidian/30 focus:border-forest focus:outline-none"
        />
        <select
          aria-label="Filter consultations by status"
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value as 'all' | ConsultationStatus)}
          className="rounded-xl border border-forest/20 bg-cream px-4 py-2.5 font-sans text-sm text-deep-obsidian focus:border-forest focus:outline-none"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-forest/10 bg-cream">
        {loading ? (
          <div className="py-20 text-center font-sans text-sm text-deep-obsidian/30">Loading consultations…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center font-sans text-sm text-deep-obsidian/30">No consultations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forest/10">
                  {['Customer', 'Contact', 'Status', 'Submitted', 'Action'].map(heading => (
                    <th key={heading} className="whitespace-nowrap px-5 py-3 text-left font-sans text-xs font-bold uppercase tracking-[0.15em] text-forest/40">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(consultation => (
                  <tr key={consultation.id} className="border-b border-forest/5 transition-colors last:border-0 hover:bg-forest/5">
                    <td className="max-w-60 px-5 py-4">
                      <p className="truncate font-sans text-sm font-bold text-deep-obsidian">{consultation.name}</p>
                      <p className="mt-0.5 truncate font-sans text-xs text-deep-obsidian/40">
                        {consultation.notes || 'No additional notes'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <a href={`tel:${consultation.mobile_number}`} className="block whitespace-nowrap font-sans text-sm text-deep-obsidian hover:text-forest">
                        {consultation.mobile_number}
                      </a>
                      <p className="mt-0.5 max-w-52 truncate font-sans text-xs text-deep-obsidian/40">{consultation.email || 'No email'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 font-sans text-xs font-bold ${STATUS_CONFIG[consultation.status].color}`}>
                        {STATUS_CONFIG[consultation.status].label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-sans text-xs text-deep-obsidian/40">{formatDate(consultation.created_at)}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setSelected(consultation)}
                        className="font-sans text-xs font-bold text-forest hover:underline"
                      >
                        View details
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
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-labelledby="consultation-detail-title">
          <button
            type="button"
            aria-label="Close consultation details"
            onClick={() => setSelected(null)}
            className="flex-1 bg-black/45"
          />
          <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-wool-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-deep-obsidian/10 bg-wool-white px-6 py-5">
              <div>
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-forest/45">Consultation request</p>
                <h2 id="consultation-detail-title" className="mt-1 font-display text-3xl uppercase tracking-tighter text-deep-obsidian">{selected.name}</h2>
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
                <label htmlFor="consultation-status" className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.15em] text-deep-obsidian/40">
                  Status
                </label>
                <select
                  id="consultation-status"
                  value={selected.status}
                  disabled={updating === selected.id}
                  onChange={event => updateStatus(selected, event.target.value as ConsultationStatus)}
                  className="w-full rounded-xl border border-forest/15 bg-cream px-4 py-3 font-sans text-sm font-bold text-forest focus:border-forest focus:outline-none disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>
                  ))}
                </select>
                <p className="mt-2 font-sans text-xs text-deep-obsidian/40">{STATUS_CONFIG[selected.status].description}</p>
              </div>

              {selected.image_url && (
                <div>
                  <p className="mb-2 font-sans text-xs font-bold uppercase tracking-[0.15em] text-deep-obsidian/40">Shared image</p>
                  <a href={selected.image_url} target="_blank" rel="noopener noreferrer" className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-forest/10 bg-cream">
                    <Image src={selected.image_url} alt={`Reference shared by ${selected.name}`} fill unoptimized className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" sizes="(max-width: 512px) 100vw, 512px" />
                    <span className="absolute bottom-3 right-3 rounded-full bg-forest/90 px-3 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-cream">Open full image ↗</span>
                  </a>
                </div>
              )}

              <div className="rounded-2xl border border-forest/10 bg-cream p-5">
                <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.15em] text-deep-obsidian/40">Contact</p>
                <p className="font-sans text-sm font-bold text-deep-obsidian">{selected.name}</p>
                <a href={`tel:${selected.mobile_number}`} className="mt-2 block font-sans text-sm text-forest hover:underline">{selected.mobile_number}</a>
                {selected.email && <a href={`mailto:${selected.email}`} className="mt-1 block break-all font-sans text-sm text-forest hover:underline">{selected.email}</a>}
              </div>

              <div className="rounded-2xl border border-forest/10 bg-cream p-5">
                <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.15em] text-deep-obsidian/40">Notes</p>
                <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-deep-obsidian/70">{selected.notes || 'No additional notes were provided.'}</p>
              </div>

              <p className="font-sans text-xs text-deep-obsidian/35">Submitted {formatDate(selected.created_at)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
