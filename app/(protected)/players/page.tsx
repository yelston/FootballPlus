import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlayersList } from '@/components/players/PlayersList'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']
type TeamRow = Database['public']['Tables']['teams']['Row']
type PositionRow = Database['public']['Tables']['positions']['Row']
type PlayerWithTeam = PlayerRow & { teams: { name: string } | null }

export default async function PlayersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()
  const [{ data: players }, { data: teams }, { data: positions }] = await Promise.all([
    supabase
      .from('players')
      .select('*, teams(name)')
      .order('createdAt', { ascending: false })
      .returns<PlayerWithTeam[]>(),
    supabase
      .from('teams')
      .select('id, name')
      .order('name')
      .returns<Pick<TeamRow, 'id' | 'name'>[]>(),
    supabase
      .from('positions')
      .select('id, name')
      .order('sortOrder', { ascending: true })
      .returns<Pick<PositionRow, 'id' | 'name'>[]>(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Players</h1>
        <p className="text-muted-foreground">
          Manage player profiles and information
        </p>
      </div>

      <PlayersList
        initialPlayers={players || []}
        teams={teams || []}
        positions={positions || []}
        canEdit={user.role === 'admin' || user.role === 'coach'}
      />
    </div>
  )
}
