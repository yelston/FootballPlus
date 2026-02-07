import type { Database } from '@/types/database'

export type PlayerRow = Database['public']['Tables']['players']['Row']

export interface PlayerDetailViewModel extends PlayerRow {
  teams: { name: string } | null
  attendanceSummary: {
    last30DaysTotalSessions: number
    last30DaysAttendedSessions: number
    last30DaysAttendancePct: number
    lastAttendanceDate: string | null
  }
}
