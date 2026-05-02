'use client'

import { useMemo, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Database } from '@/types/database'

type UserRow = Database['public']['Tables']['users']['Row']
type StaffTimesheetRow = Database['public']['Tables']['staff_timesheet']['Row']

interface OverviewTabProps {
  timesheets: StaffTimesheetRow[]
  users: Pick<UserRow, 'id' | 'name'>[]
}

const PROGRAMS = ['Champions', 'STAY in the Game', 'Schools', 'Shared/Core']
const ACTIVITY_TYPES = [
  'Direct delivery',
  'Preparation',
  'Travel',
  'Admin',
  'Monitoring & Evaluation',
  'Partner engagement',
  'Safeguarding',
  'Training',
]

type QuickFilter = 'this-month' | 'last-month' | 'this-year' | null

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function sumHours(rows: StaffTimesheetRow[]) {
  return rows.reduce((acc, r) => acc + Number(r.hours), 0)
}

function sumCost(rows: StaffTimesheetRow[]) {
  return rows.reduce((acc, r) => acc + Number(r.allocatedLabourCost ?? 0), 0)
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDayLabel(d: Date) {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

function formatMonthLabel(d: Date) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

function groupByTime(
  rows: StaffTimesheetRow[],
  dateFrom: Date | undefined,
  dateTo: Date | undefined,
): { label: string; sortKey: string; hours: number; cost: number }[] {
  if (rows.length === 0) return []

  const dates = rows.map((r) => new Date(r.date))
  const minDate = dateFrom ?? new Date(Math.min(...dates.map((d) => d.getTime())))
  const maxDate = dateTo ?? new Date(Math.max(...dates.map((d) => d.getTime())))
  const spanDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
  const useDay = spanDays <= 62

  const map: Record<string, { label: string; sortKey: string; hours: number; cost: number }> = {}

  for (const row of rows) {
    const d = new Date(row.date)
    let key: string
    let label: string
    if (useDay) {
      key = d.toISOString().slice(0, 10)
      label = formatDayLabel(d)
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      label = formatMonthLabel(d)
    }
    if (!map[key]) map[key] = { label, sortKey: key, hours: 0, cost: 0 }
    map[key].hours += Number(row.hours)
    map[key].cost += Number(row.allocatedLabourCost ?? 0)
  }

  return Object.values(map).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
}

export function OverviewTab({ timesheets, users }: OverviewTabProps) {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null)
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [customFrom, setCustomFrom] = useState<Date | undefined>()
  const [customTo, setCustomTo] = useState<Date | undefined>()
  const [roleFilter, setRoleFilter] = useState('')
  const [programFilter, setProgramFilter] = useState('')
  const [fundingFilter, setFundingFilter] = useState('')
  const [activityFilter, setActivityFilter] = useState('')
  const [chartMode, setChartMode] = useState<'hours' | 'cost'>('hours')

  const uniqueRoles = useMemo(
    () => [...new Set(timesheets.map((r) => r.role).filter(Boolean) as string[])].sort(),
    [timesheets],
  )
  const uniqueFunding = useMemo(
    () => [...new Set(timesheets.map((r) => r.fundingSource).filter(Boolean) as string[])].sort(),
    [timesheets],
  )

  const { dateFrom, dateTo } = useMemo(() => {
    if (showCustomRange) return { dateFrom: customFrom, dateTo: customTo }
    const now = new Date()
    if (quickFilter === 'this-month') return { dateFrom: startOfMonth(now), dateTo: now }
    if (quickFilter === 'last-month') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return { dateFrom: startOfMonth(lm), dateTo: endOfMonth(lm) }
    }
    if (quickFilter === 'this-year') return { dateFrom: new Date(now.getFullYear(), 0, 1), dateTo: now }
    return { dateFrom: undefined, dateTo: undefined }
  }, [quickFilter, showCustomRange, customFrom, customTo])

  const filtered = useMemo(() => {
    return timesheets.filter((row) => {
      if (dateFrom || dateTo) {
        const rowDate = new Date(row.date)
        if (dateFrom && rowDate < dateFrom) return false
        if (dateTo && rowDate > dateTo) return false
      }
      if (roleFilter && row.role !== roleFilter) return false
      if (programFilter && row.program !== programFilter) return false
      if (fundingFilter && row.fundingSource !== fundingFilter) return false
      if (activityFilter && row.activityType !== activityFilter) return false
      return true
    })
  }, [timesheets, dateFrom, dateTo, roleFilter, programFilter, fundingFilter, activityFilter])

  const activeFilterCount = [
    quickFilter !== null || showCustomRange,
    !!roleFilter,
    !!programFilter,
    !!fundingFilter,
    !!activityFilter,
  ].filter(Boolean).length

  const clearAll = useCallback(() => {
    setQuickFilter(null)
    setShowCustomRange(false)
    setCustomFrom(undefined)
    setCustomTo(undefined)
    setRoleFilter('')
    setProgramFilter('')
    setFundingFilter('')
    setActivityFilter('')
  }, [])

  const handleQuickFilter = (preset: QuickFilter) => {
    if (quickFilter === preset) {
      setQuickFilter(null)
    } else {
      setQuickFilter(preset)
      setShowCustomRange(false)
    }
  }

  const handleCustomRange = () => {
    setShowCustomRange((prev) => !prev)
    if (!showCustomRange) setQuickFilter(null)
  }

  const totalHours = sumHours(filtered)
  const totalCost = sumCost(filtered)

  const chartData = useMemo(
    () => groupByTime(filtered, dateFrom, dateTo),
    [filtered, dateFrom, dateTo],
  )

  const programBreakdown = useMemo(
    () =>
      PROGRAMS.map((program) => {
        const rows = filtered.filter((r) => r.program === program)
        return { program, hours: sumHours(rows), cost: sumCost(rows) }
      }),
    [filtered],
  )

  const activityBreakdown = useMemo(
    () =>
      ACTIVITY_TYPES.map((type) => {
        const rows = filtered.filter((r) => r.activityType === type)
        return { type, hours: sumHours(rows) }
      }),
    [filtered],
  )

  return (
    <div className="space-y-6">
      {/* ── Filters accordion ── */}
      <div className="rounded-lg border bg-card px-4">
        <Accordion type="single" collapsible>
          <AccordionItem value="filters" className="border-b-0">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    clearAll()
                  }}
                  className="ml-auto mr-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-1">
                {/* Date presets */}
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ['this-month', 'This Month'],
                      ['last-month', 'Last Month'],
                      ['this-year', 'This Year'],
                    ] as [QuickFilter, string][]
                  ).map(([preset, label]) => (
                    <Button
                      key={preset}
                      size="sm"
                      variant={quickFilter === preset ? 'default' : 'outline'}
                      onClick={() => handleQuickFilter(preset)}
                    >
                      {label}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant={showCustomRange ? 'default' : 'outline'}
                    onClick={handleCustomRange}
                  >
                    Custom
                  </Button>
                </div>

                {/* Custom date range */}
                {showCustomRange && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">From</p>
                      <DatePicker date={customFrom} onSelect={setCustomFrom} toYear={new Date().getFullYear()} />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">To</p>
                      <DatePicker date={customTo} onSelect={setCustomTo} toYear={new Date().getFullYear()} />
                    </div>
                  </div>
                )}

                {/* Attribute filters */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Role', value: roleFilter, onChange: setRoleFilter, options: uniqueRoles, placeholder: 'All Roles' },
                    { label: 'Program', value: programFilter, onChange: setProgramFilter, options: PROGRAMS, placeholder: 'All Programs' },
                    { label: 'Funding', value: fundingFilter, onChange: setFundingFilter, options: uniqueFunding, placeholder: 'All Funding' },
                    { label: 'Activity', value: activityFilter, onChange: setActivityFilter, options: ACTIVITY_TYPES, placeholder: 'All Activities' },
                  ].map(({ label, value, onChange, options, placeholder }) => (
                    <div key={label} className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                      >
                        <option value="">{placeholder}</option>
                        {options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* ── Summary cards ── */}
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

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {timesheets.length === 0
            ? 'No timesheet entries yet. Add entries in the Timesheet tab.'
            : 'No entries match the current filters.'}
        </div>
      ) : (
        <>
          {/* ── Chart mode toggle ── */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View by:</span>
            <div className="flex rounded-md border">
              <button
                onClick={() => setChartMode('hours')}
                className={`px-3 py-1.5 text-sm rounded-l-md transition-colors ${
                  chartMode === 'hours'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                Hours
              </button>
              <button
                onClick={() => setChartMode('cost')}
                className={`px-3 py-1.5 text-sm rounded-r-md border-l transition-colors ${
                  chartMode === 'cost'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                Cost
              </button>
            </div>
          </div>

          {/* ── Time-series bar chart ── */}
          <div className="rounded-lg border bg-card p-4">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    chartMode === 'hours' ? `${v}h` : formatCurrency(v)
                  }
                  width={chartMode === 'cost' ? 80 : 48}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  formatter={(value) => {
                    const n = typeof value === 'number' ? value : Number(value ?? 0)
                    return chartMode === 'hours'
                      ? [`${n.toFixed(1)}h`, 'Hours']
                      : [formatCurrency(n), 'Cost']
                  }}
                />
                <Bar
                  dataKey={chartMode}
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ── Cost breakdown tables ── */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Programme Summary */}
        <div className="overflow-hidden rounded-lg border">
          <div className="bg-orange-500 px-4 py-2.5">
            <span className="text-sm font-semibold text-white">Programme Summary (YTD)</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50 dark:bg-blue-950/30">
                <th className="px-4 py-2 text-left font-medium text-foreground">Programme</th>
                <th className="px-4 py-2 text-right font-medium text-foreground">Hours</th>
                <th className="px-4 py-2 text-right font-medium text-foreground">Labour Cost</th>
              </tr>
            </thead>
            <tbody>
              {programBreakdown.map(({ program, hours, cost }, i) => (
                <tr
                  key={program}
                  className={i % 2 === 0 ? 'bg-white dark:bg-background' : 'bg-blue-50/60 dark:bg-blue-950/20'}
                >
                  <td className="px-4 py-2 text-foreground">{program}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-foreground">{hours.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-foreground">{formatCurrency(cost)}</td>
                </tr>
              ))}
              <tr className="border-t bg-blue-50 dark:bg-blue-950/30 font-medium">
                <td className="px-4 py-2 text-foreground">Total</td>
                <td className="px-4 py-2 text-right tabular-nums text-foreground">{totalHours.toFixed(2)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-foreground">{formatCurrency(totalCost)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Activity Mix */}
        <div className="overflow-hidden rounded-lg border">
          <div className="bg-indigo-700 px-4 py-2.5">
            <span className="text-sm font-semibold text-white">Activity Mix (Hours)</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50 dark:bg-blue-950/30">
                <th className="px-4 py-2 text-left font-medium text-foreground">Activity Type</th>
                <th className="px-4 py-2 text-right font-medium text-foreground">Hours</th>
              </tr>
            </thead>
            <tbody>
              {activityBreakdown.map(({ type, hours }, i) => (
                <tr
                  key={type}
                  className={i % 2 === 0 ? 'bg-white dark:bg-background' : 'bg-blue-50/60 dark:bg-blue-950/20'}
                >
                  <td className="px-4 py-2 text-foreground">{type}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-foreground">{hours.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
