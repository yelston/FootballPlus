import { format, startOfWeek } from 'date-fns'
import type {
  PlayerStatsData,
  AttendanceData,
  StaffData,
  CostingData,
} from './types'

type AnySupabase = any

export async function fetchPlayerStats(supabase: AnySupabase): Promise<PlayerStatsData> {
  const { data: players } = await supabase
    .from('players')
    .select('id, injuryStatus, avgTechnicalScore, avgBehaviourScore, progressedToHigherLevel, completedFullSeason')

  if (!players || players.length === 0) {
    return {
      total: 0,
      injuryBreakdown: [
        { status: 'none', count: 0 },
        { status: 'rehab', count: 0 },
        { status: 'restricted', count: 0 },
        { status: 'unavailable', count: 0 },
      ],
      avgTechnicalScore: null,
      avgBehaviourScore: null,
      progressedCount: 0,
      completedFullSeasonCount: 0,
    }
  }

  const injuryMap: Record<string, number> = { none: 0, rehab: 0, restricted: 0, unavailable: 0 }
  for (const p of players) {
    const s = p.injuryStatus ?? 'none'
    injuryMap[s] = (injuryMap[s] ?? 0) + 1
  }

  const techScores = players.map((p: any) => p.avgTechnicalScore).filter((v: any) => v != null) as number[]
  const behScores = players.map((p: any) => p.avgBehaviourScore).filter((v: any) => v != null) as number[]

  return {
    total: players.length,
    injuryBreakdown: [
      { status: 'none', count: injuryMap.none },
      { status: 'rehab', count: injuryMap.rehab },
      { status: 'restricted', count: injuryMap.restricted },
      { status: 'unavailable', count: injuryMap.unavailable },
    ],
    avgTechnicalScore: techScores.length > 0 ? techScores.reduce((a, b) => a + b, 0) / techScores.length : null,
    avgBehaviourScore: behScores.length > 0 ? behScores.reduce((a, b) => a + b, 0) / behScores.length : null,
    progressedCount: players.filter((p: any) => p.progressedToHigherLevel === true).length,
    completedFullSeasonCount: players.filter((p: any) => p.completedFullSeason === true).length,
  }
}

export async function fetchAttendanceData(
  supabase: AnySupabase,
  from: string,
  to: string,
  totalPlayers: number,
): Promise<AttendanceData> {
  const { data: rows } = await supabase
    .from('attendance')
    .select('date, playerId, teamId, points, teams(name)')
    .gte('date', from)
    .lte('date', to)

  if (!rows || rows.length === 0) {
    return { totalSessions: 0, totalPoints: 0, attendanceRate: 0, byTeam: [], trend: [] }
  }

  const totalPoints = rows.reduce((sum: number, r: any) => sum + (r.points ?? 1), 0)
  const uniquePlayerIds = new Set(rows.map((r: any) => r.playerId))
  const attendanceRate = totalPlayers > 0 ? Math.round((uniquePlayerIds.size / totalPlayers) * 100) : 0

  // Unique (date, teamId) pairs as sessions
  const sessionKeys = new Set(rows.map((r: any) => `${r.date}_${r.teamId}`))
  const totalSessions = sessionKeys.size

  // By team
  const teamMap: Record<string, { teamName: string; playerIds: Set<string>; sessions: Set<string> }> = {}
  for (const r of rows as any[]) {
    const tid = r.teamId ?? 'unknown'
    if (!teamMap[tid]) {
      teamMap[tid] = {
        teamName: r.teams?.name ?? 'Unknown',
        playerIds: new Set(),
        sessions: new Set(),
      }
    }
    teamMap[tid].playerIds.add(r.playerId)
    teamMap[tid].sessions.add(`${r.date}_${r.teamId}`)
  }
  const byTeam = Object.entries(teamMap).map(([teamId, v]) => ({
    teamId,
    teamName: v.teamName,
    sessions: v.sessions.size,
    uniquePlayers: v.playerIds.size,
  }))

  // Weekly trend buckets (Monday start)
  const trendMap: Record<string, number> = {}
  for (const r of rows as any[]) {
    const d = new Date(r.date)
    const weekStart = startOfWeek(d, { weekStartsOn: 1 })
    const key = format(weekStart, 'yyyy-MM-dd')
    trendMap[key] = (trendMap[key] ?? 0) + 1
  }
  const trend = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, sessions]) => ({
      label: format(new Date(key + 'T00:00:00'), 'dd MMM'),
      sessions,
    }))

  return { totalSessions, totalPoints, attendanceRate, byTeam, trend }
}

export async function fetchStaffData(
  supabase: AnySupabase,
  from: string,
  to: string,
): Promise<StaffData> {
  const { data: rows } = await supabase
    .from('staff_timesheet')
    .select('date, program, activityType, hours, allocatedLabourCost')
    .gte('date', from)
    .lte('date', to)

  if (!rows || rows.length === 0) {
    return { totalHours: 0, totalCost: 0, byProgram: [], byActivity: [] }
  }

  const totalHours = rows.reduce((sum: number, r: any) => sum + Number(r.hours ?? 0), 0)
  const totalCost = rows.reduce((sum: number, r: any) => sum + Number(r.allocatedLabourCost ?? 0), 0)

  const programMap: Record<string, { hours: number; cost: number }> = {}
  const activityMap: Record<string, number> = {}

  for (const r of rows as any[]) {
    const prog = r.program ?? 'Unknown'
    if (!programMap[prog]) programMap[prog] = { hours: 0, cost: 0 }
    programMap[prog].hours += Number(r.hours ?? 0)
    programMap[prog].cost += Number(r.allocatedLabourCost ?? 0)

    const act = r.activityType ?? 'Unknown'
    activityMap[act] = (activityMap[act] ?? 0) + Number(r.hours ?? 0)
  }

  return {
    totalHours,
    totalCost,
    byProgram: Object.entries(programMap).map(([program, v]) => ({ program, ...v })),
    byActivity: Object.entries(activityMap)
      .map(([activityType, hours]) => ({ activityType, hours }))
      .sort((a, b) => b.hours - a.hours),
  }
}

export async function fetchCostingData(supabase: AnySupabase): Promise<CostingData> {
  const { data: rows } = await supabase
    .from('staff_costing')
    .select('userId, role, allInMonthlyCost, blendedHourlyCost, users(name)')

  if (!rows || rows.length === 0) {
    return { totalAllInMonthlyCost: 0, byStaff: [] }
  }

  const total = rows.reduce((sum: number, r: any) => sum + Number(r.allInMonthlyCost ?? 0), 0)

  return {
    totalAllInMonthlyCost: total,
    byStaff: (rows as any[]).map((r) => ({
      userId: r.userId,
      name: r.users?.name ?? 'Unknown',
      role: r.role,
      allInMonthlyCost: r.allInMonthlyCost != null ? Number(r.allInMonthlyCost) : null,
      blendedHourlyCost: r.blendedHourlyCost != null ? Number(r.blendedHourlyCost) : null,
    })),
  }
}
