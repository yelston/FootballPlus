import { getCurrentUser, getUserAssignedTeamIds } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlayersList } from '@/components/players/PlayersList'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']
type TeamRow = Database['public']['Tables']['teams']['Row']
type PlayerTeamEntry = { teamId: string; teams: { id: string; name: string } | null }
type PlayerWithTeams = PlayerRow & { player_teams: PlayerTeamEntry[] }

export default async function PlayersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()
  const isUnrestricted = user.role === 'admin' || user.role === 'board'

  const { data: allTeams } = await supabase
    .from('teams')
    .select('id, name, category')
    .order('name')
    .returns<Pick<TeamRow, 'id' | 'name' | 'category'>[]>()

  let players: PlayerWithTeams[] = []
  let teams: Pick<TeamRow, 'id' | 'name' | 'category'>[] = allTeams || []

  if (isUnrestricted) {
    const { data } = await supabase
      .from('players')
      .select('*, player_teams(teamId, teams(id, name))')
      .order('createdAt', { ascending: false })
      .returns<PlayerWithTeams[]>()
    players = data || []
  } else {
    const assignedTeamIds = await getUserAssignedTeamIds(user.id)
    teams = (allTeams || []).filter((t: Pick<TeamRow, 'id' | 'name' | 'category'>) => assignedTeamIds.includes(t.id))

    if (assignedTeamIds.length > 0) {
      const { data: playerTeamRows } = await supabase
        .from('player_teams')
        .select('playerId')
        .in('teamId', assignedTeamIds)
        .returns<{ playerId: string }[]>()
      const playerIds = [...new Set((playerTeamRows || []).map((pt) => pt.playerId))]

      if (playerIds.length > 0) {
        const { data } = await supabase
          .from('players')
          .select('*, player_teams(teamId, teams(id, name))')
          .in('id', playerIds)
          .order('createdAt', { ascending: false })
          .returns<PlayerWithTeams[]>()
        players = data || []
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Players</h1>
        <p className="text-muted-foreground">
          Manage player profiles and information
        </p>
      </div>

      <PlayersList
        initialPlayers={players}
        teams={teams}
        canEdit={user.role === 'admin' || user.role === 'coach' || user.role === 'staff'}
      />
    </div>
  )
}
