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
import { Checkbox } from '@/components/ui/checkbox'
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

type AttendanceEntry = { points: number; attended: boolean; exists: boolean; id?: string }

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

  const playerIsCheckboxOnly = (player: Player) =>
    player.teamIds.some((id) =>
      (teams.find((t) => t.id === id)?.name?.toLowerCase() ?? '').includes('stay in the game')
    )

  const HeaderComponent = isMobile ? SheetHeader : DialogHeader
  const TitleComponent = isMobile ? SheetTitle : DialogTitle
  const DescriptionComponent = isMobile ? SheetDescription : DialogDescription
  const FooterComponent = isMobile ? SheetFooter : DialogFooter

  const dateString = format(date, 'yyyy-MM-dd')

  const loadExistingAttendance = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('attendance')
      .select('id, playerId, points')
      .eq('date', dateString)
      .returns<Pick<AttendanceRow, 'id' | 'playerId' | 'points'>[]>()

    const existing: Record<string, { points: number; id: string }> = {}
    data?.forEach((r) => {
      existing[r.playerId] = { points: r.points, id: r.id }
    })

    const records: Record<string, AttendanceEntry> = {}
    players.forEach((player) => {
      const found = existing[player.id]
      records[player.id] = {
        points: found?.points ?? 1,
        attended: !!found,
        exists: !!found,
        id: found?.id,
      }
    })
    setAttendanceRecords(records)
    initialRecordsRef.current = { ...records }
  }, [dateString, players])

  useEffect(() => {
    if (!open) {
      initialRecordsRef.current = {}
      return
    }
    loadExistingAttendance()
  }, [open, loadExistingAttendance])

  const handlePointsChange = (playerId: string, points: number) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], points: Math.max(0, points) },
    }))
  }

  const handleToggle = (playerId: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], attended: !prev[playerId].attended },
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
      const entries = Object.entries(attendanceRecords)
      const toSave = entries.filter(([playerId, r]) => {
        const player = players.find((p) => p.id === playerId)
        return player && playerIsCheckboxOnly(player) ? r.attended : true
      })

      const updates = toSave.map(([playerId, record]) => {
        const player = players.find((p) => p.id === playerId)
        const checkboxOnly = player ? playerIsCheckboxOnly(player) : false
        return {
          date: dateString,
          playerId,
          teamId:
            selectedTeam !== 'all'
              ? selectedTeam
              : (player?.teamIds[0] || null),
          points: checkboxOnly ? 1 : record.points,
          updatedByUserId: user.id,
        }
      })

      await supabase.from('attendance').delete().eq('date', dateString)

      if (updates.length > 0) {
        // @ts-ignore - Supabase type inference issue with insert
        const { error } = await supabase.from('attendance').insert(updates)
        if (error) throw error
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
              {players.map((player) => {
                const record = attendanceRecords[player.id] ?? { points: 1, attended: false, exists: false }
                const checkboxOnly = playerIsCheckboxOnly(player)
                const teamNames = player.teamIds
                  .map((id) => teams.find((t) => t.id === id)?.name)
                  .filter(Boolean)
                  .join(', ')

                return (
                  <div key={player.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {player.firstName} {player.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {teamNames || 'No team'}
                        </p>
                      </div>
                      {checkboxOnly ? (
                        canEdit ? (
                          <input
                            type="checkbox"
                            checked={record.attended}
                            onChange={() => handleToggle(player.id)}
                            disabled={loading}
                            className="h-4 w-4 cursor-pointer accent-primary"
                          />
                        ) : (
                          <span className="text-sm font-medium">{record.attended ? 'Yes' : 'No'}</span>
                        )
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Points</span>
                          {canEdit ? (
                            <Input
                              type="number"
                              min="0"
                              value={record.points}
                              onChange={(e) => handlePointsChange(player.id, parseInt(e.target.value) || 0)}
                              disabled={loading}
                              className="w-20"
                            />
                          ) : (
                            <span className="font-medium">{record.points}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop layout */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-center">Points/Attended</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player) => {
                    const record = attendanceRecords[player.id] ?? { points: 1, attended: false, exists: false }
                    const checkboxOnly = playerIsCheckboxOnly(player)
                    const playerTeams = player.teamIds
                      .map((id) => teams.find((t) => t.id === id))
                      .filter(Boolean) as Team[]

                    return (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">
                          {player.firstName} {player.lastName}
                        </TableCell>
                        <TableCell>
                          {playerTeams.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {playerTeams.map((t) => (
                                <Badge key={t.id} variant="secondary">{t.name}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No team</span>
                          )}
                        </TableCell>
                        {checkboxOnly ? (
                          <TableCell>
                            <div className="flex justify-center">
                            {canEdit ? (
                              <input
                                type="checkbox"
                                checked={record.attended}
                                onChange={() => handleToggle(player.id)}
                                disabled={loading}
                                className="h-4 w-4 cursor-pointer accent-primary"
                              />
                            ) : (
                              <span className="font-medium">{record.attended ? 'Yes' : 'No'}</span>
                            )}
                            </div>
                          </TableCell>
                        ) : (
                          <TableCell className="text-center">
                            {canEdit ? (
                              <div className="flex justify-center">
                                <Input
                                  type="number"
                                  min="0"
                                  value={record.points}
                                  onChange={(e) => handlePointsChange(player.id, parseInt(e.target.value) || 0)}
                                  disabled={loading}
                                  className="w-20"
                                />
                              </div>
                            ) : (
                              <span className="font-medium">{record.points}</span>
                            )}
                          </TableCell>
                        )}
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
