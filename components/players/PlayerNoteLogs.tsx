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
import type { PlayerNote } from '@/types/player'

interface Props {
  notes: PlayerNote[]
  playerId: string
  canEdit: boolean
}

interface FormState {
  date: string
  notes: string
}

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

const emptyForm: FormState = { date: todayStr(), notes: '' }

function noteToForm(n: PlayerNote): FormState {
  return { date: n.date, notes: n.notes }
}

export function PlayerNoteLogs({ notes, playerId, canEdit }: Props) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PlayerNote | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<PlayerNote | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openAdd = useCallback(() => {
    setEditing(null)
    setForm({ ...emptyForm, date: todayStr() })
    setError(null)
    setOpen(true)
  }, [])

  const openEdit = useCallback((note: PlayerNote) => {
    setEditing(note)
    setForm(noteToForm(note))
    setError(null)
    setOpen(true)
  }, [])

  const handleSave = async () => {
    if (!form.date) { setError('Please select a date.'); return }
    if (!form.notes.trim()) { setError('Notes cannot be empty.'); return }
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated.'); setSaving(false); return }

    const payload = {
      playerId,
      date: form.date,
      notes: form.notes.trim(),
      loggedByUserId: user.id,
      updatedAt: new Date().toISOString(),
    }

    const table = supabase.from('player_notes')
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
    await supabase.from('player_notes').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Note Logs</h3>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={openAdd}>
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            Add Note
          </Button>
        )}
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes logged yet.</p>
      ) : (
        <div className="divide-y rounded-md border">
          {notes.map((note) => (
            <div key={note.id} className="flex items-start gap-3 px-3 py-2">
              <span className="shrink-0 w-24 text-sm text-muted-foreground pt-0.5">
                {format(parseISO(note.date), 'dd MMM yyyy')}
              </span>
              <span className="flex-1 min-w-0 text-sm whitespace-pre-wrap">{note.notes}</span>
              {canEdit && (
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(note)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(note)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Note' : 'New Note'}</DialogTitle>
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
              <Label>Notes</Label>
              <Textarea
                rows={5}
                placeholder="Enter notes…"
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
              {saving ? 'Saving…' : 'Save Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Note"
        description="Are you sure you want to delete this note? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        loading={deleting}
      />
    </div>
  )
}
