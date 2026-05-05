import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HouseList } from '@/components/houses/HouseList'
import type { HouseWithCount } from '@/components/houses/HouseList'

export default async function HousePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()
  const { data: rawHouses } = await (supabase as any)
    .from('houses')
    .select('*, players(count)')
    .order('name', { ascending: true })

  const houses: HouseWithCount[] = (rawHouses || []).map((h: any) => ({
    id: h.id,
    name: h.name,
    description: h.description,
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
    playerCount: h.players?.[0]?.count ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Houses</h1>
        <p className="text-muted-foreground">
          Manage house groups for player organisation
        </p>
      </div>

      <HouseList
        initialHouses={houses}
        canEdit={user.role === 'admin'}
      />
    </div>
  )
}
