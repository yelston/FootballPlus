'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { AttendanceDialog } from './AttendanceDialog'
import type { Database } from '@/types/database'
import {
  DATE_RANGE_PRESET_OPTIONS,
  DateRangePreset,
  getDateRangeForPreset,
} from './dateRangePresets'

type AttendanceRow = Database['public']['Tables']['attendance']['Row']
type AttendanceStatus = AttendanceRow['status']
type PlayerRow = Database['public']['Tables']['players']['Row']
type TeamRow = Database['public']['Tables']['teams']['Row']
type AttendanceRecordRow = AttendanceRow & {
  players: Pick<PlayerRow, 'firstName' | 'lastName'> | null
  teams: Pick<TeamRow, 'name'> | null
}

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

interface AttendanceRecord {
  id: string
  date: string
  playerId: string
  teamId: string | null
  points: number
  status: AttendanceStatus
  reason: string | null
  players?: { firstName: string; lastName: string } | null
  teams?: { name: string } | null
}

interface ListViewProps {
  teams: Team[]
  players: Player[]
  canEdit: boolean
  allowedTeamIds: string[] | null
}

const PAGE_SIZE = 30

const getStatusLabel = (status: AttendanceStatus | null | undefined) => {
  if (status === 'excused') return 'Excused'
  if (status === 'absent') return 'Absent'
  return 'Attended'
}

const getStatusCounts = (records: AttendanceRecord[]) => ({
  attended: records.filter((r) => (r.status ?? 'attended') === 'attended').length,
  excused: records.filter((r) => r.status === 'excused').length,
  absent: records.filter((r) => r.status === 'absent').length,
})

export function ListView({ teams, players, canEdit, allowedTeamIds }: ListViewProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [datePreset, setDatePreset] = useState<DateRangePreset>('thisWeek')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const activeDateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return { from: customDateFrom, to: customDateTo }
    }
    return getDateRangeForPreset(datePreset)
  }, [datePreset, customDateFrom, customDateTo])

  const loadAttendance = useCallback(async (dateRange: { from: string; to: string }) => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('attendance')
      .select(`
        *,
        players(firstName, lastName),
        teams(name)
      `)
      .order('date', { ascending: false })

    if (dateRange.from !== '') {
      query = query.gte('date', dateRange.from)
    }
    if (dateRange.to !== '') {
      query = query.lte('date', dateRange.to)
    }

    if (allowedTeamIds !== null && allowedTeamIds.length > 0) {
      query = query.in('teamId', allowedTeamIds)
    } else if (allowedTeamIds !== null && allowedTeamIds.length === 0) {
      setAttendance([])
      setLoading(false)
      return
    }

    const { data, error } = await query.returns<AttendanceRecordRow[]>()

    if (!error && data) {
      setAttendance(data)
    }
    setLoading(false)
  }, [allowedTeamIds])

  useEffect(() => {
    loadAttendance(activeDateRange)
    setCurrentPage(1)
  }, [loadAttendance, activeDateRange])

  const filteredAttendance = useMemo(() => attendance.filter((record) => {
    const matchesSearch =
      searchQuery === '' ||
      `${record.players?.firstName} ${record.players?.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())

    const matchesTeam =
      selectedTeam === 'all' || record.teamId === selectedTeam

    return matchesSearch && matchesTeam
  }), [attendance, searchQuery, selectedTeam])

  const sortedAttendance = useMemo(() =>
    [...filteredAttendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filteredAttendance]
  )

  const totalPages = Math.max(1, Math.ceil(sortedAttendance.length / PAGE_SIZE))
  const pagedRecords = sortedAttendance.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const pagedDates = Array.from(new Set(pagedRecords.map((r) => r.date)))

  const handleCreateNew = () => {
    setSelectedDate(new Date())
    setIsDialogOpen(true)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleTeamChange = (value: string) => {
    setSelectedTeam(value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 basis-full sm:basis-0 sm:max-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by player name..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={selectedTeam}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="w-full shrink-0 sm:w-[140px]"
          >
            <option value="all">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
          <Select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
            className="w-full shrink-0 sm:w-[170px]"
            aria-label="Filter by date range"
          >
            {DATE_RANGE_PRESET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {datePreset === 'custom' && (
            <>
              <Input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="h-10 w-full shrink-0 sm:w-[150px]"
                aria-label="Custom date from"
              />
              <Input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="h-10 w-full shrink-0 sm:w-[150px]"
                aria-label="Custom date to"
              />
            </>
          )}
        </div>
        {canEdit && (
          <Button onClick={handleCreateNew} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Add Attendance
          </Button>
        )}
      </div>

      {loading ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">Loading attendance records...</p>
        </div>
      ) : sortedAttendance.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">No attendance records found.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {pagedDates.map((date) => {
              const dayRecords = pagedRecords.filter((r) => r.date === date)
              const statusCounts = getStatusCounts(dayRecords)
              const totalPoints = dayRecords.reduce(
                (sum, r) => sum + ((r.status ?? 'attended') === 'attended' ? r.points : 0),
                0
              )

              return (
                <Card key={date}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        <CardTitle>{format(new Date(date), 'EEEE, MMMM d, yyyy')}</CardTitle>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Badge variant="secondary">{statusCounts.attended} attended</Badge>
                        <Badge variant="secondary">{statusCounts.excused} excused</Badge>
                        <Badge variant="secondary">{statusCounts.absent} absent</Badge>
                        <Badge variant="secondary">{totalPoints} points</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 md:hidden">
                      {dayRecords.map((record) => (
                        <div key={record.id} className="rounded-md border p-3">
                          <p className="font-semibold">
                            {record.players?.firstName} {record.players?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground mb-1">
                            {record.teams?.name || 'No team'}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span>Status: <span className="font-medium">{getStatusLabel(record.status)}</span></span>
                            {(record.status ?? 'attended') === 'attended' ? (
                              <span>Points: <span className="font-medium">{record.points}</span></span>
                            ) : (
                              <span>Reason: <span className="font-medium">{record.reason || 'No reason'}</span></span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="hidden md:block rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-center">Points</TableHead>
                            <TableHead>Reason</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dayRecords.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">
                                {record.players?.firstName} {record.players?.lastName}
                              </TableCell>
                              <TableCell>
                                {record.teams?.name || (
                                  <span className="text-muted-foreground">No team</span>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{getStatusLabel(record.status)}</TableCell>
                              <TableCell className="text-center font-medium">
                                {(record.status ?? 'attended') === 'attended' ? record.points : '-'}
                              </TableCell>
                              <TableCell>{record.reason || <span className="text-muted-foreground">-</span>}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({sortedAttendance.length} records total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedDate && (
        <AttendanceDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          date={selectedDate}
          teams={teams}
          players={selectedTeam === 'all' ? players : players.filter((p) => p.teamIds.includes(selectedTeam))}
          canEdit={canEdit}
          selectedTeam={selectedTeam}
          onSuccess={() => loadAttendance(activeDateRange)}
        />
      )}
    </div>
  )
}
