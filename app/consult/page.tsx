import type { Metadata } from 'next'
import Link from 'next/link'

import ConsultationForm from '@/components/ConsultationForm'

export const metadata: Metadata = {
  title: 'Consult — Grounded',
  description: 'Share your space and preferences with Grounded for a personal rug consultation.',
}

export default function ConsultPage() {
  return (
    <main className="min-h-screen bg-cream text-forest">
      <nav className="border-b border-forest/10 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-12">
          <Link
            href="/"
            className="flex items-center gap-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-forest/50 transition-colors hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
          >
            <span aria-hidden="true">←</span>
            Back home
          </Link>
          <span className="font-display text-lg uppercase tracking-tighter text-forest">Grounded</span>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-6 py-16 md:px-12 md:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
        <header className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-7 font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-forest/45">
            A rug chosen around your space
          </p>
          <h1 className="font-display text-7xl uppercase leading-[0.86] tracking-tighter text-maroon sm:text-8xl lg:text-9xl">
            Let&apos;s<br />Consult
          </h1>
          <div className="mt-9 h-px w-20 bg-forest/25" />
          <p className="mt-8 max-w-sm font-sans text-base leading-relaxed text-forest/60">
            Share a few details about your room and what you are looking for. Our team will get in touch to help you find the right piece.
          </p>
          <p className="mt-5 font-sans text-xs leading-relaxed text-forest/40">
            Fields marked with * are required.
          </p>
        </header>

        <div className="border border-forest/10 bg-wool-white p-6 shadow-[0_30px_80px_-50px_rgba(1,71,46,0.45)] sm:p-10 md:p-12">
          <ConsultationForm />
        </div>
      </section>
    </main>
  )
}
