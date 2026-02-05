import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { name, email, contactNumber, role } = body

    const supabase = createAdminClient()
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-12) + 'A1!', // Temporary password
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create user record
    const newUser = {
      id: authData.user.id,
      name,
      email,
      contactNumber: contactNumber || null,
      role,
    }
    // @ts-ignore - Supabase type inference issue
    const { error: userError } = await supabase.from('users').insert(newUser)

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    // Send invite email
    await supabase.auth.admin.generateLink({
      type: 'invite',
      email,
    })

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
