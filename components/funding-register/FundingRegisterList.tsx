'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { useIsMobile } from '@/lib/hooks/use-media-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Edit, Trash2, MoreHorizontal, SlidersHorizontal } from 'lucide-react'

const RESTRICTION_TYPES = ['Restricted', 'Unrestricted', 'In-kind / Other'] as const
const PROGRAMMES = ['Champions', 'STAY in the Game', 'Schools', 'Shared / Core'] as const

const COLUMNS = [
  { key: 'restriction_type',      label: 'Restriction Type' },
  { key: 'programme',             label: 'Programme' },
  { key: 'grant_code',            label: 'Grant Code' },
  { key: 'start_date',            label: 'Start Date' },
  { key: 'end_date',              label: 'End Date' },
  { key: 'awarded_amount',        label: 'Awarded (SGD)' },
  { key: 'cash_received_ytd',     label: 'Cash Received YTD' },
  { key: 'budget_allocated_ytd',  label: 'Budget Allocated YTD' },
  { key: 'total_spend_ytd',       label: 'Total Spend YTD' },
  { key: 'balance_remaining',     label: 'Balance Remaining' },
  { key: 'utilisation',           label: 'Utilisation %' },
  { key: 'reporting_due',         label: 'Reporting Due' },
  { key: 'kpi_notes',             label: 'KPI / Notes' },
  { key: 'other_non_labour',      label: 'Other Non-Labour YTD' },
] as const

type ColKey = typeof COLUMNS[number]['key']

export interface FundingEntry {
  id: string
  grant_donor_name: string
  restriction_type: string
  programme: string
  grant_code: string | null
  start_date: string | null
  end_date: string | null
  awarded_amount: number | null
  cash_received_ytd: number | null
  budget_allocated_ytd: number | null
  total_spend_charged_ytd: number | null
  reporting_due: string | null
  required_kpi_notes: string | null
  other_non_labour_spend_ytd: number | null
  created_at: string
  updated_at: string
}

interface FundingRegisterListProps {
  initialEntries: FundingEntry[]
  canEdit: boolean
}

const emptyForm = {
  grant_donor_name: '',
  restriction_type: '',
  programme: '',
  grant_code: '',
  start_date: '',
  end_date: '',
  awarded_amount: '',
  cash_received_ytd: '',
  budget_allocated_ytd: '',
  reporting_due: '',
  required_kpi_notes: '',
  other_non_labour_spend_ytd: '',
}

function fmt(value: number | null | undefined): string {
  if (value == null) return '—'
  return `$${value.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function toNum(val: string): number | null {
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

function calcBalance(awarded: number | null, spend: number | null): number | null {
  if (awarded == null) return null
  return awarded - (spend ?? 0)
}

function calcUtilisation(awarded: number | null, spend: number | null): string {
  if (!awarded || awarded === 0) return '—'
  const pct = ((spend ?? 0) / awarded) * 100
  return `${pct.toFixed(1)}%`
}

function SummaryPanel({ entries }: { entries: FundingEntry[] }) {
  const programmeSummary = PROGRAMMES.map((prog) => {
    const rows = entries.filter((e) => e.programme === prog)
    const awarded = rows.reduce((s, e) => s + (e.awarded_amount ?? 0), 0)
    const received = rows.reduce((s, e) => s + (e.cash_received_ytd ?? 0), 0)
    const spend = rows.reduce((s, e) => s + (e.total_spend_charged_ytd ?? 0), 0)
    return { prog, awarded, received, spend, balance: awarded - spend }
  })

  const totals = programmeSummary.reduce(
    (acc, r) => ({
      awarded: acc.awarded + r.awarded,
      received: acc.received + r.received,
      spend: acc.spend + r.spend,
      balance: acc.balance + r.balance,
    }),
    { awarded: 0, received: 0, spend: 0, balance: 0 }
  )

  const typeSummary = RESTRICTION_TYPES.map((rt) => {
    const rows = entries.filter((e) => e.restriction_type === rt)
    const awarded = rows.reduce((s, e) => s + (e.awarded_amount ?? 0), 0)
    const spend = rows.reduce((s, e) => s + (e.total_spend_charged_ytd ?? 0), 0)
    return { rt, awarded, spend }
  })

  const fmtNum = (v: number) =>
    `$${v.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Funding Summary by Programme */}
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-[#4B0082] text-white px-4 py-2 text-sm font-semibold">
          Funding Summary by Programme
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-orange-50">
              <TableHead className="text-xs font-semibold">Programme</TableHead>
              <TableHead className="text-xs font-semibold text-right">Awarded</TableHead>
              <TableHead className="text-xs font-semibold text-right">Received</TableHead>
              <TableHead className="text-xs font-semibold text-right">Spend Charged</TableHead>
              <TableHead className="text-xs font-semibold text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programmeSummary.map(({ prog, awarded, received, spend, balance }) => (
              <TableRow key={prog}>
                <TableCell className="text-xs">{prog}</TableCell>
                <TableCell className="text-xs text-right">{fmtNum(awarded)}</TableCell>
                <TableCell className="text-xs text-right">{fmtNum(received)}</TableCell>
                <TableCell className="text-xs text-right">{fmtNum(spend)}</TableCell>
                <TableCell className="text-xs text-right">{fmtNum(balance)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell className="text-xs">Total</TableCell>
              <TableCell className="text-xs text-right">{fmtNum(totals.awarded)}</TableCell>
              <TableCell className="text-xs text-right">{fmtNum(totals.received)}</TableCell>
              <TableCell className="text-xs text-right">{fmtNum(totals.spend)}</TableCell>
              <TableCell className="text-xs text-right">{fmtNum(totals.balance)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Funding Type Split */}
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-[#4B0082] text-white px-4 py-2 text-sm font-semibold">
          Funding Type Split
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-orange-50">
              <TableHead className="text-xs font-semibold">Restriction Type</TableHead>
              <TableHead className="text-xs font-semibold text-right">Awarded</TableHead>
              <TableHead className="text-xs font-semibold text-right">Spend Charged</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typeSummary.map(({ rt, awarded, spend }) => (
              <TableRow key={rt}>
                <TableCell className="text-xs">{rt}</TableCell>
                <TableCell className="text-xs text-right">{fmtNum(awarded)}</TableCell>
                <TableCell className="text-xs text-right">{fmtNum(spend)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function FundingRegisterList({ initialEntries, canEdit }: FundingRegisterListProps) {
  const router = useRouter()
  const toast = useToast()
  const isMobile = useIsMobile()

  const [entries, setEntries] = useState<FundingEntry[]>(initialEntries)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<FundingEntry | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FundingEntry | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>(() => {
    const defaults = Object.fromEntries(COLUMNS.map((c) => [c.key, true])) as Record<ColKey, boolean>
    try {
      const saved = localStorage.getItem('funding-register-cols')
      if (saved) return { ...defaults, ...JSON.parse(saved) }
    } catch {}
    return defaults
  })

  function toggleCol(key: ColKey, checked: boolean) {
    setVisibleCols((prev) => {
      const next = { ...prev, [key]: checked }
      try { localStorage.setItem('funding-register-cols', JSON.stringify(next)) } catch {}
      return next
    })
  }

  function set(field: keyof typeof emptyForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function openCreateDialog() {
    setEditingEntry(null)
    setForm(emptyForm)
    setIsDialogOpen(true)
  }

  function openEditDialog(entry: FundingEntry) {
    setEditingEntry(entry)
    setForm({
      grant_donor_name: entry.grant_donor_name,
      restriction_type: entry.restriction_type,
      programme: entry.programme,
      grant_code: entry.grant_code ?? '',
      start_date: entry.start_date ?? '',
      end_date: entry.end_date ?? '',
      awarded_amount: entry.awarded_amount?.toString() ?? '',
      cash_received_ytd: entry.cash_received_ytd?.toString() ?? '',
      budget_allocated_ytd: entry.budget_allocated_ytd?.toString() ?? '',
      reporting_due: entry.reporting_due ?? '',
      required_kpi_notes: entry.required_kpi_notes ?? '',
      other_non_labour_spend_ytd: entry.other_non_labour_spend_ytd?.toString() ?? '',
    })
    setIsDialogOpen(true)
  }

  function openDeleteDialog(entry: FundingEntry) {
    setDeleteTarget(entry)
    setIsDeleteDialogOpen(true)
  }

  function entryFromForm(id: string, created_at: string, updated_at: string): FundingEntry {
    return {
      id,
      grant_donor_name: form.grant_donor_name.trim(),
      restriction_type: form.restriction_type,
      programme: form.programme,
      grant_code: form.grant_code.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      awarded_amount: toNum(form.awarded_amount),
      cash_received_ytd: toNum(form.cash_received_ytd),
      budget_allocated_ytd: toNum(form.budget_allocated_ytd),
      total_spend_charged_ytd: 0,
      reporting_due: form.reporting_due || null,
      required_kpi_notes: form.required_kpi_notes.trim() || null,
      other_non_labour_spend_ytd: toNum(form.other_non_labour_spend_ytd),
      created_at,
      updated_at,
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.grant_donor_name.trim() || !form.restriction_type || !form.programme) return

    setSaving(true)
    const supabase = createClient()

    const payload = {
      grant_donor_name: form.grant_donor_name.trim(),
      restriction_type: form.restriction_type,
      programme: form.programme,
      grant_code: form.grant_code.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      awarded_amount: toNum(form.awarded_amount),
      cash_received_ytd: toNum(form.cash_received_ytd),
      budget_allocated_ytd: toNum(form.budget_allocated_ytd),
      total_spend_charged_ytd: 0,
      reporting_due: form.reporting_due || null,
      required_kpi_notes: form.required_kpi_notes.trim() || null,
      other_non_labour_spend_ytd: toNum(form.other_non_labour_spend_ytd),
    }

    if (editingEntry) {
      const { data, error } = await supabase
        .from('funding_register')
        // @ts-ignore
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editingEntry.id)
        .select()
        .single() as { data: any; error: any }

      if (error) {
        toast.error(error.message)
      } else {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === editingEntry.id
              ? entryFromForm(editingEntry.id, editingEntry.created_at, data.updated_at)
              : e
          )
        )
        toast.success('Entry updated')
        setIsDialogOpen(false)
        router.refresh()
      }
    } else {
      const { data, error } = await supabase
        .from('funding_register')
        // @ts-ignore
        .insert(payload)
        .select()
        .single() as { data: any; error: any }

      if (error) {
        toast.error(error.message)
      } else {
        setEntries((prev) => [entryFromForm(data.id, data.created_at, data.updated_at), ...prev])
        toast.success('Entry added')
        setIsDialogOpen(false)
        router.refresh()
      }
    }

    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('funding_register').delete().eq('id', deleteTarget.id)

    if (error) {
      toast.error(error.message)
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      toast.success('Entry deleted')
      setIsDeleteDialogOpen(false)
      router.refresh()
    }
    setDeleting(false)
  }

  const FormWrapper = isMobile ? Sheet : Dialog
  const FormContent = isMobile ? SheetContent : DialogContent
  const FormHeader = isMobile ? SheetHeader : DialogHeader
  const FormTitle = isMobile ? SheetTitle : DialogTitle
  const FormFooter = isMobile ? SheetFooter : DialogFooter

  const formBody = (
    <form id="funding-form" onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="f-name">Grant / Donor Name</Label>
        <Input
          id="f-name"
          value={form.grant_donor_name}
          onChange={set('grant_donor_name')}
          placeholder="Enter grant or donor name"
          required
          disabled={saving}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-restriction">Restriction Type</Label>
        <Select
          id="f-restriction"
          value={form.restriction_type}
          onChange={set('restriction_type')}
          required
          disabled={saving}
        >
          <option value="">Select type...</option>
          {RESTRICTION_TYPES.map((rt) => (
            <option key={rt} value={rt}>{rt}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-programme">Programme</Label>
        <Select
          id="f-programme"
          value={form.programme}
          onChange={set('programme')}
          required
          disabled={saving}
        >
          <option value="">Select programme...</option>
          {PROGRAMMES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-code">Grant Code</Label>
        <Input
          id="f-code"
          value={form.grant_code}
          onChange={set('grant_code')}
          placeholder="Optional"
          disabled={saving}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="f-start">Start Date</Label>
          <Input id="f-start" type="date" value={form.start_date} onChange={set('start_date')} disabled={saving} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-end">End Date</Label>
          <Input id="f-end" type="date" value={form.end_date} onChange={set('end_date')} disabled={saving} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-awarded">Awarded Amount (SGD)</Label>
        <Input
          id="f-awarded"
          type="number"
          step="0.01"
          min="0"
          value={form.awarded_amount}
          onChange={set('awarded_amount')}
          placeholder="0.00"
          disabled={saving}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-received">Cash Received YTD</Label>
        <Input
          id="f-received"
          type="number"
          step="0.01"
          min="0"
          value={form.cash_received_ytd}
          onChange={set('cash_received_ytd')}
          placeholder="0.00"
          disabled={saving}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-budget">Budget Allocated YTD</Label>
        <Input
          id="f-budget"
          type="number"
          step="0.01"
          min="0"
          value={form.budget_allocated_ytd}
          onChange={set('budget_allocated_ytd')}
          placeholder="0.00"
          disabled={saving}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-other">Other Non-Labour Spend Charged YTD</Label>
        <Input
          id="f-other"
          type="number"
          step="0.01"
          min="0"
          value={form.other_non_labour_spend_ytd}
          onChange={set('other_non_labour_spend_ytd')}
          placeholder="0.00"
          disabled={saving}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-reporting">Reporting Due</Label>
        <Input id="f-reporting" type="date" value={form.reporting_due} onChange={set('reporting_due')} disabled={saving} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-kpi">Required KPI / Notes</Label>
        <Textarea
          id="f-kpi"
          value={form.required_kpi_notes}
          onChange={set('required_kpi_notes')}
          placeholder="Optional"
          rows={3}
          disabled={saving}
        />
      </div>
    </form>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Funding Register</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="hidden md:flex">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Toggle columns</p>
              <div className="space-y-2">
                {COLUMNS.map((col) => (
                  <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={visibleCols[col.key]}
                      onCheckedChange={(checked) => toggleCol(col.key, !!checked)}
                    />
                    <span className="text-sm">{col.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {canEdit && (
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          )}
        </div>
      </div>

      {/* Summary panel */}
      <SummaryPanel entries={entries} />

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Grant / Donor Name</TableHead>
              {visibleCols.restriction_type && <TableHead className="whitespace-nowrap">Restriction Type</TableHead>}
              {visibleCols.programme && <TableHead className="whitespace-nowrap">Programme</TableHead>}
              {visibleCols.grant_code && <TableHead className="whitespace-nowrap">Grant Code</TableHead>}
              {visibleCols.start_date && <TableHead className="whitespace-nowrap">Start Date</TableHead>}
              {visibleCols.end_date && <TableHead className="whitespace-nowrap">End Date</TableHead>}
              {visibleCols.awarded_amount && <TableHead className="whitespace-nowrap text-right">Awarded (SGD)</TableHead>}
              {visibleCols.cash_received_ytd && <TableHead className="whitespace-nowrap text-right">Cash Received YTD</TableHead>}
              {visibleCols.budget_allocated_ytd && <TableHead className="whitespace-nowrap text-right">Budget Allocated YTD</TableHead>}
              {visibleCols.total_spend_ytd && <TableHead className="whitespace-nowrap text-right">Total Spend YTD</TableHead>}
              {visibleCols.balance_remaining && <TableHead className="whitespace-nowrap text-right">Balance Remaining</TableHead>}
              {visibleCols.utilisation && <TableHead className="whitespace-nowrap text-right">Utilisation %</TableHead>}
              {visibleCols.reporting_due && <TableHead className="whitespace-nowrap">Reporting Due</TableHead>}
              {visibleCols.kpi_notes && <TableHead className="whitespace-nowrap">KPI / Notes</TableHead>}
              {visibleCols.other_non_labour && <TableHead className="whitespace-nowrap text-right">Other Non-Labour YTD</TableHead>}
              {canEdit && (
                <TableHead className="w-12 sticky right-0 bg-background z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] text-right whitespace-nowrap">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={1 + COLUMNS.filter((c) => visibleCols[c.key]).length + (canEdit ? 1 : 0)}
                  className="text-center text-muted-foreground py-10"
                >
                  No entries yet. {canEdit && 'Click "Add Entry" to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium whitespace-nowrap">{entry.grant_donor_name}</TableCell>
                  {visibleCols.restriction_type && <TableCell className="whitespace-nowrap">{entry.restriction_type}</TableCell>}
                  {visibleCols.programme && <TableCell className="whitespace-nowrap">{entry.programme}</TableCell>}
                  {visibleCols.grant_code && <TableCell className="whitespace-nowrap text-muted-foreground">{entry.grant_code ?? '—'}</TableCell>}
                  {visibleCols.start_date && <TableCell className="whitespace-nowrap">{entry.start_date ?? '—'}</TableCell>}
                  {visibleCols.end_date && <TableCell className="whitespace-nowrap">{entry.end_date ?? '—'}</TableCell>}
                  {visibleCols.awarded_amount && <TableCell className="text-right whitespace-nowrap">{fmt(entry.awarded_amount)}</TableCell>}
                  {visibleCols.cash_received_ytd && <TableCell className="text-right whitespace-nowrap">{fmt(entry.cash_received_ytd)}</TableCell>}
                  {visibleCols.budget_allocated_ytd && <TableCell className="text-right whitespace-nowrap">{fmt(entry.budget_allocated_ytd)}</TableCell>}
                  {visibleCols.total_spend_ytd && <TableCell className="text-right whitespace-nowrap">{fmt(entry.total_spend_charged_ytd)}</TableCell>}
                  {visibleCols.balance_remaining && (
                    <TableCell className="text-right whitespace-nowrap">
                      {fmt(calcBalance(entry.awarded_amount, entry.total_spend_charged_ytd))}
                    </TableCell>
                  )}
                  {visibleCols.utilisation && (
                    <TableCell className="text-right whitespace-nowrap">
                      {calcUtilisation(entry.awarded_amount, entry.total_spend_charged_ytd)}
                    </TableCell>
                  )}
                  {visibleCols.reporting_due && <TableCell className="whitespace-nowrap">{entry.reporting_due ?? '—'}</TableCell>}
                  {visibleCols.kpi_notes && (
                    <TableCell className="max-w-[160px] truncate text-muted-foreground">
                      {entry.required_kpi_notes ?? '—'}
                    </TableCell>
                  )}
                  {visibleCols.other_non_labour && <TableCell className="text-right whitespace-nowrap">{fmt(entry.other_non_labour_spend_ytd)}</TableCell>}
                  {canEdit && (
                    <TableCell className="sticky right-0 bg-background z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(entry)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(entry)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            No entries yet. {canEdit && 'Tap "Add Entry" to get started.'}
          </p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{entry.grant_donor_name}</p>
                  <p className="text-xs text-muted-foreground">{entry.programme} · {entry.restriction_type}</p>
                </div>
                {canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(entry)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDeleteDialog(entry)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-muted-foreground">Awarded</span>
                <span className="text-right">{fmt(entry.awarded_amount)}</span>
                <span className="text-muted-foreground">Spend YTD</span>
                <span className="text-right">{fmt(entry.total_spend_charged_ytd)}</span>
                <span className="text-muted-foreground">Balance</span>
                <span className="text-right">{fmt(calcBalance(entry.awarded_amount, entry.total_spend_charged_ytd))}</span>
                <span className="text-muted-foreground">Utilisation</span>
                <span className="text-right">{calcUtilisation(entry.awarded_amount, entry.total_spend_charged_ytd)}</span>
              </div>
              {entry.grant_code && (
                <p className="text-xs text-muted-foreground">Code: {entry.grant_code}</p>
              )}
              {entry.reporting_due && (
                <p className="text-xs text-muted-foreground">Reporting due: {entry.reporting_due}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit dialog */}
      <FormWrapper open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <FormContent className={isMobile ? 'px-6 overflow-y-auto' : 'sm:max-w-[540px] overflow-y-auto max-h-[90vh]'}>
          <FormHeader>
            <FormTitle>{editingEntry ? 'Edit Entry' : 'Add Entry'}</FormTitle>
          </FormHeader>
          {formBody}
          <FormFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="funding-form" disabled={saving}>
              {saving ? 'Saving...' : editingEntry ? 'Update' : 'Add'}
            </Button>
          </FormFooter>
        </FormContent>
      </FormWrapper>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete entry?"
        description={`This will permanently delete the entry for "${deleteTarget?.grant_donor_name}". This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
