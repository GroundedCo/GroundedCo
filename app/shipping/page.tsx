import Link from 'next/link'
import { createAnonServerClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Shipping & Delivery — Grounded',
  description: 'Shipping, delivery timelines, and returns information for Grounded rugs.',
}

interface SitePage {
  slug: string
  title: string
  content: string
  updated_at: string
}

const FALLBACK: SitePage = {
  slug: 'shipping',
  title: 'Shipping & Delivery',
  content: 'We offer free shipping across India. Delivery typically takes 5–10 business days depending on your location. For any queries, please contact us.',
  updated_at: new Date().toISOString(),
}

async function getSitePage(slug: string): Promise<SitePage> {
  try {
    const supabase = createAnonServerClient()
    const { data, error } = await supabase
      .from('site_pages')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) return FALLBACK
    return data as SitePage
  } catch {
    return FALLBACK
  }
}

export default async function ShippingPage() {
  const page = await getSitePage('shipping')

  const updatedDate = new Date(page.updated_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Parse content into sections: lines starting with ## become section cards
  const sections: { heading: string; body: string[] }[] = []
  let currentHeading = ''
  let currentBody: string[] = []

  page.content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      if (currentHeading || currentBody.length) {
        sections.push({ heading: currentHeading, body: currentBody.filter(Boolean) })
      }
      currentHeading = trimmed.replace(/^#{1,2}\s/, '')
      currentBody = []
    } else {
      currentBody.push(trimmed)
    }
  })
  if (currentHeading || currentBody.length) {
    sections.push({ heading: currentHeading, body: currentBody.filter(Boolean) })
  }

  const hasSections = sections.some((s) => s.heading)

  return (
    <main className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-forest/10">
        <div className="max-w-4xl mx-auto px-6 md:px-12 flex items-center justify-between h-16">
          <Link
            href="/"
            className="font-sans text-forest/50 text-xs tracking-[0.2em] uppercase hover:text-forest transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </Link>
          <span className="font-display text-forest text-xl uppercase tracking-tighter">Grounded</span>
          <div className="w-16" />
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 pt-20 pb-12">
        <p className="font-sans font-bold text-forest/40 text-xs tracking-[0.25em] uppercase mb-4">Delivery</p>
        <h1 className="font-display text-forest text-5xl sm:text-7xl uppercase tracking-tighter leading-none mb-6">
          {page.title}
        </h1>
        <p className="font-sans text-forest/40 text-sm">Last updated: {updatedDate}</p>
      </section>

      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="border-t border-forest/10" />
      </div>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 py-16">
        {hasSections ? (
          // Render as visual section cards when headings exist
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sections.map((section, i) => (
              <div key={i} className="border border-forest/10 p-8 bg-cream">
                {section.heading && (
                  <h2 className="font-display text-forest text-xl uppercase tracking-tighter mb-4">
                    {section.heading}
                  </h2>
                )}
                <div className="space-y-3">
                  {section.body.map((para, j) => (
                    para ? (
                      <p key={j} className="font-sans text-forest/70 text-sm leading-relaxed">{para}</p>
                    ) : (
                      <div key={j} className="h-1" />
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Plain text fallback
          <div className="max-w-2xl space-y-5">
            {page.content.split('\n').filter((p) => p.trim()).map((para, i) => (
              <p key={i} className="font-sans text-forest/70 text-base leading-relaxed">{para}</p>
            ))}
          </div>
        )}
      </section>

      {/* Trust strip */}
      <section className="bg-forest py-16">
        <div className="max-w-4xl mx-auto px-6 md:px-12 grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          {[
            { label: 'Free Shipping', desc: 'Across all of India, on every order.' },
            { label: '30-Day Returns', desc: 'No questions asked. Free reverse pickup.' },
            { label: 'Secure Packaging', desc: 'Roll-packed and protected for safe delivery.' },
          ].map((item) => (
            <div key={item.label}>
              <p className="font-display text-sage text-xl uppercase tracking-tighter mb-2">{item.label}</p>
              <p className="font-sans text-sage/60 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer strip */}
      <section className="border-t border-forest/10 py-10">
        <div className="max-w-4xl mx-auto px-6 md:px-12 flex flex-wrap gap-6 items-center justify-between">
          <span className="font-display text-forest/30 text-2xl uppercase tracking-tighter">Grounded</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="font-sans font-bold text-forest/40 text-xs tracking-[0.2em] uppercase hover:text-forest transition-colors">Privacy</Link>
            <Link href="/contact" className="font-sans font-bold text-forest/40 text-xs tracking-[0.2em] uppercase hover:text-forest transition-colors">Contact</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
