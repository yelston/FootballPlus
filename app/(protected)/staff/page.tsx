import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { StaffView } from '@/components/staff/StaffView'
import type { Database } from '@/types/database'

type UserRow = Database['public']['Tables']['users']['Row']
type StaffTimesheetRow = Database['public']['Tables']['staff_timesheet']['Row']
type StaffCostingRow = Database['public']['Tables']['staff_costing']['Row']

export default async function StaffPage() {
  const user = await requireRole(['admin', 'board'])
  const canEdit = user.role === 'admin'

  const supabase = createClient()

  const { data: users } = await supabase
    .from('users')
    .select('id, name')
    .order('name')
    .returns<Pick<UserRow, 'id' | 'name'>[]>()

  const { data: timesheets } = await supabase
    .from('staff_timesheet')
    .select('*')
    .order('date', { ascending: false })
    .returns<StaffTimesheetRow[]>()

  const { data: costingEntries } = await supabase
    .from('staff_costing')
    .select('*')
    .order('createdAt', { ascending: false })
    .returns<StaffCostingRow[]>()

  return (
    <div className="min-w-0 space-y-3 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Staff</h1>
        <p className="text-muted-foreground">
          Manage staff timesheets and labour costs
        </p>
      </div>

      <StaffView
        users={users || []}
        timesheets={timesheets || []}
        costingEntries={costingEntries || []}
        canEdit={canEdit}
      />
    </div>
  )
}
