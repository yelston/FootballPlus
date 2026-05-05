import { differenceInYears, format, subDays } from 'date-fns'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, getUserAssignedTeamIds } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PlayerBackButton } from '@/components/players/PlayerBackButton'
import { PlayerDetailActions } from '@/components/players/PlayerDetailActions'
import { PlayerDetailTabs } from '@/components/players/PlayerDetailTabs'
import type { PlayerDetailViewModel, LiteracySession, PlayerNote } from '@/types/player'
import type { Database } from '@/types/database'

type AttendanceRow = {
  date: string
  points: number
}
type PlayerRow = Database['public']['Tables']['players']['Row']
type LiteracySessionRow = Database['public']['Tables']['literacy_sessions']['Row']
type PlayerTeamEntry = { teamId: string; teams: { id: string; name: string } | null }

export default async function PlayerDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const isUnrestricted = user.role === 'admin' || user.role === 'board'
  const canEdit = user.role === 'admin' || user.role === 'coach' || user.role === 'staff'
  const canViewSensitive = canEdit

  const q = typeof searchParams.q === 'string' ? searchParams.q : ''
  const team = typeof searchParams.team === 'string' ? searchParams.team : ''
  const position = typeof searchParams.position === 'string' ? searchParams.position : ''

  const fallbackQuery = new URLSearchParams()
  if (q) fallbackQuery.set('q', q)
  if (team) fallbackQuery.set('team', team)
  if (position) fallbackQuery.set('position', position)
  const fallbackHref = fallbackQuery.toString()
    ? `/players?${fallbackQuery.toString()}`
    : '/players'

  const supabase = createClient()
  const last30Date = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const [
    { data: playerData },
    { data: last30Attendance },
    { data: latestAttendance },
    { data: sessionsData },
    { data: notesData },
  ] = await Promise.all([
    (supabase.from('players').select('*, player_teams(teamId, teams(id, name)), houses(id, name)').eq('id', params.id).single() as any),
    supabase
      .from('attendance')
      .select('date, points')
      .eq('playerId', params.id)
      .gte('date', last30Date)
      .returns<AttendanceRow[]>(),
    supabase
      .from('attendance')
      .select('date, points')
      .eq('playerId', params.id)
      .order('date', { ascending: false })
      .limit(1)
      .returns<AttendanceRow[]>(),
    supabase
      .from('literacy_sessions')
      .select('*')
      .eq('playerId', params.id)
      .order('date', { ascending: true })
      .order('createdAt', { ascending: true })
      .returns<LiteracySessionRow[]>(),
    (supabase as any)
      .from('player_notes')
      .select('*')
      .eq('playerId', params.id)
      .order('date', { ascending: false })
      .order('createdAt', { ascending: false }),
  ])

  const player = playerData as (PlayerRow & { player_teams: PlayerTeamEntry[] }) | null

  if (!player) {
    notFound()
  }

  if (!isUnrestricted) {
    const assignedTeamIds = await getUserAssignedTeamIds(user.id)
    const playerTeamIds = (player.player_teams || []).map((pt) => pt.teamId)
    const hasAccess = playerTeamIds.some((tid) => assignedTeamIds.includes(tid))
    if (!hasAccess) {
      notFound()
    }
  }

  const age = differenceInYears(new Date(), new Date(player.dob))
  const attendanceRows = last30Attendance || []
  const attendedRows = attendanceRows.filter((row) => row.points > 0)
  const last30Total = attendanceRows.length
  const last30Attended = attendedRows.length
  const last30Pct = last30Total > 0 ? Math.round((last30Attended / last30Total) * 100) : 0
  const lastAttendanceDate =
    latestAttendance && latestAttendance.length > 0 ? latestAttendance[0].date : null

  const rawSessions = sessionsData || []
  const literacySessions: LiteracySession[] = rawSessions.map((s, i) => ({
    id: s.id,
    playerId: s.playerId,
    sessionNumber: i + 1,
    date: s.date,
    phonics: s.phonics,
    sightwords: s.sightwords,
    readers: s.readers,
    notes: s.notes,
    loggedByUserId: s.loggedByUserId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }))

  const teams = (player.player_teams ?? [])
    .map((pt) => pt.teams)
    .filter((t): t is { id: string; name: string } => t !== null)

  const house = ((player as any).houses as { id: string; name: string } | null) ?? null

  const playerNotes: PlayerNote[] = (notesData || []).map((n: any) => ({
    id: n.id,
    playerId: n.playerId,
    date: n.date,
    notes: n.notes,
    loggedByUserId: n.loggedByUserId,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  }))

  const viewModel: PlayerDetailViewModel = {
    ...player,
    teams,
    house,
    attendanceSummary: {
      last30DaysTotalSessions: last30Total,
      last30DaysAttendedSessions: last30Attended,
      last30DaysAttendancePct: last30Pct,
      lastAttendanceDate,
    },
    literacySessions,
    playerNotes,
  }

  return (
    <div>
      <PlayerDetailTabs
        viewModel={viewModel}
        age={age}
        canViewSensitive={canViewSensitive}
        canEdit={canEdit}
        start={<PlayerBackButton fallbackHref={fallbackHref} />}
        end={canEdit && (
          <PlayerDetailActions
            playerId={player.id}
            playerName={`${player.firstName} ${player.lastName}`}
            fallbackHref={fallbackHref}
          />
        )}
      />
    </div>
  )
}
