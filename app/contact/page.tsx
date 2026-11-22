import Link from 'next/link'
import type { ReactNode } from 'react'
import { createAnonServerClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Contact — Grounded',
  description: 'Reach out to the Grounded team. We\'d love to hear from you.',
}

interface ContactSettings {
  brand_name: string
  tagline: string
  email: string
  whatsapp: string
  location: string
  story_text: string
}

// Studio address and its Google Maps place link (from the business's own share link).
const STUDIO_ADDRESS = 'Puthiya Palli Masjid, Irumbichi Road, Mattancherry, Kochi, Kerala 682002'
const STUDIO_MAP_URL = 'https://share.google/GAw7nR5Tb9vlD9cRM'

// Only brand copy has fallbacks — contact details are never invented.
const EMPTY: ContactSettings = {
  brand_name: '',
  tagline: '',
  email: '',
  whatsapp: '',
  location: '',
  story_text: '',
}

async function getContactSettings(): Promise<ContactSettings> {
  try {
    const supabase = createAnonServerClient()
    const { data, error } = await supabase
      .from('contact_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    if (error || !data) return EMPTY
    return {
      brand_name: data.brand_name?.trim() ?? '',
      tagline: data.tagline?.trim() ?? '',
      email: data.email?.trim() ?? '',
      whatsapp: data.whatsapp?.trim() ?? '',
      location: data.location?.trim() ?? '',
      story_text: data.story_text?.trim() ?? '',
    }
  } catch {
    return EMPTY
  }
}

const icons = {
  whatsapp: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.103 1.518 5.829L.057 23.885a.5.5 0 00.611.61l6.056-1.462A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.788 9.788 0 01-5.02-1.384l-.36-.213-3.731.901.92-3.619-.235-.372A9.79 9.79 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
    </svg>
  ),
  email: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  location: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  ),
}

function ContactRow({
  href,
  external,
  icon,
  label,
  note,
  value,
}: {
  href: string
  external?: boolean
  icon: ReactNode
  label: string
  note: string
  value: string
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group relative flex items-center gap-5 sm:gap-6 overflow-hidden rounded-2xl border border-forest/10 bg-cream px-5 py-6 sm:px-8 sm:py-7 transition-shadow duration-500 hover:shadow-xl hover:shadow-forest/10"
    >
      {/* Forest fill slides up on hover */}
      <span className="absolute inset-0 bg-forest translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />

      <span className="relative z-10 shrink-0 w-12 h-12 rounded-full border border-forest/20 group-hover:border-sage/30 flex items-center justify-center text-forest group-hover:text-sage transition-colors duration-500">
        {icon}
      </span>

      <span className="relative z-10 min-w-0 flex-1">
        <span className="block font-sans font-bold text-forest/40 group-hover:text-sage/70 text-[10px] tracking-[0.22em] uppercase mb-1 transition-colors duration-500">
          {label} <span className="hidden sm:inline">· {note}</span>
        </span>
        <span className="block font-display text-forest group-hover:text-cream text-lg sm:text-2xl tracking-tight break-words transition-colors duration-500">
          {value}
        </span>
      </span>

      <svg
        className="relative z-10 shrink-0 w-5 h-5 text-forest/30 group-hover:text-sage -translate-x-1 group-hover:translate-x-0 transition-all duration-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </a>
  )
}

export default async function ContactPage() {
  const contact = await getContactSettings()
  const brand = contact.brand_name || 'Grounded'
  const tagline = contact.tagline || 'Woven from heritage, designed for you.'
  const whatsappDigits = contact.whatsapp.replace(/[^0-9]/g, '')
  const storyParagraphs = contact.story_text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <main className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-forest/10">
        <div className="max-w-6xl mx-auto px-6 md:px-12 flex items-center justify-between h-16">
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

      {/* Hero + contact details */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pt-16 sm:pt-24 pb-20 sm:pb-28 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-start">
        <div className="lg:sticky lg:top-32">
          <p className="font-sans font-bold text-forest/40 text-xs tracking-[0.25em] uppercase mb-5">{brand}</p>
          <h1 className="font-display text-forest text-6xl sm:text-8xl uppercase tracking-tighter leading-[0.9] mb-8">
            Get in
            <br />
            Touch
          </h1>
          <p className="font-sans text-forest/60 text-lg leading-relaxed max-w-md">{tagline}</p>
        </div>

        <div className="space-y-4">
          {whatsappDigits && (
            <ContactRow
              href={`https://wa.me/${whatsappDigits}`}
              external
              icon={icons.whatsapp}
              label="WhatsApp"
              note="Chat with us directly"
              value={contact.whatsapp}
            />
          )}
          {contact.email && (
            <ContactRow
              href={`mailto:${contact.email}`}
              icon={icons.email}
              label="Email"
              note="We reply within 24 hours"
              value={contact.email.toLowerCase()}
            />
          )}
          <ContactRow
            href={STUDIO_MAP_URL}
            external
            icon={icons.location}
            label="Studio"
            note="Find us"
            value={STUDIO_ADDRESS}
          />
        </div>
      </section>

      {/* Story */}
      {storyParagraphs.length > 0 && (
        <section className="bg-forest">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-20">
            <div>
              <p className="font-sans font-bold text-sage/60 text-xs tracking-[0.25em] uppercase mb-5">Who we are</p>
              <h2 className="font-display text-sage text-5xl sm:text-7xl uppercase tracking-tighter leading-[0.9]">
                Our
                <br />
                Story
              </h2>
            </div>
            <div className="space-y-6">
              {storyParagraphs.map((para, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? 'font-sans text-cream text-lg sm:text-xl leading-relaxed'
                      : 'font-sans text-cream/70 text-base leading-[1.8]'
                  }
                >
                  {para}
                </p>
              ))}
              <Link
                href="/about"
                className="inline-flex items-center gap-2 pt-2 font-sans font-bold text-sage text-xs tracking-[0.2em] uppercase hover:text-cream transition-colors"
              >
                More about us
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer strip */}
      <section className="border-t border-forest/10 py-10">
        <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-wrap gap-6 items-center justify-between">
          <span className="font-display text-forest/30 text-2xl uppercase tracking-tighter">Grounded</span>
          <div className="flex items-center gap-6">
            <Link href="/about" className="font-sans font-bold text-forest/40 text-xs tracking-[0.2em] uppercase hover:text-forest transition-colors">About</Link>
            <Link href="/shipping" className="font-sans font-bold text-forest/40 text-xs tracking-[0.2em] uppercase hover:text-forest transition-colors">Shipping</Link>
            <Link href="/privacy" className="font-sans font-bold text-forest/40 text-xs tracking-[0.2em] uppercase hover:text-forest transition-colors">Privacy</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
