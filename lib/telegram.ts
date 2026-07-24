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

const TELEGRAM_API_TIMEOUT_MS = 10_000

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
  const messageResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message }),
    signal: AbortSignal.timeout(TELEGRAM_API_TIMEOUT_MS),
  })
  const messageResult = (await messageResponse.json()) as TelegramResponse

  if (!messageResponse.ok || !messageResult.ok) {
    throw new Error(messageResult.description ?? `Telegram API returned ${messageResponse.status}`)
  }

  if (notification.image) {
    const formData = new FormData()
    formData.set('chat_id', chatId)
    formData.set('caption', `Reference image from ${notification.name}`)
    formData.set(
      'photo',
      new Blob([Uint8Array.from(notification.image.bytes)], { type: notification.image.contentType }),
      notification.image.fileName,
    )

    const photoResponse = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(TELEGRAM_API_TIMEOUT_MS),
    })
    const photoResult = (await photoResponse.json()) as TelegramResponse

    if (!photoResponse.ok || !photoResult.ok) {
      console.error(
        'Telegram consultation image notification failed:',
        photoResult.description ?? `Telegram API returned ${photoResponse.status}`,
      )
    }
  }

  return true
}
