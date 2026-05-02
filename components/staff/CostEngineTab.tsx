'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CostEngineDialog } from './CostEngineDialog'
import type { Database } from '@/types/database'

type UserRow = Database['public']['Tables']['users']['Row']
type StaffCostingRow = Database['public']['Tables']['staff_costing']['Row']

interface CostEngineTabProps {
  costingEntries: StaffCostingRow[]
  users: Pick<UserRow, 'id' | 'name'>[]
  canEdit: boolean
}

function formatSGD(value: number | null) {
  if (value === null) return '—'
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
  }).format(value)
}

export function CostEngineTab({ costingEntries, users, canEdit }: CostEngineTabProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<StaffCostingRow | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<StaffCostingRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]))

  function openCreate() {
    setEditEntry(null)
    setDialogOpen(true)
  }

  function openEdit(entry: StaffCostingRow) {
    setEditEntry(entry)
    setDialogOpen(true)
  }

  async function handleDelete() {
    if (!deleteEntry) return
    setDeleting(true)
    const supabase = createClient()
    await (supabase as any).from('staff_costing').delete().eq('id', deleteEntry.id)
    setDeleting(false)
    setDeleteEntry(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {costingEntries.length} {costingEntries.length === 1 ? 'entry' : 'entries'}
        </p>
        {canEdit && (
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        )}
      </div>

      {costingEntries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {canEdit
            ? 'No costing entries yet. Click "Add Entry" to get started.'
            : 'No costing entries yet.'}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {costingEntries.map((entry) => (
              <div key={entry.id} className="rounded-md border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{userMap[entry.userId ?? ''] ?? '—'}</p>
                    <p className="text-sm text-muted-foreground">{entry.role ?? '—'}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.employmentType ?? '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Monthly Gross</span>
                  <span>{formatSGD(entry.monthlyGrossPay)}</span>
                  <span className="text-muted-foreground">All-In Monthly</span>
                  <span>{formatSGD(entry.allInMonthlyCost)}</span>
                  <span className="text-muted-foreground">Blended Hourly</span>
                  <span>{formatSGD(entry.blendedHourlyCost)}</span>
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
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Employment Type</TableHead>
                  <TableHead className="text-right">Monthly Gross Pay</TableHead>
                  <TableHead className="text-right">All-In Monthly Cost</TableHead>
                  <TableHead className="text-right">Blended Hourly Cost</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {costingEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{userMap[entry.userId ?? ''] ?? '—'}</TableCell>
                    <TableCell>{entry.role ?? '—'}</TableCell>
                    <TableCell>{entry.employmentType ?? '—'}</TableCell>
                    <TableCell className="text-right">{formatSGD(entry.monthlyGrossPay)}</TableCell>
                    <TableCell className="text-right">{formatSGD(entry.allInMonthlyCost)}</TableCell>
                    <TableCell className="text-right">{formatSGD(entry.blendedHourlyCost)}</TableCell>
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

      <CostEngineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editEntry}
        users={users}
      />

      <ConfirmDialog
        open={deleteEntry !== null}
        onOpenChange={(open) => { if (!open) setDeleteEntry(null) }}
        title="Delete costing entry?"
        description={`This will permanently delete the entry for ${deleteEntry ? (userMap[deleteEntry.userId ?? ''] ?? 'this staff member') : ''}. This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
      />
    </div>
  )
}
