import { redirect } from 'next/navigation'
import { requireAdminCoachOrStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PlayerFormPage } from '@/components/players/PlayerFormPage'
import type { Database } from '@/types/database'

type TeamRow = Database['public']['Tables']['teams']['Row']
type PositionRow = Database['public']['Tables']['positions']['Row']
type HouseRow = Database['public']['Tables']['houses']['Row']

export default async function NewPlayerPage() {
  await requireAdminCoachOrStaff()

  const supabase = createClient()
  const [{ data: teams }, { data: positions }, { data: houses }] = await Promise.all([
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
    supabase
      .from('houses')
      .select('id, name')
      .order('name')
      .returns<Pick<HouseRow, 'id' | 'name'>[]>(),
  ])

  if (!teams || teams.length === 0) {
    redirect('/teams')
  }

  return <PlayerFormPage mode="create" teams={teams || []} positions={positions || []} houses={houses || []} />
}
