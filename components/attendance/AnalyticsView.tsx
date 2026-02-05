'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database'

type AttendanceRow = Database['public']['Tables']['attendance']['Row']
type PlayerRow = Database['public']['Tables']['players']['Row']
type TeamRow = Database['public']['Tables']['teams']['Row']
type AnalyticsRecord = Pick<AttendanceRow, 'playerId' | 'points'> & {
  players: Pick<PlayerRow, 'firstName' | 'lastName' | 'teamId'> | null
  teams: Pick<TeamRow, 'name'> | null
}

interface Team {
  id: string
  name: string
}

interface PlayerStats {
  playerId: string
  firstName: string
  lastName: string
  teamName: string | null
  totalPoints: number
  attendanceCount: number
}

interface TeamStats {
  teamId: string
  teamName: string
  totalPoints: number
  playerCount: number
}

interface AnalyticsViewProps {
  teams: Team[]
}

export function AnalyticsView({ teams }: AnalyticsViewProps) {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [teamFilter, setTeamFilter] = useState<string>('all')

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('attendance')
      .select(`
        playerId,
        points,
        players(firstName, lastName, teamId),
        teams(name)
      `)

    if (dateFrom) {
      query = query.gte('date', dateFrom)
    }
    if (dateTo) {
      query = query.lte('date', dateTo)
    }
    if (teamFilter !== 'all') {
      query = query.eq('teamId', teamFilter)
    }

    const { data } = await query as { data: AnalyticsRecord[] | null }

    if (data) {
      // Calculate player stats
      const playerMap = new Map<string, PlayerStats>()
      
      data.forEach((record) => {
        const playerId = record.playerId
        if (!playerMap.has(playerId)) {
          playerMap.set(playerId, {
            playerId,
            firstName: record.players?.firstName || '',
            lastName: record.players?.lastName || '',
            teamName: record.teams?.name || null,
            totalPoints: 0,
            attendanceCount: 0,
          })
        }
        const stats = playerMap.get(playerId)!
        stats.totalPoints += record.points
        stats.attendanceCount += 1
      })

      setPlayerStats(Array.from(playerMap.values()).sort((a, b) => b.totalPoints - a.totalPoints))

      // Calculate team stats
      const teamMap = new Map<string, TeamStats>()
      
      data.forEach((record: any) => {
        const teamId = record.teams?.name || 'no-team'
        const teamName = record.teams?.name || 'No Team'
        
        if (!teamMap.has(teamId)) {
          teamMap.set(teamId, {
            teamId,
            teamName,
            totalPoints: 0,
            playerCount: 0,
          })
        }
        const stats = teamMap.get(teamId)!
        stats.totalPoints += record.points
      })

      // Count unique players per team
      const playersPerTeam = new Map<string, Set<string>>()
      data.forEach((record: any) => {
        const teamId = record.teams?.name || 'no-team'
        if (!playersPerTeam.has(teamId)) {
          playersPerTeam.set(teamId, new Set())
        }
        playersPerTeam.get(teamId)!.add(record.playerId)
      })

      playersPerTeam.forEach((playerSet, teamId) => {
        const stats = teamMap.get(teamId)
        if (stats) {
          stats.playerCount = playerSet.size
        }
      })

      setTeamStats(Array.from(teamMap.values()).sort((a, b) => b.totalPoints - a.totalPoints))
    }

    setLoading(false)
  }, [dateFrom, dateTo, teamFilter])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter analytics by date range and team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teamFilter">Team</Label>
              <Select
                id="teamFilter"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                <option value="all">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Player Statistics</CardTitle>
            <CardDescription>Total points by player</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : playerStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No data available
              </div>
            ) : (
              <>
                <div className="space-y-2 md:hidden">
                  {playerStats.map((stat) => (
                    <div key={stat.playerId} className="rounded-md border p-3">
                      <p className="font-semibold">
                        {stat.firstName} {stat.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stat.teamName || 'No team'}
                      </p>
                      <div className="mt-1 flex items-center gap-4 text-sm">
                        <span>Points: <span className="font-medium">{stat.totalPoints}</span></span>
                        <span>Sessions: <span className="font-medium">{stat.attendanceCount}</span></span>
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
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead className="text-right">Sessions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {playerStats.map((stat) => (
                        <TableRow key={stat.playerId}>
                          <TableCell className="font-medium">
                            {stat.firstName} {stat.lastName}
                          </TableCell>
                          <TableCell>
                            {stat.teamName ? (
                              <Badge variant="secondary">{stat.teamName}</Badge>
                            ) : (
                              <span className="text-muted-foreground">No team</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {stat.totalPoints}
                          </TableCell>
                          <TableCell className="text-right">
                            {stat.attendanceCount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Statistics</CardTitle>
            <CardDescription>Total points by team</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : teamStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No data available
              </div>
            ) : (
              <>
                <div className="space-y-2 md:hidden">
                  {teamStats.map((stat) => (
                    <div key={stat.teamId} className="rounded-md border p-3">
                      <p className="font-semibold">{stat.teamName}</p>
                      <div className="mt-1 flex items-center gap-4 text-sm">
                        <span>Players: <span className="font-medium">{stat.playerCount}</span></span>
                        <span>Points: <span className="font-medium">{stat.totalPoints}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-right">Players</TableHead>
                        <TableHead className="text-right">Total Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamStats.map((stat) => (
                        <TableRow key={stat.teamId}>
                          <TableCell className="font-medium">
                            {stat.teamName}
                          </TableCell>
                          <TableCell className="text-right">
                            {stat.playerCount}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {stat.totalPoints}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
