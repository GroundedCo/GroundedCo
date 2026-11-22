import type { Metadata } from 'next'
import Link from 'next/link'

import SpatialPartnerForm from '@/components/SpatialPartnerForm'

export const metadata: Metadata = {
  title: 'Spatial Partner Registry — The Grounded Company',
  description:
    'A private directory for architects, interior designers and spatial studios: priority One-of-1 previews, bespoke rug commissions and tactile material dossiers.',
}

const BENEFITS = [
  {
    n: '01',
    title: 'Priority Drop Previews',
    body: 'See every One-of-1 piece before it opens for placement, with time to hold it for a client.',
  },
  {
    n: '02',
    title: 'Bespoke Commission Consideration',
    body: 'Custom sizing and palettes, woven around the proportions and light of your project.',
  },
  {
    n: '03',
    title: 'Tactile Material Dossiers',
    body: '4000 GSM NZ wool and Zero Latex swatch kits, for your studio library and client presentations.',
  },
]

export default function SpatialPartnersPage() {
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

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-6 py-16 md:px-12 md:py-24 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <header className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-7 font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-forest/45">
            For architects, interior designers &amp; spatial studios
          </p>
          <h1 className="font-display text-6xl uppercase leading-[0.86] tracking-tighter text-maroon sm:text-7xl lg:text-8xl">
            Spatial<br />Partner<br />Registry
          </h1>
          <div className="mt-9 h-px w-20 bg-forest/25" />
          <p className="mt-8 max-w-sm font-sans text-base leading-relaxed text-forest/60">
            A private directory of the practices we weave for. Register your studio and our team will review it for partnership.
          </p>

          <ol className="mt-12 space-y-7 border-t border-forest/10 pt-8">
            {BENEFITS.map((b) => (
              <li key={b.n} className="grid grid-cols-[2.25rem_1fr] gap-x-3">
                <span className="pt-1 font-sans text-[11px] font-bold tracking-[0.15em] text-muted-earth">{b.n}</span>
                <div>
                  <h2 className="font-display text-xl uppercase tracking-tighter text-forest">{b.title}</h2>
                  <p className="mt-1.5 max-w-sm font-sans text-sm leading-relaxed text-forest/55">{b.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-10 font-sans text-xs leading-relaxed text-forest/40">
            Fields marked with * are required. Registrations are reviewed by our team before partner benefits begin.
          </p>
        </header>

        <div className="relative border border-forest/10 bg-wool-white p-6 shadow-[0_30px_80px_-50px_rgba(1,71,46,0.45)] sm:p-10 md:p-12">
          <SpatialPartnerForm />
        </div>
      </section>
    </main>
  )
}
