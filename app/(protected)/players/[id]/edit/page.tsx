import { notFound } from 'next/navigation'
import { requireAdminOrCoach } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PlayerFormPage } from '@/components/players/PlayerFormPage'
import type { Database } from '@/types/database'

type TeamRow = Database['public']['Tables']['teams']['Row']
type PositionRow = Database['public']['Tables']['positions']['Row']
type PlayerRow = Database['public']['Tables']['players']['Row']

export default async function EditPlayerPage({ params }: { params: { id: string } }) {
  await requireAdminOrCoach()

  const supabase = createClient()

  const [{ data: playerData }, { data: teams }, { data: positions }] = await Promise.all([
    supabase.from('players').select('*').eq('id', params.id).single(),
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

  const player = playerData as PlayerRow | null

  if (!player) {
    notFound()
  }

  return <PlayerFormPage mode="edit" player={player} teams={teams || []} positions={positions || []} />
}
