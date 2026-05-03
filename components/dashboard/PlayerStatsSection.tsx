import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PlayerStatsData } from './types'

interface PlayerStatsSectionProps {
  playerStats: PlayerStatsData
}

export function PlayerStatsSection({ playerStats }: PlayerStatsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Scores */}
        {(playerStats.avgTechnicalScore != null || playerStats.avgBehaviourScore != null) && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Average Scores</p>
            <div className="grid grid-cols-2 gap-3">
              {playerStats.avgTechnicalScore != null && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Technical</p>
                  <p className="mt-1 text-2xl font-bold">
                    {playerStats.avgTechnicalScore.toFixed(1)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">/ 5</span>
                  </p>
                </div>
              )}
              {playerStats.avgBehaviourScore != null && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Behaviour</p>
                  <p className="mt-1 text-2xl font-bold">
                    {playerStats.avgBehaviourScore.toFixed(1)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">/ 5</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Season Progress</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm">Progressed to Higher Level</span>
              <Badge variant="secondary">{playerStats.progressedCount}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm">Completed Full Season</span>
              <Badge variant="secondary">{playerStats.completedFullSeasonCount}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
