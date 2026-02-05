import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'

export type UserRole = 'admin' | 'coach' | 'volunteer'

export interface User {
  id: string
  name: string
  email: string
  contactNumber: string | null
  role: UserRole
  profileImageUrl: string | null
  createdAt: string
}

type UserRow = Database['public']['Tables']['users']['Row']

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()
  
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .returns<UserRow[]>()
    .eq('id', authUser.id)
    .single()

  if (error || !user) {
    return null
  }

  return user
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  return user
}

export async function requireRole(allowedRoles: UserRole[]): Promise<User> {
  const user = await requireAuth()
  
  if (!allowedRoles.includes(user.role)) {
    redirect('/')
  }

  return user
}

export async function requireAdmin(): Promise<User> {
  return requireRole(['admin'])
}

export async function requireAdminOrCoach(): Promise<User> {
  return requireRole(['admin', 'coach'])
}
