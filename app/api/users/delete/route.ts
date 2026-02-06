import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin()
    const body = await request.json()
    const { userId } = body as { userId?: string }

    if (!userId) {
      return NextResponse.json({ error: 'User id is required.' }, { status: 400 })
    }

    if (userId === adminUser.id) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error: attendanceError } = await supabase
      .from('attendance')
      // @ts-ignore - Supabase type inference issue with update
      .update({ updatedByUserId: adminUser.id })
      .eq('updatedByUserId', userId)

    if (attendanceError) {
      return NextResponse.json({ error: attendanceError.message }, { status: 400 })
    }

    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, mainCoachId, coachIds, volunteerIds')
      .or(`mainCoachId.eq.${userId},coachIds.cs.{${userId}},volunteerIds.cs.{${userId}}`)

    if (teamsError) {
      return NextResponse.json({ error: teamsError.message }, { status: 400 })
    }

    if (teams && teams.length > 0) {
      for (const team of teams) {
        const updates: Record<string, any> = {}

        if (team.mainCoachId === userId) {
          updates.mainCoachId = null
        }

        if (Array.isArray(team.coachIds) && team.coachIds.includes(userId)) {
          updates.coachIds = team.coachIds.filter((id: string) => id !== userId)
        }

        if (Array.isArray(team.volunteerIds) && team.volunteerIds.includes(userId)) {
          updates.volunteerIds = team.volunteerIds.filter((id: string) => id !== userId)
        }

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('teams')
            // @ts-ignore - Supabase type inference issue with update
            .update(updates)
            .eq('id', team.id)

          if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 400 })
          }
        }
      }
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
