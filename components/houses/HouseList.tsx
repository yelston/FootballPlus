'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks/use-media-query'

export interface HouseWithCount {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  playerCount: number
}

interface HouseListProps {
  initialHouses: HouseWithCount[]
  canEdit: boolean
}

export function HouseList({ initialHouses, canEdit }: HouseListProps) {
  const router = useRouter()
  const toast = useToast()
  const isMobile = useIsMobile()
  const [houses, setHouses] = useState<HouseWithCount[]>(initialHouses)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingHouse, setEditingHouse] = useState<HouseWithCount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HouseWithCount | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = (formData.get('name') as string)?.trim()
    const description = (formData.get('description') as string)?.trim() || null

    if (!name) {
      setError('House name is required.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    if (editingHouse) {
      const { error: updateError } = await supabase
        .from('houses')
        .update({ name, description, updated_at: new Date().toISOString() })
        .eq('id', editingHouse.id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }
      setHouses(houses.map((h) =>
        h.id === editingHouse.id ? { ...h, name, description } : h
      ))
      toast.success('House updated')
    } else {
      const { data, error: insertError } = await supabase
        .from('houses')
        .insert({ name, description })
        .select()
        .single() as { data: any; error: any }

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
      setHouses([...houses, { ...data, playerCount: 0 }])
      toast.success('House created')
    }

    closeForm()
    router.refresh()
    setLoading(false)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setLoading(true)

    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('houses')
      .delete()
      .eq('id', deleteTarget.id)

    if (deleteError) {
      toast.error(deleteError.message)
      setLoading(false)
      return
    }

    setHouses(houses.filter((h) => h.id !== deleteTarget.id))
    toast.success('House deleted')
    setIsDeleteOpen(false)
    setDeleteTarget(null)
    router.refresh()
    setLoading(false)
  }

  const openCreateForm = () => {
    setEditingHouse(null)
    setIsFormOpen(true)
  }

  const openEditForm = (house: HouseWithCount) => {
    setEditingHouse(house)
    setIsFormOpen(true)
  }

  const openDeleteDialog = (house: HouseWithCount) => {
    setDeleteTarget(house)
    setIsDeleteOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingHouse(null)
    setError(null)
  }

  const FormHeaderComponent = isMobile ? SheetHeader : DialogHeader
  const FormTitleComponent = isMobile ? SheetTitle : DialogTitle
  const FormDescriptionComponent = isMobile ? SheetDescription : DialogDescription
  const FormFooterComponent = isMobile ? SheetFooter : DialogFooter

  const houseForm = (
    <form key={editingHouse?.id ?? 'new'} onSubmit={handleSubmit}>
      <FormHeaderComponent>
        <FormTitleComponent>
          {editingHouse ? 'Edit House' : 'Add New House'}
        </FormTitleComponent>
        <FormDescriptionComponent>
          {editingHouse
            ? 'Update the house name and description.'
            : 'Add a new house group for player organisation.'}
        </FormDescriptionComponent>
      </FormHeaderComponent>
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
            defaultValue={editingHouse?.name ?? ''}
            required
            disabled={loading}
            placeholder="e.g. Red House"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={editingHouse?.description ?? ''}
            disabled={loading}
            placeholder="Optional description"
            rows={3}
          />
        </div>
      </div>
      <FormFooterComponent>
        <Button type="button" variant="outline" onClick={closeForm} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : editingHouse ? 'Update' : 'Create'}
        </Button>
      </FormFooterComponent>
    </form>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        {canEdit && (
          isMobile ? (
            <Sheet
              open={isFormOpen}
              onOpenChange={(open) => {
                if (!open) closeForm()
                setIsFormOpen(open)
              }}
            >
              <SheetTrigger asChild>
                <Button onClick={openCreateForm} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add House
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[100svh] w-screen overflow-y-auto">
                {houseForm}
              </SheetContent>
            </Sheet>
          ) : (
            <Dialog
              open={isFormOpen}
              onOpenChange={(open) => {
                if (!open) closeForm()
                setIsFormOpen(open)
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={openCreateForm} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add House
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px]">
                {houseForm}
              </DialogContent>
            </Dialog>
          )
        )}
      </div>

      {houses.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">No houses yet.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {houses.map((house) => (
              <div key={house.id} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{house.name}</p>
                      <Badge variant="secondary">{house.playerCount} player{house.playerCount !== 1 ? 's' : ''}</Badge>
                    </div>
                    {house.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {house.description}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => openEditForm(house)}
                        disabled={loading}
                        aria-label="Edit house"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(house)}
                        disabled={loading}
                        aria-label="Delete house"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-28">Players</TableHead>
                  {canEdit && <TableHead className="text-right w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {houses.map((house) => (
                  <TableRow key={house.id}>
                    <TableCell className="font-medium">{house.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {house.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{house.playerCount}</Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditForm(house)}
                            disabled={loading}
                            aria-label="Edit house"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(house)}
                            disabled={loading}
                            aria-label="Delete house"
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

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open)
          if (!open) setDeleteTarget(null)
        }}
        title="Delete house?"
        description={
          deleteTarget
            ? deleteTarget.playerCount > 0
              ? `This house has ${deleteTarget.playerCount} player${deleteTarget.playerCount !== 1 ? 's' : ''}. They will be unassigned from this house. This action cannot be undone.`
              : `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        loading={loading}
      />
    </div>
  )
}
