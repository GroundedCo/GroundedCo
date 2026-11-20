'use client'

import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LoaderCircle } from 'lucide-react'

export interface OneOfOnePiece {
  id: string
  name: string
}

interface OneOfOneInquiryModalProps {
  piece: OneOfOnePiece | null
  onClose: () => void
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

const labelClassName = 'font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-forest/55'
const inputClassName =
  'w-full border-b border-forest/20 bg-transparent px-0 py-3 font-sans text-base text-forest outline-none transition-colors placeholder:text-forest/30 focus:border-forest'

const MICRO_COPY = 'Each “One of 1” placement is reviewed privately by our studio.'

const PATRONAGE = [
  {
    title: 'Full Ownership of the Design',
    body: 'Complete ownership rights to this singular work.',
  },
  {
    title: 'Grounded Loyal Aesthete Certification',
    body: 'Official studio certification recognizing your patronage and provenance.',
  },
  {
    title: 'Share in Respect of Original Art',
    body: 'A dedicated share honoring the original artwork.',
  },
]

function Required() {
  return <span aria-hidden="true" className="text-muted-earth"> *</span>
}

export default function OneOfOneInquiryModal({ piece, onClose }: OneOfOneInquiryModalProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const inFlightRef = useRef(false)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  // Reset when a new piece is opened
  useEffect(() => {
    if (piece) {
      setStatus('idle')
      setError('')
    }
  }, [piece])

  useEffect(() => {
    if (!piece) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [piece, onClose])

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!piece || inFlightRef.current) return

    const formData = new FormData(event.currentTarget)
    inFlightRef.current = true
    setStatus('submitting')
    setError('')

    try {
      const response = await fetch('/api/one-of-one-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: piece.id,
          name: formData.get('name'),
          contact: formData.get('contact'),
          citySpace: formData.get('citySpace'),
          bidAmount: formData.get('bidAmount'),
          spatialNotes: formData.get('spatialNotes'),
          website: formData.get('website'),
        }),
      })
      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        setStatus('error')
        setError(result.error ?? 'We could not send your inquiry. Please try again.')
        return
      }

      setStatus('success')
    } catch {
      setStatus('error')
      setError('We could not send your inquiry. Check your connection and try again.')
    } finally {
      inFlightRef.current = false
    }
  }

  return (
    <AnimatePresence>
      {piece && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-forest/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 z-[51] flex items-center justify-center p-4 md:p-8 pointer-events-none"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            onAnimationComplete={() => firstFieldRef.current?.focus()}
          >
            <div
              id="one-of-one-inquiry-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="one-of-one-inquiry-title"
              className="pointer-events-auto relative bg-cream w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl px-6 py-10 sm:px-12 sm:py-12"
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center text-forest/50 hover:text-forest bg-forest/5 hover:bg-forest/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {status === 'success' ? (
                <div className="text-center" aria-live="polite">
                  <p className="font-sans font-bold text-sage text-xs tracking-[0.2em] uppercase mb-4">
                    &ldquo;One of 1&rdquo; &middot; {piece.name}
                  </p>
                  <h2
                    id="one-of-one-inquiry-title"
                    className="font-display text-forest text-3xl sm:text-4xl uppercase tracking-tighter leading-[0.95] mb-6"
                  >
                    Congratulations on taking the first step toward becoming a Grounded aesthete.
                  </h2>
                  <p className="font-sans text-forest/70 text-sm leading-relaxed mb-10">
                    Your offer and spatial details have been received for consideration. Our studio will review your
                    submission privately and connect with you within 24 hours.
                  </p>

                  <div className="text-left border border-forest/15 rounded-[2rem] bg-forest/[0.03] p-6 sm:p-8">
                    <p className="font-sans font-bold text-forest text-xs tracking-[0.2em] uppercase pb-4 mb-5 border-b border-forest/10">
                      Provenance &amp; Patronage
                    </p>
                    <ul className="space-y-5">
                      {PATRONAGE.map((item) => (
                        <li key={item.title} className="flex gap-4">
                          <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sage" />
                          <div>
                            <p className="font-sans font-bold text-forest text-sm">{item.title}</p>
                            <p className="font-sans text-forest/60 text-sm leading-relaxed mt-1">{item.body}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="mt-8 font-sans text-xs text-forest/50 tracking-wide">{MICRO_COPY}</p>
                </div>
              ) : (
                <>
                  <p className="font-sans font-bold text-sage text-xs tracking-[0.2em] uppercase mb-3">
                    &ldquo;One of 1&rdquo; Designs Only
                  </p>
                  <h2
                    id="one-of-one-inquiry-title"
                    className="font-display text-forest text-4xl uppercase tracking-tighter leading-[0.9] mb-8 pr-10"
                  >
                    Inquire to Acquire
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-7">
                    {/* Honeypot — hidden from people, bots tend to fill it */}
                    <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-px w-px overflow-hidden opacity-0">
                      <label htmlFor="ooo-website">Website</label>
                      <input id="ooo-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                    </div>
                    <div>
                      <label htmlFor="ooo-name" className={labelClassName}>
                        Name<Required />
                      </label>
                      <input
                        ref={firstFieldRef}
                        id="ooo-name"
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
                      <label htmlFor="ooo-contact" className={labelClassName}>
                        Email / WhatsApp<Required />
                      </label>
                      <input
                        id="ooo-contact"
                        name="contact"
                        type="text"
                        autoComplete="email"
                        required
                        minLength={5}
                        maxLength={254}
                        placeholder="you@example.com or +91 98765 43210"
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <label htmlFor="ooo-city" className={labelClassName}>
                        City &amp; Space Type<Required />
                      </label>
                      <input
                        id="ooo-city"
                        name="citySpace"
                        type="text"
                        required
                        maxLength={200}
                        placeholder="e.g. Kochi · Living room"
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <label htmlFor="ooo-piece" className={labelClassName}>
                        Selected &ldquo;One of 1&rdquo; Piece
                      </label>
                      <input
                        id="ooo-piece"
                        name="piece"
                        type="text"
                        readOnly
                        value={piece.name}
                        className={`${inputClassName} cursor-default text-forest/70 focus:border-forest/20`}
                      />
                    </div>

                    <div>
                      <label htmlFor="ooo-bid" className={labelClassName}>
                        Bid Amount (INR)<Required />
                      </label>
                      <div className="flex items-center gap-2 border-b border-forest/20 focus-within:border-forest transition-colors">
                        <span aria-hidden="true" className="font-sans text-base text-forest/50">₹</span>
                        <input
                          id="ooo-bid"
                          name="bidAmount"
                          type="number"
                          inputMode="numeric"
                          required
                          min={1}
                          step={1}
                          placeholder="Your offer"
                          className="w-full bg-transparent px-0 py-3 font-sans text-base text-forest outline-none placeholder:text-forest/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="ooo-notes" className={labelClassName}>
                        Spatial Notes{' '}
                        <span className="font-normal normal-case tracking-normal text-forest/35">(optional)</span>
                      </label>
                      <textarea
                        id="ooo-notes"
                        name="spatialNotes"
                        rows={3}
                        maxLength={2000}
                        placeholder="Room size, light, flooring, where the piece will live…"
                        className={`${inputClassName} resize-y leading-relaxed`}
                      />
                    </div>

                    <div className="space-y-4 pt-2">
                      <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="flex w-full items-center justify-center gap-3 bg-forest text-cream font-sans font-bold text-xs tracking-[0.2em] uppercase px-8 py-4 rounded-[2.5rem] hover:bg-sage hover:text-forest transition-colors duration-300 disabled:cursor-wait disabled:opacity-65"
                      >
                        {status === 'submitting' && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                        Submit for Consideration
                      </button>

                      {error && (
                        <p aria-live="polite" className="text-center font-sans text-sm text-red-700">
                          {error}
                        </p>
                      )}

                      <p className="text-center font-sans text-xs text-forest/50 tracking-wide">{MICRO_COPY}</p>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
