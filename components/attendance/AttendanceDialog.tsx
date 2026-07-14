'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useIsMobile } from '@/lib/hooks/use-media-query'
import type { Database } from '@/types/database'

type AttendanceRow = Database['public']['Tables']['attendance']['Row']

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

type AttendanceEntry = { points: number; attended: boolean; exists: boolean; playerId: string; teamId: string | null; id?: string }

interface AttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  teams: Team[]
  players: Player[]
  canEdit: boolean
  selectedTeam: string
  onSuccess?: () => void
}

export function AttendanceDialog({
  open,
  onOpenChange,
  date,
  teams,
  players,
  canEdit,
  selectedTeam,
  onSuccess,
}: AttendanceDialogProps) {
  const router = useRouter()
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceEntry>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const initialRecordsRef = useRef<Record<string, AttendanceEntry>>({})
  const isMobile = useIsMobile()

  const isDirty = useMemo(
    () => JSON.stringify(attendanceRecords) !== JSON.stringify(initialRecordsRef.current),
    [attendanceRecords]
  )

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isDirty && canEdit) {
      setShowDiscardConfirm(true)
      return
    }
    onOpenChange(newOpen)
  }

  const HeaderComponent = isMobile ? SheetHeader : DialogHeader
  const TitleComponent = isMobile ? SheetTitle : DialogTitle
  const DescriptionComponent = isMobile ? SheetDescription : DialogDescription
  const FooterComponent = isMobile ? SheetFooter : DialogFooter

  const dateString = format(date, 'yyyy-MM-dd')

  const getPlayerTeams = useCallback((player: Player) => {
    return player.teamIds
      .map((id) => teams.find((team) => team.id === id))
      .filter(Boolean) as Team[]
  }, [teams])

  const getTeamName = useCallback((teamId: string | null | undefined) => {
    if (!teamId) return null
    return teams.find((team) => team.id === teamId)?.name ?? null
  }, [teams])

  const rowKey = (playerId: string, teamId: string | null) => `${playerId}::${teamId ?? 'none'}`

  // One row per (player, team) pair so a player on multiple teams can be marked
  // attended for more than one team session on the same day. When a specific
  // team is selected, only show that team's row for the player.
  const getPlayerRows = useCallback((player: Player) => {
    const playerTeams = selectedTeam === 'all'
      ? getPlayerTeams(player)
      : getPlayerTeams(player).filter((team) => team.id === selectedTeam)
    if (playerTeams.length === 0) {
      return [{ key: rowKey(player.id, null), teamId: null as string | null }]
    }
    return playerTeams.map((team) => ({ key: rowKey(player.id, team.id), teamId: team.id as string | null }))
  }, [getPlayerTeams, selectedTeam])

  const loadExistingAttendance = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('attendance')
      .select('id, playerId, teamId, points')
      .eq('date', dateString)
      .returns<Pick<AttendanceRow, 'id' | 'playerId' | 'teamId' | 'points'>[]>()

    const existing: Record<string, { points: number; teamId: string | null; id: string }> = {}
    data?.forEach((r) => {
      existing[rowKey(r.playerId, r.teamId)] = { points: r.points, teamId: r.teamId, id: r.id }
    })

    const records: Record<string, AttendanceEntry> = {}
    players.forEach((player) => {
      getPlayerRows(player).forEach(({ key, teamId }) => {
        const found = existing[key]
        records[key] = {
          points: found?.points ?? 0,
          attended: !!found,
          exists: !!found,
          playerId: player.id,
          teamId,
          id: found?.id,
        }
      })
    })
    setAttendanceRecords(records)
    initialRecordsRef.current = { ...records }
  }, [dateString, getPlayerRows, players])

  useEffect(() => {
    if (!open) {
      initialRecordsRef.current = {}
      return
    }
    loadExistingAttendance()
  }, [open, loadExistingAttendance])

  const handlePointsChange = (key: string, points: number) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [key]: { ...prev[key], points: Math.max(0, points) },
    }))
  }

  const handleToggle = (key: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [key]: { ...prev[key], attended: !prev[key].attended },
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
      const records = Object.values(attendanceRecords)
      const toSave = records.filter((r) => r.attended)
      const toDelete = records.filter((r) => !r.attended && r.exists).map((r) => r.id as string)

      const updates = toSave.map((record) => ({
        date: dateString,
        playerId: record.playerId,
        teamId: record.teamId,
        points: record.points,
        updatedByUserId: user.id,
      }))

      if (updates.length > 0) {
        const attendanceQuery = supabase.from('attendance') as any
        const { error } = await attendanceQuery.upsert(updates, { onConflict: 'date,playerId,teamId' })
        if (error) throw error
      }

      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('attendance')
          .delete()
          .in('id', toDelete)
        if (deleteError) throw deleteError
      }

      initialRecordsRef.current = { ...attendanceRecords }
      onOpenChange(false)
      if (onSuccess) onSuccess()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save attendance')
    } finally {
      setLoading(false)
    }
  }

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

        {players.length === 0 ? (
          <div className="rounded-lg border p-4 text-center text-muted-foreground">
            No players found for selected team.
          </div>
        ) : (
          <>
            {/* Mobile layout */}
            <div className="space-y-2 md:hidden">
              {players.flatMap((player) =>
                getPlayerRows(player).map(({ key, teamId }) => {
                  const record = attendanceRecords[key] ?? {
                    points: 0,
                    attended: false,
                    exists: false,
                    playerId: player.id,
                    teamId,
                  }
                  const teamName = getTeamName(teamId)

                  return (
                    <div key={key} className="rounded-md border p-3">
                      <p className="font-semibold">
                        {player.firstName} {player.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {teamName || 'No team'}
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Attended</span>
                          {canEdit ? (
                            <input
                              type="checkbox"
                              checked={record.attended}
                              onChange={() => handleToggle(key)}
                              disabled={loading}
                              className="h-4 w-4 cursor-pointer accent-primary"
                            />
                          ) : (
                            <span className="text-sm font-medium">{record.attended ? 'Yes' : 'No'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Points</span>
                          {canEdit ? (
                            <Input
                              type="number"
                              min="0"
                              value={record.points}
                              onChange={(e) => handlePointsChange(key, parseInt(e.target.value) || 0)}
                              disabled={loading}
                              className="w-20"
                            />
                          ) : (
                            <span className="font-medium">{record.points}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Desktop layout */}
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
                  {players.flatMap((player) =>
                    getPlayerRows(player).map(({ key, teamId }) => {
                      const record = attendanceRecords[key] ?? {
                        points: 0,
                        attended: false,
                        exists: false,
                        playerId: player.id,
                        teamId,
                      }
                      const teamName = getTeamName(teamId)

                      return (
                        <TableRow key={key}>
                          <TableCell className="font-medium">
                            {player.firstName} {player.lastName}
                          </TableCell>
                          <TableCell>
                            {teamName ? (
                              <Badge variant="secondary">{teamName}</Badge>
                            ) : (
                              <span className="text-muted-foreground">No team</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {canEdit ? (
                              <div className="flex justify-center">
                                <input
                                  type="checkbox"
                                  checked={record.attended}
                                  onChange={() => handleToggle(key)}
                                  disabled={loading}
                                  className="h-4 w-4 cursor-pointer accent-primary"
                                />
                              </div>
                            ) : (
                              <span className="font-medium">{record.attended ? 'Yes' : 'No'}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {canEdit ? (
                              <div className="flex justify-center">
                                <Input
                                  type="number"
                                  min="0"
                                  value={record.points}
                                  onChange={(e) => handlePointsChange(key, parseInt(e.target.value) || 0)}
                                  disabled={loading}
                                  className="w-20"
                                />
                              </div>
                            ) : (
                              <span className="font-medium">{record.points}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <FooterComponent>
        {isDirty && canEdit && (
          <span className="mr-auto text-sm text-amber-500">Unsaved changes</span>
        )}
        <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
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
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent side="bottom" className="h-[100svh] w-screen overflow-y-auto">
            {dialogBody}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            {dialogBody}
          </DialogContent>
        </Dialog>
      )}
      <ConfirmDialog
        open={showDiscardConfirm}
        title="Discard Changes?"
        description="You have unsaved attendance changes. They will be lost if you close without saving."
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        onConfirm={() => {
          setShowDiscardConfirm(false)
          onOpenChange(false)
        }}
        onOpenChange={setShowDiscardConfirm}
      />
    </>
  )
}
