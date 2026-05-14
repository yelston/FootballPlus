type RowStateKey = 'q1_actual' | 'q2_actual' | 'q3_actual' | 'q4_actual' | 'ytd_total'

export interface MetricDefinition {
  key: string
  label: string
  /** Fields whose values are auto-computed from live data (not manually editable / saved). */
  computedFields?: RowStateKey[]
}

export interface ProgrammeDefinition {
  id: string
  title: string
  headerColour: string
  metrics: MetricDefinition[]
}

const ALL_ACTUALS: RowStateKey[] = ['q1_actual', 'q2_actual', 'q3_actual', 'q4_actual', 'ytd_total']

export const PROGRAMME_DEFINITIONS: ProgrammeDefinition[] = [
  {
    id: 'stay_in_the_game',
    title: 'STAY IN THE GAME — Quarterly Impact',
    headerColour: '#1e5c3b',
    metrics: [
      { key: 'participants_enrolled', label: 'Participants enrolled (total)', computedFields: ALL_ACTUALS },
      { key: 'sessions_delivered', label: 'Sessions delivered', computedFields: ALL_ACTUALS },
      { key: 'avg_attendance_pct', label: 'Avg attendance per session (%)', computedFields: ALL_ACTUALS },
      { key: 'participants_completing', label: 'Participants completing programme (attended 6+/8)', computedFields: ALL_ACTUALS },
      { key: 'pre_survey_avg_score', label: 'Pre-survey avg score (out of 65)', computedFields: ALL_ACTUALS },
      { key: 'post_survey_avg_score', label: 'Post-survey avg score (out of 65)', computedFields: ALL_ACTUALS },
      { key: 'avg_survey_improvement', label: 'Avg survey score improvement', computedFields: ALL_ACTUALS },
      { key: 'participant_satisfaction', label: 'Participant satisfaction rating', computedFields: ALL_ACTUALS },
    ],
  },
  {
    id: 'champions',
    title: 'CHAMPIONS PROGRAMME — Quarterly Impact',
    headerColour: '#1a6b7a',
    metrics: [
      { key: 'active_players_enrolled', label: 'Active players (enrolled)', computedFields: ALL_ACTUALS },
      { key: 'sessions_delivered', label: 'Sessions delivered', computedFields: ALL_ACTUALS },
      { key: 'avg_attendance_pct', label: 'Avg attendance per session (%)', computedFields: ALL_ACTUALS },
      { key: 'players_completing_full_season', label: 'Players completing full season', computedFields: ALL_ACTUALS },
      { key: 'avg_technical_skills_rating', label: 'Avg technical skills rating (1–5)', computedFields: ALL_ACTUALS },
      { key: 'players_progressed', label: 'Players progressed to higher level', computedFields: ALL_ACTUALS },
      { key: 'players_joining_school_team', label: 'Players joining school/regional team', computedFields: ALL_ACTUALS },
      { key: 'avg_academic_improvement', label: 'Avg academic improvement (1–5 scale)', computedFields: ALL_ACTUALS },
    ],
  },
  {
    id: 'schools',
    title: 'SCHOOLS PROGRAMME — Quarterly Impact',
    headerColour: '#1e5c3b',
    metrics: [
      { key: 'school_partners', label: 'School partners', computedFields: ALL_ACTUALS },
      { key: 'total_students_reached', label: 'Total students reached', computedFields: ALL_ACTUALS },
      { key: 'sessions_delivered', label: 'Sessions delivered', computedFields: ALL_ACTUALS },
      { key: 'sessions_delivered_pct', label: 'Sessions delivered (%)', computedFields: ALL_ACTUALS },
      { key: 'avg_students_per_session', label: 'Avg students per session', computedFields: ALL_ACTUALS },
    ],
  },
]
