'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ImageUpload from '@/components/admin/ImageUpload'

type Tab = 'contact' | 'about' | 'privacy' | 'shipping'

interface ContactSettings {
  id?: string
  brand_name: string
  tagline: string
  email: string
  whatsapp: string
  location: string
  story_text: string
}

interface SitePage {
  slug: string
  title: string
  content: string
}

const CONTACT_DEFAULTS: ContactSettings = {
  brand_name: '',
  tagline: '',
  email: '',
  whatsapp: '',
  location: '',
  story_text: '',
}

interface AboutPage extends SitePage {
  image_url: string
}

const PAGE_DEFAULTS: SitePage = { slug: '', title: '', content: '' }

export default function AdminPagesPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('contact')
  const [contact, setContact] = useState<ContactSettings>(CONTACT_DEFAULTS)
  const [privacy, setPrivacy] = useState<SitePage>({ ...PAGE_DEFAULTS, slug: 'privacy', title: 'Privacy Policy' })
  const [shipping, setShipping] = useState<SitePage>({ ...PAGE_DEFAULTS, slug: 'shipping', title: 'Shipping & Delivery' })
  const [about, setAbout] = useState<AboutPage>({ ...PAGE_DEFAULTS, slug: 'about', title: 'About Us', image_url: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    supabase.from('contact_settings').select('*').limit(1).single()
      .then(({ data }) => {
        if (!active || !data) return
        setContact({
          id: data.id,
          brand_name: data.brand_name ?? '',
          tagline: data.tagline ?? '',
          email: data.email ?? '',
          whatsapp: data.whatsapp ?? '',
          location: data.location ?? '',
          story_text: data.story_text ?? '',
        })
      })

    supabase.from('site_pages').select('*').in('slug', ['privacy', 'shipping', 'about'])
      .then(({ data }) => {
        if (!active || !data) return
        const p = data.find((r) => r.slug === 'privacy')
        const s = data.find((r) => r.slug === 'shipping')
        const a = data.find((r) => r.slug === 'about')
        if (p) setPrivacy({ slug: p.slug, title: p.title, content: p.content ?? '' })
        if (s) setShipping({ slug: s.slug, title: s.title, content: s.content ?? '' })
        if (a) setAbout({ slug: a.slug, title: a.title, content: a.content ?? '', image_url: a.image_url ?? '' })
      })

    return () => { active = false }
  }, [supabase])

  const saveContact = async () => {
    setSaving(true)
    setError('')
    // contact_settings is a single-row table: update the loaded row by its
    // primary key, or create it if none exists yet.
    const { id, ...fields } = contact
    const { data, error } = id
      ? await supabase.from('contact_settings').update(fields).eq('id', id).select().single()
      : await supabase.from('contact_settings').insert(fields).select().single()
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    if (data) setContact((c) => ({ ...c, id: data.id }))
    flash()
  }

  const savePage = async (page: SitePage | AboutPage) => {
    setSaving(true)
    setError('')
    const { error } = await supabase
      .from('site_pages')
      .upsert({ ...page, updated_at: new Date().toISOString() }, { onConflict: 'slug' })
    setSaving(false)
    if (error) {
      setError(
        error.message.includes('image_url')
          ? 'The About page needs a database update first: run supabase/about-page.sql.'
          : error.message,
      )
      return
    }
    flash()
  }

  const flash = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'contact', label: 'Contact' },
    { key: 'about', label: 'About' },
    { key: 'privacy', label: 'Privacy' },
    { key: 'shipping', label: 'Shipping' },
  ]

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-tighter text-forest">Pages</h1>
        <p className="font-sans text-forest/50 text-sm mt-1">Edit content shown on the Contact, About, Privacy, and Shipping pages.</p>
      </div>

      {error && (
        <p className="font-sans text-sm text-maroon bg-maroon/5 border border-maroon/20 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-forest/10 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-xs font-sans font-bold tracking-[0.15em] uppercase transition-colors duration-200 ${
              tab === t.key ? 'bg-forest text-cream' : 'text-forest/50 hover:text-forest'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contact tab */}
      {tab === 'contact' && (
        <div className="space-y-5">
          {(
            [
              { key: 'brand_name', label: 'Brand Name' },
              { key: 'tagline',    label: 'Tagline' },
              { key: 'email',      label: 'Email' },
              { key: 'whatsapp',   label: 'WhatsApp Number' },
              { key: 'location',   label: 'Location' },
            ] as { key: keyof ContactSettings; label: string }[]
          ).map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <label className="font-sans font-bold text-forest/60 text-xs tracking-[0.15em] uppercase">{label}</label>
              <input
                type="text"
                value={contact[key]}
                onChange={(e) => setContact({ ...contact, [key]: e.target.value })}
                className="w-full bg-cream/70 border border-forest/20 rounded-xl px-4 py-3 text-sm font-sans text-forest placeholder:text-forest/30 focus:outline-none focus:border-forest/50 focus:bg-cream transition-colors"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="font-sans font-bold text-forest/60 text-xs tracking-[0.15em] uppercase">Our Story</label>
            <textarea
              rows={6}
              value={contact.story_text}
              onChange={(e) => setContact({ ...contact, story_text: e.target.value })}
              className="w-full bg-cream/70 border border-forest/20 rounded-xl px-4 py-3 text-sm font-sans text-forest placeholder:text-forest/30 focus:outline-none focus:border-forest/50 focus:bg-cream transition-colors resize-none"
            />
          </div>

          <SaveButton onClick={saveContact} saving={saving} saved={saved} />
        </div>
      )}

      {/* About tab */}
      {tab === 'about' && (
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="font-sans font-bold text-forest/60 text-xs tracking-[0.15em] uppercase">Banner Image</label>
            <p className="font-sans text-forest/40 text-xs">Shown full-width at the top of the About page. Wide (16:9) photos work best.</p>
            <ImageUpload
              key={about.image_url || 'empty'}
              currentUrl={about.image_url}
              folder="about"
              aspect={16 / 9}
              onUpload={(url) => setAbout((a) => ({ ...a, image_url: url }))}
            />
            {about.image_url && (
              <button
                type="button"
                onClick={() => setAbout((a) => ({ ...a, image_url: '' }))}
                className="font-sans font-bold text-forest/40 text-[10px] tracking-[0.15em] uppercase hover:text-maroon transition-colors"
              >
                Remove image
              </button>
            )}
          </div>

          <PageEditor
            page={about}
            onChange={(p) => setAbout((a) => ({ ...a, ...p }))}
            saving={saving}
            saved={saved}
            onSave={() => savePage(about)}
            hint="Leave a blank line between paragraphs. Wrap text in **double asterisks** to make it bold."
          />
        </div>
      )}

      {/* Privacy tab */}
      {tab === 'privacy' && (
        <PageEditor page={privacy} onChange={setPrivacy} saving={saving} saved={saved} onSave={() => savePage(privacy)} />
      )}

      {/* Shipping tab */}
      {tab === 'shipping' && (
        <PageEditor page={shipping} onChange={setShipping} saving={saving} saved={saved} onSave={() => savePage(shipping)} />
      )}
    </div>
  )
}

function PageEditor({
  page,
  onChange,
  saving,
  saved,
  onSave,
  hint = 'Use # or ## for headings. Leave blank lines between paragraphs.',
}: {
  page: SitePage
  onChange: (p: SitePage) => void
  saving: boolean
  saved: boolean
  onSave: () => void
  hint?: string
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="font-sans font-bold text-forest/60 text-xs tracking-[0.15em] uppercase">Page Title</label>
        <input
          type="text"
          value={page.title}
          onChange={(e) => onChange({ ...page, title: e.target.value })}
          className="w-full bg-cream/70 border border-forest/20 rounded-xl px-4 py-3 text-sm font-sans text-forest placeholder:text-forest/30 focus:outline-none focus:border-forest/50 focus:bg-cream transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-sans font-bold text-forest/60 text-xs tracking-[0.15em] uppercase">Content</label>
        <p className="font-sans text-forest/40 text-xs">{hint}</p>
        <textarea
          rows={16}
          value={page.content}
          onChange={(e) => onChange({ ...page, content: e.target.value })}
          className="w-full bg-cream/70 border border-forest/20 rounded-xl px-4 py-3 text-sm font-sans text-forest placeholder:text-forest/30 focus:outline-none focus:border-forest/50 focus:bg-cream transition-colors resize-none font-mono"
        />
      </div>

      <SaveButton onClick={onSave} saving={saving} saved={saved} />
    </div>
  )
}

function SaveButton({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="px-6 py-2.5 rounded-xl bg-forest text-cream text-xs font-sans font-bold tracking-[0.15em] uppercase transition-all duration-200 hover:bg-forest/80 disabled:opacity-50"
    >
      {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
    </button>
  )
}
