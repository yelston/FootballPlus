'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { PlusCircle, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import type { LiteracySession } from '@/types/player'

interface Props {
  sessions: LiteracySession[]
  playerId: string
  canEdit: boolean
}

interface FormState {
  date: string
  phonics: string
  sightwords: string
  readers: string
  notes: string
}

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

const emptyForm: FormState = {
  date: todayStr(),
  phonics: '',
  sightwords: '',
  readers: '',
  notes: '',
}

function sessionToForm(s: LiteracySession): FormState {
  return {
    date: s.date,
    phonics: s.phonics ?? '',
    sightwords: s.sightwords ?? '',
    readers: s.readers ?? '',
    notes: s.notes ?? '',
  }
}

export function LiteracySessionLogs({ sessions, playerId, canEdit }: Props) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LiteracySession | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<LiteracySession | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openAdd = useCallback(() => {
    setEditing(null)
    setForm({ ...emptyForm, date: todayStr() })
    setError(null)
    setOpen(true)
  }, [])

  const openEdit = useCallback((session: LiteracySession) => {
    setEditing(session)
    setForm(sessionToForm(session))
    setError(null)
    setOpen(true)
  }, [])

  const handleSave = async () => {
    if (!form.date) {
      setError('Please select a date.')
      return
    }
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated.')
      setSaving(false)
      return
    }

    const payload = {
      playerId,
      date: form.date,
      phonics: form.phonics || null,
      sightwords: form.sightwords || null,
      readers: form.readers || null,
      notes: form.notes || null,
      loggedByUserId: user.id,
      updatedAt: new Date().toISOString(),
    }

    const table = (supabase as any).from('literacy_sessions')
    const { error: err } = editing
      ? await table.update(payload).eq('id', editing.id)
      : await table.insert(payload)

    setSaving(false)
    if (err) { setError(err.message); return }

    setOpen(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('literacy_sessions').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Session Logs</h3>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={openAdd}>
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            Add Session
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sessions logged yet.</p>
      ) : (
        <div className="divide-y rounded-md border">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center gap-3 px-3 py-2">
              <span className="shrink-0 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                #{session.sessionNumber}
              </span>
              <span className="shrink-0 w-24 text-sm text-muted-foreground">
                {format(parseISO(session.date), 'dd MMM yyyy')}
              </span>
              <span className="flex-1 min-w-0 text-sm truncate">
                <span className="text-muted-foreground">Phonics: </span>{session.phonics || <em className="text-muted-foreground">—</em>}
              </span>
              <span className="flex-1 min-w-0 text-sm truncate">
                <span className="text-muted-foreground">Sight Words: </span>{session.sightwords || <em className="text-muted-foreground">—</em>}
              </span>
              <span className="flex-1 min-w-0 text-sm truncate">
                <span className="text-muted-foreground">Readers: </span>{session.readers || <em className="text-muted-foreground">—</em>}
              </span>
              {canEdit && (
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(session)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(session)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? `Edit Session ${editing.sessionNumber}`
                : `New Session (Session ${sessions.length + 1})`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                max={todayStr()}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Phonics</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Phase 3 – digraphs sh, ch, th..."
                value={form.phonics}
                onChange={(e) => setForm((f) => ({ ...f, phonics: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Sight Words</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Red words list 1–10, focusing on 'said', 'the'..."
                value={form.sightwords}
                onChange={(e) => setForm((f) => ({ ...f, sightwords: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Readers</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Oxford Level 3 – 'Kipper's Birthday'..."
                value={form.readers}
                onChange={(e) => setForm((f) => ({ ...f, readers: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                rows={2}
                placeholder="Any additional observations..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Session"
        description={`Are you sure you want to delete Session ${deleteTarget?.sessionNumber}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        loading={deleting}
      />
    </div>
  )
}

