import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ReportingView } from '@/components/reporting/ReportingView'
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

export default async function ReportingPage() {
  const user = await requireRole(['admin', 'board'])
  const canEdit = user.role === 'admin'

  const supabase = createClient()
  const [{ data: metrics }, { data: players }, { data: literacySessions }] = await Promise.all([
    supabase.from('programme_metrics').select('*').returns<ProgrammeMetricRow[]>(),
    supabase
      .from('players')
      .select('id, firstName, lastName, preferredName, literacyEnrolled, literacyReadingBaseline, literacyReadingCurrent, literacyReadingImprovement, literacySessionsAttended')
      .order('firstName')
      .returns<PlayerLiteracyRow[]>(),
    supabase
      .from('literacy_sessions')
      .select('*')
      .order('date', { ascending: true })
      .returns<LiteracySessionRow[]>(),
  ])

  return (
    <div className="min-w-0 space-y-3 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reporting</h1>
        <p className="text-muted-foreground">
          Quarterly impact summary across all programmes
        </p>
      </div>
      <ReportingView
        metrics={metrics ?? []}
        canEdit={canEdit}
        players={players ?? []}
        literacySessions={literacySessions ?? []}
      />
    </div>
  )
}
