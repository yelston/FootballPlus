'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Edit, Search, Eye } from 'lucide-react'

interface Team {
  id: string
  name: string
  mainCoachId: string | null
  coachIds: string[]
  volunteerIds: string[]
  notes: string | null
  createdAt: string
  mainCoach?: { id: string; name: string; email: string } | null
  players?: { count: number }[] | null
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface TeamsListProps {
  initialTeams: Team[]
  users: User[]
  canEdit: boolean
}

export function TeamsList({ initialTeams, users, canEdit }: TeamsListProps) {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSupportTeamIds, setSelectedSupportTeamIds] = useState<string[]>([])

  const filteredTeams = teams.filter(
    (team) =>
      searchQuery === '' ||
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const coaches = users.filter((u) => u.role === 'coach' || u.role === 'admin')
  const volunteers = users.filter((u) => u.role === 'volunteer')
  const supportTeamMembers = [...coaches, ...volunteers]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = (formData.get('name') as string)?.trim()
    const mainCoachId = formData.get('mainCoachId') as string

    if (!name) {
      setError('Team name is required.')
      setLoading(false)
      return
    }
    if (!mainCoachId) {
      setError('Main coach is required.')
      setLoading(false)
      return
    }

    const coachIds = selectedSupportTeamIds
      .filter((id) => coaches.some((c) => c.id === id))
      .filter((id) => id !== mainCoachId)
    const volunteerIds = selectedSupportTeamIds.filter((id) =>
      volunteers.some((v) => v.id === id)
    )
    const notes = formData.get('notes') as string

    const supabase = createClient()

    if (editingTeam) {
      const { error } = await supabase
        .from('teams')
        .update({
          name,
          mainCoachId: mainCoachId || null,
          coachIds,
          volunteerIds,
          notes: notes || null,
        })
        .eq('id', editingTeam.id)

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setTeams(
          teams.map((t) =>
            t.id === editingTeam.id
              ? {
                  ...t,
                  name,
                  mainCoachId: mainCoachId || null,
                  coachIds,
                  volunteerIds,
                  notes: notes || null,
                }
              : t
          )
        )
        setIsDialogOpen(false)
        setEditingTeam(null)
        setLoading(false)
        router.refresh()
      }
    } else {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name,
          mainCoachId: mainCoachId || null,
          coachIds,
          volunteerIds,
          notes: notes || null,
        })
        .select()
        .single()

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setTeams([data, ...teams])
        setIsDialogOpen(false)
        setLoading(false)
        router.refresh()
      }
    }
  }

  const openEditDialog = (team: Team) => {
    setEditingTeam(team)
    setSelectedSupportTeamIds([
      ...(team.coachIds || []),
      ...(team.volunteerIds || []),
    ])
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingTeam(null)
    setSelectedSupportTeamIds([])
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingTeam(null)
    setSelectedSupportTeamIds([])
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm flex items-center gap-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by team name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingTeam ? 'Edit Team' : 'Add New Team'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTeam
                      ? 'Update team information below.'
                      : 'Create a new team and assign coaches and volunteers.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="name">Team Name *</Label>
                    <input
                      id="name"
                      name="name"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      defaultValue={editingTeam?.name}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mainCoachId">Main Coach *</Label>
                    <Select
                      id="mainCoachId"
                      name="mainCoachId"
                      defaultValue={editingTeam?.mainCoachId || ''}
                      disabled={loading}
                    >
                      <option value="">Select main coach</option>
                      {coaches.map((coach) => (
                        <option key={coach.id} value={coach.id}>
                          {coach.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Support Team</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                      {supportTeamMembers.map((member) => (
                        <label
                          key={member.id}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedSupportTeamIds.includes(member.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSupportTeamIds([
                                  ...selectedSupportTeamIds,
                                  member.id,
                                ])
                              } else {
                                setSelectedSupportTeamIds(
                                  selectedSupportTeamIds.filter(
                                    (id) => id !== member.id
                                  )
                                )
                              }
                            }}
                            disabled={loading}
                          />
                          <span className="text-sm">{member.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      defaultValue={editingTeam?.notes || ''}
                      disabled={loading}
                      rows={4}
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
                      : editingTeam
                      ? 'Update Team'
                      : 'Create Team'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {filteredTeams.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            {searchQuery
              ? 'No teams found matching your search.'
              : 'No teams yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Main Coach</TableHead>
                <TableHead>Players</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/teams/${team.id}`}
                      className="hover:underline"
                    >
                      {team.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {team.mainCoach?.name || (
                      <span className="text-muted-foreground">No main coach</span>
                    )}
                  </TableCell>
                  <TableCell>{team.players?.[0]?.count ?? 0}</TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          aria-label="View team details"
                        >
                          <Link href={`/teams/${team.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(team)}
                          disabled={loading}
                          aria-label="Edit team"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
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
