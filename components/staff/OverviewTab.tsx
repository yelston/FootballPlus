'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Database } from '@/types/database'

type UserRow = Database['public']['Tables']['users']['Row']
type StaffTimesheetRow = Database['public']['Tables']['staff_timesheet']['Row']

interface OverviewTabProps {
  timesheets: StaffTimesheetRow[]
  users: Pick<UserRow, 'id' | 'name'>[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(value)
}

function sumHours(rows: StaffTimesheetRow[]) {
  return rows.reduce((acc, r) => acc + Number(r.hours), 0)
}

function sumCost(rows: StaffTimesheetRow[]) {
  return rows.reduce((acc, r) => acc + Number(r.allocatedLabourCost ?? 0), 0)
}

export function OverviewTab({ timesheets, users }: OverviewTabProps) {
  const totalHours = sumHours(timesheets)
  const totalCost = sumCost(timesheets)

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]))

  // Group by user
  const byUser = timesheets.reduce<Record<string, StaffTimesheetRow[]>>((acc, row) => {
    const key = row.userId ?? 'unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})

  // Group by program
  const byProgram = timesheets.reduce<Record<string, StaffTimesheetRow[]>>((acc, row) => {
    const key = row.program ?? 'Unspecified'
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})

  // Group by activity type
  const byActivity = timesheets.reduce<Record<string, StaffTimesheetRow[]>>((acc, row) => {
    const key = row.activityType ?? 'Unspecified'
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Hours</p>
          <p className="mt-1 text-3xl font-bold">{totalHours.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Allocated Labour Cost</p>
          <p className="mt-1 text-3xl font-bold">{formatCurrency(totalCost)}</p>
        </div>
      </div>

      {timesheets.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No timesheet entries yet. Add entries in the Timesheet tab.
        </div>
      )}

      {timesheets.length > 0 && (
        <>
          {/* By staff member */}
          <div>
            <h2 className="mb-3 text-base font-semibold">By Staff Member</h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Labour Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(byUser)
                    .sort((a, b) => sumHours(b[1]) - sumHours(a[1]))
                    .map(([userId, rows]) => (
                      <TableRow key={userId}>
                        <TableCell>{userMap[userId] ?? 'Unknown'}</TableCell>
                        <TableCell className="text-right">{sumHours(rows).toFixed(1)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sumCost(rows))}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* By program */}
          <div>
            <h2 className="mb-3 text-base font-semibold">By Program</h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Labour Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(byProgram)
                    .sort((a, b) => sumHours(b[1]) - sumHours(a[1]))
                    .map(([program, rows]) => (
                      <TableRow key={program}>
                        <TableCell>{program}</TableCell>
                        <TableCell className="text-right">{sumHours(rows).toFixed(1)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sumCost(rows))}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* By activity type */}
          <div>
            <h2 className="mb-3 text-base font-semibold">By Activity Type</h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity Type</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Labour Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(byActivity)
                    .sort((a, b) => sumHours(b[1]) - sumHours(a[1]))
                    .map(([activity, rows]) => (
                      <TableRow key={activity}>
                        <TableCell>{activity}</TableCell>
                        <TableCell className="text-right">{sumHours(rows).toFixed(1)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sumCost(rows))}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
