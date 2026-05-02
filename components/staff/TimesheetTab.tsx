'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfMonth, endOfMonth, startOfYear, startOfWeek, endOfWeek, startOfQuarter, endOfQuarter, subWeeks, subQuarters } from 'date-fns'
import { Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const PROGRAMS = ['Champions', 'STAY in the Game', 'Schools', 'Shared/Core']
const ACTIVITY_TYPES = [
  'Direct delivery',
  'Preparation',
  'Travel',
  'Admin',
  'Monitoring & Evaluation',
  'Partner engagement',
  'Safeguarding',
  'Training',
]

type DatePreset = 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'this-quarter' | 'last-quarter' | 'this-year'

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'this-quarter', label: 'This Quarter' },
  { value: 'last-quarter', label: 'Last Quarter' },
  { value: 'this-year', label: 'This Year' },
]

const PAGE_SIZE = 10

function formatCurrency(value: number | null) {
  if (value === null) return '—'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(value)
}

const WEEK_OPTS = { weekStartsOn: 1 as const }

function getDateRange(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date()
  if (preset === 'this-week') return { from: startOfWeek(now, WEEK_OPTS), to: endOfWeek(now, WEEK_OPTS) }
  if (preset === 'last-week') {
    const lw = subWeeks(now, 1)
    return { from: startOfWeek(lw, WEEK_OPTS), to: endOfWeek(lw, WEEK_OPTS) }
  }
  if (preset === 'this-month') return { from: startOfMonth(now), to: now }
  if (preset === 'last-month') {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return { from: startOfMonth(lm), to: endOfMonth(lm) }
  }
  if (preset === 'this-quarter') return { from: startOfQuarter(now), to: now }
  if (preset === 'last-quarter') {
    const lq = subQuarters(now, 1)
    return { from: startOfQuarter(lq), to: endOfQuarter(lq) }
  }
  return { from: startOfYear(now), to: now }
}

export function TimesheetTab({ timesheets: initialTimesheets, users, costingEntries, canEdit }: TimesheetTabProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<StaffTimesheetRow | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<StaffTimesheetRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [programFilter, setProgramFilter] = useState('')
  const [activityFilter, setActivityFilter] = useState('')
  const [datePreset, setDatePreset] = useState<DatePreset | null>(null)
  const [page, setPage] = useState(1)

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const dateRange = datePreset ? getDateRange(datePreset) : null
    return initialTimesheets.filter((entry) => {
      if (q) {
        const name = (userMap[entry.userId ?? ''] ?? '').toLowerCase()
        if (!name.includes(q)) return false
      }
      if (programFilter && entry.program !== programFilter) return false
      if (activityFilter && entry.activityType !== activityFilter) return false
      if (dateRange) {
        const d = new Date(entry.date + 'T00:00:00')
        if (d < dateRange.from || d > dateRange.to) return false
      }
      return true
    })
  }, [initialTimesheets, search, programFilter, activityFilter, datePreset, userMap])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const hasFilters = search || programFilter || activityFilter || datePreset

  function clearFilters() {
    setSearch('')
    setProgramFilter('')
    setActivityFilter('')
    setDatePreset(null)
    setPage(1)
  }

  function handleFilterChange<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setPage(1)
    }
  }

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
          {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
          {hasFilters && initialTimesheets.length !== filtered.length && (
            <span className="ml-1 text-muted-foreground/70">of {initialTimesheets.length}</span>
          )}
        </p>
        {canEdit && (
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        )}
      </div>

      {/* Search & filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
              className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Program select */}
          <SelectRoot value={programFilter || '__all__'} onValueChange={(v: string) => handleFilterChange(setProgramFilter)(v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Programs</SelectItem>
              {PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </SelectRoot>

          {/* Activity type select */}
          <SelectRoot value={activityFilter || '__all__'} onValueChange={(v: string) => handleFilterChange(setActivityFilter)(v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="All Activities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Activities</SelectItem>
              {ACTIVITY_TYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </SelectRoot>

          {/* Period select */}
          <SelectRoot value={datePreset ?? '__all__'} onValueChange={(v: string) => { setDatePreset(v === '__all__' ? null : v as DatePreset); setPage(1) }}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="All Periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Periods</SelectItem>
              {DATE_PRESETS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </div>
      </div>

      {initialTimesheets.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {canEdit
            ? 'No timesheet entries yet. Click "Add Entry" to get started.'
            : 'No timesheet entries yet.'}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No entries match the current filters.
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {paginated.map((entry) => (
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
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Activity Type</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Labour Cost</TableHead>
                  <TableHead>Approved</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      {entry.date ? format(new Date(entry.date + 'T00:00:00'), 'd MMM yyyy') : '—'}
                    </TableCell>
                    <TableCell>{userMap[entry.userId ?? ''] ?? '—'}</TableCell>
                    <TableCell>{entry.program ?? '—'}</TableCell>
                    <TableCell>{entry.activityType ?? '—'}</TableCell>
                    <TableCell className="text-right">{Number(entry.hours).toFixed(1)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.allocatedLabourCost)}</TableCell>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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
