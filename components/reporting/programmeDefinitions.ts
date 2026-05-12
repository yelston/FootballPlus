export interface MetricDefinition {
  key: string
  label: string
}

export interface ProgrammeDefinition {
  id: string
  title: string
  headerColour: string
  metrics: MetricDefinition[]
}

export const PROGRAMME_DEFINITIONS: ProgrammeDefinition[] = [
  {
    id: 'stay_in_the_game',
    title: 'STAY IN THE GAME — Quarterly Impact',
    headerColour: '#1e5c3b',
    metrics: [
      { key: 'cohorts_groups_run', label: 'Cohorts / groups run' },
      { key: 'participants_enrolled', label: 'Participants enrolled (total)' },
      { key: 'sessions_delivered', label: 'Sessions delivered' },
      { key: 'avg_attendance_pct', label: 'Avg attendance per session (%)' },
      { key: 'participants_completing', label: 'Participants completing programme (attended 6+/8)' },
      { key: 'pre_survey_avg_score', label: 'Pre-survey avg score (out of 65)' },
      { key: 'post_survey_avg_score', label: 'Post-survey avg score (out of 65)' },
      { key: 'avg_survey_improvement', label: 'Avg survey score improvement' },
      { key: 'participant_satisfaction', label: 'Participant satisfaction rating' },
      { key: 'safeguarding_referrals', label: 'Concerns/safeguarding referrals' },
    ],
  },
  {
    id: 'champions',
    title: 'CHAMPIONS PROGRAMME — Quarterly Impact',
    headerColour: '#1a6b7a',
    metrics: [
      { key: 'active_players_enrolled', label: 'Active players (enrolled)' },
      { key: 'sessions_delivered', label: 'Sessions delivered' },
      { key: 'avg_attendance_pct', label: 'Avg attendance per session (%)' },
      { key: 'players_completing_full_season', label: 'Players completing full season' },
      { key: 'avg_technical_skills_rating', label: 'Avg technical skills rating (1–5)' },
      { key: 'players_progressed', label: 'Players progressed to higher level' },
      { key: 'players_joining_school_team', label: 'Players joining school/regional team' },
      { key: 'avg_academic_improvement', label: 'Avg academic improvement (1–5 scale)' },
      { key: 'players_significant_life_change', label: 'Players with significant life change logged' },
    ],
  },
  {
    id: 'schools',
    title: 'SCHOOLS PROGRAMME — Quarterly Impact',
    headerColour: '#1e5c3b',
    metrics: [
      { key: 'school_partners', label: 'School partners' },
      { key: 'total_students_reached', label: 'Total students reached' },
      { key: 'sessions_contracted', label: 'Sessions contracted' },
      { key: 'sessions_delivered', label: 'Sessions delivered' },
      { key: 'sessions_delivered_pct', label: 'Sessions delivered (%)' },
      { key: 'avg_students_per_session', label: 'Avg students per session' },
      { key: 'teacher_satisfaction_avg', label: 'Teacher satisfaction avg (1–5)' },
      { key: 'safeguarding_concerns_raised', label: 'Safeguarding concerns raised' },
    ],
  },
]
