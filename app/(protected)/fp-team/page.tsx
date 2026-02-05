import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { UsersList } from '@/components/users/UsersList'

export default async function FPTeamPage() {
  await requireAdmin()

  const supabase = createClient()
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">FP Team</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage academy staff and volunteers
        </p>
      </div>

      <UsersList initialUsers={users || []} />
    </div>
  )
}
