import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamsList } from '@/components/teams/TeamsList'
import type { Database } from '@/types/database'

type TeamRow = Database['public']['Tables']['teams']['Row']
type UserRow = Database['public']['Tables']['users']['Row']
type PlayerRow = Database['public']['Tables']['players']['Row']

export default async function TeamsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()
  const [{ data: teams }, { data: users }, { data: playerCounts }] = await Promise.all([
    supabase
      .from('teams')
      .select('*')
      .order('createdAt', { ascending: false })
      .returns<TeamRow[]>(),
    supabase
      .from('users')
      .select('id, name, email, role')
      .in('role', ['coach', 'volunteer', 'admin'])
      .order('name')
      .returns<Pick<UserRow, 'id' | 'name' | 'email' | 'role'>[]>(),
    supabase
      .from('players')
      .select('teamId')
      .returns<Pick<PlayerRow, 'teamId'>[]>(),
  ])

  const coachMap = new Map(users?.map((u) => [u.id, u]) || [])
  const playerCountMap = new Map<string, number>()
  playerCounts?.forEach((player) => {
    if (!player.teamId) {
      return
    }
    playerCountMap.set(player.teamId, (playerCountMap.get(player.teamId) || 0) + 1)
  })

  const teamsWithData = teams?.map(team => ({
    ...team,
    mainCoach: coachMap.get(team.mainCoachId || '') || null,
    players: [{ count: playerCountMap.get(team.id) || 0 }]
  })) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teams</h1>
        <p className="text-muted-foreground">
          Manage teams and assign coaches and volunteers
        </p>
      </div>

      <TeamsList
        initialTeams={teamsWithData}
        users={users || []}
        canEdit={user.role === 'admin' || user.role === 'coach'}
      />
    </div>
  )
}
