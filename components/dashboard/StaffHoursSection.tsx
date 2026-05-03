'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StaffData } from './types'
import type { DateRange } from './dashboardPresets'
import { isFutureRange } from './dashboardPresets'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

interface StaffHoursSectionProps {
  staffData: StaffData
  dateRange: DateRange
  loading: boolean
}

export function StaffHoursSection({ staffData, dateRange, loading }: StaffHoursSectionProps) {
  const isFuture = isFutureRange(dateRange)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Hours</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Total Hours</p>
            <p className="mt-1 text-2xl font-bold">
              {isFuture ? '—' : staffData.totalHours.toFixed(1)}
              {!isFuture && <span className="ml-1 text-sm font-normal text-muted-foreground">hrs</span>}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="mt-1 text-2xl font-bold">
              {isFuture ? '—' : formatCurrency(staffData.totalCost)}
            </p>
          </div>
        </div>

        {isFuture || staffData.byProgram.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              {isFuture ? 'No staff data for future periods' : 'No timesheet data for this period'}
            </p>
          </div>
        ) : (
          <>
            {/* Bar chart — hours by program */}
            <div className={loading ? 'opacity-50 transition-opacity' : ''}>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Hours by Program
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={staffData.byProgram}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="program"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    formatter={(value) => [`${Number(value).toFixed(1)} hrs`, 'Hours']}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Programme + Activity tables */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Programme summary */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Programme Summary
                </p>
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Programme</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Hrs</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffData.byProgram.map((row, i) => (
                        <tr key={row.program} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                          <td className="px-3 py-2 text-xs">{row.program}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{row.hours.toFixed(1)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Activity mix */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Activity Mix
                </p>
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Activity</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Hrs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffData.byActivity.map((row, i) => (
                        <tr key={row.activityType} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                          <td className="px-3 py-2 text-xs">{row.activityType}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{row.hours.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
