export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          contactNumber: string | null
          role: 'admin' | 'coach' | 'volunteer'
          profileImageUrl: string | null
          createdAt: string
        }
        Insert: {
          id: string
          name: string
          email: string
          contactNumber?: string | null
          role: 'admin' | 'coach' | 'volunteer'
          profileImageUrl?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          contactNumber?: string | null
          role?: 'admin' | 'coach' | 'volunteer'
          profileImageUrl?: string | null
          createdAt?: string
        }
      }
      players: {
        Row: {
          id: string
          firstName: string
          lastName: string
          dob: string
          positions: string[]
          teamId: string | null
          profileImageUrl: string | null
          contactNumber: string | null
          notes: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          firstName: string
          lastName: string
          dob: string
          positions?: string[]
          teamId?: string | null
          profileImageUrl?: string | null
          contactNumber?: string | null
          notes?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          firstName?: string
          lastName?: string
          dob?: string
          positions?: string[]
          teamId?: string | null
          profileImageUrl?: string | null
          contactNumber?: string | null
          notes?: string | null
          createdAt?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          mainCoachId: string | null
          coachIds: string[]
          volunteerIds: string[]
          notes: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          name: string
          mainCoachId?: string | null
          coachIds?: string[]
          volunteerIds?: string[]
          notes?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          name?: string
          mainCoachId?: string | null
          coachIds?: string[]
          volunteerIds?: string[]
          notes?: string | null
          createdAt?: string
        }
      }
      attendance: {
        Row: {
          id: string
          date: string
          playerId: string
          teamId: string | null
          points: number
          updatedByUserId: string
          createdAt: string
        }
        Insert: {
          id?: string
          date: string
          playerId: string
          teamId?: string | null
          points?: number
          updatedByUserId: string
          createdAt?: string
        }
        Update: {
          id?: string
          date?: string
          playerId?: string
          teamId?: string | null
          points?: number
          updatedByUserId?: string
          createdAt?: string
        }
      }
      positions: {
        Row: {
          id: string
          name: string
          sortOrder: number | null
          createdAt: string
        }
        Insert: {
          id?: string
          name: string
          sortOrder?: number | null
          createdAt?: string
        }
        Update: {
          id?: string
          name?: string
          sortOrder?: number | null
          createdAt?: string
        }
      }
    }
  }
}
