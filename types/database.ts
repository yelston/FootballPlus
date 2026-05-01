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
          role: 'admin' | 'board' | 'coach' | 'staff' | 'volunteer'
          profileImageUrl: string | null
          createdAt: string
        }
        Insert: {
          id: string
          name: string
          email: string
          contactNumber?: string | null
          role: 'admin' | 'board' | 'coach' | 'staff' | 'volunteer'
          profileImageUrl?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          contactNumber?: string | null
          role?: 'admin' | 'board' | 'coach' | 'staff' | 'volunteer'
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
          profileImageUrl: string | null
          preferredName: string | null
          jerseyNumber: number | null
          dominantFoot: 'left' | 'right' | 'both' | null
          contactNumber: string | null
          guardianName: string | null
          guardianRelationship: string | null
          guardianPhone: string | null
          guardianEmail: string | null
          emergencyContactName: string | null
          emergencyContactRelationship: string | null
          emergencyContactPhone: string | null
          medicalNotes: string | null
          injuryStatus: 'none' | 'rehab' | 'restricted' | 'unavailable'
          medicationNotes: string | null
          photoConsent: boolean
          medicalConsent: boolean
          transportConsent: boolean
          strengths: string | null
          developmentFocus: string | null
          coachSummary: string | null
          notes: string | null
          registeredAt: string
          updatedAt: string
          createdAt: string
          // Group 1: Basic Info
          dateJoined: string | null
          reviewDate: string | null
          // Group 2: Technical (1–5)
          technicalSprint: number | null
          technicalDribbling: number | null
          technicalPassing: number | null
          technicalJuggling: number | null
          technicalYoyo: number | null
          avgTechnicalScore: number | null
          // Group 3: Behaviour (1–5)
          behaviourTeamwork: number | null
          behaviourAttitude: number | null
          behaviourCommunication: number | null
          avgBehaviourScore: number | null
          // Group 4: Progress
          academicSchoolConcern: 'no' | 'monitor' | 'yes_discuss_school' | null
          progressedToHigherLevel: boolean | null
          nextStepGoal: string | null
          completedFullSeason: boolean | null
          joinedSchoolRegionalTeam: boolean | null
          // Group 5: Academics (1–5)
          academicBaseline: number | null
          academicCurrent: number | null
          academicImprovement: number | null
          // Group 6: Notes
          significantLifeChange: string | null
          // Group 7: Literacy
          literacyEnrolled: boolean | null
          literacyReadingBaseline: number | null
          literacyReadingCurrent: number | null
          literacyReadingImprovement: number | null
          literacySessionsAttended: number | null
        }
        Insert: {
          id?: string
          firstName: string
          lastName: string
          dob: string
          positions?: string[]
          profileImageUrl?: string | null
          preferredName?: string | null
          jerseyNumber?: number | null
          dominantFoot?: 'left' | 'right' | 'both' | null
          contactNumber?: string | null
          guardianName?: string | null
          guardianRelationship?: string | null
          guardianPhone?: string | null
          guardianEmail?: string | null
          emergencyContactName?: string | null
          emergencyContactRelationship?: string | null
          emergencyContactPhone?: string | null
          medicalNotes?: string | null
          injuryStatus?: 'none' | 'rehab' | 'restricted' | 'unavailable'
          medicationNotes?: string | null
          photoConsent?: boolean
          medicalConsent?: boolean
          transportConsent?: boolean
          strengths?: string | null
          developmentFocus?: string | null
          coachSummary?: string | null
          notes?: string | null
          registeredAt?: string
          updatedAt?: string
          createdAt?: string
          dateJoined?: string | null
          reviewDate?: string | null
          technicalSprint?: number | null
          technicalDribbling?: number | null
          technicalPassing?: number | null
          technicalJuggling?: number | null
          technicalYoyo?: number | null
          behaviourTeamwork?: number | null
          behaviourAttitude?: number | null
          behaviourCommunication?: number | null
          academicSchoolConcern?: 'no' | 'monitor' | 'yes_discuss_school' | null
          progressedToHigherLevel?: boolean | null
          nextStepGoal?: string | null
          completedFullSeason?: boolean | null
          joinedSchoolRegionalTeam?: boolean | null
          academicBaseline?: number | null
          academicCurrent?: number | null
          significantLifeChange?: string | null
          literacyEnrolled?: boolean | null
          literacyReadingBaseline?: number | null
          literacyReadingCurrent?: number | null
          literacySessionsAttended?: number | null
        }
        Update: {
          id?: string
          firstName?: string
          lastName?: string
          dob?: string
          positions?: string[]
          profileImageUrl?: string | null
          preferredName?: string | null
          jerseyNumber?: number | null
          dominantFoot?: 'left' | 'right' | 'both' | null
          contactNumber?: string | null
          guardianName?: string | null
          guardianRelationship?: string | null
          guardianPhone?: string | null
          guardianEmail?: string | null
          emergencyContactName?: string | null
          emergencyContactRelationship?: string | null
          emergencyContactPhone?: string | null
          medicalNotes?: string | null
          injuryStatus?: 'none' | 'rehab' | 'restricted' | 'unavailable'
          medicationNotes?: string | null
          photoConsent?: boolean
          medicalConsent?: boolean
          transportConsent?: boolean
          strengths?: string | null
          developmentFocus?: string | null
          coachSummary?: string | null
          notes?: string | null
          registeredAt?: string
          updatedAt?: string
          createdAt?: string
          dateJoined?: string | null
          reviewDate?: string | null
          technicalSprint?: number | null
          technicalDribbling?: number | null
          technicalPassing?: number | null
          technicalJuggling?: number | null
          technicalYoyo?: number | null
          behaviourTeamwork?: number | null
          behaviourAttitude?: number | null
          behaviourCommunication?: number | null
          academicSchoolConcern?: 'no' | 'monitor' | 'yes_discuss_school' | null
          progressedToHigherLevel?: boolean | null
          nextStepGoal?: string | null
          completedFullSeason?: boolean | null
          joinedSchoolRegionalTeam?: boolean | null
          academicBaseline?: number | null
          academicCurrent?: number | null
          significantLifeChange?: string | null
          literacyEnrolled?: boolean | null
          literacyReadingBaseline?: number | null
          literacyReadingCurrent?: number | null
          literacySessionsAttended?: number | null
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
      player_teams: {
        Row: {
          playerId: string
          teamId: string
          joinedAt: string
        }
        Insert: {
          playerId: string
          teamId: string
          joinedAt?: string
        }
        Update: {
          playerId?: string
          teamId?: string
          joinedAt?: string
        }
      }
      literacy_sessions: {
        Row: {
          id: string
          playerId: string
          date: string
          phonics: string | null
          sightwords: string | null
          readers: string | null
          notes: string | null
          loggedByUserId: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          playerId: string
          date: string
          phonics?: string | null
          sightwords?: string | null
          readers?: string | null
          notes?: string | null
          loggedByUserId: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          playerId?: string
          date?: string
          phonics?: string | null
          sightwords?: string | null
          readers?: string | null
          notes?: string | null
          loggedByUserId?: string
          createdAt?: string
          updatedAt?: string
        }
      }
    }
  }
}
