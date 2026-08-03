import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ReportingView } from '@/components/reporting/ReportingView'
import { computeProgrammeActuals, computeProgrammeDiagnostics } from '@/lib/reportingComputed'
import type { Database } from '@/types/database'
import type { FundingEntryLight, StaffTimesheetRow } from '@/components/reporting/BoardGrantTab'
import type { StaffWeeklyMetricRow } from '@/components/reporting/StaffTab'

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
type TechnicalPlayerRow = Pick<
  Database['public']['Tables']['players']['Row'],
  'id' | 'dob' | 'technicalSprint' | 'technicalDribbling' | 'technicalJuggling' | 'technicalYoyo'
>

interface TeamRow { id: string; name: string; category: string | null }
interface PlayerTeamRow {
  playerId: string
  teamId: string
  players: {
    id: string
    avgTechnicalScore: number | null
    progressedToHigherLevel: boolean | null
    joinedSchoolRegionalTeam: boolean | null
    academicImprovement: number | null
    completedFullSeason: boolean | null
    sitgPreSurveyScore: number | null
    sitgPostSurveyScore: number | null
    sitgSatisfactionRating: number | null
  } | null
}
interface AttendanceRow {
  date: string
  playerId: string
  teamId: string | null
  points: number
  status?: 'attended' | 'excused' | 'absent'
}

const PAGE_SIZE = 1000

async function fetchAttendanceRows(
  supabase: ReturnType<typeof createClient>,
  year: number
): Promise<{ data: AttendanceRow[] | null }> {
  const rows: AttendanceRow[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('attendance')
      .select('date, playerId, teamId, points, status')
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
      .eq('status', 'attended')
      .order('date', { ascending: true })
      .order('playerId', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
      .returns<AttendanceRow[]>()

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break

    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }

  return { data: rows }
}

// staff_weekly_metrics is not yet in the auto-generated DB types
async function fetchStaffOpsRows(
  supabase: ReturnType<typeof createClient>
): Promise<{ data: StaffWeeklyMetricRow[] | null }> {
  const client = supabase as unknown as { from: (t: string) => { select: (c: string) => { order: (k: string) => Promise<{ data: unknown[] | null }> } } }
  const result = await client.from('staff_weekly_metrics').select('*').order('sort_order')
  return { data: result.data as StaffWeeklyMetricRow[] | null }
}

export default async function ReportingPage() {
  const user = await requireRole(['admin', 'board'])
  const canEdit = user.role === 'admin'

  const supabase = createClient()
  const year = new Date().getFullYear()

  const [
    { data: metrics },
    { data: players },
    { data: literacySessions },
    { data: teams },
    { data: playerTeams },
    { data: attendance },
    { data: technicalPlayers },
    { data: fundingRaw },
    { data: staffTimesheetRaw },
    { data: staffOpsRaw },
  ] = await Promise.all([
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
    supabase
      .from('teams')
      .select('id, name, category')
      .returns<TeamRow[]>(),
    supabase
      .from('player_teams')
      .select('playerId, teamId, players(id, avgTechnicalScore, progressedToHigherLevel, joinedSchoolRegionalTeam, academicImprovement, completedFullSeason, sitgPreSurveyScore, sitgPostSurveyScore, sitgSatisfactionRating)')
      .returns<PlayerTeamRow[]>(),
    fetchAttendanceRows(supabase, year),
    supabase
      .from('players')
      .select('id, dob, technicalSprint, technicalDribbling, technicalJuggling, technicalYoyo')
      .returns<TechnicalPlayerRow[]>(),
    supabase
      .from('funding_register')
      .select('programme, awarded_amount, cash_received_ytd, total_spend_charged_ytd')
      .returns<FundingEntryLight[]>(),
    supabase
      .from('staff_timesheet')
      .select('role, program, hours')
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
      .returns<StaffTimesheetRow[]>(),
    // staff_weekly_metrics not yet in generated DB types — cast to bypass
    fetchStaffOpsRows(supabase),
  ])

  const computedActuals = computeProgrammeActuals(
    teams ?? [],
    playerTeams ?? [],
    attendance ?? [],
  )
  const programmeDiagnostics = computeProgrammeDiagnostics(
    teams ?? [],
    playerTeams ?? [],
    attendance ?? [],
  )

  const playerTeamLinks = (playerTeams ?? []).map((pt) => ({ playerId: pt.playerId, teamId: pt.teamId }))

  return (
    <div className="min-w-0 space-y-3 lg:space-y-6">
      <ReportingView
        metrics={metrics ?? []}
        canEdit={canEdit}
        players={players ?? []}
        literacySessions={literacySessions ?? []}
        computedActuals={computedActuals}
        programmeDiagnostics={programmeDiagnostics}
        teams={teams ?? []}
        playerTeamLinks={playerTeamLinks}
        technicalPlayers={technicalPlayers ?? []}
        fundingEntries={fundingRaw ?? []}
        staffTimesheetRows={staffTimesheetRaw ?? []}
        staffOpsRows={staffOpsRaw ?? []}
      />
    </div>
  )
}
