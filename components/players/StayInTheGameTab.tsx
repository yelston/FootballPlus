'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PlayerDetailViewModel } from '@/types/player'

const TEAM_NAME = 'Stay In The Game'

interface Props {
  viewModel: PlayerDetailViewModel
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

export function StayInTheGameTab({ viewModel }: Props) {
  const isEnrolled = viewModel.teams.some((t) => t.name === TEAM_NAME)

  if (!isEnrolled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stay In The Game</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This player is not currently enrolled in the Stay In The Game programme. Enrol them by
            adding them to the &quot;Stay In The Game&quot; team.
          </p>
        </CardContent>
      </Card>
    )
  }

  const pre = viewModel.sitgPreSurveyScore
  const post = viewModel.sitgPostSurveyScore
  const scoreChange = pre != null && post != null ? post - pre : null
  const improvementMet = scoreChange != null ? scoreChange >= 8 : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stay In The Game</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <StatRow
          label="Pre-Survey Score (/65)"
          value={pre != null ? `${pre} / 65` : 'Not set'}
        />
        <StatRow
          label="Post-Survey Score (/65)"
          value={post != null ? `${post} / 65` : 'Not set'}
        />
        <StatRow
          label="Score Change"
          value={
            scoreChange != null ? (
              <Badge
                variant="secondary"
                className={
                  scoreChange > 0
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : scoreChange < 0
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : 'bg-muted text-muted-foreground'
                }
              >
                {scoreChange > 0 ? '+' : ''}
                {scoreChange}
              </Badge>
            ) : (
              'N/A'
            )
          }
        />
        <StatRow
          label="Improvement Met? (+8)"
          value={
            improvementMet != null ? (
              <Badge
                variant="secondary"
                className={
                  improvementMet
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-muted text-muted-foreground'
                }
              >
                {improvementMet ? 'Yes' : 'No'}
              </Badge>
            ) : (
              'N/A'
            )
          }
        />
        <StatRow
          label="Participant Satisfaction Rating"
          value={
            viewModel.sitgSatisfactionRating != null
              ? `${viewModel.sitgSatisfactionRating} / 5`
              : 'Not set'
          }
        />
      </CardContent>
    </Card>
  )
}
