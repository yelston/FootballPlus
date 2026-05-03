import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import {
  fetchPlayerStats,
  fetchAttendanceData,
  fetchStaffData,
  fetchCostingData,
} from '@/components/dashboard/dashboardQueries'
import { getDateRangeForPreset } from '@/components/dashboard/dashboardPresets'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createClient()
  const isAdminOrBoard = ['admin', 'board'].includes(user.role)
  const defaultPreset = 'thisMonth' as const
  const defaultRange = getDateRangeForPreset(defaultPreset)

  const playerStats = await fetchPlayerStats(supabase)

  const [attendanceData, staffData, costingData] = await Promise.all([
    fetchAttendanceData(supabase, defaultRange.from, defaultRange.to, playerStats.total),
    isAdminOrBoard ? fetchStaffData(supabase, defaultRange.from, defaultRange.to) : Promise.resolve(null),
    isAdminOrBoard ? fetchCostingData(supabase) : Promise.resolve(null),
  ])

  return (
    <DashboardClient
      user={{ id: user.id, name: user.name, role: user.role }}
      initialData={{ playerStats, attendanceData, staffData, costingData }}
      defaultPreset={defaultPreset}
    />
  )
}
