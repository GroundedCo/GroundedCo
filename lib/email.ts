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
