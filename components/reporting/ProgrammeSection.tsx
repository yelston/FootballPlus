'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProgrammeDefinition } from './programmeDefinitions'

type Status = 'on_track' | 'needs_attention' | 'off_track' | 'no_data'

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'on_track', label: 'On Track' },
  { value: 'needs_attention', label: 'Needs Attention' },
  { value: 'off_track', label: 'Off Track' },
  { value: 'no_data', label: 'No Data' },
]

const STATUS_STYLES: Record<Status, string> = {
  on_track: 'bg-green-100 text-green-800',
  needs_attention: 'bg-yellow-100 text-yellow-800',
  off_track: 'bg-red-100 text-red-800',
  no_data: 'bg-gray-100 text-gray-600',
}

export interface RowState {
  annual_target: string
  q1_actual: string
  q2_actual: string
  q3_actual: string
  q4_actual: string
  ytd_total: string
  status: string
  notes: string
}

interface ProgrammeSectionProps {
  programme: ProgrammeDefinition
  rowStates: Record<string, RowState>
  onFieldChange: (metricKey: string, field: keyof RowState, value: string) => void
  canEdit: boolean
}

export function ProgrammeSection({ programme, rowStates, onFieldChange, canEdit }: ProgrammeSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="overflow-hidden rounded-lg border">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: programme.headerColour }}
      >
        <span>{programme.title}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-[220px] px-4 py-2 text-left font-semibold text-foreground">Metric</th>
                <th className="w-[110px] px-3 py-2 text-center font-semibold text-foreground">Annual Target</th>
                <th className="w-[80px] px-3 py-2 text-center font-semibold text-foreground">Q1 Actual</th>
                <th className="w-[80px] px-3 py-2 text-center font-semibold text-foreground">Q2 Actual</th>
                <th className="w-[80px] px-3 py-2 text-center font-semibold text-foreground">Q3 Actual</th>
                <th className="w-[80px] px-3 py-2 text-center font-semibold text-foreground">Q4 Actual</th>
                <th className="w-[80px] px-3 py-2 text-center font-semibold text-foreground">YTD Total</th>
                <th className="w-[165px] px-3 py-2 text-center font-semibold text-foreground">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground">Notes</th>
              </tr>
            </thead>
            <tbody>
              {programme.metrics.map((metric, idx) => {
                const state = rowStates[metric.key]
                const statusStyle = state.status ? STATUS_STYLES[state.status as Status] : ''

                return (
                  <tr
                    key={metric.key}
                    className={cn('border-b last:border-0', idx % 2 === 0 ? 'bg-background' : 'bg-muted/20')}
                  >
                    <td className="px-4 py-2 text-foreground">{metric.label}</td>

                    <td className="px-3 py-1.5 text-center">
                      {canEdit ? (
                        <input
                          type="text"
                          value={state.annual_target}
                          onChange={(e) => onFieldChange(metric.key, 'annual_target', e.target.value)}
                          className="w-full rounded border border-border bg-transparent px-1.5 py-0.5 text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          placeholder="—"
                        />
                      ) : (
                        <span className="font-semibold text-foreground">{state.annual_target || '—'}</span>
                      )}
                    </td>

                    {(['q1_actual', 'q2_actual', 'q3_actual', 'q4_actual'] as const).map((qField) => (
                      <td key={qField} className="px-3 py-2 text-center text-muted-foreground">
                        {state[qField] || ''}
                      </td>
                    ))}

                    <td className="px-3 py-2 text-center text-muted-foreground">{state.ytd_total || ''}</td>

                    <td className="px-3 py-1.5 text-center">
                      {canEdit ? (
                        <SelectRoot
                          value={state.status || ''}
                          onValueChange={(val: string) => onFieldChange(metric.key, 'status', val)}
                        >
                          <SelectTrigger className={cn('h-7 w-full border-border text-xs', statusStyle)}>
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </SelectRoot>
                      ) : (
                        <span className={cn('inline-block rounded px-2 py-0.5 text-xs font-medium', statusStyle)}>
                          {STATUS_OPTIONS.find((o) => o.value === state.status)?.label || '—'}
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-1.5">
                      {canEdit ? (
                        <input
                          type="text"
                          value={state.notes}
                          onChange={(e) => onFieldChange(metric.key, 'notes', e.target.value)}
                          className="w-full rounded border border-border bg-transparent px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          placeholder="Add a note…"
                        />
                      ) : (
                        <span className="text-muted-foreground">{state.notes || ''}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
