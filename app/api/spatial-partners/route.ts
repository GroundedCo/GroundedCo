import { after } from 'next/server'

import { getClientIp, hashClientIp } from '@/lib/client-ip'
import { sendPartnerAlertEmail, sendPartnerConfirmationEmail, type PartnerRegistration } from '@/lib/email'
import { PRACTICE_TYPES, PROJECT_FOCUS, TIMELINES, isKeyOf } from '@/lib/spatial-partners'
import { createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 10_000
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

// Counted from saved registrations, so they hold across server instances.
// The site-wide cap also protects the email quota (two emails per signup).
const LIMITS = {
  perIpPerHour: 3,
  perIpPerDay: 8,
  perEmailPerDay: 2,
  sitewidePerHour: 40,
} as const

const GENERIC_ERROR = 'We could not register your practice. Please try again.'
const TOO_MANY = 'Too many registrations. Please try again later.'

function readText(body: Record<string, unknown>, key: string) {
  const value = body[key]
  return typeof value === 'string' ? value.trim() : ''
}

function normalisePortfolio(raw: string) {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withScheme)
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) return null
    return url.toString()
  } catch {
    return null
  }
}

const bad = (error: string) => Response.json({ error }, { status: 400 })

export async function POST(request: Request) {
  try {
    const declaredLength = Number(request.headers.get('content-length') ?? 0)
    if (declaredLength > MAX_BODY_BYTES) {
      return Response.json({ error: 'Your submission is too large.' }, { status: 413 })
    }
    const rawBody = await request.text()
    if (rawBody.length > MAX_BODY_BYTES) {
      return Response.json({ error: 'Your submission is too large.' }, { status: 413 })
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(rawBody)
    } catch {
      return bad('Invalid submission.')
    }
    if (!parsed || typeof parsed !== 'object') return bad('Invalid submission.')
    const body = parsed as Record<string, unknown>

    // Honeypot: bots that fill the hidden field get a fake success.
    if (readText(body, 'website')) {
      return Response.json({ ok: true }, { status: 201 })
    }

    const studioName = readText(body, 'studioName')
    const leadDesigner = readText(body, 'leadDesigner')
    const practiceType = readText(body, 'practiceType')
    const regions = readText(body, 'regions')
    const portfolioRaw = readText(body, 'portfolioUrl')
    const timeline = readText(body, 'timeline')
    const email = readText(body, 'email').toLowerCase()
    const phone = readText(body, 'phone')
    const notes = readText(body, 'notes')
    const focusRaw = Array.isArray(body.projectFocus) ? body.projectFocus : []
    const projectFocus = [...new Set(focusRaw.filter((v): v is string => typeof v === 'string'))]

    if (!studioName || studioName.length > 160) return bad('Please enter your studio name.')
    if (!leadDesigner || leadDesigner.length > 120) return bad('Please enter the lead designer’s name.')
    if (!isKeyOf(PRACTICE_TYPES, practiceType)) return bad('Please choose your practice type.')
    if (!regions || regions.length > 200) return bad('Please tell us the city or regions you work in.')
    const portfolioUrl = portfolioRaw.length <= 500 ? normalisePortfolio(portfolioRaw) : null
    if (!portfolioUrl) return bad('Please enter a valid portfolio or website link.')
    if (projectFocus.length === 0 || !projectFocus.every((f) => isKeyOf(PROJECT_FOCUS, f))) {
      return bad('Please choose at least one project focus.')
    }
    if (!isKeyOf(TIMELINES, timeline)) return bad('Please choose a timeline.')
    if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) return bad('Please enter a valid email address.')
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 10 || phoneDigits.length > 15 || phone.length > 20) {
      return bad('Please enter a valid phone or WhatsApp number.')
    }
    if (notes.length > 2000) return bad('Notes must be 2,000 characters or fewer.')

    const supabase = createServerClient()
    const clientIp = getClientIp(request)
    const ipHash = clientIp ? hashClientIp(clientIp) : null

    const since = (ms: number) => new Date(Date.now() - ms).toISOString()
    const count = async (windowMs: number, column?: 'ip_hash' | 'email', value?: string) => {
      let query = supabase
        .from('spatial_partners')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since(windowMs))
      if (column && value) query = query.eq(column, value)
      const { count: n, error } = await query
      if (error) throw error
      return n ?? 0
    }

    try {
      const [sitewideHour, emailDay, ipHour, ipDay] = await Promise.all([
        count(HOUR),
        count(DAY, 'email', email),
        ipHash ? count(HOUR, 'ip_hash', ipHash) : Promise.resolve(0),
        ipHash ? count(DAY, 'ip_hash', ipHash) : Promise.resolve(0),
      ])
      if (sitewideHour >= LIMITS.sitewidePerHour) {
        console.warn('Spatial partners: site-wide hourly limit reached')
        return Response.json({ error: TOO_MANY }, { status: 429, headers: { 'Retry-After': '3600' } })
      }
      if (emailDay >= LIMITS.perEmailPerDay) {
        return Response.json(
          { error: 'Your practice is already registered with us. Our studio will be in touch shortly.' },
          { status: 429, headers: { 'Retry-After': '86400' } },
        )
      }
      if (ipHour >= LIMITS.perIpPerHour || ipDay >= LIMITS.perIpPerDay) {
        return Response.json({ error: TOO_MANY }, { status: 429, headers: { 'Retry-After': '3600' } })
      }
    } catch (rateLimitError) {
      console.error('Spatial partner rate-limit check failed:', rateLimitError)
      return Response.json({ error: GENERIC_ERROR }, { status: 500 })
    }

    const { error: insertError } = await supabase.from('spatial_partners').insert({
      studio_name: studioName,
      lead_designer: leadDesigner,
      practice_type: practiceType,
      regions,
      portfolio_url: portfolioUrl,
      project_focus: projectFocus,
      timeline,
      email,
      phone,
      notes: notes || null,
      ip_hash: ipHash,
      status: 'pending_review',
    })

    if (insertError) {
      console.error('Spatial partner insert failed:', insertError)
      return Response.json({ error: GENERIC_ERROR }, { status: 500 })
    }

    // Emails go out after responding so the studio isn't kept waiting.
    const registration: PartnerRegistration = {
      studioName,
      leadDesigner,
      practiceType: PRACTICE_TYPES[practiceType],
      regions,
      portfolioUrl,
      projectFocus: projectFocus.map((f) => PROJECT_FOCUS[f as keyof typeof PROJECT_FOCUS]),
      timeline: TIMELINES[timeline],
      email,
      phone,
      notes: notes || null,
    }
    const adminUrl = `${new URL(request.url).origin}/admin/partners`
    after(async () => {
      const results = await Promise.allSettled([
        sendPartnerAlertEmail(registration, adminUrl),
        sendPartnerConfirmationEmail(registration),
      ])
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`Spatial partner ${i === 0 ? 'team alert' : 'confirmation'} email failed:`, r.reason)
        }
      })
    })

    return Response.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('Spatial partner registration failed:', error)
    return Response.json({ error: GENERIC_ERROR }, { status: 500 })
  }
}
