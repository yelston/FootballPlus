'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getDateRangeForPreset,
  type DashboardPreset,
} from './dashboardPresets'
import {
  fetchAttendanceData,
  fetchStaffData,
} from './dashboardQueries'
import { DashboardHeader } from './DashboardHeader'
import { KPISummaryRow } from './KPISummaryRow'
import { AttendanceSection } from './AttendanceSection'
import { StaffHoursSection } from './StaffHoursSection'
import { CostingSection } from './CostingSection'
import type { DashboardUser, DashboardInitialData, AttendanceData, StaffData } from './types'

interface DashboardClientProps {
  user: DashboardUser
  initialData: DashboardInitialData
  defaultPreset: DashboardPreset
}

export function DashboardClient({ user, initialData, defaultPreset }: DashboardClientProps) {
  const [preset, setPreset] = useState<DashboardPreset>(defaultPreset)
  const [loading, setLoading] = useState(false)
  const [attendanceData, setAttendanceData] = useState<AttendanceData>(initialData.attendanceData)
  const [staffData, setStaffData] = useState<StaffData | null>(initialData.staffData)

  const isAdminOrBoard = ['admin', 'board'].includes(user.role)
  const isMounted = useRef(false)

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }

    setLoading(true)
    const range = getDateRangeForPreset(preset)
    const supabase = createClient()

    const requests: Promise<any>[] = [
      fetchAttendanceData(supabase, range.from, range.to, initialData.playerStats.total),
    ]
    if (isAdminOrBoard) {
      requests.push(fetchStaffData(supabase, range.from, range.to))
    }

    Promise.all(requests).then(([attendance, staff]) => {
      setAttendanceData(attendance)
      if (isAdminOrBoard && staff) setStaffData(staff)
      setLoading(false)
    })
  }, [preset, initialData.playerStats.total, isAdminOrBoard])

  const dateRange = getDateRangeForPreset(preset)

  return (
    <div className="space-y-6">
      <DashboardHeader
        userName={user.name}
        preset={preset}
        onPresetChange={setPreset}
        loading={loading}
      />

      <KPISummaryRow
        playerStats={initialData.playerStats}
        attendanceData={attendanceData}
        staffData={staffData}
        isAdminOrBoard={isAdminOrBoard}
        dateRange={dateRange}
      />

      <AttendanceSection
        attendanceData={attendanceData}
        dateRange={dateRange}
        loading={loading}
      />

      {isAdminOrBoard && (
        <div className="grid gap-6 lg:grid-cols-2">
          {staffData && (
            <StaffHoursSection
              staffData={staffData}
              dateRange={dateRange}
              loading={loading}
            />
          )}
          {initialData.costingData && (
            <CostingSection costingData={initialData.costingData} />
          )}
        </div>
      )}
    </div>
  )
}
