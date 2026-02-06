import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { name, email, contactNumber, role } = body

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields: name, email, role.' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable.' },
        { status: 500 }
      )
    }

    const supabase = createAdminClient()
    
    const requestUrl = new URL(request.url)
    const redirectTo = `${requestUrl.origin}/auth/callback?next=/reset-password`

    // Invite auth user (sends email invite to set password)
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      { redirectTo }
    )

    if (inviteError) {
      return NextResponse.json(
        {
          error: inviteError.message,
          details: {
            status: (inviteError as any).status ?? null,
            code: (inviteError as any).code ?? null,
          },
        },
        { status: 400 }
      )
    }

    const invitedUserId = inviteData?.user?.id
    if (!invitedUserId) {
      return NextResponse.json({ error: 'Invite failed to return a user id.' }, { status: 500 })
    }

    // Create user record
    const newUser = {
      id: invitedUserId,
      name,
      email,
      contactNumber: contactNumber || null,
      role,
    }
    // @ts-ignore - Supabase type inference issue
    const { error: userError } = await supabase.from('users').insert(newUser)

    if (userError) {
      // Cleanup auth user if DB insert fails to avoid orphans
      await supabase.auth.admin.deleteUser(invitedUserId)
      return NextResponse.json(
        {
          error: userError.message,
          details: {
            code: (userError as any).code ?? null,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, userId: invitedUserId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
