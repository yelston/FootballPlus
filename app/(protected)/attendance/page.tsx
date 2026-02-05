import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AttendanceView } from '@/components/attendance/AttendanceView'

export default async function AttendancePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .order('name')

  const { data: players } = await supabase
    .from('players')
    .select('id, firstName, lastName, teamId')
    .order('firstName')

  return (
    <div className="min-w-0 space-y-3 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance & Points</h1>
        <p className="text-muted-foreground">
          Track player attendance and assign points
        </p>
      </div>

      <AttendanceView
        teams={teams || []}
        players={players || []}
        canEdit={user.role === 'admin' || user.role === 'coach'}
      />
    </div>
  )
}
