import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'

export type UserRole = 'admin' | 'board' | 'coach' | 'staff' | 'volunteer'

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
type TeamRow = Database['public']['Tables']['teams']['Row']

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
    .eq('id', authUser.id)
    .single() as { data: UserRow | null, error: any }

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

export async function requireAdminCoachOrStaff(): Promise<User> {
  return requireRole(['admin', 'coach', 'staff'])
}

export async function getUserAssignedTeamIds(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .returns<TeamRow[]>()
  if (!teams) return []
  return teams
    .filter(t =>
      t.mainCoachId === userId ||
      (t.coachIds || []).includes(userId) ||
      (t.staffIds || []).includes(userId) ||
      (t.volunteerIds || []).includes(userId)
    )
    .map(t => t.id)
}
