'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useIsMobile } from '@/lib/hooks/use-media-query'
import type { Database } from '@/types/database'

type UserRow = Database['public']['Tables']['users']['Row']
type StaffCostingRow = Database['public']['Tables']['staff_costing']['Row']

interface CostEngineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: StaffCostingRow | null
  users: Pick<UserRow, 'id' | 'name'>[]
}

export function CostEngineDialog({
  open,
  onOpenChange,
  entry,
  users,
}: CostEngineDialogProps) {
  const router = useRouter()
  const isMobile = useIsMobile()

  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [monthlyGrossPay, setMonthlyGrossPay] = useState('')
  const [employerCpfPercent, setEmployerCpfPercent] = useState('')
  const [otherMonthlyCost, setOtherMonthlyCost] = useState('')
  const [monthlyCapacityHours, setMonthlyCapacityHours] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const gross = parseFloat(monthlyGrossPay) || 0
  const cpf = parseFloat(employerCpfPercent) || 0
  const other = parseFloat(otherMonthlyCost) || 0
  const capHours = parseFloat(monthlyCapacityHours) || 0

  const allInMonthlyCost =
    monthlyGrossPay !== '' && employerCpfPercent !== '' && otherMonthlyCost !== ''
      ? gross + gross * (cpf / 100) + other
      : null

  const blendedHourlyCost =
    allInMonthlyCost !== null && capHours > 0
      ? allInMonthlyCost / capHours
      : null

  const wasOpenRef = useRef(false)

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current
    wasOpenRef.current = open
    if (!justOpened) return

    if (entry) {
      setUserId(entry.userId ?? '')
      setRole(entry.role ?? '')
      setEmploymentType(entry.employmentType ?? '')
      setMonthlyGrossPay(entry.monthlyGrossPay !== null ? String(entry.monthlyGrossPay) : '')
      setEmployerCpfPercent(entry.employerCpfPercent !== null ? String(entry.employerCpfPercent) : '')
      setOtherMonthlyCost(entry.otherMonthlyCost !== null ? String(entry.otherMonthlyCost) : '')
      setMonthlyCapacityHours(entry.monthlyCapacityHours !== null ? String(entry.monthlyCapacityHours) : '')
      setNotes(entry.notes ?? '')
    } else {
      setUserId('')
      setRole('')
      setEmploymentType('')
      setMonthlyGrossPay('')
      setEmployerCpfPercent('')
      setOtherMonthlyCost('')
      setMonthlyCapacityHours('')
      setNotes('')
    }
    setError(null)
  }, [open, entry])

  const handleSubmit = useCallback(async () => {
    if (!monthlyGrossPay) {
      setError('Monthly Gross Pay is required')
      return
    }
    if (employerCpfPercent === '') {
      setError('Employer CPF % is required')
      return
    }
    if (otherMonthlyCost === '') {
      setError('Other Monthly Cost is required')
      return
    }
    if (!monthlyCapacityHours) {
      setError('Monthly Capacity Hours is required')
      return
    }

    setLoading(true)
    setError(null)

    const g = parseFloat(monthlyGrossPay)
    const c = parseFloat(employerCpfPercent) || 0
    const o = parseFloat(otherMonthlyCost) || 0
    const h = parseFloat(monthlyCapacityHours)

    const computedAllIn =
      monthlyGrossPay !== '' && employerCpfPercent !== '' && otherMonthlyCost !== ''
        ? g + g * (c / 100) + o
        : null

    const computedBlended =
      computedAllIn !== null && h > 0 ? computedAllIn / h : null

    const payload = {
      userId: userId || null,
      role: role || null,
      employmentType: employmentType || null,
      monthlyGrossPay: g,
      employerCpfPercent: c,
      otherMonthlyCost: o,
      monthlyCapacityHours: h,
      allInMonthlyCost: computedAllIn,
      blendedHourlyCost: computedBlended,
      notes: notes || null,
      updatedAt: new Date().toISOString(),
    }

    const supabase = createClient()
    let err: unknown = null

    if (entry) {
      const { error: updateError } = await (supabase as any)
        .from('staff_costing')
        .update(payload)
        .eq('id', entry.id)
      err = updateError
    } else {
      const { error: insertError } = await (supabase as any)
        .from('staff_costing')
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
    userId, role, employmentType, monthlyGrossPay, employerCpfPercent,
    otherMonthlyCost, monthlyCapacityHours, notes, entry, onOpenChange, router,
  ])

  const HeaderComponent = isMobile ? SheetHeader : DialogHeader
  const TitleComponent = isMobile ? SheetTitle : DialogTitle
  const FooterComponent = isMobile ? SheetFooter : DialogFooter

  const body = (
    <>
      <HeaderComponent>
        <TitleComponent>
          {entry ? 'Edit Costing Entry' : 'Add Costing Entry'}
        </TitleComponent>
      </HeaderComponent>

      <div className="space-y-4 py-4">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

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

        {/* Employment Type */}
        <div className="grid gap-2">
          <Label htmlFor="employmentType">Employment Type</Label>
          <Input
            id="employmentType"
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Monthly Gross Pay | Employer CPF % | Other Monthly Cost */}
        <div className="grid grid-cols-3 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="monthlyGrossPay">Monthly Gross Pay (SGD) <span className="text-destructive">*</span></Label>
            <Input
              id="monthlyGrossPay"
              type="number"
              min="0"
              step="0.01"
              value={monthlyGrossPay}
              onChange={(e) => setMonthlyGrossPay(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="employerCpfPercent">Employer CPF % <span className="text-destructive">*</span></Label>
            <Input
              id="employerCpfPercent"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={employerCpfPercent}
              onChange={(e) => setEmployerCpfPercent(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="otherMonthlyCost">Other Monthly Cost <span className="text-destructive">*</span></Label>
            <Input
              id="otherMonthlyCost"
              type="number"
              min="0"
              step="0.01"
              value={otherMonthlyCost}
              onChange={(e) => setOtherMonthlyCost(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Monthly Capacity Hours */}
        <div className="grid gap-2">
          <Label htmlFor="monthlyCapacityHours">Monthly Capacity Hours <span className="text-destructive">*</span></Label>
          <Input
            id="monthlyCapacityHours"
            type="number"
            min="0"
            step="0.5"
            value={monthlyCapacityHours}
            onChange={(e) => setMonthlyCapacityHours(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* All In Monthly Cost | Blended Hourly Cost (auto-populated) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">All In Monthly Cost (SGD)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span className="sr-only">Formula info</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 text-sm">
                  <p className="font-medium mb-1">All In Monthly Cost</p>
                  <p className="text-muted-foreground">
                    Gross Pay + (Gross Pay × CPF% ÷ 100) + Other Monthly Cost
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-sm py-2 px-3 rounded-md border bg-muted/50 min-h-[36px]">
              {allInMonthlyCost !== null
                ? `S$${allInMonthlyCost.toFixed(2)}`
                : '—'}
            </p>
          </div>
          <div className="grid gap-1">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Blended Hourly Cost (SGD)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span className="sr-only">Formula info</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 text-sm">
                  <p className="font-medium mb-1">Blended Hourly Cost</p>
                  <p className="text-muted-foreground">
                    All In Monthly Cost ÷ Monthly Capacity Hours
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-sm py-2 px-3 rounded-md border bg-muted/50 min-h-[36px]">
              {blendedHourlyCost !== null
                ? `S$${blendedHourlyCost.toFixed(2)}`
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
            disabled={loading}
          />
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
