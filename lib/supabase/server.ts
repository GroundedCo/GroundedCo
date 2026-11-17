import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Server-side client using service role key — bypasses RLS.
// Only use in API routes (Route Handlers) and Server Components.
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function createServerClient() {
  return createSupabaseClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  )
}

// Anon client for server components that should respect RLS
// 12-second fetch timeout prevents hanging while giving self-hosted instances enough time
export function createAnonServerClient(revalidate: number = 0) {
  return createSupabaseClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      global: {
        fetch: (url, options = {}) =>
          fetch(url, {
            ...options,
            signal: AbortSignal.timeout(12000),
            cache: 'no-store',
          } as RequestInit),
      },
    }
  )
}
