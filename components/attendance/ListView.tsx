'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { Plus, Search, Calendar as CalendarIcon } from 'lucide-react'
import { AttendanceDialog } from './AttendanceDialog'
import type { Database } from '@/types/database'
import {
  DATE_RANGE_PRESET_OPTIONS,
  DateRangePreset,
  getDateRangeForPreset,
} from './dateRangePresets'

type AttendanceRow = Database['public']['Tables']['attendance']['Row']
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
  players?: { firstName: string; lastName: string } | null
  teams?: { name: string } | null
}

interface ListViewProps {
  teams: Team[]
  players: Player[]
  canEdit: boolean
  allowedTeamIds: string[] | null
}

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

  useEffect(() => {
    loadAttendance()
  }, [])

  const loadAttendance = async () => {
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
      .limit(100)

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
  }

  const activeDateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return { from: customDateFrom, to: customDateTo }
    }

    return getDateRangeForPreset(datePreset)
  }, [datePreset, customDateFrom, customDateTo])

  const filteredAttendance = attendance.filter((record) => {
    const matchesSearch =
      searchQuery === '' ||
      `${record.players?.firstName} ${record.players?.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())

    const matchesTeam =
      selectedTeam === 'all' || record.teamId === selectedTeam

    const matchesDateFrom =
      activeDateRange.from === '' || record.date >= activeDateRange.from
    const matchesDateTo =
      activeDateRange.to === '' || record.date <= activeDateRange.to

    return matchesSearch && matchesTeam && matchesDateFrom && matchesDateTo
  })

  const uniqueDates = Array.from(
    new Set(filteredAttendance.map((r) => r.date))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const handleCreateNew = () => {
    setSelectedDate(new Date())
    setIsDialogOpen(true)
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
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
      ) : uniqueDates.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">No attendance records found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {uniqueDates.map((date) => {
            const dayRecords = filteredAttendance.filter((r) => r.date === date)
            const totalPoints = dayRecords.reduce((sum, r) => sum + r.points, 0)

            return (
              <Card key={date}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      <CardTitle>{format(new Date(date), 'EEEE, MMMM d, yyyy')}</CardTitle>
                    </div>
                    <Badge variant="secondary">
                      {dayRecords.length} players • {totalPoints} points
                    </Badge>
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
                        <div className="flex gap-4 text-sm">
                          <span>Attended: <span className="font-medium">Yes</span></span>
                          <span>Points: <span className="font-medium">{record.points}</span></span>
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
                          <TableHead className="text-center">Attended</TableHead>
                          <TableHead className="text-center">Points</TableHead>
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
                            <TableCell className="text-center font-medium">Yes</TableCell>
                            <TableCell className="text-center font-medium">{record.points}</TableCell>
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
          onSuccess={loadAttendance}
        />
      )}
    </div>
  )
}
