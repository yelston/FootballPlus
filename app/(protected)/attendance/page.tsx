import { getCurrentUser, getUserAssignedTeamIds } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AttendanceView } from '@/components/attendance/AttendanceView'
import type { Database } from '@/types/database'

type TeamRow = Database['public']['Tables']['teams']['Row']

interface PlayerQueryResult {
  id: string
  firstName: string
  lastName: string
  player_teams: { teamId: string }[]
}

export default async function AttendancePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()
  const isUnrestricted = user.role === 'admin' || user.role === 'board'

  const { data: allTeams } = await supabase
    .from('teams')
    .select('id, name')
    .order('name')
    .returns<Pick<TeamRow, 'id' | 'name'>[]>()

  let teams: Pick<TeamRow, 'id' | 'name'>[] = allTeams || []
  let players: { id: string; firstName: string; lastName: string; teamIds: string[] }[] = []

  if (isUnrestricted) {
    const { data: rawPlayers } = await supabase
      .from('players')
      .select('id, firstName, lastName, player_teams(teamId)')
      .order('firstName')
      .returns<PlayerQueryResult[]>()
    players = (rawPlayers || []).map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      teamIds: p.player_teams.map((pt) => pt.teamId),
    }))
  } else {
    const assignedTeamIds = await getUserAssignedTeamIds(user.id)
    teams = (allTeams || []).filter((t) => assignedTeamIds.includes(t.id))

    if (assignedTeamIds.length > 0) {
      const { data: playerTeamRows } = await supabase
        .from('player_teams')
        .select('playerId')
        .in('teamId', assignedTeamIds)
        .returns<{ playerId: string }[]>()
      const playerIds = [...new Set((playerTeamRows || []).map((pt) => pt.playerId))]

      if (playerIds.length > 0) {
        const { data: rawPlayers } = await supabase
          .from('players')
          .select('id, firstName, lastName, player_teams(teamId)')
          .in('id', playerIds)
          .order('firstName')
          .returns<PlayerQueryResult[]>()
        players = (rawPlayers || []).map((p) => ({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          teamIds: p.player_teams.map((pt) => pt.teamId),
        }))
      }
    }
  }

  return (
    <div className="min-w-0 space-y-3 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance & Points</h1>
        <p className="text-muted-foreground">
          Track player attendance and assign points
        </p>
      </div>

      <AttendanceView
        teams={teams}
        players={players}
        canEdit={user.role === 'admin' || user.role === 'coach' || user.role === 'staff'}
        allowedTeamIds={isUnrestricted ? null : teams.map((t) => t.id)}
      />
    </div>
  )
}
