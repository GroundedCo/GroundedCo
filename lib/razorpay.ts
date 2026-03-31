import Razorpay from 'razorpay'

// Singleton to avoid re-instantiation on every request
let instance: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (!instance) {
    const keyId     = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      throw new Error(
        'Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables. ' +
        'Copy .env.local.example to .env.local and fill in your Razorpay test credentials.'
      )
    }

    instance = new Razorpay({ key_id: keyId, key_secret: keySecret })
  }
  return instance
}
