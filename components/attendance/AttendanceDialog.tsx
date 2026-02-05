'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useIsMobile } from '@/lib/hooks/use-media-query'

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

interface AttendanceRecord {
  id: string
  playerId: string
  points: number
}

interface AttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  teams: Team[]
  players: Player[]
  canEdit: boolean
  onSuccess?: () => void
}

export function AttendanceDialog({
  open,
  onOpenChange,
  date,
  teams,
  players,
  canEdit,
  onSuccess,
}: AttendanceDialogProps) {
  const router = useRouter()
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, { points: number; exists: boolean; id?: string }>
  >({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMobile = useIsMobile()

  const HeaderComponent = isMobile ? SheetHeader : DialogHeader
  const TitleComponent = isMobile ? SheetTitle : DialogTitle
  const DescriptionComponent = isMobile ? SheetDescription : DialogDescription
  const FooterComponent = isMobile ? SheetFooter : DialogFooter

  const dateString = format(date, 'yyyy-MM-dd')

  const getFilteredPlayers = useCallback(() => {
    if (selectedTeam === 'all') {
      return players
    }
    return players.filter((p) => p.teamId === selectedTeam)
  }, [players, selectedTeam])

  const loadExistingAttendance = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('attendance')
      .select('id, playerId, points')
      .eq('date', dateString)

    const records: Record<string, { points: number; exists: boolean; id?: string }> = {}

    if (data) {
      data.forEach((record) => {
        records[record.playerId] = {
          points: record.points,
          exists: true,
          id: record.id,
        }
      })
    }

    // Initialize all players with default points
    const filteredPlayers = getFilteredPlayers()
    filteredPlayers.forEach((player) => {
      if (!records[player.id]) {
        records[player.id] = {
          points: 1,
          exists: false,
        }
      }
    })

    setAttendanceRecords(records)
  }, [dateString, getFilteredPlayers])

  useEffect(() => {
    if (open) {
      loadExistingAttendance()
    }
  }, [open, loadExistingAttendance])

  const handlePointsChange = (playerId: string, points: number) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        points: Math.max(0, points),
      },
    }))
  }

  const handleSubmit = async () => {
    if (!canEdit) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to update attendance')
      setLoading(false)
      return
    }

    try {
      const updates = Object.entries(attendanceRecords).map(
        ([playerId, record]) => ({
          date: dateString,
          playerId,
          teamId: players.find((p) => p.id === playerId)?.teamId || null,
          points: record.points,
          updatedByUserId: user.id,
        })
      )

      // Delete existing records for this date
      await supabase.from('attendance').delete().eq('date', dateString)

      // Insert new/updated records
      const { error } = await supabase.from('attendance').insert(updates)

      if (error) {
        throw error
      }

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save attendance')
    } finally {
      setLoading(false)
    }
  }

  const filteredPlayers = getFilteredPlayers()

  const dialogBody = (
    <>
      <HeaderComponent>
        <TitleComponent>Attendance - {format(date, 'MMMM d, yyyy')}</TitleComponent>
        <DescriptionComponent>
          {canEdit
            ? 'Update attendance and points for players.'
            : 'View attendance records for this date.'}
        </DescriptionComponent>
      </HeaderComponent>

      <div className="space-y-4 py-4">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="team">Filter by Team</Label>
          <Select
            id="team"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            disabled={loading || !canEdit}
          >
            <option value="all">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
        </div>

        {filteredPlayers.length === 0 ? (
          <div className="rounded-lg border p-4 text-center text-muted-foreground">
            No players found for selected team.
          </div>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {filteredPlayers.map((player) => {
                const record = attendanceRecords[player.id] || {
                  points: 1,
                  exists: false,
                }
                const team = teams.find((t) => t.id === player.teamId)

                return (
                  <div key={player.id} className="rounded-md border p-3">
                    <p className="font-semibold">
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {team?.name || 'No team'}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">Points</span>
                      {canEdit ? (
                        <Input
                          type="number"
                          min="0"
                          value={record.points}
                          onChange={(e) =>
                            handlePointsChange(
                              player.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={loading}
                          className="w-20"
                        />
                      ) : (
                        <span className="font-medium">{record.points}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map((player) => {
                    const record = attendanceRecords[player.id] || {
                      points: 1,
                      exists: false,
                    }
                    const team = teams.find((t) => t.id === player.teamId)

                    return (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">
                          {player.firstName} {player.lastName}
                        </TableCell>
                        <TableCell>
                          {team ? (
                            <Badge variant="secondary">{team.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">No team</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {canEdit ? (
                            <Input
                              type="number"
                              min="0"
                              value={record.points}
                              onChange={(e) =>
                                handlePointsChange(
                                  player.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              disabled={loading}
                              className="w-20 ml-auto"
                            />
                          ) : (
                            <span className="font-medium">{record.points}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <FooterComponent>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          {canEdit ? 'Cancel' : 'Close'}
        </Button>
        {canEdit && (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Attendance'}
          </Button>
        )}
      </FooterComponent>
    </>
  )

  return (
    isMobile ? (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[100svh] w-screen overflow-y-auto">
          {dialogBody}
        </SheetContent>
      </Sheet>
    ) : (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {dialogBody}
        </DialogContent>
      </Dialog>
    )
  )
}
