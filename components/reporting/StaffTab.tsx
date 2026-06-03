'use client'

import { useState, useCallback } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

export interface StaffWeeklyMetricRow {
  id: string
  programme: string
  cohort: string | null
  metric_label: string
  metric_key: string
  sort_order: number
  annual_target: string | null
  q1_target: string | null
  q2_target: string | null
  q3_target: string | null
  q4_target: string | null
  this_week_actual: string | null
  cumulative_ytd: string | null
  status: string | null
  notes: string | null
  updated_at: string
}

type StatusValue = 'on_track' | 'needs_attention' | 'off_track' | 'na'

const STATUS_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: 'on_track', label: 'On Track' },
  { value: 'needs_attention', label: 'Needs Attention' },
  { value: 'off_track', label: 'Off Track' },
  { value: 'na', label: 'N/A' },
]

const STATUS_STYLES: Record<string, string> = {
  on_track: 'bg-green-100 text-green-800',
  needs_attention: 'bg-yellow-100 text-yellow-800',
  off_track: 'bg-red-100 text-red-800',
  na: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  on_track: 'On Track',
  needs_attention: 'Needs Attention',
  off_track: 'Off Track',
  na: 'N/A',
}

const PROGRAMME_ORDER = ['Champions', 'Stay in the Row', 'Stay in the Game', 'Schools']

function computePct(ytd: string | null, annual: string | null): string {
  const y = parseFloat(ytd ?? '')
  const a = parseFloat(annual ?? '')
  if (!isNaN(y) && !isNaN(a) && a > 0) return `${((y / a) * 100).toFixed(0)}%`
  return '—'
}

function StatusBadge({ status }: { status: string | null }) {
  const key = status ?? 'na'
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_STYLES[key] ?? STATUS_STYLES.na}`}>
      {STATUS_LABELS[key] ?? 'N/A'}
    </span>
  )
}

interface StaffTabProps {
  initialRows: StaffWeeklyMetricRow[]
  canEdit: boolean
}

export function StaffTab({ initialRows, canEdit }: StaffTabProps) {
  const [rows, setRows] = useState<StaffWeeklyMetricRow[]>(initialRows)
  const [isDirty, setIsDirty] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const updateRow = useCallback((id: string, field: keyof StaffWeeklyMetricRow, value: string | null) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
    setIsDirty(true)
  }, [])

  const handleSave = useCallback(async () => {
    setSaveState('saving')
    const supabase = createClient()
    const now = new Date().toISOString()
    const table = supabase.from('staff_weekly_metrics') as any
    await Promise.all(
      rows.map((r) =>
        table
          .update({
            this_week_actual: r.this_week_actual,
            cumulative_ytd: r.cumulative_ytd,
            status: r.status,
            notes: r.notes,
            updated_at: now,
          })
          .eq('id', r.id)
      )
    )
    setSaveState('saved')
    setIsDirty(false)
    setTimeout(() => setSaveState('idle'), 2000)
  }, [rows])

  // Group rows by programme (then cohort)
  type GroupKey = string
  const groups = new Map<GroupKey, { programme: string; cohort: string | null; rows: StaffWeeklyMetricRow[] }>()

  for (const row of rows) {
    const key = `${row.programme}||${row.cohort ?? ''}`
    if (!groups.has(key)) {
      groups.set(key, { programme: row.programme, cohort: row.cohort, rows: [] })
    }
    groups.get(key)!.rows.push(row)
  }

  // Sort groups by programme order, then cohort alphabetically
  const sortedGroups = [...groups.values()].sort((a, b) => {
    const ai = PROGRAMME_ORDER.indexOf(a.programme)
    const bi = PROGRAMME_ORDER.indexOf(b.programme)
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    return (a.cohort ?? '').localeCompare(b.cohort ?? '')
  })

  const TH = 'px-3 py-2 text-left text-xs font-semibold text-white whitespace-nowrap'
  const TD = 'px-3 py-2 text-sm text-gray-700 align-middle'
  const TDR = 'px-3 py-2 text-sm text-gray-700 text-center tabular-nums align-middle whitespace-nowrap'

  return (
    <div className="space-y-6">
      {/* Header row with save button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Enter actuals for each metric. The dashboard auto-calculates % of target.
          Green&nbsp;= on track. Amber&nbsp;= needs attention. Red&nbsp;= off track.
        </p>
        {canEdit && (
          <Button
            size="sm"
            className="shrink-0 ml-4"
            disabled={!isDirty || saveState === 'saving'}
            onClick={handleSave}
          >
            {saveState === 'saving' && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {saveState === 'saved' && <Check className="mr-1.5 h-4 w-4" />}
            {saveState === 'saved' ? 'Saved' : 'Save'}
          </Button>
        )}
      </div>

      {sortedGroups.length === 0 && (
        <div className="flex items-center justify-center rounded-lg border border-dashed py-20 text-muted-foreground">
          No metrics configured. Add rows to the staff_weekly_metrics table to get started.
        </div>
      )}

      {sortedGroups.map(({ programme, cohort, rows: groupRows }) => {
        const groupKey = `${programme}||${cohort ?? ''}`
        const subtitle = cohort ? `${cohort}` : null

        return (
          <div key={groupKey} className="overflow-hidden rounded-lg border border-gray-200">
            {/* Section header */}
            <div className="bg-[#1e3a5f] px-4 py-2.5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                {programme}
                {subtitle && <span className="ml-2 font-normal normal-case opacity-80">— {subtitle}</span>}
                <span className="ml-2 font-normal normal-case opacity-70">— Weekly Input</span>
              </h2>
              {programme === 'Stay in the Row' || programme === 'Stay in the Game' ? (
                <p className="mt-0.5 text-xs text-blue-200">
                  STAY runs in cohorts (8 sessions). Identify which cohort is running this week and which session number.
                </p>
              ) : null}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="bg-[#2d4d73]">
                    <th className={`${TH} min-w-[200px]`}>Metric</th>
                    <th className={`${TH} min-w-[90px] text-center`}>Annual Target</th>
                    <th className={`${TH} min-w-[60px] text-center`}>Q1 Target</th>
                    <th className={`${TH} min-w-[60px] text-center`}>Q2 Target</th>
                    <th className={`${TH} min-w-[60px] text-center`}>Q3 Target</th>
                    <th className={`${TH} min-w-[60px] text-center`}>Q4 Target</th>
                    <th className={`${TH} min-w-[110px] text-center`}>This Week Actual</th>
                    <th className={`${TH} min-w-[110px] text-center`}>Cumulative YTD</th>
                    <th className={`${TH} min-w-[110px] text-center`}>% of Annual Target</th>
                    <th className={`${TH} min-w-[140px]`}>Status</th>
                    <th className={`${TH} min-w-[200px]`}>Notes / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {groupRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {/* Metric label */}
                      <td className={`${TD} font-medium text-gray-800`}>{row.metric_label}</td>

                      {/* Annual Target — read-only */}
                      <td className={TDR}>{row.annual_target ?? '—'}</td>

                      {/* Q1–Q4 targets — read-only */}
                      <td className={TDR}>{row.q1_target ?? '-'}</td>
                      <td className={TDR}>{row.q2_target ?? '-'}</td>
                      <td className={TDR}>{row.q3_target ?? '-'}</td>
                      <td className={TDR}>{row.q4_target ?? '-'}</td>

                      {/* This Week Actual — editable */}
                      <td className={TDR}>
                        {canEdit ? (
                          <input
                            type="text"
                            value={row.this_week_actual ?? ''}
                            onChange={(e) => updateRow(row.id, 'this_week_actual', e.target.value || null)}
                            className="w-20 rounded border border-gray-200 bg-yellow-50 px-2 py-1 text-center text-sm tabular-nums focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            placeholder="—"
                          />
                        ) : (
                          row.this_week_actual ?? '—'
                        )}
                      </td>

                      {/* Cumulative YTD — editable */}
                      <td className={TDR}>
                        {canEdit ? (
                          <input
                            type="text"
                            value={row.cumulative_ytd ?? ''}
                            onChange={(e) => updateRow(row.id, 'cumulative_ytd', e.target.value || null)}
                            className="w-20 rounded border border-gray-200 bg-yellow-50 px-2 py-1 text-center text-sm tabular-nums focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            placeholder="—"
                          />
                        ) : (
                          row.cumulative_ytd ?? '—'
                        )}
                      </td>

                      {/* % of Annual Target — computed */}
                      <td className={TDR}>{computePct(row.cumulative_ytd, row.annual_target)}</td>

                      {/* Status — dropdown or badge */}
                      <td className={TD}>
                        {canEdit ? (
                          <SelectRoot
                            value={row.status ?? 'na'}
                            onValueChange={(val: string) => updateRow(row.id, 'status', val)}
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[opt.value]}`}>
                                    {opt.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </SelectRoot>
                        ) : (
                          <StatusBadge status={row.status} />
                        )}
                      </td>

                      {/* Notes / Actions — editable */}
                      <td className={TD}>
                        {canEdit ? (
                          <input
                            type="text"
                            value={row.notes ?? ''}
                            onChange={(e) => updateRow(row.id, 'notes', e.target.value || null)}
                            className="w-full min-w-[180px] rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            placeholder="Add note…"
                          />
                        ) : (
                          <span className="text-gray-600">{row.notes ?? ''}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
