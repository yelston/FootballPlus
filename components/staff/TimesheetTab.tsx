'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TimesheetDialog } from './TimesheetDialog'
import type { Database } from '@/types/database'

type UserRow = Database['public']['Tables']['users']['Row']
type StaffTimesheetRow = Database['public']['Tables']['staff_timesheet']['Row']
type StaffCostingRow = Database['public']['Tables']['staff_costing']['Row']

interface TimesheetTabProps {
  timesheets: StaffTimesheetRow[]
  users: Pick<UserRow, 'id' | 'name'>[]
  costingEntries: StaffCostingRow[]
  canEdit: boolean
}

function formatCurrency(value: number | null) {
  if (value === null) return '—'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(value)
}

export function TimesheetTab({ timesheets: initialTimesheets, users, costingEntries, canEdit }: TimesheetTabProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<StaffTimesheetRow | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<StaffTimesheetRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]))

  function openCreate() {
    setEditEntry(null)
    setDialogOpen(true)
  }

  function openEdit(entry: StaffTimesheetRow) {
    setEditEntry(entry)
    setDialogOpen(true)
  }

  async function handleDelete() {
    if (!deleteEntry) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('staff_timesheet').delete().eq('id', deleteEntry.id)
    setDeleting(false)
    setDeleteEntry(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initialTimesheets.length} {initialTimesheets.length === 1 ? 'entry' : 'entries'}
        </p>
        {canEdit && (
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        )}
      </div>

      {initialTimesheets.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {canEdit
            ? 'No timesheet entries yet. Click "Add Entry" to get started.'
            : 'No timesheet entries yet.'}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {initialTimesheets.map((entry) => (
              <div key={entry.id} className="rounded-md border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{entry.date ? format(new Date(entry.date + 'T00:00:00'), 'd MMM yyyy') : '—'}</p>
                    <p className="text-sm text-muted-foreground">{userMap[entry.userId ?? ''] ?? '—'}</p>
                  </div>
                  <Badge variant={entry.approved ? 'default' : 'secondary'}>
                    {entry.approved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Program</span>
                  <span>{entry.program ?? '—'}</span>
                  <span className="text-muted-foreground">Activity</span>
                  <span>{entry.activityType ?? '—'}</span>
                  <span className="text-muted-foreground">Hours</span>
                  <span>{Number(entry.hours).toFixed(1)}</span>
                  <span className="text-muted-foreground">Labour Cost</span>
                  <span>{formatCurrency(entry.allocatedLabourCost)}</span>
                </div>
                {canEdit && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => openEdit(entry)}>
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteEntry(entry)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Week Commencing</TableHead>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Activity Type</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Hourly Cost</TableHead>
                  <TableHead className="text-right">Labour Cost</TableHead>
                  <TableHead>Quarter</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Approved</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialTimesheets.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      {entry.date ? format(new Date(entry.date + 'T00:00:00'), 'd MMM yyyy') : '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {entry.weekCommencing ? format(new Date(entry.weekCommencing + 'T00:00:00'), 'd MMM yyyy') : '—'}
                    </TableCell>
                    <TableCell>{userMap[entry.userId ?? ''] ?? '—'}</TableCell>
                    <TableCell>{entry.role ?? '—'}</TableCell>
                    <TableCell>{entry.program ?? '—'}</TableCell>
                    <TableCell>{entry.activityType ?? '—'}</TableCell>
                    <TableCell className="text-right">{Number(entry.hours).toFixed(1)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.hourlyCost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.allocatedLabourCost)}</TableCell>
                    <TableCell>{entry.quarter ?? '—'}</TableCell>
                    <TableCell>{entry.month ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={entry.approved ? 'default' : 'secondary'}>
                        {entry.approved ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteEntry(entry)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <TimesheetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editEntry}
        users={users}
        costingEntries={costingEntries}
      />

      <ConfirmDialog
        open={deleteEntry !== null}
        onOpenChange={(open) => { if (!open) setDeleteEntry(null) }}
        title="Delete timesheet entry?"
        description={`This will permanently delete the entry for ${deleteEntry ? format(new Date(deleteEntry.date + 'T00:00:00'), 'd MMM yyyy') : ''}. This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
      />
    </div>
  )
}
