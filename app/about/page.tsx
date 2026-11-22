import Link from 'next/link'
import Image from 'next/image'
import { Fragment, type ReactNode } from 'react'
import { createAnonServerClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'About Us — Grounded',
  description: 'The story behind Grounded: rugs woven from heritage, designed for you.',
}

interface AboutPage {
  title: string
  content: string
  image_url: string
}

const FALLBACK_IMAGE = '/images/hero-pasture-lounge-wide.jpg'

const FALLBACK: AboutPage = {
  title: 'About Us',
  content:
    'A rug is more than décor; it is a story woven in fibre, a fusion of heritage and modern design.\n\n' +
    'To be **grounded**, you have to know who you are, where you come from, and what you are up to. ' +
    'Every Grounded piece is made with that in mind.',
  image_url: '',
}

async function getAboutPage(): Promise<AboutPage> {
  try {
    const supabase = createAnonServerClient()
    const { data, error } = await supabase
      .from('site_pages')
      .select('*')
      .eq('slug', 'about')
      .single()

    if (error || !data) return FALLBACK
    return {
      title: data.title || FALLBACK.title,
      content: data.content?.trim() ? data.content : FALLBACK.content,
      image_url: data.image_url || '',
    }
  } catch {
    return FALLBACK
  }
}

/** Renders `**bold**` segments as <strong>; everything else as plain text. */
function renderInline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-bold text-forest">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}

export default async function AboutPage() {
  const page = await getAboutPage()

  // Paragraphs are separated by blank lines; single line breaks stay inside a paragraph.
  const paragraphs = page.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

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

      {/* Full-bleed banner */}
      <section className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-[78vh] bg-forest overflow-hidden">
        <Image
          src={page.image_url || FALLBACK_IMAGE}
          alt={page.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-forest/30 to-transparent" />
      </section>

      {/* Story */}
      <article className="max-w-2xl mx-auto px-6 md:px-0 pt-14 sm:pt-20 pb-24 sm:pb-32">
        <p className="font-sans font-bold text-forest/40 text-xs tracking-[0.25em] uppercase mb-4">Our Story</p>
        <h1 className="font-display text-forest text-5xl sm:text-7xl uppercase tracking-tighter leading-none mb-10 sm:mb-14">
          {page.title}
        </h1>
        <div className="space-y-6">
          {paragraphs.map((para, i) => (
            <p key={i} className="font-sans text-forest/70 text-base sm:text-[17px] leading-[1.8] whitespace-pre-line">
              {renderInline(para)}
            </p>
          ))}
        </div>
      </article>

      {/* Footer strip */}
      <section className="border-t border-forest/10 py-10">
        <div className="max-w-4xl mx-auto px-6 md:px-12 flex flex-wrap gap-6 items-center justify-between">
          <span className="font-display text-forest/30 text-2xl uppercase tracking-tighter">Grounded</span>
          <div className="flex items-center gap-6">
            <Link href="/shipping" className="font-sans font-bold text-forest/40 text-xs tracking-[0.2em] uppercase hover:text-forest transition-colors">Shipping</Link>
            <Link href="/privacy" className="font-sans font-bold text-forest/40 text-xs tracking-[0.2em] uppercase hover:text-forest transition-colors">Privacy</Link>
            <Link href="/contact" className="font-sans font-bold text-forest/40 text-xs tracking-[0.2em] uppercase hover:text-forest transition-colors">Contact</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
