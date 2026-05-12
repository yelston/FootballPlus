'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProgramTab } from './ProgramTab'
import type { Database } from '@/types/database'

type ProgrammeMetricRow = Database['public']['Tables']['programme_metrics']['Row']

interface ReportingViewProps {
  metrics: ProgrammeMetricRow[]
  canEdit: boolean
}

export function ReportingView({ metrics, canEdit }: ReportingViewProps) {
  return (
    <Tabs defaultValue="program" className="w-full min-w-0 overflow-hidden">
      <TabsList className="grid h-auto w-full min-w-0 grid-cols-3 overflow-hidden lg:h-10">
        <TabsTrigger value="program" className="min-w-0 truncate px-2 sm:px-3">
          Program
        </TabsTrigger>
        <TabsTrigger value="staff" className="min-w-0 truncate px-2 sm:px-3">
          Staff
        </TabsTrigger>
        <TabsTrigger value="board-grant" className="min-w-0 truncate px-2 sm:px-3">
          Board &amp; Grant
        </TabsTrigger>
      </TabsList>

      <TabsContent value="program" className="mt-2 lg:mt-6">
        <ProgramTab metrics={metrics} canEdit={canEdit} />
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
    </Tabs>
  )
}
