'use client'

import { useState, useRef, useCallback } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProgramTab } from './ProgramTab'
import { LiteracyTab } from './LiteracyTab'
import type { ProgramTabHandle } from './ProgramTab'
import type { Database } from '@/types/database'

type ProgrammeMetricRow = Database['public']['Tables']['programme_metrics']['Row']
type PlayerLiteracyRow = Pick<
  Database['public']['Tables']['players']['Row'],
  | 'id'
  | 'firstName'
  | 'lastName'
  | 'preferredName'
  | 'literacyEnrolled'
  | 'literacyReadingBaseline'
  | 'literacyReadingCurrent'
  | 'literacyReadingImprovement'
  | 'literacySessionsAttended'
>
type LiteracySessionRow = Database['public']['Tables']['literacy_sessions']['Row']

interface ReportingViewProps {
  metrics: ProgrammeMetricRow[]
  canEdit: boolean
  players: PlayerLiteracyRow[]
  literacySessions: LiteracySessionRow[]
}

export function ReportingView({ metrics, canEdit, players, literacySessions }: ReportingViewProps) {
  const [activeTab, setActiveTab] = useState('program')
  const [isDirty, setIsDirty] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const programTabRef = useRef<ProgramTabHandle>(null)

  const handleSave = useCallback(async () => {
    setSaveState('saving')
    await programTabRef.current?.save()
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2000)
  }, [])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0 overflow-hidden">
      {canEdit && activeTab === 'program' && (
        <div className="mb-2 flex justify-end lg:mb-4">
          <Button
            size="sm"
            className="shrink-0"
            disabled={!isDirty || saveState === 'saving'}
            onClick={handleSave}
          >
            {saveState === 'saving' && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {saveState === 'saved' && <Check className="mr-1.5 h-4 w-4" />}
            {saveState === 'saved' ? 'Saved' : 'Save'}
          </Button>
        </div>
      )}
      <TabsList className="grid h-auto w-full min-w-0 grid-cols-4 overflow-hidden lg:h-10">
        <TabsTrigger value="program" className="min-w-0 truncate px-2 sm:px-3">
          Program
        </TabsTrigger>
        <TabsTrigger value="staff" className="min-w-0 truncate px-2 sm:px-3">
          Staff
        </TabsTrigger>
        <TabsTrigger value="board-grant" className="min-w-0 truncate px-2 sm:px-3">
          Board &amp; Grant
        </TabsTrigger>
        <TabsTrigger value="literacy" className="min-w-0 truncate px-2 sm:px-3">
          Literacy
        </TabsTrigger>
      </TabsList>

      <TabsContent value="program" className="mt-2 lg:mt-6">
        <ProgramTab ref={programTabRef} metrics={metrics} canEdit={canEdit} onDirtyChange={setIsDirty} />
      </TabsContent>

      <TabsContent value="staff" className="mt-2 lg:mt-6">
        <div className="flex items-center justify-center rounded-lg border border-dashed py-20 text-muted-foreground">
          Coming soon
        </div>
      </TabsContent>

      <TabsContent value="board-grant" className="mt-2 lg:mt-6">
        <div className="flex items-center justify-center rounded-lg border border-dashed py-20 text-muted-foreground">
          Coming soon
        </div>
      </TabsContent>

      <TabsContent value="literacy" className="mt-2 lg:mt-6">
        <LiteracyTab players={players} sessions={literacySessions} />
      </TabsContent>
    </Tabs>
  )
}
