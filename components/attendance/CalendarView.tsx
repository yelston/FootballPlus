'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { AttendanceDialog } from './AttendanceDialog'
import type { Database } from '@/types/database'

type AttendanceRow = Database['public']['Tables']['attendance']['Row']
type AttendanceStatus = AttendanceRow['status']

interface Team {
  id: string
  name: string
}

interface Player {
  id: string
  firstName: string
  lastName: string
  teamIds: string[]
}

export type DateSubmissionSummary = {
  teamId: string | null
  teamName: string
  count: number
  attended: number
  excused: number
  absent: number
}[]

interface CalendarViewProps {
  teams: Team[]
  players: Player[]
  canEdit: boolean
  allowedTeamIds: string[] | null
}

function getTeamName(teamId: string | null, teams: Team[]): string {
  if (!teamId) return 'No team'
  return teams.find((t) => t.id === teamId)?.name ?? 'Unknown'
}

function buildSubmissionSummary(
  rows: Pick<AttendanceRow, 'date' | 'teamId' | 'status'>[],
  teams: Team[],
) {
  const byDate: Record<string, Record<string | 'null', { attended: number; excused: number; absent: number }>> = {}
  rows.forEach((row) => {
    const d = row.date as string
    const tid = row.teamId ?? 'null'
    const status = (row.status ?? 'attended') as AttendanceStatus
    if (!byDate[d]) byDate[d] = {}
    if (!byDate[d][tid]) byDate[d][tid] = { attended: 0, excused: 0, absent: 0 }
    byDate[d][tid][status] += 1
  })

  const next: Record<string, DateSubmissionSummary> = {}
  Object.entries(byDate).forEach(([dateStr, counts]) => {
    next[dateStr] = Object.entries(counts).map(([teamId, statusCounts]) => ({
      teamId: teamId === 'null' ? null : teamId,
      teamName: getTeamName(teamId === 'null' ? null : teamId, teams),
      count: statusCounts.attended + statusCounts.excused + statusCounts.absent,
      ...statusCounts,
    }))
  })
  return next
}

export function CalendarView({ teams, players, canEdit, allowedTeamIds }: CalendarViewProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const filteredPlayers = selectedTeam === 'all'
    ? players
    : players.filter((p) => p.teamIds.includes(selectedTeam))
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
    if (allowedTeamIds !== null && allowedTeamIds.length === 0) {
      setSubmissionsByDate({})
      return
    }
    let cancelled = false
    const supabase = createClient()
    let query = supabase
      .from('attendance')
      .select('date, teamId, status')
      .gte('date', rangeStart)
      .lte('date', rangeEnd)
    if (allowedTeamIds !== null) {
      query = query.in('teamId', allowedTeamIds)
    }
    query
      .returns<Pick<AttendanceRow, 'date' | 'teamId' | 'status'>[]>()
      .then(({ data }) => {
        if (cancelled || !data) return
        setSubmissionsByDate(buildSubmissionSummary(data, teams))
      })
    return () => {
      cancelled = true
    }
  }, [rangeStart, rangeEnd, teams, allowedTeamIds])

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
    if (allowedTeamIds !== null && allowedTeamIds.length === 0) return
    const supabase = createClient()
    let query = supabase
      .from('attendance')
      .select('date, teamId, status')
      .gte('date', rangeStart)
      .lte('date', rangeEnd)
    if (allowedTeamIds !== null) {
      query = query.in('teamId', allowedTeamIds)
    }
    query
      .returns<Pick<AttendanceRow, 'date' | 'teamId' | 'status'>[]>()
      .then(({ data }) => {
        if (!data) return
        setSubmissionsByDate(buildSubmissionSummary(data, teams))
      })
  }

  const formatSubmissionTooltip = (summary: DateSubmissionSummary) =>
    summary
      .map((s) => `${s.teamName}: ${s.attended} attended, ${s.excused} excused, ${s.absent} absent`)
      .join('\n')

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <Select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-[160px]"
            >
              <option value="all">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
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
              const rawSummary = submissionsByDate[dateStr] ?? []
              const summary = selectedTeam === 'all' ? rawSummary : rawSummary.filter(s => s.teamId === selectedTeam)
              const total = summary.reduce((sum, s) => sum + s.count, 0)
              const attended = summary.reduce((sum, s) => sum + s.attended, 0)
              const excused = summary.reduce((sum, s) => sum + s.excused, 0)
              const absent = summary.reduce((sum, s) => sum + s.absent, 0)

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
                      {total} logged
                    </span>
                  </div>
                  {summary.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {attended} attended
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {excused} excused
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {absent} absent
                      </span>
                      {selectedTeam === 'all' && summary.map((s) => (
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
              const rawSummary = submissionsByDate[dateStr] ?? []
              const summary = selectedTeam === 'all' ? rawSummary : rawSummary.filter(s => s.teamId === selectedTeam)
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
                        {summary.slice(0, 3).map((s) => (
                          <span
                            key={s.teamId ?? 'none'}
                            className="truncate max-w-full text-center"
                            title={`${s.teamName}: ${s.attended} attended, ${s.excused} excused, ${s.absent} absent`}
                          >
                            {s.teamName}: {s.attended}/{s.excused}/{s.absent}
                          </span>
                        ))}
                        {summary.length > 3 && (
                          <span className={`text-[9px] leading-tight ${isToday ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                            +{summary.length - 3} more
                          </span>
                        )}
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
          players={filteredPlayers}
          canEdit={canEdit}
          selectedTeam={selectedTeam}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  )
}
