import type { UserRole } from '@/lib/auth'

export type { UserRole }

export interface DashboardUser {
  id: string
  name: string
  role: UserRole
}

export interface PlayerStatsData {
  total: number
  injuryBreakdown: {
    status: 'none' | 'rehab' | 'restricted' | 'unavailable'
    count: number
  }[]
  avgTechnicalScore: number | null
  avgBehaviourScore: number | null
  progressedCount: number
  completedFullSeasonCount: number
}

export interface AttendanceTrendPoint {
  label: string
  sessions: number
}

export interface AttendanceTeamRow {
  teamId: string
  teamName: string
  sessions: number
  uniquePlayers: number
}

export interface AttendanceData {
  totalSessions: number
  totalPoints: number
  attendanceRate: number
  byTeam: AttendanceTeamRow[]
  trend: AttendanceTrendPoint[]
}

export interface StaffProgramRow {
  program: string
  hours: number
  cost: number
}

export interface StaffActivityRow {
  activityType: string
  hours: number
}

export interface StaffData {
  totalHours: number
  totalCost: number
  byProgram: StaffProgramRow[]
  byActivity: StaffActivityRow[]
}

export interface CostingStaffRow {
  userId: string
  name: string
  role: string | null
  allInMonthlyCost: number | null
  blendedHourlyCost: number | null
}

export interface CostingData {
  totalAllInMonthlyCost: number
  byStaff: CostingStaffRow[]
}

export interface DashboardInitialData {
  playerStats: PlayerStatsData
  attendanceData: AttendanceData
  staffData: StaffData | null
  costingData: CostingData | null
}
