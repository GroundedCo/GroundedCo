import { after } from 'next/server'

import { getClientIp, hashClientIp } from '@/lib/client-ip'
import { sendBidAlertEmail } from '@/lib/email'
import { createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const MAX_BID_INR = 1_000_000_000
const MAX_BODY_BYTES = 10_000

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

// Rate limits (counted from saved bids, so they hold across server instances)
const LIMITS = {
  perIpPerHour: 5,      // same device/network
  perIpPerDay: 15,
  perContactPerDay: 3,  // same email / WhatsApp, even from different networks
  sitewidePerHour: 30,  // flood guard — also protects the email quota
} as const

const TOO_MANY = 'Too many inquiries. Please try again later.'

function readText(body: Record<string, unknown>, key: string) {
  const value = body[key]
  return typeof value === 'string' ? value.trim() : ''
}

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
      return Response.json({ error: 'Invalid submission.' }, { status: 400 })
    }
    if (!parsed || typeof parsed !== 'object') {
      return Response.json({ error: 'Invalid submission.' }, { status: 400 })
    }
    const body = parsed as Record<string, unknown>

    // Honeypot: a hidden field real visitors never see. Bots that fill it get a
    // fake success so they don't retry, and nothing is saved or emailed.
    if (readText(body, 'website')) {
      return Response.json({ ok: true }, { status: 201 })
    }

    const productId = readText(body, 'productId')
    const name = readText(body, 'name')
    const rawContact = readText(body, 'contact')
    // Normalise so the per-contact limit can't be dodged with case changes
    const contact = rawContact.includes('@') ? rawContact.toLowerCase() : rawContact
    const citySpace = readText(body, 'citySpace')
    const bidRaw = readText(body, 'bidAmount').replace(/[,\s₹]/g, '')
    const spatialNotes = readText(body, 'spatialNotes')

    if (!productId || productId.length > 100) {
      return Response.json({ error: 'Please choose a piece to inquire about.' }, { status: 400 })
    }
    if (!name || name.length > 120) {
      return Response.json({ error: 'Please enter your name.' }, { status: 400 })
    }
    if (contact.length < 5 || contact.length > 254) {
      return Response.json({ error: 'Please enter a valid email or WhatsApp number.' }, { status: 400 })
    }
    if (!citySpace || citySpace.length > 200) {
      return Response.json({ error: 'Please tell us your city and space type.' }, { status: 400 })
    }
    if (!/^\d+$/.test(bidRaw)) {
      return Response.json({ error: 'Please enter your bid as a whole number in INR.' }, { status: 400 })
    }
    const bidAmountInr = Number(bidRaw)
    if (bidAmountInr <= 0 || bidAmountInr > MAX_BID_INR) {
      return Response.json({ error: 'Please enter a valid bid amount.' }, { status: 400 })
    }
    if (spatialNotes.length > 2000) {
      return Response.json({ error: 'Spatial notes must be 2,000 characters or fewer.' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: product, error: productError } = await supabase
      .from('featured_products')
      .select('id, name, is_one_of_one')
      .eq('id', productId)
      .maybeSingle()

    if (productError) {
      console.error('One of 1 product lookup failed:', productError)
      return Response.json({ error: 'We could not send your inquiry. Please try again.' }, { status: 500 })
    }
    if (!product || product.is_one_of_one !== true) {
      return Response.json({ error: 'This piece is not open for inquiry.' }, { status: 400 })
    }

    const clientIp = getClientIp(request)
    const ipHash = clientIp ? hashClientIp(clientIp) : null

    const since = (ms: number) => new Date(Date.now() - ms).toISOString()
    const countBids = async (windowMs: number, column?: 'ip_hash' | 'contact', value?: string) => {
      let query = supabase
        .from('one_of_one_inquiries')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since(windowMs))
      if (column && value) query = query.eq(column, value)
      const { count, error } = await query
      if (error) throw error
      return count ?? 0
    }

    try {
      const [sitewideHour, contactDay, ipHour, ipDay] = await Promise.all([
        countBids(HOUR),
        countBids(DAY, 'contact', contact),
        ipHash ? countBids(HOUR, 'ip_hash', ipHash) : Promise.resolve(0),
        ipHash ? countBids(DAY, 'ip_hash', ipHash) : Promise.resolve(0),
      ])

      if (sitewideHour >= LIMITS.sitewidePerHour) {
        console.warn('One of 1 inquiries: site-wide hourly limit reached')
        return Response.json({ error: TOO_MANY }, { status: 429, headers: { 'Retry-After': '3600' } })
      }
      if (contactDay >= LIMITS.perContactPerDay) {
        return Response.json(
          { error: 'We already have your recent offers on file. Our studio will be in touch shortly.' },
          { status: 429, headers: { 'Retry-After': '86400' } },
        )
      }
      if (ipHour >= LIMITS.perIpPerHour || ipDay >= LIMITS.perIpPerDay) {
        return Response.json({ error: TOO_MANY }, { status: 429, headers: { 'Retry-After': '3600' } })
      }
    } catch (rateLimitError) {
      console.error('One of 1 inquiry rate-limit check failed:', rateLimitError)
      return Response.json({ error: 'We could not send your inquiry. Please try again.' }, { status: 500 })
    }

    const { error: insertError } = await supabase.from('one_of_one_inquiries').insert({
      product_id: product.id,
      piece_name: product.name,
      name,
      contact,
      city_space: citySpace,
      bid_amount_inr: bidAmountInr,
      spatial_notes: spatialNotes || null,
      ip_hash: ipHash,
    })

    if (insertError) {
      console.error('One of 1 inquiry insert failed:', insertError)
      return Response.json({ error: 'We could not save your inquiry. Please try again.' }, { status: 500 })
    }

    // Send the alert after responding, so the visitor isn't kept waiting on email.
    const adminUrl = `${new URL(request.url).origin}/admin/bids?product=${encodeURIComponent(product.id)}`
    after(async () => {
      try {
        await sendBidAlertEmail({
          pieceName: product.name,
          bidAmountInr,
          name,
          contact,
          citySpace,
          spatialNotes: spatialNotes || null,
          adminUrl,
        })
      } catch (emailError) {
        console.error('Bid alert email failed:', emailError)
      }
    })

    return Response.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('One of 1 inquiry submission failed:', error)
    return Response.json({ error: 'We could not send your inquiry. Please try again.' }, { status: 500 })
  }
}
