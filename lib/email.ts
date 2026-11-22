/**
 * Email alerts sent through Resend (https://resend.com) — server-only.
 *
 * Env vars:
 *   RESEND_API_KEY        Resend API key (re_…)
 *   BID_ALERT_EMAIL_TO    Recipient(s), comma-separated
 *   BID_ALERT_EMAIL_FROM  Sender on a domain verified in Resend,
 *                         e.g. "Grounded Studio <studio@yourdomain.com>".
 *                         Defaults to Resend's test sender, which can only
 *                         deliver to the email that owns the Resend account.
 */

const RESEND_TIMEOUT_MS = 10_000

interface BidAlert {
  pieceName: string
  bidAmountInr: number
  name: string
  contact: string
  citySpace: string
  spatialNotes: string | null
  adminUrl: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendBidAlertEmail(alert: BidAlert) {
  const apiKey = process.env.RESEND_API_KEY
  const to = (process.env.BID_ALERT_EMAIL_TO ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (!apiKey || to.length === 0) {
    console.warn('Bid alert emails are not configured (RESEND_API_KEY / BID_ALERT_EMAIL_TO)')
    return false
  }

  const from = process.env.BID_ALERT_EMAIL_FROM || 'Grounded <onboarding@resend.dev>'
  const amount = `₹${alert.bidAmountInr.toLocaleString('en-IN')}`
  const notes = alert.spatialNotes?.trim() || 'None'

  const rows: [string, string][] = [
    ['Piece', alert.pieceName],
    ['Bid', amount],
    ['Name', alert.name],
    ['Email / WhatsApp', alert.contact],
    ['City & space', alert.citySpace],
    ['Spatial notes', notes],
  ]

  const text = [
    `New "One of 1" bid: ${amount} on ${alert.pieceName}`,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    `Review in admin: ${alert.adminUrl}`,
  ].join('\n')

  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a2e22">
  <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b8f71;margin:0 0 8px">New “One of 1” bid</p>
  <h1 style="font-size:32px;margin:0 0 4px;color:#004d2c">${escapeHtml(amount)}</h1>
  <p style="font-size:15px;margin:0 0 24px">on <strong>${escapeHtml(alert.pieceName)}</strong></p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    ${rows
      .map(
        ([k, v]) => `<tr>
      <td style="padding:10px 12px 10px 0;border-top:1px solid #e5e5dc;color:#6b6b6b;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td>
      <td style="padding:10px 0;border-top:1px solid #e5e5dc;white-space:pre-wrap">${escapeHtml(v)}</td>
    </tr>`,
      )
      .join('')}
  </table>
  <p style="margin:28px 0 0">
    <a href="${escapeHtml(alert.adminUrl)}" style="display:inline-block;background:#004d2c;color:#fdf9e1;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:14px 24px;border-radius:999px">Review bid in admin</a>
  </p>
</div>`

  const body: Record<string, unknown> = {
    from,
    to,
    subject: `New One of 1 bid: ${amount} on ${alert.pieceName}`,
    text,
    html,
  }
  // Hitting "Reply" goes straight to the bidder when they left an email.
  if (/^\S+@\S+\.\S+$/.test(alert.contact)) body.reply_to = alert.contact

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Resend API returned ${response.status}: ${detail.slice(0, 300)}`)
  }

  return true
}

// ─── Spatial Partner Registry ────────────────────────────────
//
// Reuses the bid-alert Resend setup by default. Optional overrides:
//   PARTNER_ALERT_EMAIL_TO    Team recipient(s), comma-separated.
//                             Falls back to BID_ALERT_EMAIL_TO, then
//                             hello@thegrounded.co.in.
//   PARTNER_EMAIL_FROM        Sender for both partner emails. Falls back to
//                             BID_ALERT_EMAIL_FROM, then Resend's test sender.
//
// Resend's test sender only delivers to the email that owns the Resend
// account, so the studio confirmation is skipped until a sender on a verified
// domain is configured. The team alert still goes out to the account owner.

const DEFAULT_PARTNER_TEAM_EMAIL = 'hello@thegrounded.co.in'

function partnerTeamRecipients() {
  return (process.env.PARTNER_ALERT_EMAIL_TO || process.env.BID_ALERT_EMAIL_TO || DEFAULT_PARTNER_TEAM_EMAIL)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function hasVerifiedPartnerSender() {
  return Boolean(process.env.PARTNER_EMAIL_FROM || process.env.BID_ALERT_EMAIL_FROM)
}

async function sendResendEmail(body: Record<string, unknown>) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('Emails are not configured (RESEND_API_KEY)')
    return false
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Resend API returned ${response.status}: ${detail.slice(0, 300)}`)
  }
  return true
}

function partnerSender() {
  return (
    process.env.PARTNER_EMAIL_FROM ||
    process.env.BID_ALERT_EMAIL_FROM ||
    'The Grounded Company <onboarding@resend.dev>'
  )
}

function detailTable(rows: [string, string][]) {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">
    ${rows
      .map(
        ([k, v]) => `<tr>
      <td style="padding:10px 12px 10px 0;border-top:1px solid #e5e5dc;color:#6b6b6b;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td>
      <td style="padding:10px 0;border-top:1px solid #e5e5dc;white-space:pre-wrap">${escapeHtml(v)}</td>
    </tr>`,
      )
      .join('')}
  </table>`
}

export interface PartnerRegistration {
  studioName: string
  leadDesigner: string
  practiceType: string
  regions: string
  portfolioUrl: string
  projectFocus: string[]
  timeline: string
  email: string
  phone: string
  notes: string | null
}

export async function sendPartnerAlertEmail(partner: PartnerRegistration, adminUrl: string) {
  const to = partnerTeamRecipients()

  const rows: [string, string][] = [
    ['Studio', partner.studioName],
    ['Lead designer', partner.leadDesigner],
    ['Practice', partner.practiceType],
    ['City / regions', partner.regions],
    ['Portfolio', partner.portfolioUrl],
    ['Project focus', partner.projectFocus.join(', ') || '—'],
    ['Timeline', partner.timeline],
    ['Email', partner.email],
    ['Phone', partner.phone],
    ['Notes', partner.notes?.trim() || 'None'],
  ]

  const text = [
    `New Spatial Partner registration: ${partner.studioName}`,
    'Status: Pending Review',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    `Review in admin: ${adminUrl}`,
  ].join('\n')

  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a2e22">
  <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b8f71;margin:0 0 8px">Spatial Partner Registry · Pending Review</p>
  <h1 style="font-size:28px;margin:0 0 4px;color:#004d2c">${escapeHtml(partner.studioName)}</h1>
  <p style="font-size:15px;margin:0 0 24px">${escapeHtml(partner.practiceType)} · ${escapeHtml(partner.regions)}</p>
  ${detailTable(rows)}
  <p style="margin:28px 0 0">
    <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#004d2c;color:#fdf9e1;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:14px 24px;border-radius:999px">Review studio in admin</a>
  </p>
</div>`

  return sendResendEmail({
    from: partnerSender(),
    to,
    reply_to: partner.email,
    subject: `New Spatial Partner: ${partner.studioName} (${partner.regions})`,
    text,
    html,
  })
}

export async function sendPartnerConfirmationEmail(partner: PartnerRegistration) {
  if (!hasVerifiedPartnerSender()) {
    console.warn(
      'Spatial partner confirmation skipped: set PARTNER_EMAIL_FROM (or BID_ALERT_EMAIL_FROM) to a sender on a Resend-verified domain to email studios.',
    )
    return false
  }

  const teamEmail = partnerTeamRecipients()[0] ?? DEFAULT_PARTNER_TEAM_EMAIL
  const firstName = partner.leadDesigner.split(/\s+/)[0]

  const text = [
    `Dear ${firstName},`,
    '',
    `Thank you for registering ${partner.studioName} with the Spatial Partner Registry at The Grounded Company.`,
    '',
    'Your practice is now with our studio for review. Once vetted, partner studios receive:',
    '  · Priority previews of each One-of-1 drop, before open placement',
    '  · Consideration for bespoke commissions in custom sizes and palettes',
    '  · A tactile material dossier — 4000 GSM NZ wool and Zero Latex swatches',
    '',
    'We review every practice personally and will be in touch within a few working days.',
    `If anything changes in the meantime, simply reply to this note or write to ${teamEmail}.`,
    '',
    'Warmly,',
    'The Grounded Company',
  ].join('\n')

  const html = `
<div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;color:#1a2e22;line-height:1.6">
  <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b8f71;margin:0 0 20px">Spatial Partner Registry</p>
  <p style="font-size:16px;margin:0 0 16px">Dear ${escapeHtml(firstName)},</p>
  <p style="font-size:16px;margin:0 0 16px">Thank you for registering <strong>${escapeHtml(partner.studioName)}</strong> with the Spatial Partner Registry at The Grounded Company.</p>
  <p style="font-size:16px;margin:0 0 12px">Your practice is now with our studio for review. Once vetted, partner studios receive:</p>
  <ul style="font-size:15px;margin:0 0 16px;padding-left:20px">
    <li style="margin-bottom:6px"><strong>Priority drop previews</strong> — early access to each One-of-1 piece before open placement.</li>
    <li style="margin-bottom:6px"><strong>Bespoke commission consideration</strong> — custom sizing and palettes for your projects.</li>
    <li><strong>Tactile material dossier</strong> — 4000 GSM NZ wool and Zero Latex swatch kits.</li>
  </ul>
  <p style="font-size:16px;margin:0 0 16px">We review every practice personally and will be in touch within a few working days. If anything changes in the meantime, simply reply to this note.</p>
  <p style="font-size:16px;margin:24px 0 0">Warmly,<br />The Grounded Company</p>
</div>`

  return sendResendEmail({
    from: partnerSender(),
    to: [partner.email],
    reply_to: teamEmail,
    subject: 'Your Spatial Partner registration — The Grounded Company',
    text,
    html,
  })
}
