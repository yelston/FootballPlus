'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Edit } from 'lucide-react'
import type { Database } from '@/types/database'

type Position = Database['public']['Tables']['positions']['Row']

interface PositionsListProps {
  initialPositions: Position[]
  canEdit: boolean
}

export function PositionsList({ initialPositions, canEdit }: PositionsListProps) {
  const router = useRouter()
  const [positions, setPositions] = useState<Position[]>(initialPositions)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = (formData.get('name') as string)?.trim()
    const sortOrderRaw = formData.get('sortOrder') as string
    const sortOrder = sortOrderRaw ? parseInt(sortOrderRaw, 10) : null

    if (!name) {
      setError('Position name is required.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    if (editingPosition) {
      const { error: updateError } = await supabase
        .from('positions')
        .update({ name, sortOrder: sortOrder ?? 0 })
        .eq('id', editingPosition.id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }
      setPositions(
        positions.map((p) =>
          p.id === editingPosition.id ? { ...p, name, sortOrder } : p
        )
      )
      setIsDialogOpen(false)
      setEditingPosition(null)
      router.refresh()
    } else {
      const { data, error: insertError } = await supabase
        .from('positions')
        .insert({ name, sortOrder: sortOrder ?? 0 })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
      setPositions([data, ...positions])
      setIsDialogOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  const openEditDialog = (position: Position) => {
    setEditingPosition(position)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingPosition(null)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingPosition(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        {canEdit && (
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              if (!open) closeDialog()
              setIsDialogOpen(open)
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Position
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <form key={editingPosition?.id ?? 'new'} onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingPosition ? 'Edit Position' : 'Add New Position'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPosition
                      ? 'Update the position name and order.'
                      : 'Add a new position option for player profiles.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingPosition?.name ?? ''}
                      required
                      disabled={loading}
                      placeholder="e.g. Goalkeeper"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sortOrder">Sort order</Label>
                    <Input
                      id="sortOrder"
                      name="sortOrder"
                      type="number"
                      min={0}
                      defaultValue={editingPosition?.sortOrder ?? ''}
                      disabled={loading}
                      placeholder="0"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialog}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading
                      ? 'Saving...'
                      : editingPosition
                        ? 'Update'
                        : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {positions.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">No positions yet.</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-24">Order</TableHead>
                {canEdit && <TableHead className="text-right w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="font-medium">{position.name}</TableCell>
                  <TableCell>{position.sortOrder ?? 0}</TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(position)}
                        disabled={loading}
                        aria-label="Edit position"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
