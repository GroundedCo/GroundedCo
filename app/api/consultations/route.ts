import { createHmac, randomUUID } from 'node:crypto'

import { createServerClient } from '@/lib/supabase/server'
import { notifyConsultationOnTelegram } from '@/lib/telegram'

export const runtime = 'nodejs'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_SUBMISSIONS_PER_HOUR = 5
const IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

function readText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function getClientIp(request: Request) {
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
}

function hashClientIp(ip: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY')
  return createHmac('sha256', secret).update(ip).digest('hex')
}

function hasExpectedImageSignature(bytes: Buffer, type: string) {
  if (type === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (type === 'image/png') {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  }
  if (type === 'image/webp') {
    return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  }
  return false
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const name = readText(formData, 'name')
    const mobileNumber = readText(formData, 'mobileNumber')
    const email = readText(formData, 'email')
    const notes = readText(formData, 'notes')
    const image = formData.get('image')
    const mobileDigits = mobileNumber.replace(/\D/g, '')

    if (!name || name.length > 120) {
      return Response.json({ error: 'Please enter your name.' }, { status: 400 })
    }
    if (mobileDigits.length < 10 || mobileDigits.length > 15) {
      return Response.json({ error: 'Please enter a valid mobile number.' }, { status: 400 })
    }
    if (email && (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email))) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    if (notes.length > 2000) {
      return Response.json({ error: 'Notes must be 2,000 characters or fewer.' }, { status: 400 })
    }

    let imageUpload: { bytes: Buffer; contentType: string; extension: string } | null = null
    if (image instanceof File && image.size > 0) {
      const extension = IMAGE_TYPES.get(image.type)
      if (!extension) {
        return Response.json({ error: 'Please upload a JPG, PNG, or WebP image.' }, { status: 400 })
      }
      if (image.size > MAX_IMAGE_SIZE) {
        return Response.json({ error: 'Please choose an image smaller than 5 MB.' }, { status: 400 })
      }

      const imageBytes = Buffer.from(await image.arrayBuffer())
      if (!hasExpectedImageSignature(imageBytes, image.type)) {
        return Response.json({ error: 'The selected file is not a valid image.' }, { status: 400 })
      }
      imageUpload = { bytes: imageBytes, contentType: image.type, extension }
    }

    let imagePath: string | null = null
    const supabase = createServerClient()
    const clientIp = getClientIp(request)
    const ipHash = clientIp ? hashClientIp(clientIp) : null

    if (ipHash) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count, error: rateLimitError } = await supabase
        .from('consultations')
        .select('id', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .gte('created_at', oneHourAgo)

      if (rateLimitError) {
        console.error('Consultation rate-limit check failed:', rateLimitError)
        return Response.json({ error: 'We could not send your request. Please try again.' }, { status: 500 })
      }
      if ((count ?? 0) >= MAX_SUBMISSIONS_PER_HOUR) {
        return Response.json(
          { error: 'Too many consultation requests. Please try again later.' },
          { status: 429 },
        )
      }
    }

    if (imageUpload) {
      imagePath = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${imageUpload.extension}`
      const { error: uploadError } = await supabase.storage
        .from('consultation-images')
        .upload(imagePath, imageUpload.bytes, {
          contentType: imageUpload.contentType,
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Consultation image upload failed:', uploadError)
        return Response.json({ error: 'We could not upload that image. Please try again.' }, { status: 500 })
      }
    }

    const { error: insertError } = await supabase.from('consultations').insert({
      name,
      mobile_number: mobileNumber,
      email: email || null,
      image_path: imagePath,
      ip_hash: ipHash,
      notes: notes || null,
    })

    if (insertError) {
      if (imagePath) {
        const { error: cleanupError } = await supabase.storage.from('consultation-images').remove([imagePath])
        if (cleanupError) console.error('Consultation image cleanup failed:', cleanupError)
      }
      console.error('Consultation insert failed:', insertError)
      return Response.json({ error: 'We could not save your request. Please try again.' }, { status: 500 })
    }

    try {
      await notifyConsultationOnTelegram({
        name,
        mobileNumber,
        email: email || null,
        notes: notes || null,
        adminUrl: `${new URL(request.url).origin}/admin/consultations`,
        image: imageUpload ? {
          bytes: imageUpload.bytes,
          contentType: imageUpload.contentType,
          fileName: `consultation.${imageUpload.extension}`,
        } : undefined,
      })
    } catch (notificationError) {
      console.error('Telegram consultation notification failed:', notificationError)
    }

    return Response.json(
      { message: 'Your consultation request has been received. We will be in touch soon.' },
      { status: 201 },
    )
  } catch (error) {
    console.error('Consultation submission failed:', error)
    return Response.json({ error: 'We could not send your request. Please try again.' }, { status: 500 })
  }
}
