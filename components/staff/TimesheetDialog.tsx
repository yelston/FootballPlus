'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { format, startOfWeek } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useIsMobile } from '@/lib/hooks/use-media-query'
import type { Database } from '@/types/database'

type UserRow = Database['public']['Tables']['users']['Row']
type StaffTimesheetRow = Database['public']['Tables']['staff_timesheet']['Row']
type StaffCostingRow = Database['public']['Tables']['staff_costing']['Row']

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

const HOURS_OPTIONS = Array.from({ length: 24 }, (_, i) =>
  ((i + 1) * 0.5).toFixed(1)
)

const MONTHS = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i)

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getQuarter(month: number): string {
  if (month < 3) return 'Q1'
  if (month < 6) return 'Q2'
  if (month < 9) return 'Q3'
  return 'Q4'
}

interface TimesheetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: StaffTimesheetRow | null
  users: Pick<UserRow, 'id' | 'name'>[]
  costingEntries: StaffCostingRow[]
}

export function TimesheetDialog({
  open,
  onOpenChange,
  entry,
  users,
  costingEntries,
}: TimesheetDialogProps) {
  const router = useRouter()
  const isMobile = useIsMobile()

  const today = new Date()

  // Date state — three independent values, no roundtrip through a Date object
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())

  // Derived read-only display fields
  const [weekCommencing, setWeekCommencing] = useState('')
  const [quarter, setQuarter] = useState('')
  const [month, setMonth] = useState('')

  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('')
  const [program, setProgram] = useState('')
  const [fundingSource, setFundingSource] = useState('')
  const [activityType, setActivityType] = useState('')
  const [hours, setHours] = useState('')
  // Fallback: stored hourlyCost from an entry when cost engine has no record for that user
  const [fallbackHourlyCost, setFallbackHourlyCost] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [approved, setApproved] = useState('no')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const costingMap = useMemo(
    () =>
      Object.fromEntries(
        costingEntries
          .filter((e) => e.userId && e.blendedHourlyCost !== null)
          .map((e) => [e.userId!, e.blendedHourlyCost!])
      ),
    [costingEntries]
  )

  // Derive hourly cost from cost engine; fall back to stored value only when no cost engine entry exists
  const hourlyCost: number | null = userId
    ? (costingMap[userId] ?? fallbackHourlyCost)
    : null

  const allocatedLabourCost =
    hours && hourlyCost !== null
      ? (parseFloat(hours) * hourlyCost).toFixed(2)
      : null

  // Days available for the currently selected month/year
  const daysInMonth = useMemo(
    () => getDaysInMonth(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  )

  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  )

  // Cap day when month/year change makes current day invalid
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth)
    }
  }, [selectedDay, daysInMonth])

  // Update derived fields whenever any date part changes
  useEffect(() => {
    const d = new Date(selectedYear, selectedMonth, Math.min(selectedDay, daysInMonth))
    const monday = startOfWeek(d, { weekStartsOn: 1 })
    setWeekCommencing(format(monday, 'd MMM yyyy'))
    setQuarter(getQuarter(selectedMonth))
    setMonth(format(d, 'MMMM'))
  }, [selectedDay, selectedMonth, selectedYear, daysInMonth])

  // Only initialise fields when the dialog transitions from closed → open
  const wasOpenRef = useRef(false)

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current
    wasOpenRef.current = open
    if (!justOpened) return

    if (entry) {
      const d = new Date(entry.date + 'T00:00:00')
      setSelectedDay(d.getDate())
      setSelectedMonth(d.getMonth())
      setSelectedYear(d.getFullYear())
      setUserId(entry.userId ?? '')
      setRole(entry.role ?? '')
      setProgram(entry.program ?? '')
      setFundingSource(entry.fundingSource ?? '')
      setActivityType(entry.activityType ?? '')
      setHours(Number(entry.hours).toFixed(1))
      setFallbackHourlyCost(entry.hourlyCost ?? null)
      setNotes(entry.notes ?? '')
      setApproved(entry.approved ? 'yes' : 'no')
    } else {
      const now = new Date()
      setSelectedDay(now.getDate())
      setSelectedMonth(now.getMonth())
      setSelectedYear(now.getFullYear())
      setUserId('')
      setRole('')
      setProgram('')
      setFundingSource('')
      setActivityType('')
      setHours('')
      setFallbackHourlyCost(null)
      setNotes('')
      setApproved('no')
    }
    setError(null)
  }, [open, entry])

  const handleSubmit = useCallback(async () => {
    if (!hours) {
      setError('Please select hours')
      return
    }

    setLoading(true)
    setError(null)

    const cappedDay = Math.min(selectedDay, daysInMonth)
    const d = new Date(selectedYear, selectedMonth, cappedDay)
    const monday = startOfWeek(d, { weekStartsOn: 1 })

    const payload = {
      date: format(d, 'yyyy-MM-dd'),
      weekCommencing: format(monday, 'yyyy-MM-dd'),
      userId: userId || null,
      role: role || null,
      program: program || null,
      fundingSource: fundingSource || null,
      activityType: activityType || null,
      hours: parseFloat(hours),
      hourlyCost: hourlyCost ?? null,
      allocatedLabourCost: allocatedLabourCost !== null ? parseFloat(allocatedLabourCost) : null,
      quarter: getQuarter(selectedMonth),
      month: format(d, 'MMMM'),
      notes: notes || null,
      approved: approved === 'yes',
      updatedAt: new Date().toISOString(),
    }

    const supabase = createClient()
    let err: unknown = null

    if (entry) {
      const { error: updateError } = await (supabase as any)
        .from('staff_timesheet')
        .update(payload)
        .eq('id', entry.id)
      err = updateError
    } else {
      const { error: insertError } = await (supabase as any)
        .from('staff_timesheet')
        .insert(payload)
      err = insertError
    }

    setLoading(false)

    if (err) {
      setError((err as { message?: string }).message ?? 'Failed to save entry')
      return
    }

    onOpenChange(false)
    router.refresh()
  }, [
    selectedDay, selectedMonth, selectedYear, daysInMonth,
    hours, userId, role, program, fundingSource, activityType,
    hourlyCost, allocatedLabourCost, notes, approved, entry, onOpenChange, router,
  ])

  const HeaderComponent = isMobile ? SheetHeader : DialogHeader
  const TitleComponent = isMobile ? SheetTitle : DialogTitle
  const FooterComponent = isMobile ? SheetFooter : DialogFooter

  const body = (
    <>
      <HeaderComponent>
        <TitleComponent>
          {entry ? 'Edit Timesheet Entry' : 'Add Timesheet Entry'}
        </TitleComponent>
      </HeaderComponent>

      <div className="space-y-4 py-4">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Date — inline selects with independent state, no roundtrip */}
        <div className="grid gap-2">
          <Label>Date</Label>
          <div className="flex gap-2">
            <Select
              value={String(selectedDay)}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              disabled={loading}
              className="flex-1"
            >
              {days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
            <Select
              value={String(selectedMonth)}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              disabled={loading}
              className="flex-[2]"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
            <Select
              value={String(selectedYear)}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              disabled={loading}
              className="flex-[1.5]"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Auto-populated fields */}
        <div className="grid grid-cols-3 gap-3">
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Week Commencing</Label>
            <p className="text-sm py-2 px-3 rounded-md border bg-muted/50 min-h-[36px]">
              {weekCommencing || '—'}
            </p>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Quarter</Label>
            <p className="text-sm py-2 px-3 rounded-md border bg-muted/50 min-h-[36px]">
              {quarter || '—'}
            </p>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Month</Label>
            <p className="text-sm py-2 px-3 rounded-md border bg-muted/50 min-h-[36px]">
              {month || '—'}
            </p>
          </div>
        </div>

        {/* Staff Name */}
        <div className="grid gap-2">
          <Label htmlFor="userId">Staff Name</Label>
          <Select
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loading}
          >
            <option value="">Select staff member...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Role */}
        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Program */}
        <div className="grid gap-2">
          <Label htmlFor="program">Program</Label>
          <Select
            id="program"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            disabled={loading}
          >
            <option value="">Select program...</option>
            {PROGRAMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </div>

        {/* Funding Source */}
        <div className="grid gap-2">
          <Label htmlFor="fundingSource">Funding Source / Grant</Label>
          <Input
            id="fundingSource"
            value={fundingSource}
            onChange={(e) => setFundingSource(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Activity Type */}
        <div className="grid gap-2">
          <Label htmlFor="activityType">Activity Type</Label>
          <Select
            id="activityType"
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            disabled={loading}
          >
            <option value="">Select activity type...</option>
            {ACTIVITY_TYPES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
        </div>

        {/* Hours + Hourly Cost + Allocated Labour Cost */}
        <div className="grid grid-cols-3 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="hours">Hours</Label>
            <Select
              id="hours"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              disabled={loading}
            >
              <option value="">Select...</option>
              {HOURS_OPTIONS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1">
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Hourly Cost ($)</Label>
              <span className="relative group cursor-help">
                <Info className="h-3 w-3 text-muted-foreground" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-52 rounded-md border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md invisible group-hover:visible z-50 pointer-events-none">
                  Auto-populated from the Cost Engine tab based on the selected staff member&apos;s blended hourly rate.
                </span>
              </span>
            </div>
            <p className="text-sm py-2 px-3 rounded-md border bg-muted/50 min-h-[36px]">
              {hourlyCost !== null ? `$${Number(hourlyCost).toFixed(2)}` : '—'}
            </p>
          </div>
          <div className="grid gap-1">
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Allocated Labour Cost</Label>
              <span className="relative group cursor-help">
                <Info className="h-3 w-3 text-muted-foreground" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 rounded-md border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md invisible group-hover:visible z-50 pointer-events-none">
                  Calculated automatically: Hours × Hourly Cost.
                </span>
              </span>
            </div>
            <p className="text-sm py-2 px-3 rounded-md border bg-muted/50 min-h-[36px]">
              {allocatedLabourCost
                ? `$${parseFloat(allocatedLabourCost).toFixed(2)}`
                : '—'}
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            disabled={loading}
          />
        </div>

        {/* Approved */}
        <div className="grid gap-2">
          <Label htmlFor="approved">Approved</Label>
          <Select
            id="approved"
            value={approved}
            onChange={(e) => setApproved(e.target.value)}
            disabled={loading}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </Select>
        </div>
      </div>

      <FooterComponent>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : entry ? 'Save Changes' : 'Add Entry'}
        </Button>
      </FooterComponent>
    </>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[100svh] w-screen overflow-y-auto">
          {body}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        {body}
      </DialogContent>
    </Dialog>
  )
}
