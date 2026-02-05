import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamsList } from '@/components/teams/TeamsList'

export default async function TeamsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('createdAt', { ascending: false })
  
  // Get main coaches for teams
  const teamIds = teams?.map(t => t.mainCoachId).filter(Boolean) || []
  const { data: coaches } = teamIds.length > 0 ? await supabase
    .from('users')
    .select('id, name, email')
    .in('id', teamIds) : { data: [] }
  
  // Get player counts
  const { data: playerCounts } = await supabase
    .from('players')
    .select('teamId')
  
  const teamsWithData = teams?.map(team => ({
    ...team,
    mainCoach: coaches?.find(c => c.id === team.mainCoachId) || null,
    players: [{ count: playerCounts?.filter(p => p.teamId === team.id).length || 0 }]
  })) || []

  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, role')
    .in('role', ['coach', 'volunteer', 'admin'])
    .order('name')

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
