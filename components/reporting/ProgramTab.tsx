'use client'

import { ProgrammeSection } from './ProgrammeSection'
import { PROGRAMME_DEFINITIONS } from './programmeDefinitions'
import type { Database } from '@/types/database'

type ProgrammeMetricRow = Database['public']['Tables']['programme_metrics']['Row']

interface ProgramTabProps {
  metrics: ProgrammeMetricRow[]
  canEdit: boolean
}

export function ProgramTab({ metrics, canEdit }: ProgramTabProps) {
  return (
    <div className="space-y-8">
      {PROGRAMME_DEFINITIONS.map((programme) => {
        const rows = metrics.filter((m) => m.programme === programme.id)
        return (
          <ProgrammeSection
            key={programme.id}
            programme={programme}
            savedRows={rows}
            canEdit={canEdit}
          />
        )
      })}
    </div>
  )
}
