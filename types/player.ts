import type { Database } from '@/types/database'

export type PlayerRow = Database['public']['Tables']['players']['Row']

export interface PlayerNote {
  id: string
  playerId: string
  date: string
  notes: string
  loggedByUserId: string
  createdAt: string
  updatedAt: string
}

export interface LiteracySession {
  id: string
  playerId: string
  sessionNumber: number
  date: string
  phonics: string | null
  sightwords: string | null
  readers: string | null
  notes: string | null
  loggedByUserId: string
  createdAt: string
  updatedAt: string
}

export interface PlayerDetailViewModel extends PlayerRow {
  teams: { id: string; name: string }[]
  house: { id: string; name: string } | null
  attendanceSummary: {
    last30DaysTotalSessions: number
    last30DaysAttendedSessions: number
    last30DaysAttendancePct: number
    lastAttendanceDate: string | null
  }
  literacySessions: LiteracySession[]
  playerNotes: PlayerNote[]
}
