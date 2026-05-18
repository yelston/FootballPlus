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
import { Plus, Edit, Trash2, Search } from 'lucide-react'

interface LogEntry {
  id: string
  date: string
  team_id: string
  teamName: string
  title: string
  details: string | null
  created_at: string
  updated_at: string
}

interface Team {
  id: string
  name: string
}

interface TeamsLogListProps {
  initialLogs: LogEntry[]
  teams: Team[]
  canEdit: boolean
}

const emptyForm = { date: '', team_id: '', title: '', details: '' }

export function TeamsLogList({ initialLogs, teams, canEdit }: TeamsLogListProps) {
  const router = useRouter()
  const toast = useToast()
  const isMobile = useIsMobile()

  const [logs, setLogs] = useState<LogEntry[]>(initialLogs)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<LogEntry | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase()
    return (
      log.teamName.toLowerCase().includes(q) ||
      log.title.toLowerCase().includes(q) ||
      (log.details ?? '').toLowerCase().includes(q)
    )
  })

  function openCreateDialog() {
    setEditingLog(null)
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
    setIsDialogOpen(true)
  }

  function openEditDialog(log: LogEntry) {
    setEditingLog(log)
    setForm({
      date: log.date,
      team_id: log.team_id,
      title: log.title,
      details: log.details ?? '',
    })
    setIsDialogOpen(true)
  }

  function openDeleteDialog(log: LogEntry) {
    setDeleteTarget(log)
    setIsDeleteDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.date || !form.team_id || !form.title.trim()) return

    setSaving(true)
    const supabase = createClient()
    const teamName = teams.find((t) => t.id === form.team_id)?.name ?? ''

    if (editingLog) {
      const { data, error } = await supabase
        .from('teams_log')
        // @ts-ignore - Supabase type inference issue with update
        .update({
          date: form.date,
          team_id: form.team_id,
          title: form.title.trim(),
          details: form.details.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingLog.id)
        .select()
        .single() as { data: any; error: any }

      if (error) {
        toast.error(error.message)
      } else {
        setLogs((prev) =>
          prev.map((l) =>
            l.id === editingLog.id
              ? { ...l, ...form, teamName, details: form.details.trim() || null }
              : l
          )
        )
        toast.success('Log updated')
        setIsDialogOpen(false)
        router.refresh()
      }
    } else {
      const { data, error } = await supabase
        .from('teams_log')
        // @ts-ignore - Supabase type inference issue with insert
        .insert({
          date: form.date,
          team_id: form.team_id,
          title: form.title.trim(),
          details: form.details.trim() || null,
        })
        .select()
        .single() as { data: any; error: any }

      if (error) {
        toast.error(error.message)
      } else {
        setLogs((prev) => [
          {
            id: data.id,
            date: data.date,
            team_id: data.team_id,
            teamName,
            title: data.title,
            details: data.details,
            created_at: data.created_at,
            updated_at: data.updated_at,
          },
          ...prev,
        ])
        toast.success('Log added')
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
    const { error } = await supabase.from('teams_log').delete().eq('id', deleteTarget.id)

    if (error) {
      toast.error(error.message)
    } else {
      setLogs((prev) => prev.filter((l) => l.id !== deleteTarget.id))
      toast.success('Log deleted')
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
    <form id="log-form" onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="log-date">Date</Label>
        <Input
          id="log-date"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          required
          disabled={saving}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="log-team">Team</Label>
        <Select
          id="log-team"
          value={form.team_id}
          onChange={(e) => setForm((f) => ({ ...f, team_id: e.target.value }))}
          required
          disabled={saving}
        >
          <option value="">Select a team...</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="log-title">Title</Label>
        <Input
          id="log-title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Enter title"
          required
          disabled={saving}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="log-details">Details</Label>
        <Textarea
          id="log-details"
          value={form.details}
          onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
          placeholder="Additional details (optional)"
          rows={3}
          disabled={saving}
        />
      </div>
    </form>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Teams Log</h1>
        {canEdit && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Log
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by team or title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Details</TableHead>
              {canEdit && <TableHead className="w-24 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 5 : 4} className="text-center text-muted-foreground py-10">
                  No logs found.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">{log.date}</TableCell>
                  <TableCell>{log.teamName}</TableCell>
                  <TableCell>{log.title}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {log.details ?? '—'}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(log)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(log)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
        {filteredLogs.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No logs found.</p>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{log.teamName}</p>
                  <p className="text-xs text-muted-foreground">{log.date}</p>
                </div>
                {canEdit && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(log)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(log)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-sm">{log.title}</p>
              {log.details && (
                <p className="text-sm text-muted-foreground">{log.details}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit dialog */}
      <FormWrapper open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <FormContent className={isMobile ? 'px-6' : 'sm:max-w-[480px]'}>
          <FormHeader>
            <FormTitle>{editingLog ? 'Edit Log' : 'Add Log'}</FormTitle>
          </FormHeader>
          {formBody}
          <FormFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="log-form" disabled={saving}>
              {saving ? 'Saving...' : editingLog ? 'Update' : 'Add'}
            </Button>
          </FormFooter>
        </FormContent>
      </FormWrapper>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete log?"
        description={`This will permanently delete the log entry for "${deleteTarget?.teamName}" on ${deleteTarget?.date}. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
