import Link from 'next/link'
import { createAnonServerClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Privacy Policy — Grounded',
  description: 'The Grounded privacy policy and data practices.',
}

interface SitePage {
  slug: string
  title: string
  content: string
  updated_at: string
}

const FALLBACK: SitePage = {
  slug: 'privacy',
  title: 'Privacy Policy',
  content: 'Our full privacy policy is being updated. Please check back soon or contact us at hello@grounded.in.',
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

export default async function PrivacyPage() {
  const page = await getSitePage('privacy')

  const updatedDate = new Date(page.updated_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

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
        <p className="font-sans font-bold text-forest/40 text-xs tracking-[0.25em] uppercase mb-4">Legal</p>
        <h1 className="font-display text-forest text-5xl sm:text-7xl uppercase tracking-tighter leading-none mb-6">
          {page.title}
        </h1>
        <p className="font-sans text-forest/40 text-sm">Last updated: {updatedDate}</p>
      </section>

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="border-t border-forest/10" />
      </div>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 py-16">
        <div className="max-w-2xl space-y-6">
          {page.content.split('\n').map((para, i) => {
            const trimmed = para.trim()
            if (!trimmed) return <div key={i} className="h-2" />
            // Treat lines starting with # as headings
            if (trimmed.startsWith('## ')) {
              return (
                <h2 key={i} className="font-display text-forest text-2xl uppercase tracking-tighter pt-4">
                  {trimmed.replace('## ', '')}
                </h2>
              )
            }
            if (trimmed.startsWith('# ')) {
              return (
                <h2 key={i} className="font-display text-forest text-3xl uppercase tracking-tighter pt-6">
                  {trimmed.replace('# ', '')}
                </h2>
              )
            }
            return (
              <p key={i} className="font-sans text-forest/70 text-base leading-relaxed">
                {trimmed}
              </p>
            )
          })}
        </div>
      </section>

      {/* Footer strip */}
      <section className="border-t border-forest/10 py-10">
        <div className="max-w-4xl mx-auto px-6 md:px-12 flex flex-wrap gap-6 items-center justify-between">
          <span className="font-display text-forest/30 text-2xl uppercase tracking-tighter">Grounded</span>
          <div className="flex items-center gap-6">
            <Link href="/shipping" className="font-sans font-bold text-forest/40 text-xs tracking-[0.2em] uppercase hover:text-forest transition-colors">Shipping</Link>
            <Link href="/contact" className="font-sans font-bold text-forest/40 text-xs tracking-[0.2em] uppercase hover:text-forest transition-colors">Contact</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
