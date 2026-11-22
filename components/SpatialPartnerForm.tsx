'use client'

import { useRef, useState, type SyntheticEvent } from 'react'
import { Check, LoaderCircle } from 'lucide-react'

import { PRACTICE_TYPES, PROJECT_FOCUS, TIMELINES } from '@/lib/spatial-partners'

type SubmissionState =
  | { status: 'idle' | 'submitting' }
  | { status: 'success'; studio: string }
  | { status: 'error'; message: string }

const inputClassName =
  'w-full border-b border-forest/20 bg-transparent px-0 py-3 font-sans text-base text-forest outline-none transition-colors placeholder:text-forest/30 focus:border-forest'
const labelClassName = 'font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-forest/55'
const pillClassName =
  'flex cursor-pointer items-center gap-2 border border-forest/15 px-4 py-2.5 font-sans text-sm text-forest/70 transition-colors hover:border-forest/40 has-[:checked]:border-forest has-[:checked]:bg-forest has-[:checked]:text-cream has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest'

function Required() {
  return <span aria-hidden="true" className="text-muted-earth">*</span>
}

export default function SpatialPartnerForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const inFlightRef = useRef(false)
  const [submission, setSubmission] = useState<SubmissionState>({ status: 'idle' })

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlightRef.current) return

    const formData = new FormData(event.currentTarget)
    const projectFocus = formData.getAll('projectFocus').map(String)
    if (projectFocus.length === 0) {
      setSubmission({ status: 'error', message: 'Please choose at least one project focus.' })
      return
    }

    const payload = {
      studioName: formData.get('studioName'),
      leadDesigner: formData.get('leadDesigner'),
      practiceType: formData.get('practiceType'),
      regions: formData.get('regions'),
      portfolioUrl: formData.get('portfolioUrl'),
      projectFocus,
      timeline: formData.get('timeline'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      notes: formData.get('notes'),
      website: formData.get('website'),
    }

    inFlightRef.current = true
    setSubmission({ status: 'submitting' })
    try {
      const response = await fetch('/api/spatial-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        setSubmission({ status: 'error', message: result.error ?? 'We could not register your practice. Please try again.' })
        return
      }
      formRef.current?.reset()
      setSubmission({ status: 'success', studio: String(payload.studioName ?? '') })
    } catch {
      setSubmission({ status: 'error', message: 'We could not register your practice. Check your connection and try again.' })
    } finally {
      inFlightRef.current = false
    }
  }

  if (submission.status === 'success') {
    return (
      <div role="status" className="flex flex-col items-start py-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest text-cream">
          <Check className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-8 font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-forest/45">Pending review</p>
        <h2 className="mt-3 font-display text-5xl uppercase leading-[0.9] tracking-tighter text-maroon">
          {submission.studio || 'Your studio'} is on file
        </h2>
        <p className="mt-6 max-w-md font-sans text-base leading-relaxed text-forest/65">
          Thank you for registering. Our team reviews every practice personally and will be in touch within a few working days.
        </p>
        <button
          type="button"
          onClick={() => setSubmission({ status: 'idle' })}
          className="mt-10 font-sans text-xs font-bold uppercase tracking-[0.2em] text-forest/55 underline-offset-4 hover:text-forest hover:underline"
        >
          Register another practice
        </button>
      </div>
    )
  }

  const submitting = submission.status === 'submitting'

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-10">
      {/* Honeypot — hidden from people and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="sp-website">Website</label>
        <input id="sp-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="space-y-8">
        <legend className="mb-6 font-display text-2xl uppercase tracking-tighter text-forest">The practice</legend>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <label htmlFor="sp-studio" className={labelClassName}>Studio name <Required /></label>
            <input id="sp-studio" name="studioName" type="text" autoComplete="organization" required maxLength={160} placeholder="Studio Terrain" className={inputClassName} />
          </div>
          <div>
            <label htmlFor="sp-lead" className={labelClassName}>Lead designer <Required /></label>
            <input id="sp-lead" name="leadDesigner" type="text" autoComplete="name" required maxLength={120} placeholder="Full name" className={inputClassName} />
          </div>
          <div>
            <label htmlFor="sp-type" className={labelClassName}>Practice type <Required /></label>
            <select id="sp-type" name="practiceType" required defaultValue="" className={`${inputClassName} cursor-pointer appearance-none invalid:text-forest/30 [&>option]:text-forest`}>
              <option value="" disabled>Select one</option>
              {Object.entries(PRACTICE_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sp-regions" className={labelClassName}>City / regions <Required /></label>
            <input id="sp-regions" name="regions" type="text" required maxLength={200} placeholder="Bengaluru, Goa, Middle East" className={inputClassName} />
          </div>
        </div>
        <div>
          <label htmlFor="sp-portfolio" className={labelClassName}>Portfolio link <Required /></label>
          <input id="sp-portfolio" name="portfolioUrl" type="text" inputMode="url" autoComplete="url" required maxLength={500} placeholder="studioterrain.com or instagram.com/studioterrain" className={inputClassName} />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-6 font-display text-2xl uppercase tracking-tighter text-forest">The work</legend>
        <p id="sp-focus-label" className={labelClassName}>Project focus <Required /> <span className="font-normal normal-case tracking-normal text-forest/35">(choose all that apply)</span></p>
        <div role="group" aria-labelledby="sp-focus-label" className="mt-4 flex flex-wrap gap-2">
          {Object.entries(PROJECT_FOCUS).map(([value, label]) => (
            <label key={value} className={pillClassName}>
              <input type="checkbox" name="projectFocus" value={value} className="sr-only" />
              {label}
            </label>
          ))}
        </div>

        <p id="sp-timeline-label" className={`${labelClassName} mt-10`}>Timeline <Required /></p>
        <div role="radiogroup" aria-labelledby="sp-timeline-label" className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(TIMELINES).map(([value, label]) => (
            <label key={value} className={pillClassName}>
              <input type="radio" name="timeline" value={value} required className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-8">
        <legend className="mb-6 font-display text-2xl uppercase tracking-tighter text-forest">Contact</legend>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <label htmlFor="sp-email" className={labelClassName}>Email <Required /></label>
            <input id="sp-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="studio@example.com" className={inputClassName} />
          </div>
          <div>
            <label htmlFor="sp-phone" className={labelClassName}>Phone / WhatsApp <Required /></label>
            <input id="sp-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required minLength={10} maxLength={20} placeholder="+91 98765 43210" className={inputClassName} />
          </div>
        </div>
        <div>
          <label htmlFor="sp-notes" className={labelClassName}>
            Anything we should know? <span className="font-normal normal-case tracking-normal text-forest/35">(optional)</span>
          </label>
          <textarea id="sp-notes" name="notes" rows={3} maxLength={2000} placeholder="A current project, a palette you're chasing, sizes you often specify…" className={`${inputClassName} resize-y leading-relaxed`} />
        </div>
      </fieldset>

      <div className="space-y-4 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-3 bg-forest px-8 py-4 font-sans text-xs font-bold uppercase tracking-[0.24em] text-cream transition-colors hover:bg-deep-obsidian focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest disabled:cursor-wait disabled:opacity-65"
        >
          {submitting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitting ? 'Registering' : 'Register my practice'}
        </button>
        <p aria-live="polite" className="min-h-5 text-center font-sans text-sm text-red-700">
          {submission.status === 'error' ? submission.message : ''}
        </p>
      </div>
    </form>
  )
}
