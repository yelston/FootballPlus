type QuarterKey = 'q1' | 'q2' | 'q3' | 'q4'
type PeriodKey = QuarterKey | 'ytd'

export type ComputedActuals = Record<string, Record<string, Partial<Record<PeriodKey, string>>>>

interface Team {
  id: string
  name: string
  category: string | null
}

interface PlayerDetail {
  id: string
  avgTechnicalScore: number | null
  progressedToHigherLevel: boolean | null
  joinedSchoolRegionalTeam: boolean | null
  academicImprovement: number | null
  completedFullSeason: boolean | null
  sitgPreSurveyScore: number | null
  sitgPostSurveyScore: number | null
  sitgSatisfactionRating: number | null
}

interface PlayerTeamRow {
  playerId: string
  teamId: string
  players: PlayerDetail | null
}

interface AttendanceRow {
  date: string
  playerId: string
  teamId: string | null
  points: number
}

const QUARTER_MONTHS: Record<QuarterKey, [number, number]> = {
  q1: [1, 3],
  q2: [4, 6],
  q3: [7, 9],
  q4: [10, 12],
}

function getQuarter(dateStr: string): QuarterKey | null {
  const month = new Date(dateStr).getUTCMonth() + 1
  for (const [q, [start, end]] of Object.entries(QUARTER_MONTHS) as [QuarterKey, [number, number]][]) {
    if (month >= start && month <= end) return q
  }
  return null
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function fmt(n: number | null, decimals = 0, fallback = ''): string {
  if (n === null) return fallback
  return decimals > 0 ? n.toFixed(decimals) : String(Math.round(n))
}

function computeSessionMetrics(
  teamIds: Set<string>,
  enrolledCount: number,
  attendance: AttendanceRow[],
  period: QuarterKey | null,
): { sessions: number; avgPct: string; totalAttendances: number; distinctPlayers: number } {
  const teamAttendance = attendance.filter(
    (a) => a.teamId !== null && teamIds.has(a.teamId) && a.points > 0,
  )
  const filtered = period
    ? teamAttendance.filter((a) => getQuarter(a.date) === period)
    : teamAttendance

  const sessionMap = new Map<string, Set<string>>()
  for (const a of filtered) {
    if (!sessionMap.has(a.date)) sessionMap.set(a.date, new Set())
    sessionMap.get(a.date)!.add(a.playerId)
  }

  const sessions = sessionMap.size
  const allPlayers = new Set(filtered.map((a) => a.playerId))
  const totalAttendances = filtered.length

  let avgPct = '0%'
  if (sessions > 0 && enrolledCount > 0) {
    const pcts = [...sessionMap.values()].map((players) => (players.size / enrolledCount) * 100)
    avgPct = fmt(avg(pcts), 1) + '%'
  }

  return { sessions, avgPct, totalAttendances, distinctPlayers: allPlayers.size }
}

export function computeProgrammeActuals(
  teams: Team[],
  playerTeams: PlayerTeamRow[],
  attendance: AttendanceRow[],
): ComputedActuals {
  const result: ComputedActuals = {}

  // ── Stay In The Game ────────────────────────────────────────────────────────
  const sitgTeam = teams.find((t) => t.name === 'Stay In The Game')
  {
    const prog = 'stay_in_the_game'
    result[prog] = {}
    const sitgIds = new Set(sitgTeam ? [sitgTeam.id] : [])
    const sitgPlayerIds = new Set(
      playerTeams.filter((pt) => sitgTeam && pt.teamId === sitgTeam.id).map((pt) => pt.playerId),
    )
    const enrolled = sitgPlayerIds.size

    // participants_enrolled — same for all quarters
    const enrolledStr = fmt(enrolled)
    result[prog]['participants_enrolled'] = {
      q1: enrolledStr, q2: enrolledStr, q3: enrolledStr, q4: enrolledStr, ytd: enrolledStr,
    }

    // sessions_delivered + avg_attendance_pct — per quarter, YTD sum/avg
    let ytdSessions = 0
    for (const q of ['q1', 'q2', 'q3', 'q4'] as QuarterKey[]) {
      const m = computeSessionMetrics(sitgIds, enrolled, attendance, q)
      result[prog]['sessions_delivered'] = result[prog]['sessions_delivered'] ?? {}
      result[prog]['sessions_delivered'][q] = fmt(m.sessions)
      result[prog]['avg_attendance_pct'] = result[prog]['avg_attendance_pct'] ?? {}
      result[prog]['avg_attendance_pct'][q] = m.avgPct
      ytdSessions += m.sessions
    }
    const sitgYtd = computeSessionMetrics(sitgIds, enrolled, attendance, null)
    result[prog]['sessions_delivered']['ytd'] = fmt(ytdSessions)
    result[prog]['avg_attendance_pct']['ytd'] = sitgYtd.avgPct

    // participants_completing — YTD only (≥6 sessions across the year)
    const sitgAttendance = attendance.filter(
      (a) => a.teamId !== null && sitgIds.has(a.teamId) && a.points > 0,
    )
    const sessionsByPlayer = new Map<string, number>()
    for (const a of sitgAttendance) {
      sessionsByPlayer.set(a.playerId, (sessionsByPlayer.get(a.playerId) ?? 0) + 1)
    }
    const completing = [...sessionsByPlayer.values()].filter((n) => n >= 6).length
    const completingStr = fmt(completing)
    result[prog]['participants_completing'] = { q1: '0', q2: '0', q3: '0', q4: '0', ytd: completingStr }

    // Survey metrics — averaged from individual player records, same across all periods
    const sitgPlayers = playerTeams
      .filter((pt) => sitgTeam && pt.teamId === sitgTeam.id)
      .map((pt) => pt.players)
      .filter(Boolean) as PlayerDetail[]

    const preScores = sitgPlayers.map((p) => p.sitgPreSurveyScore).filter((v): v is number => v !== null)
    const postScores = sitgPlayers.map((p) => p.sitgPostSurveyScore).filter((v): v is number => v !== null)
    const improvements = sitgPlayers
      .filter((p) => p.sitgPreSurveyScore != null && p.sitgPostSurveyScore != null)
      .map((p) => p.sitgPostSurveyScore! - p.sitgPreSurveyScore!)
    const satisfactionScores = sitgPlayers
      .map((p) => p.sitgSatisfactionRating)
      .filter((v): v is number => v !== null)

    const preAvg = fmt(avg(preScores), 1, '—')
    const postAvg = fmt(avg(postScores), 1, '—')
    const improvAvg = fmt(avg(improvements), 1, '—')
    const satisfAvg = fmt(avg(satisfactionScores), 1, '—')

    result[prog]['pre_survey_avg_score'] = { q1: preAvg, q2: preAvg, q3: preAvg, q4: preAvg, ytd: preAvg }
    result[prog]['post_survey_avg_score'] = { q1: postAvg, q2: postAvg, q3: postAvg, q4: postAvg, ytd: postAvg }
    result[prog]['avg_survey_improvement'] = { q1: improvAvg, q2: improvAvg, q3: improvAvg, q4: improvAvg, ytd: improvAvg }
    result[prog]['participant_satisfaction'] = { q1: satisfAvg, q2: satisfAvg, q3: satisfAvg, q4: satisfAvg, ytd: satisfAvg }
  }

  // ── Champions ───────────────────────────────────────────────────────────────
  const champTeam = teams.find((t) => t.name === 'Champions')
  {
    const prog = 'champions'
    result[prog] = {}
    const champIds = new Set(champTeam ? [champTeam.id] : [])
    const champPlayerRows = playerTeams.filter((pt) => champTeam && pt.teamId === champTeam.id)
    const champPlayers = champPlayerRows.map((pt) => pt.players).filter(Boolean) as PlayerDetail[]
    const enrolled = champPlayerRows.length

    const enrolledStr = fmt(enrolled)
    result[prog]['active_players_enrolled'] = {
      q1: enrolledStr, q2: enrolledStr, q3: enrolledStr, q4: enrolledStr, ytd: enrolledStr,
    }

    // sessions_delivered + avg_attendance_pct
    let ytdSessions = 0
    for (const q of ['q1', 'q2', 'q3', 'q4'] as QuarterKey[]) {
      const m = computeSessionMetrics(champIds, enrolled, attendance, q)
      result[prog]['sessions_delivered'] = result[prog]['sessions_delivered'] ?? {}
      result[prog]['sessions_delivered'][q] = fmt(m.sessions)
      result[prog]['avg_attendance_pct'] = result[prog]['avg_attendance_pct'] ?? {}
      result[prog]['avg_attendance_pct'][q] = m.avgPct
      ytdSessions += m.sessions
    }
    const champYtd = computeSessionMetrics(champIds, enrolled, attendance, null)
    result[prog]['sessions_delivered']['ytd'] = fmt(ytdSessions)
    result[prog]['avg_attendance_pct']['ytd'] = champYtd.avgPct

    // Player-state metrics — same across all quarters
    const completingFull = champPlayers.filter((p) => p.completedFullSeason === true).length
    const completingStr = fmt(completingFull)
    result[prog]['players_completing_full_season'] = {
      q1: completingStr, q2: completingStr, q3: completingStr, q4: completingStr, ytd: completingStr,
    }

    const techScores = champPlayers.map((p) => p.avgTechnicalScore).filter((v): v is number => v !== null)
    const avgTech = fmt(avg(techScores), 1)
    result[prog]['avg_technical_skills_rating'] = {
      q1: avgTech, q2: avgTech, q3: avgTech, q4: avgTech, ytd: avgTech,
    }

    const progressed = champPlayers.filter((p) => p.progressedToHigherLevel === true).length
    const progressedStr = fmt(progressed)
    result[prog]['players_progressed'] = {
      q1: progressedStr, q2: progressedStr, q3: progressedStr, q4: progressedStr, ytd: progressedStr,
    }

    const joinedSchool = champPlayers.filter((p) => p.joinedSchoolRegionalTeam === true).length
    const joinedStr = fmt(joinedSchool)
    result[prog]['players_joining_school_team'] = {
      q1: joinedStr, q2: joinedStr, q3: joinedStr, q4: joinedStr, ytd: joinedStr,
    }

    const acadImprovements = champPlayers.map((p) => p.academicImprovement).filter((v): v is number => v !== null)
    const avgAcad = fmt(avg(acadImprovements), 1)
    result[prog]['avg_academic_improvement'] = {
      q1: avgAcad, q2: avgAcad, q3: avgAcad, q4: avgAcad, ytd: avgAcad,
    }
  }

  // ── Schools ─────────────────────────────────────────────────────────────────
  {
    const prog = 'schools'
    result[prog] = {}
    const schoolTeams = teams.filter((t) => t.category === 'Schools')
    const schoolIds = new Set(schoolTeams.map((t) => t.id))
    const schoolCount = fmt(schoolTeams.length)

    result[prog]['school_partners'] = {
      q1: schoolCount, q2: schoolCount, q3: schoolCount, q4: schoolCount, ytd: schoolCount,
    }

    // Per-quarter: sessions_delivered, total_students_reached, avg_students_per_session
    let ytdSessions = 0
    const ytdStudents = new Set<string>()

    for (const q of ['q1', 'q2', 'q3', 'q4'] as QuarterKey[]) {
      const schoolAtt = attendance.filter(
        (a) => a.teamId !== null && schoolIds.has(a.teamId) && a.points > 0 && getQuarter(a.date) === q,
      )
      const sessionDates = new Set(schoolAtt.map((a) => a.date))
      const distinctStudents = new Set(schoolAtt.map((a) => a.playerId))
      const sessions = sessionDates.size

      result[prog]['sessions_delivered'] = result[prog]['sessions_delivered'] ?? {}
      result[prog]['sessions_delivered'][q] = fmt(sessions)

      result[prog]['total_students_reached'] = result[prog]['total_students_reached'] ?? {}
      result[prog]['total_students_reached'][q] = fmt(distinctStudents.size)

      result[prog]['avg_students_per_session'] = result[prog]['avg_students_per_session'] ?? {}
      result[prog]['avg_students_per_session'][q] =
        sessions > 0 ? fmt(schoolAtt.length / sessions, 1) : '0'

      result[prog]['sessions_delivered_pct'] = result[prog]['sessions_delivered_pct'] ?? {}
      result[prog]['sessions_delivered_pct'][q] = '0%'

      ytdSessions += sessions
      schoolAtt.forEach((a) => ytdStudents.add(a.playerId))
    }

    result[prog]['sessions_delivered_pct']!['ytd'] = '0%'

    const ytdSchoolAtt = attendance.filter(
      (a) => a.teamId !== null && schoolIds.has(a.teamId) && a.points > 0,
    )
    result[prog]['sessions_delivered']['ytd'] = fmt(ytdSessions)
    result[prog]['total_students_reached']['ytd'] = fmt(ytdStudents.size)
    result[prog]['avg_students_per_session']['ytd'] =
      ytdSessions > 0 ? fmt(ytdSchoolAtt.length / ytdSessions, 1) : '0'
  }

  return result
}
