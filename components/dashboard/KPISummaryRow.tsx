import { Users, CalendarCheck, Clock, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PlayerStatsData, AttendanceData, StaffData } from './types'
import { isFutureRange, type DateRange } from './dashboardPresets'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

interface KPISummaryRowProps {
  playerStats: PlayerStatsData
  attendanceData: AttendanceData
  staffData: StaffData | null
  isAdminOrBoard: boolean
  dateRange: DateRange
}

export function KPISummaryRow({
  playerStats,
  attendanceData,
  staffData,
  isAdminOrBoard,
  dateRange,
}: KPISummaryRowProps) {
  const isFuture = isFutureRange(dateRange)
  const unavailable = playerStats.injuryBreakdown.find((b) => b.status === 'unavailable')?.count ?? 0

  const colCount = isAdminOrBoard ? 4 : 2

  return (
    <div
      className={`grid gap-4 ${
        colCount === 4
          ? 'sm:grid-cols-2 lg:grid-cols-4'
          : 'sm:grid-cols-2'
      }`}
    >
      {/* Total Players */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Players</p>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-3xl font-bold">{playerStats.total}</p>
          {unavailable > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <Badge variant="destructive" className="text-xs">
                {unavailable} unavailable
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Rate */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Attendance Coverage</p>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          {isFuture ? (
            <>
              <p className="mt-2 text-3xl font-bold text-muted-foreground">—</p>
              <p className="mt-1 text-xs text-muted-foreground">Future period</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold">{attendanceData.attendanceRate}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                of players attended this period
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Staff Hours — admin/board only */}
      {isAdminOrBoard && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Staff Hours</p>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            {isFuture ? (
              <>
                <p className="mt-2 text-3xl font-bold text-muted-foreground">—</p>
                <p className="mt-1 text-xs text-muted-foreground">Future period</p>
              </>
            ) : (
              <p className="mt-2 text-3xl font-bold">
                {(staffData?.totalHours ?? 0).toFixed(1)}
                <span className="ml-1 text-lg font-normal text-muted-foreground">hrs</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Labour Cost — admin/board only */}
      {isAdminOrBoard && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Labour Cost</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            {isFuture ? (
              <>
                <p className="mt-2 text-3xl font-bold text-muted-foreground">—</p>
                <p className="mt-1 text-xs text-muted-foreground">Future period</p>
              </>
            ) : (
              <p className="mt-2 text-3xl font-bold">
                {formatCurrency(staffData?.totalCost ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
