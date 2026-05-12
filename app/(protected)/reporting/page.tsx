import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ReportingView } from '@/components/reporting/ReportingView'
import type { Database } from '@/types/database'

type ProgrammeMetricRow = Database['public']['Tables']['programme_metrics']['Row']

export default async function ReportingPage() {
  const user = await requireRole(['admin', 'board'])
  const canEdit = user.role === 'admin'

  const supabase = createClient()
  const { data: metrics } = await supabase
    .from('programme_metrics')
    .select('*')
    .returns<ProgrammeMetricRow[]>()

  return (
    <div className="min-w-0 space-y-3 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reporting</h1>
        <p className="text-muted-foreground">
          Quarterly impact summary across all programmes
        </p>
      </div>
      <ReportingView metrics={metrics ?? []} canEdit={canEdit} />
    </div>
  )
}
