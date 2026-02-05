'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { AttendanceDialog } from './AttendanceDialog'

interface Team {
  id: string
  name: string
}

interface Player {
  id: string
  firstName: string
  lastName: string
  teamId: string | null
}

export type DateSubmissionSummary = { teamId: string | null; teamName: string; count: number }[]

interface CalendarViewProps {
  teams: Team[]
  players: Player[]
  canEdit: boolean
}

function getTeamName(teamId: string | null, teams: Team[]): string {
  if (!teamId) return 'No team'
  return teams.find((t) => t.id === teamId)?.name ?? 'Unknown'
}

export function CalendarView({ teams, players, canEdit }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submissionsByDate, setSubmissionsByDate] = useState<Record<string, DateSubmissionSummary>>({})

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const agendaDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const rangeStart = format(calendarStart, 'yyyy-MM-dd')
  const rangeEnd = format(calendarEnd, 'yyyy-MM-dd')

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('attendance')
      .select('date, teamId')
      .gte('date', rangeStart)
      .lte('date', rangeEnd)
      .then(({ data }) => {
        if (cancelled || !data) return
        const byDate: Record<string, Record<string | 'null', number>> = {}
        data.forEach((row) => {
          const d = row.date as string
          const tid = row.teamId ?? 'null'
          if (!byDate[d]) byDate[d] = {}
          byDate[d][tid] = (byDate[d][tid] ?? 0) + 1
        })
        const next: Record<string, DateSubmissionSummary> = {}
        Object.entries(byDate).forEach(([dateStr, counts]) => {
          next[dateStr] = Object.entries(counts).map(([teamId, count]) => ({
            teamId: teamId === 'null' ? null : teamId,
            teamName: getTeamName(teamId === 'null' ? null : teamId, teams),
            count,
          }))
        })
        setSubmissionsByDate(next)
      })
    return () => {
      cancelled = true
    }
  }, [rangeStart, rangeEnd, teams])

  const handleDateClick = (date: Date) => {
    if (canEdit || isSameDay(date, new Date())) {
      setSelectedDate(date)
      setIsDialogOpen(true)
    }
  }

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleDialogSuccess = () => {
    const supabase = createClient()
    supabase
      .from('attendance')
      .select('date, teamId')
      .gte('date', rangeStart)
      .lte('date', rangeEnd)
      .then(({ data }) => {
        if (!data) return
        const byDate: Record<string, Record<string | 'null', number>> = {}
        data.forEach((row) => {
          const d = row.date as string
          const tid = row.teamId ?? 'null'
          if (!byDate[d]) byDate[d] = {}
          byDate[d][tid] = (byDate[d][tid] ?? 0) + 1
        })
        const next: Record<string, DateSubmissionSummary> = {}
        Object.entries(byDate).forEach(([dateStr, counts]) => {
          next[dateStr] = Object.entries(counts).map(([teamId, count]) => ({
            teamId: teamId === 'null' ? null : teamId,
            teamName: getTeamName(teamId === 'null' ? null : teamId, teams),
            count,
          }))
        })
        setSubmissionsByDate(next)
      })
  }

  const formatSubmissionTooltip = (summary: DateSubmissionSummary) =>
    summary.map((s) => `${s.teamName}: ${s.count} player${s.count !== 1 ? 's' : ''}`).join('\n')

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="md:hidden space-y-2">
            {agendaDays.map((day) => {
              const isToday = isSameDay(day, new Date())
              const isPast = day < new Date() && !isToday
              const dateStr = format(day, 'yyyy-MM-dd')
              const summary = submissionsByDate[dateStr] ?? []
              const total = summary.reduce((sum, s) => sum + s.count, 0)

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateClick(day)}
                  disabled={!canEdit && !isToday}
                  className={`w-full rounded-md border p-3 text-left transition-colors ${canEdit || isToday ? 'hover:bg-accent' : 'cursor-not-allowed'} ${isToday ? 'border-primary' : ''} ${isPast && !isToday ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {format(day, 'EEE, MMM d')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {total} {total === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                  {summary.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {summary.map((s) => (
                        <span
                          key={s.teamId ?? 'none'}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs"
                        >
                          {s.teamName}: {s.count}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No submissions</p>
                  )}
                </button>
              )
            })}
          </div>
          <div className="hidden md:grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
            {days.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())
              const isPast = day < new Date() && !isToday
              const dateStr = format(day, 'yyyy-MM-dd')
              const summary = submissionsByDate[dateStr] ?? []
              const hasSubmission = summary.length > 0
              const tooltipText = hasSubmission
                ? `${format(day, 'MMM d')}\n${formatSubmissionTooltip(summary)}`
                : undefined

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  disabled={!canEdit && !isToday}
                  title={tooltipText}
                  className={`
                    relative aspect-square p-1 pb-1 text-sm rounded-md border transition-colors flex flex-col items-center min-h-0 gap-0 overflow-hidden
                    ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                    ${isToday ? 'bg-primary text-primary-foreground font-bold' : ''}
                    ${!isCurrentMonth ? 'opacity-50' : ''}
                    ${canEdit || isToday ? 'hover:bg-accent cursor-pointer' : 'cursor-not-allowed'}
                    ${isPast && !isToday ? 'opacity-60' : ''}
                  `}
                >
                  <div className="min-h-7 shrink-0 w-full flex items-center justify-center">
                    <span className="leading-none">{format(day, 'd')}</span>
                  </div>
                  {hasSubmission && (
                    <div
                      className={`min-w-0 w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-0.5 flex flex-col items-center justify-center ${isToday ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                      aria-label={formatSubmissionTooltip(summary)}
                    >
                      <div className="flex flex-col items-center gap-px text-[9px] leading-tight">
                        {summary.map((s) => (
                          <span
                            key={s.teamId ?? 'none'}
                            className="truncate max-w-full text-center"
                            title={`${s.teamName}: ${s.count}`}
                          >
                            {s.teamName}: {s.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <AttendanceDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          date={selectedDate}
          teams={teams}
          players={players}
          canEdit={canEdit}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  )
}
