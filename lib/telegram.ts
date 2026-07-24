interface ConsultationNotification {
  name: string
  mobileNumber: string
  email: string | null
  notes: string | null
  adminUrl: string
  image?: {
    bytes: Buffer
    contentType: string
    fileName: string
  }
}

interface TelegramResponse {
  ok: boolean
  description?: string
}

function consultationMessage(notification: ConsultationNotification) {
  const notes = notification.notes
    ? notification.notes.slice(0, 650)
    : 'No additional notes'

  return [
    'New consultation request',
    '',
    `Name: ${notification.name}`,
    `Mobile: ${notification.mobileNumber}`,
    `Email: ${notification.email ?? 'Not provided'}`,
    `Notes: ${notes}`,
    '',
    `Open admin: ${notification.adminUrl}`,
  ].join('\n')
}

export async function notifyConsultationOnTelegram(notification: ConsultationNotification) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CONSULTATIONS_CHAT_ID

  if (!token || !chatId) {
    console.warn('Telegram consultation notifications are not configured')
    return false
  }

  const message = consultationMessage(notification)
  const endpoint = notification.image ? 'sendPhoto' : 'sendMessage'
  let body: BodyInit
  let headers: HeadersInit | undefined

  if (notification.image) {
    const formData = new FormData()
    formData.set('chat_id', chatId)
    formData.set('caption', message)
    formData.set(
      'photo',
      new Blob([Uint8Array.from(notification.image.bytes)], { type: notification.image.contentType }),
      notification.image.fileName,
    )
    body = formData
  } else {
    headers = { 'Content-Type': 'application/json' }
    body = JSON.stringify({ chat_id: chatId, text: message })
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(10_000),
  })
  const result = (await response.json()) as TelegramResponse

  if (!response.ok || !result.ok) {
    throw new Error(result.description ?? `Telegram API returned ${response.status}`)
  }

  return true
}
