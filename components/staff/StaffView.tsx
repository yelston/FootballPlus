'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverviewTab } from './OverviewTab'
import { TimesheetTab } from './TimesheetTab'
import { CostEngineTab } from './CostEngineTab'
import type { Database } from '@/types/database'

type UserRow = Database['public']['Tables']['users']['Row']
type StaffTimesheetRow = Database['public']['Tables']['staff_timesheet']['Row']
export type StaffCostingRow = Database['public']['Tables']['staff_costing']['Row']

interface StaffViewProps {
  users: Pick<UserRow, 'id' | 'name'>[]
  timesheets: StaffTimesheetRow[]
  costingEntries: StaffCostingRow[]
  canEdit: boolean
}

export function StaffView({ users, timesheets, costingEntries, canEdit }: StaffViewProps) {
  return (
    <Tabs defaultValue="overview" className="w-full min-w-0 overflow-hidden">
      <TabsList className="grid h-auto w-full min-w-0 grid-cols-3 overflow-hidden lg:h-10">
        <TabsTrigger value="overview" className="min-w-0 truncate px-2 sm:px-3">
          Overview
        </TabsTrigger>
        <TabsTrigger value="timesheet" className="min-w-0 truncate px-2 sm:px-3">
          Timesheet
        </TabsTrigger>
        <TabsTrigger value="cost-engine" className="min-w-0 truncate px-2 sm:px-3">
          Cost Engine
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-2 lg:mt-6">
        <OverviewTab timesheets={timesheets} users={users} />
      </TabsContent>
      <TabsContent value="timesheet" className="mt-2 lg:mt-6">
        <TimesheetTab timesheets={timesheets} users={users} costingEntries={costingEntries} canEdit={canEdit} />
      </TabsContent>
      <TabsContent value="cost-engine" className="mt-2 lg:mt-6">
        <CostEngineTab costingEntries={costingEntries} users={users} canEdit={canEdit} />
      </TabsContent>
    </Tabs>
  )
}
