'use client'

import { useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProgrammeSection } from './ProgrammeSection'
import { PROGRAMME_DEFINITIONS } from './programmeDefinitions'
import type { RowState } from './ProgrammeSection'
import type { Database } from '@/types/database'

type ProgrammeMetricRow = Database['public']['Tables']['programme_metrics']['Row']
type ProgrammeMetricInsert = Database['public']['Tables']['programme_metrics']['Insert']
type ProgrammeMetricsWriter = {
  upsert: (
    values: ProgrammeMetricInsert,
    options: { onConflict: string }
  ) => Promise<{ error: { message: string } | null }>
}

export interface ProgramTabHandle {
  save: () => Promise<void>
}

interface ProgramTabProps {
  metrics: ProgrammeMetricRow[]
  canEdit: boolean
  onDirtyChange: (isDirty: boolean) => void
}

function buildInitialState(metricKey: string, savedRows: ProgrammeMetricRow[]): RowState {
  const saved = savedRows.find((r) => r.metric_key === metricKey)
  return {
    annual_target: saved?.annual_target ?? '',
    q1_actual: saved?.q1_actual ?? '',
    q2_actual: saved?.q2_actual ?? '',
    q3_actual: saved?.q3_actual ?? '',
    q4_actual: saved?.q4_actual ?? '',
    ytd_total: saved?.ytd_total ?? '',
    status: saved?.status ?? '',
    notes: saved?.notes ?? '',
  }
}

type AllRowStates = Record<string, Record<string, RowState>>

export const ProgramTab = forwardRef<ProgramTabHandle, ProgramTabProps>(
  function ProgramTab({ metrics, canEdit, onDirtyChange }, ref) {
    const [allRowStates, setAllRowStates] = useState<AllRowStates>(() => {
      const initial: AllRowStates = {}
      for (const programme of PROGRAMME_DEFINITIONS) {
        initial[programme.id] = {}
        for (const metric of programme.metrics) {
          const savedRows = metrics.filter((m) => m.programme === programme.id)
          initial[programme.id][metric.key] = buildInitialState(metric.key, savedRows)
        }
      }
      return initial
    })

    const handleFieldChange = useCallback(
      (programmeId: string, metricKey: string, field: keyof RowState, value: string) => {
        setAllRowStates((prev) => ({
          ...prev,
          [programmeId]: {
            ...prev[programmeId],
            [metricKey]: { ...prev[programmeId][metricKey], [field]: value },
          },
        }))
        onDirtyChange(true)
      },
      [onDirtyChange]
    )

    useImperativeHandle(ref, () => ({
      save: async () => {
        const supabase = createClient()
        const programmeMetrics = supabase.from('programme_metrics') as unknown as ProgrammeMetricsWriter
        const now = new Date().toISOString()

        await Promise.all(
          PROGRAMME_DEFINITIONS.flatMap((programme) =>
            programme.metrics.map((metric) => {
              const payload: ProgrammeMetricInsert = {
                programme: programme.id,
                metric_key: metric.key,
                ...allRowStates[programme.id][metric.key],
                updated_at: now,
              }
              return programmeMetrics.upsert(payload, { onConflict: 'programme,metric_key' })
            })
          )
        )

        onDirtyChange(false)
      },
    }), [allRowStates, onDirtyChange])

    return (
      <div className="space-y-8">
        {PROGRAMME_DEFINITIONS.map((programme) => (
          <ProgrammeSection
            key={programme.id}
            programme={programme}
            rowStates={allRowStates[programme.id]}
            onFieldChange={(metricKey, field, value) =>
              handleFieldChange(programme.id, metricKey, field, value)
            }
            canEdit={canEdit}
          />
        ))}
      </div>
    )
  }
)
