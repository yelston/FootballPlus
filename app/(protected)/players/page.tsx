import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlayersList } from '@/components/players/PlayersList'

export default async function PlayersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()
  const { data: players } = await supabase
    .from('players')
    .select('*, teams(name)')
    .order('createdAt', { ascending: false })

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .order('name')

  const { data: positions } = await supabase
    .from('positions')
    .select('id, name')
    .order('sortOrder', { ascending: true })

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
