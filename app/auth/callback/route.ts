import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token = requestUrl.searchParams.get('token')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/reset-password'

  if (!code && !token && !tokenHash) {
    return NextResponse.redirect(new URL('/login?invalid_session=1', requestUrl.origin))
  }

  let response = NextResponse.redirect(new URL(next, requestUrl.origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.redirect(new URL(next, requestUrl.origin))
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.redirect(new URL(next, requestUrl.origin))
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  let error: { message?: string } | null = null

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code)
    error = result.error
  } else {
    const tokenValue = tokenHash || token
    if (!tokenValue || !type) {
      return NextResponse.redirect(new URL('/login?invalid_session=1', requestUrl.origin))
    }
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenValue,
      type: type as any,
    })
    error = result.error
  }

  if (error) {
    return NextResponse.redirect(new URL('/login?invalid_session=1', requestUrl.origin))
  }

  return response
}
