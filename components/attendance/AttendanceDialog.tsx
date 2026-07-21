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
import { Select } from '@/components/ui/select'
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
type AttendanceStatus = AttendanceRow['status']
type AttendanceStatusValue = AttendanceStatus | ''

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

type AttendanceEntry = {
  points: number
  status: AttendanceStatusValue
  reason: string
  exists: boolean
  playerId: string
  teamId: string | null
  id?: string
}

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
  const [reasonSuggestions, setReasonSuggestions] = useState<Record<'excused' | 'absent', string[]>>({
    excused: [],
    absent: [],
  })
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

  const getStatusLabel = (status: AttendanceStatusValue) => {
    if (status === 'attended') return 'Attended'
    if (status === 'excused') return 'Excused'
    if (status === 'absent') return 'Absent'
    return 'Not selected'
  }

  const getDefaultEntry = (playerId: string, teamId: string | null): AttendanceEntry => ({
    points: 0,
    status: '',
    reason: '',
    exists: false,
    playerId,
    teamId,
  })

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
      .select('id, playerId, teamId, points, status, reason')
      .eq('date', dateString)
      .returns<Pick<AttendanceRow, 'id' | 'playerId' | 'teamId' | 'points' | 'status' | 'reason'>[]>()

    const existing: Record<string, { points: number; teamId: string | null; id: string; status: AttendanceStatus; reason: string }> = {}
    data?.forEach((r) => {
      existing[rowKey(r.playerId, r.teamId)] = {
        points: r.points,
        teamId: r.teamId,
        id: r.id,
        status: r.status ?? 'attended',
        reason: r.reason ?? '',
      }
    })

    const records: Record<string, AttendanceEntry> = {}
    players.forEach((player) => {
      getPlayerRows(player).forEach(({ key, teamId }) => {
        const found = existing[key]
        records[key] = {
          points: found?.points ?? 0,
          status: found?.status ?? '',
          reason: found?.reason ?? '',
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

  const loadReasonSuggestions = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('attendance')
      .select('status, reason')
      .in('status', ['excused', 'absent'])
      .not('reason', 'is', null)
      .returns<Pick<AttendanceRow, 'status' | 'reason'>[]>()

    const next: Record<'excused' | 'absent', string[]> = { excused: [], absent: [] }
    const seen: Record<'excused' | 'absent', Set<string>> = {
      excused: new Set(),
      absent: new Set(),
    }
    data?.forEach((row) => {
      if (row.status !== 'excused' && row.status !== 'absent') return
      const reason = row.reason?.trim()
      if (!reason || seen[row.status].has(reason.toLowerCase())) return
      seen[row.status].add(reason.toLowerCase())
      next[row.status].push(reason)
    })
    setReasonSuggestions(next)
  }, [])

  useEffect(() => {
    if (!open) {
      initialRecordsRef.current = {}
      return
    }
    loadExistingAttendance()
    loadReasonSuggestions()
  }, [open, loadExistingAttendance, loadReasonSuggestions])

  const handlePointsChange = (key: string, points: number) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [key]: { ...prev[key], points: Math.max(0, points) },
    }))
  }

  const handleStatusChange = (key: string, status: AttendanceStatusValue) => {
    setError(null)
    setAttendanceRecords((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
        points: status === 'attended' ? prev[key].points : 0,
        reason: status === 'excused' || status === 'absent' ? prev[key].reason : '',
      },
    }))
  }

  const handleReasonChange = (key: string, reason: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [key]: { ...prev[key], reason },
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
      const toSave = records.filter((r) => r.status)
      const toDelete = records.filter((r) => !r.status && r.exists).map((r) => r.id as string)

      const updates = toSave.map((record) => ({
        date: dateString,
        playerId: record.playerId,
        teamId: record.teamId,
        points: record.status === 'attended' ? record.points : 0,
        status: record.status,
        reason: record.status === 'excused' || record.status === 'absent' ? record.reason.trim() || null : null,
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

      <datalist id="attendance-excused-reasons">
        {reasonSuggestions.excused.map((reason) => (
          <option key={reason} value={reason} />
        ))}
      </datalist>
      <datalist id="attendance-absent-reasons">
        {reasonSuggestions.absent.map((reason) => (
          <option key={reason} value={reason} />
        ))}
      </datalist>

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
                    status: '',
                    reason: '',
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
                      <div className="mt-3 grid gap-3">
                        <div className="grid gap-1">
                          <span className="text-sm text-muted-foreground">Status</span>
                          {canEdit ? (
                            <Select
                              value={record.status}
                              onChange={(e) => handleStatusChange(key, e.target.value as AttendanceStatusValue)}
                              disabled={loading}
                            >
                              <option value="">Select status</option>
                              <option value="attended">Attended</option>
                              <option value="excused">Excused</option>
                              <option value="absent">Absent</option>
                            </Select>
                          ) : (
                            <span className="text-sm font-medium">{getStatusLabel(record.status)}</span>
                          )}
                        </div>
                        {record.status === 'attended' && (
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
                        )}
                        {(record.status === 'excused' || record.status === 'absent') && (
                          <div className="grid gap-1">
                            <span className="text-sm text-muted-foreground">Reason</span>
                            {canEdit ? (
                              <Input
                                value={record.reason}
                                onChange={(e) => handleReasonChange(key, e.target.value)}
                                disabled={loading}
                                list={`attendance-${record.status}-reasons`}
                                placeholder="Enter reason"
                              />
                            ) : (
                              <span className="text-sm font-medium">{record.reason || 'No reason'}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Desktop layout */}
            <div className="hidden md:block rounded-md border">
              <Table className="table-fixed">
                <colgroup>
                  <col className="w-[27%]" />
                  <col className="w-[20%]" />
                  <col className="w-[18%]" />
                  <col className="w-[14%]" />
                  <col className="w-[21%]" />
                </colgroup>
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
                  {players.flatMap((player) =>
                    getPlayerRows(player).map(({ key, teamId }) => {
                      const record = attendanceRecords[key] ?? {
                        points: 0,
                        status: '',
                        reason: '',
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
                          <TableCell className="min-w-0">
                            {teamName ? (
                              <Badge variant="secondary" className="max-w-full whitespace-normal break-words">
                                {teamName}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No team</span>
                            )}
                          </TableCell>
                          <TableCell className="min-w-0">
                            {canEdit ? (
                              <Select
                                value={record.status}
                                onChange={(e) => handleStatusChange(key, e.target.value as AttendanceStatusValue)}
                                disabled={loading}
                                className="w-full"
                              >
                                <option value="">Select status</option>
                                <option value="attended">Attended</option>
                                <option value="excused">Excused</option>
                                <option value="absent">Absent</option>
                              </Select>
                            ) : (
                              <span className="font-medium">{getStatusLabel(record.status)}</span>
                            )}
                          </TableCell>
                          <TableCell className="min-w-0 text-center">
                            {record.status === 'attended' && canEdit ? (
                              <div className="flex justify-center">
                                <Input
                                  type="number"
                                  min="0"
                                  value={record.points}
                                  onChange={(e) => handlePointsChange(key, parseInt(e.target.value) || 0)}
                                  disabled={loading}
                                  className="w-full max-w-24"
                                />
                              </div>
                            ) : record.status === 'attended' ? (
                              <span className="font-medium">{record.points}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="min-w-0">
                            {(record.status === 'excused' || record.status === 'absent') && canEdit ? (
                              <Input
                                value={record.reason}
                                onChange={(e) => handleReasonChange(key, e.target.value)}
                                disabled={loading}
                                list={`attendance-${record.status}-reasons`}
                                placeholder="Enter reason"
                                className="w-full"
                              />
                            ) : record.status === 'excused' || record.status === 'absent' ? (
                              <span className="block truncate text-sm">{record.reason || 'No reason'}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
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
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
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
