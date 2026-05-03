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
import type { AttendanceData } from './types'
import type { DateRange } from './dashboardPresets'
import { isFutureRange } from './dashboardPresets'

interface AttendanceSectionProps {
  attendanceData: AttendanceData
  dateRange: DateRange
  loading: boolean
}

export function AttendanceSection({ attendanceData, dateRange, loading }: AttendanceSectionProps) {
  const isFuture = isFutureRange(dateRange)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Mini KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Sessions</p>
            <p className="mt-1 text-2xl font-bold">{isFuture ? '—' : attendanceData.totalSessions}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Total Points</p>
            <p className="mt-1 text-2xl font-bold">{isFuture ? '—' : attendanceData.totalPoints}</p>
          </div>
        </div>

        {/* Chart */}
        {isFuture || attendanceData.trend.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              {isFuture ? 'No attendance data for future periods' : 'No attendance data for this period'}
            </p>
          </div>
        ) : (
          <div className={loading ? 'opacity-50 transition-opacity' : ''}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceData.trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
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
                />
                <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Team breakdown */}
        {!isFuture && attendanceData.byTeam.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">By Team</p>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Team</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Sessions</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Players</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.byTeam.map((row, i) => (
                    <tr key={row.teamId} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                      <td className="px-3 py-2">{row.teamName}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.sessions}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.uniquePlayers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
