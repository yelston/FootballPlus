'use client'

import { useState } from 'react'
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
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import type { User } from '@/lib/auth'
import { useRouter } from 'next/navigation'

interface UsersListProps {
  initialUsers: User[]
}

export function UsersList({ initialUsers }: UsersListProps) {
  const router = useRouter()
  const toast = useToast()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizeContactNumber = (value: string) => value.replace(/\D/g, '')

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  })

  const handleDelete = async (userId: string) => {
    setLoading(true)
    setError(null)

    const response = await fetch('/api/users/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result.error || 'Failed to delete user')
      toast.error(result.error || 'Failed to delete user')
      setLoading(false)
      return false
    } else {
      setUsers(users.filter((u) => u.id !== userId))
      setLoading(false)
      router.refresh()
      toast.success('User deleted')
      return true
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = (formData.get('name') as string) || ''
    const emailFromForm = formData.get('email') as string | null
    const email = emailFromForm || editingUser?.email || ''
    const contactNumberRaw = (formData.get('contactNumber') as string) || ''
    const contactNumber = normalizeContactNumber(contactNumberRaw)
    const role = formData.get('role') as 'admin' | 'coach' | 'volunteer'

    const supabase = createClient()

    if (!name.trim()) {
      setError('Name is required.')
      setLoading(false)
      return
    }

    if (!role) {
      setError('Role is required.')
      setLoading(false)
      return
    }

    if (contactNumberRaw && contactNumberRaw !== contactNumber) {
      setError('Contact number can only contain digits.')
      setLoading(false)
      return
    }

    if (editingUser) {
      // Update existing user
      const { error } = await supabase
        .from('users')
        // @ts-ignore - Supabase type inference issue with update
        .update({
          name,
          email,
          contactNumber: contactNumber || null,
          role,
        })
        .eq('id', editingUser.id)

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setUsers(
          users.map((u) =>
            u.id === editingUser.id
              ? { ...u, name, email, contactNumber: contactNumber || null, role }
              : u
          )
        )
        toast.success('User updated')
        setIsDialogOpen(false)
        setEditingUser(null)
        setLoading(false)
        router.refresh()
      }
    } else {
      // Create new user via API route
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          contactNumber: contactNumber || null,
          role,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to create user')
        setLoading(false)
      } else {
        setUsers([
          {
            id: result.userId,
            name,
            email,
            contactNumber: contactNumber || null,
            role,
            profileImageUrl: null,
            createdAt: new Date().toISOString(),
          },
          ...users,
        ])
        toast.success('User created')
        setIsDialogOpen(false)
        setLoading(false)
        router.refresh()
      }
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingUser(null)
    setError(null)
  }

  const openDeleteDialog = (user: User) => {
    setDeleteTarget(user)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return
    }
    const didDelete = await handleDelete(deleteTarget.id)
    if (didDelete) {
      setIsDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="relative w-full min-w-0 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4 shrink-0" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] max-w-[500px] sm:w-full">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? 'Update user information below.'
                    : 'Create a new user account. They will receive an invitation email.'}
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
                    defaultValue={editingUser?.name}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingUser?.email}
                    required
                    disabled={loading || !!editingUser}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    name="contactNumber"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="tel"
                    defaultValue={editingUser?.contactNumber || ''}
                    disabled={loading}
                    onChange={(e) => {
                      const nextValue = normalizeContactNumber(e.currentTarget.value)
                      if (e.currentTarget.value !== nextValue) {
                        e.currentTarget.value = nextValue
                      }
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    id="role"
                    name="role"
                    defaultValue={editingUser?.role}
                    required
                    disabled={loading}
                  >
                    <option value="admin">Admin</option>
                    <option value="coach">Coach</option>
                    <option value="volunteer">Volunteer</option>
                  </Select>
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
                    : editingUser
                    ? 'Update User'
                    : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="rounded-lg border p-6 text-center sm:p-8">
          <p className="text-sm text-muted-foreground sm:text-base">
            {searchQuery ? 'No users found matching your search.' : 'No users yet.'}
          </p>
        </div>
      ) : (
        <>
          <ConfirmDialog
            open={isDeleteDialogOpen}
            onOpenChange={(open) => {
              setIsDeleteDialogOpen(open)
              if (!open) {
                setDeleteTarget(null)
              }
            }}
            title="Delete user?"
            description={
              deleteTarget
                ? `This will permanently delete ${deleteTarget.name}.`
                : 'This will permanently delete this user.'
            }
            confirmLabel="Delete"
            onConfirm={handleConfirmDelete}
            loading={loading}
          />

          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate font-semibold">{user.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.contactNumber || '—'}
                      </p>
                      <Badge variant="secondary" className="mt-2 capitalize">
                        {user.role}
                      </Badge>
                    </div>
                    <div className="flex shrink-0 flex-col justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(user)}
                        disabled={loading}
                        aria-label="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(user)}
                        disabled={loading}
                        aria-label="Delete user"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.contactNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(user)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
