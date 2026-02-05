'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
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
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { DateOfBirthPicker } from '@/components/ui/date-picker'
import { Plus, Search, Edit, Trash2, Filter, ChevronDown } from 'lucide-react'
import { differenceInYears } from 'date-fns'
import Image from 'next/image'

interface Player {
  id: string
  firstName: string
  lastName: string
  dob: string
  positions: string[]
  teamId: string | null
  profileImageUrl: string | null
  contactNumber: string | null
  notes: string | null
  createdAt: string
  teams?: { name: string } | null
}

interface Team {
  id: string
  name: string
}

interface PositionOption {
  id: string
  name: string
}

interface PlayersListProps {
  initialPlayers: Player[]
  teams: Team[]
  positions: PositionOption[]
  canEdit: boolean
}

export function PlayersList({ initialPlayers, teams, positions, canEdit }: PlayersListProps) {
  const positionNames = positions.map((p) => p.name)
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [searchQuery, setSearchQuery] = useState('')
  const [teamFilter, setTeamFilter] = useState<string[]>([])
  const [positionFilter, setPositionFilter] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [positionsPopoverOpen, setPositionsPopoverOpen] = useState(false)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [dobDate, setDobDate] = useState<Date | undefined>(undefined)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [contactNumber, setContactNumber] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleContactNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const digitsOnly = value.replace(/\D/g, '')
    const formatted = value.trimStart().startsWith('+') ? `+${digitsOnly}` : digitsOnly
    setContactNumber(formatted)
  }

  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      searchQuery === '' ||
      `${player.firstName} ${player.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())

    const matchesTeam =
      teamFilter.length === 0 ||
      (teamFilter.includes('none') && !player.teamId) ||
      (player.teamId && teamFilter.includes(player.teamId))

    const matchesPosition =
      positionFilter.length === 0 ||
      (player.positions && player.positions.some(pos => positionFilter.includes(pos)))

    return matchesSearch && matchesTeam && matchesPosition
  })

  const handleDelete = async (playerId: string) => {
    if (!confirm('Are you sure you want to delete this player?')) {
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.from('players').delete().eq('id', playerId)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setPlayers(players.filter((p) => p.id !== playerId))
      setLoading(false)
      router.refresh()
    }
  }

  const validateForm = (form: HTMLFormElement) => {
    const errors: Record<string, string> = {}

    const formData = new FormData(form)
    const firstName = formData.get('firstName') as string
    const lastName = formData?.get('lastName') as string
    const contactNumber = formData?.get('contactNumber') as string
    const notes = formData?.get('notes') as string

    if (!firstName?.trim()) {
      errors.firstName = 'First name is required'
    }
    if (!lastName?.trim()) {
      errors.lastName = 'Last name is required'
    }
    if (!dobDate) {
      errors.dob = 'Date of birth is required'
    }
    if (!contactNumber?.trim()) {
      errors.contactNumber = 'Contact number is required'
    }
    if (!selectedTeamId || selectedTeamId === '') {
      errors.teamId = 'Please select a team'
    }
    if (positionNames.length > 0 && selectedPositions.length === 0) {
      errors.positions = 'At least one position is required'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!validateForm(e.currentTarget)) {
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const dob = dobDate ? dobDate.toISOString().split('T')[0] : (formData.get('dob') as string)
    const teamIdValue = selectedTeamId === '_no_team_' ? '' : selectedTeamId
    const contactNumber = formData.get('contactNumber') as string
    const notes = formData.get('notes') as string
    const positions = selectedPositions.length > 0 ? selectedPositions : formData.getAll('positions') as string[]

    const supabase = createClient()

    let profileImageUrl = editingPlayer?.profileImageUrl || null
    const profileImageFile = formData.get('profileImage') as File | null

    if (profileImageFile && profileImageFile.size > 0) {
      const fileExt = profileImageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
      const filePath = `player-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('player-photos')
        .upload(filePath, profileImageFile)

      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }

      const { data } = supabase.storage
        .from('player-photos')
        .getPublicUrl(filePath)

      profileImageUrl = data.publicUrl
    }

    if (editingPlayer) {
      const { error } = await supabase
        .from('players')
        .update({
          firstName,
          lastName,
          dob,
          teamId: teamIdValue || null,
          positions,
          profileImageUrl,
          contactNumber: contactNumber || null,
          notes: notes || null,
        })
        .eq('id', editingPlayer.id)

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setPlayers(
          players.map((p) =>
            p.id === editingPlayer.id
              ? {
                  ...p,
                  firstName,
                  lastName,
                  dob,
                  teamId: teamIdValue || null,
                  positions,
                  profileImageUrl,
                  contactNumber: contactNumber || null,
                  notes: notes || null,
                }
              : p
          )
        )
        setIsDialogOpen(false)
        setEditingPlayer(null)
        setDobDate(undefined)
        setLoading(false)
        router.refresh()
      }
    } else {
      const { data, error } = await supabase
        .from('players')
        .insert({
          firstName,
          lastName,
          dob,
          teamId: teamIdValue || null,
          positions,
          profileImageUrl,
          contactNumber: contactNumber || null,
          notes: notes || null,
        })
        .select()
        .single()

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setPlayers([data, ...players])
        setIsDialogOpen(false)
        setDobDate(undefined)
        setLoading(false)
        router.refresh()
      }
    }
  }

  const openEditDialog = (player: Player) => {
    setEditingPlayer(player)
    setSelectedPositions(player.positions || [])
    setSelectedTeamId(player.teamId || '_no_team_')
    setContactNumber(player.contactNumber || '')
    setPositionsPopoverOpen(false)
    setProfileImagePreview(null)
    setDobDate(player.dob ? new Date(player.dob) : undefined)
    setFieldErrors({})
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingPlayer(null)
    setSelectedPositions([])
    setSelectedTeamId('')
    setContactNumber('')
    setPositionsPopoverOpen(false)
    setProfileImagePreview(null)
    setDobDate(undefined)
    setFieldErrors({})
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingPlayer(null)
    setSelectedPositions([])
    setSelectedTeamId('')
    setContactNumber('')
    setPositionsPopoverOpen(false)
    setProfileImagePreview(null)
    setDobDate(undefined)
    setError(null)
    setFieldErrors({})
  }

  const handleProfileImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const getProfileImageUrl = () => {
    return profileImagePreview || editingPlayer?.profileImageUrl || null
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
            </div>
            <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="relative shrink-0">
                  <Filter className="h-4 w-4" />
                  {(teamFilter.length > 0 || positionFilter.length > 0) && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {teamFilter.length + positionFilter.length}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Filter Players</DialogTitle>
                  <DialogDescription>
                    Select teams and positions to filter the player list
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Teams</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={teamFilter.includes('none')}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTeamFilter([...teamFilter, 'none'])
                              } else {
                                setTeamFilter(teamFilter.filter(t => t !== 'none'))
                              }
                            }}
                          />
                          <span className="text-sm">No Team</span>
                        </label>
                        {teams.map((team) => (
                          <label
                            key={team.id}
                            className="flex items-center space-x-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={teamFilter.includes(team.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTeamFilter([...teamFilter, team.id])
                                } else {
                                  setTeamFilter(teamFilter.filter(t => t !== team.id))
                                }
                              }}
                            />
                            <span className="text-sm">{team.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Positions</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                        {positionNames.length === 0 ? (
                          <p className="text-sm text-muted-foreground col-span-2">
                            No positions defined. Add them from the <Link href="/positions" className="underline">Positions</Link> page.
                          </p>
                        ) : (
                          positionNames.map((position) => (
                            <label
                              key={position}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={positionFilter.includes(position)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setPositionFilter([...positionFilter, position])
                                  } else {
                                    setPositionFilter(positionFilter.filter(p => p !== position))
                                  }
                                }}
                              />
                              <span className="text-sm">{position}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setTeamFilter([])
                      setPositionFilter([])
                    }}
                  >
                    Clear All
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsFilterDialogOpen(false)}
                  >
                    Apply Filters
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {canEdit && (
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) {
                  setEditingPlayer(null)
                  setSelectedPositions([])
                  setSelectedTeamId('')
                  setContactNumber('')
                  setPositionsPopoverOpen(false)
                  setProfileImagePreview(null)
                  setDobDate(undefined)
                  setError(null)
                  setFieldErrors({})
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form id="player-form" onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingPlayer ? 'Edit Player' : 'Add New Player'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingPlayer
                        ? 'Update player information below.'
                        : 'Create a new player profile.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {error && (
                      <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        {error}
                      </div>
                    )}
                    {/* Profile Photo Section - Top (optional) */}
                    <div className="flex flex-col items-center gap-4 pb-4 border-b">
                      <div className="relative group rounded-full">
                        <button
                          type="button"
                          onClick={handleProfileImageClick}
                          disabled={loading}
                          className="relative h-24 w-24 rounded-full border-2 border-border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {getProfileImageUrl() ? (
                            <Image
                              src={getProfileImageUrl()!}
                              alt={editingPlayer ? `${editingPlayer.firstName} ${editingPlayer.lastName}` : 'Player'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center">
                              <span className="text-muted-foreground text-xs">Click to add photo</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="text-white text-xs opacity-0 group-hover:opacity-100 font-medium">
                              Change Photo
                            </span>
                          </div>
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        id="profileImage"
                        name="profileImage"
                        type="file"
                        accept="image/*"
                        disabled={loading}
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          defaultValue={editingPlayer?.firstName}
                          required
                          disabled={loading}
                          aria-invalid={!!fieldErrors.firstName}
                          className={cn(fieldErrors.firstName && "border-destructive")}
                        />
                        {fieldErrors.firstName && (
                          <p className="text-sm text-destructive">{fieldErrors.firstName}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          defaultValue={editingPlayer?.lastName}
                          required
                          disabled={loading}
                          aria-invalid={!!fieldErrors.lastName}
                          className={cn(fieldErrors.lastName && "border-destructive")}
                        />
                        {fieldErrors.lastName && (
                          <p className="text-sm text-destructive">{fieldErrors.lastName}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="dob">Date of Birth <span className="text-destructive">*</span></Label>
                        <div className={cn(fieldErrors.dob && "rounded-md ring-2 ring-destructive ring-offset-2 w-fit")}>
                          <DateOfBirthPicker
                            date={dobDate}
                            onSelect={setDobDate}
                            disabled={loading}
                          />
                        </div>
                        <input
                          type="hidden"
                          name="dob"
                          value={dobDate ? dobDate.toISOString().split('T')[0] : ''}
                          required
                        />
                        {fieldErrors.dob && (
                          <p className="text-sm text-destructive">{fieldErrors.dob}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contactNumber">Contact Number <span className="text-destructive">*</span></Label>
                        <Input
                          id="contactNumber"
                          name="contactNumber"
                          type="tel"
                          inputMode="numeric"
                          placeholder="e.g., +1234567890"
                          value={contactNumber}
                          onChange={handleContactNumberChange}
                          required
                          disabled={loading}
                          aria-invalid={!!fieldErrors.contactNumber}
                          className={cn(fieldErrors.contactNumber && "border-destructive")}
                        />
                        {fieldErrors.contactNumber && (
                          <p className="text-sm text-destructive">{fieldErrors.contactNumber}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="teamId">Team <span className="text-destructive">*</span></Label>
                        <Select
                          id="teamId"
                          name="teamId"
                          value={selectedTeamId}
                          onChange={(e) => setSelectedTeamId(e.target.value)}
                          disabled={loading}
                          className={cn(fieldErrors.teamId && "border-destructive")}
                        >
                          <option value="">Select a team...</option>
                          <option value="_no_team_">No team</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </Select>
                        {fieldErrors.teamId && (
                          <p className="text-sm text-destructive">{fieldErrors.teamId}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>Positions <span className="text-destructive">*</span></Label>
                        <div className={cn(
                          "relative",
                          fieldErrors.positions && "rounded-md ring-2 ring-destructive ring-offset-2"
                        )}>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                            disabled={loading || positionNames.length === 0}
                            onClick={() => setPositionsPopoverOpen(!positionsPopoverOpen)}
                          >
                            {positionNames.length === 0
                              ? 'No positions defined'
                              : selectedPositions.length > 0
                                ? `${selectedPositions.length} position${selectedPositions.length > 1 ? 's' : ''} selected`
                                : 'Select positions...'}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                          {positionsPopoverOpen && positionNames.length > 0 && (
                            <div className="mt-2 rounded-md border bg-popover shadow-md">
                              <div className="max-h-60 overflow-y-auto overscroll-contain p-2">
                                <div className="space-y-1">
                                  {positionNames.map((position) => (
                                    <label
                                      key={position}
                                      className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-accent select-none"
                                    >
                                      <Checkbox
                                        checked={selectedPositions.includes(position)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedPositions([...selectedPositions, position])
                                          } else {
                                            setSelectedPositions(selectedPositions.filter(p => p !== position))
                                          }
                                        }}
                                        disabled={loading}
                                      />
                                      <span className="text-sm">{position}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <div className="flex justify-end border-t p-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setPositionsPopoverOpen(false)}
                                >
                                  Done
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        {positionNames.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Add positions from the <Link href="/positions" className="underline">Positions</Link> page.
                          </p>
                        )}
                        {selectedPositions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedPositions.map((position) => (
                              <Badge key={position} variant="secondary" className="text-xs">
                                {position}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {fieldErrors.positions && (
                          <p className="text-sm text-destructive mt-1">{fieldErrors.positions}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          placeholder="Add any additional notes about the player..."
                          defaultValue={editingPlayer?.notes || ''}
                          disabled={loading}
                          rows={4}
                        />
                      </div>
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
                        : editingPlayer
                        ? 'Update Player'
                        : 'Create Player'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {filteredPlayers.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            {searchQuery || teamFilter.length > 0 || positionFilter.length > 0
              ? 'No players found matching your filters.'
              : 'No players yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Positions</TableHead>
                <TableHead>Team</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((player) => {
                const age = differenceInYears(new Date(), new Date(player.dob))
                return (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/players/${player.id}`}
                        className="hover:underline"
                      >
                        {player.firstName} {player.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{age}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {player.positions && player.positions.length > 0 ? (
                          player.positions.slice(0, 2).map((position) => (
                            <Badge key={position} variant="secondary" className="text-xs">
                              {position}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                        {player.positions && player.positions.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{player.positions.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {player.teams?.name || (
                        <span className="text-muted-foreground">No team</span>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(player)}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(player.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
