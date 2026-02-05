import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PositionsList } from '@/components/positions/PositionsList'
import type { Database } from '@/types/database'

type PositionRow = Database['public']['Tables']['positions']['Row']

export default async function PositionsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()
  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .order('sortOrder', { ascending: true })
    .returns<PositionRow[]>()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Positions</h1>
        <p className="text-muted-foreground">
          Manage position options used for player profiles
        </p>
      </div>

      <PositionsList
        initialPositions={positions || []}
        canEdit={user.role === 'admin' || user.role === 'coach'}
      />
    </div>
  )
}
