import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamsLogList } from '@/components/teams-log/TeamsLogList'

export default async function TeamsLogPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (!['admin', 'coach', 'staff'].includes(user.role)) {
    redirect('/')
  }

  const supabase = createClient()

  const { data: logsRaw } = await supabase
    .from('teams_log')
    .select('id, date, team_id, title, details, created_at, updated_at, teams(name)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .order('name')

  const logs = (logsRaw ?? []).map((row: any) => ({
    id: row.id as string,
    date: row.date as string,
    team_id: row.team_id as string,
    teamName: (row.teams as { name: string } | null)?.name ?? '',
    title: row.title as string,
    details: row.details as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }))

  return (
    <TeamsLogList
      initialLogs={logs}
      teams={(teams ?? []) as { id: string; name: string }[]}
      canEdit={true}
    />
  )
}
