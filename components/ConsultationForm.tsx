'use client'

import { useRef, useState, type SyntheticEvent } from 'react'
import { ImagePlus, LoaderCircle, X } from 'lucide-react'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

type SubmissionState =
  | { status: 'idle'; message: '' }
  | { status: 'submitting'; message: '' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

const inputClassName =
  'w-full border-b border-forest/20 bg-transparent px-0 py-3 font-sans text-base text-forest outline-none transition-colors placeholder:text-forest/30 focus:border-forest'

export default function ConsultationForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submissionInFlightRef = useRef(false)
  const [fileName, setFileName] = useState('')
  const [submission, setSubmission] = useState<SubmissionState>({ status: 'idle', message: '' })

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submissionInFlightRef.current) return

    const formData = new FormData(event.currentTarget)
    const image = formData.get('image')

    if (image instanceof File && image.size > MAX_IMAGE_SIZE) {
      setSubmission({ status: 'error', message: 'Please choose an image smaller than 5 MB.' })
      return
    }

    submissionInFlightRef.current = true
    setSubmission({ status: 'submitting', message: '' })

    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        body: formData,
      })
      const result = (await response.json()) as { error?: string; message?: string }

      if (!response.ok) {
        setSubmission({
          status: 'error',
          message: result.error ?? 'We could not send your request. Please try again.',
        })
        return
      }

      formRef.current?.reset()
      setFileName('')
      setSubmission({
        status: 'success',
        message: result.message ?? 'Your consultation request has been received.',
      })
    } catch {
      setSubmission({
        status: 'error',
        message: 'We could not send your request. Check your connection and try again.',
      })
    } finally {
      submissionInFlightRef.current = false
    }
  }

  function clearImage() {
    if (fileInputRef.current) fileInputRef.current.value = ''
    setFileName('')
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8" encType="multipart/form-data">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="consult-name" className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-forest/55">
            Name <span aria-hidden="true" className="text-muted-earth">*</span>
          </label>
          <input
            id="consult-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            placeholder="Your name"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="consult-mobile" className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-forest/55">
            Mobile number <span aria-hidden="true" className="text-muted-earth">*</span>
          </label>
          <input
            id="consult-mobile"
            name="mobileNumber"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            minLength={10}
            maxLength={20}
            placeholder="+91 98765 43210"
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <label htmlFor="consult-email" className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-forest/55">
          Email <span className="font-normal normal-case tracking-normal text-forest/35">(optional)</span>
        </label>
        <input
          id="consult-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          placeholder="you@example.com"
          className={inputClassName}
        />
      </div>

      <div>
        <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-forest/55">
          Image <span className="font-normal normal-case tracking-normal text-forest/35">(optional)</span>
        </span>
        <div className="mt-3 flex min-h-24 items-center border border-dashed border-forest/25 bg-forest/[0.025] px-5 py-4 transition-colors focus-within:border-forest">
          <input
            ref={fileInputRef}
            id="consult-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
          />
          {fileName ? (
            <div className="flex w-full items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-sans text-sm font-semibold text-forest">{fileName}</p>
                <p className="mt-1 font-sans text-xs text-forest/40">Ready to upload</p>
              </div>
              <button
                type="button"
                onClick={clearImage}
                aria-label="Remove selected image"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-forest/50 transition-colors hover:bg-forest/10 hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <label htmlFor="consult-image" className="flex w-full cursor-pointer items-center gap-4 text-forest/55">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest/8">
                <ImagePlus className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-sans text-sm font-semibold text-forest">Choose a room or rug image</span>
                <span className="mt-1 block font-sans text-xs">JPG, PNG or WebP, up to 5 MB</span>
              </span>
            </label>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="consult-notes" className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-forest/55">
          Anything else to be noted? <span className="font-normal normal-case tracking-normal text-forest/35">(optional)</span>
        </label>
        <textarea
          id="consult-notes"
          name="notes"
          rows={4}
          maxLength={2000}
          placeholder="Tell us about your space, preferred colours, dimensions, or anything else that may help."
          className={`${inputClassName} resize-y leading-relaxed`}
        />
      </div>

      <div className="space-y-4 pt-2">
        <button
          type="submit"
          disabled={submission.status === 'submitting'}
          className="flex w-full items-center justify-center gap-3 bg-forest px-8 py-4 font-sans text-xs font-bold uppercase tracking-[0.24em] text-cream transition-colors hover:bg-deep-obsidian focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest disabled:cursor-wait disabled:opacity-65"
        >
          {submission.status === 'submitting' && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submission.status === 'submitting' ? 'Sending request' : 'Request consultation'}
        </button>

        <p
          aria-live="polite"
          className={`min-h-5 text-center font-sans text-sm ${
            submission.status === 'error' ? 'text-red-700' : 'text-forest/65'
          }`}
        >
          {submission.message}
        </p>
      </div>
    </form>
  )
}
