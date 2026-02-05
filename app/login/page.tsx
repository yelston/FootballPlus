'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Clear invalid session if redirected here with invalid_session param
  useEffect(() => {
    const invalidSession = searchParams.get('invalid_session')
    if (invalidSession === '1') {
      const supabase = createClient()
      supabase.auth.signOut()
      // Remove the query param from URL
      router.replace('/login')
    }
  }, [searchParams, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Login failed. Please try again.')
      setLoading(false)
      return
    }

    // Check if user record exists in database
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', authData.user.id)
      .single()

    if (userError) {
      // User exists in auth but not in users table or RLS blocking access
      console.error('User record error:', userError)
      await supabase.auth.signOut()
      setError(
        `Your account is not properly set up. Error: ${userError.message}. Please contact your administrator or verify the user record exists in the database.`
      )
      setLoading(false)
      return
    }

    if (!userRecord) {
      // User exists in auth but not in users table
      await supabase.auth.signOut()
      setError('Your account is not properly set up. Please contact your administrator.')
      setLoading(false)
      return
    }

    // Success - redirect to dashboard
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Image
              src="/images/logo/FP Logo.png"
              alt="Football Plus Logo"
              width={200}
              height={200}
              className="h-auto w-full max-w-[200px] object-contain"
              priority
            />
          </div>
          <CardDescription className="text-center">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Contact your administrator
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
