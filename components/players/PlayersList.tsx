'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Search, Filter } from 'lucide-react'
import { differenceInYears } from 'date-fns'
import type { Database } from '@/types/database'

type PlayerTeamEntry = { teamId: string; teams: { id: string; name: string } | null }
type Player = Database['public']['Tables']['players']['Row'] & { player_teams?: PlayerTeamEntry[] }

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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialSearchQuery = searchParams.get('q') || ''
  const initialTeamFilter = searchParams.get('team')?.split(',').filter(Boolean) || []
  const initialPositionFilter = searchParams.get('position')?.split(',').filter(Boolean) || []

  const [players] = useState<Player[]>(initialPlayers)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [teamFilter, setTeamFilter] = useState<string[]>(initialTeamFilter)
  const [positionFilter, setPositionFilter] = useState<string[]>(initialPositionFilter)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)

  const positionNames = useMemo(() => positions.map((p) => p.name), [positions])

  useEffect(() => {
    const params = new URLSearchParams()

    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim())
    }

    if (teamFilter.length > 0) {
      params.set('team', teamFilter.join(','))
    }

    if (positionFilter.length > 0) {
      params.set('position', positionFilter.join(','))
    }

    const query = params.toString()
    const href = query ? `${pathname}?${query}` : pathname
    router.replace(href, { scroll: false })
  }, [searchQuery, teamFilter, positionFilter, pathname, router])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim())
    }
    if (teamFilter.length > 0) {
      params.set('team', teamFilter.join(','))
    }
    if (positionFilter.length > 0) {
      params.set('position', positionFilter.join(','))
    }
    return params.toString()
  }, [searchQuery, teamFilter, positionFilter])

  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      searchQuery === '' ||
      `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())

    const playerTeamIds = player.player_teams?.map((pt) => pt.teamId) ?? []
    const matchesTeam =
      teamFilter.length === 0 ||
      (teamFilter.includes('none') && playerTeamIds.length === 0) ||
      playerTeamIds.some((id) => teamFilter.includes(id))

    const matchesPosition =
      positionFilter.length === 0 ||
      (player.positions && player.positions.some((pos) => positionFilter.includes(pos)))

    return matchesSearch && matchesTeam && matchesPosition
  })

  const detailHref = (playerId: string) => {
    return queryString ? `/players/${playerId}?${queryString}` : `/players/${playerId}`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
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
                <DialogDescription>Select teams and positions to filter the player list</DialogDescription>
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
                              setTeamFilter(teamFilter.filter((t) => t !== 'none'))
                            }
                          }}
                        />
                        <span className="text-sm">No Team</span>
                      </label>
                      {teams.map((team) => (
                        <label key={team.id} className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={teamFilter.includes(team.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTeamFilter([...teamFilter, team.id])
                              } else {
                                setTeamFilter(teamFilter.filter((t) => t !== team.id))
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
                          No positions defined. Add them from the{' '}
                          <Link href="/positions" className="underline">
                            Positions
                          </Link>{' '}
                          page.
                        </p>
                      ) : (
                        positionNames.map((position) => (
                          <label key={position} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={positionFilter.includes(position)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setPositionFilter([...positionFilter, position])
                                } else {
                                  setPositionFilter(positionFilter.filter((p) => p !== position))
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
                <Button type="button" onClick={() => setIsFilterDialogOpen(false)}>
                  Apply Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {canEdit && (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/players/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Player
            </Link>
          </Button>
        )}
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
        <>
          <div className="space-y-3 md:hidden">
            {filteredPlayers.map((player) => {
              const age = differenceInYears(new Date(), new Date(player.dob))
              return (
                <div
                  key={player.id}
                  className="rounded-md border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(detailHref(player.id))}
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{player.firstName} {player.lastName}</p>
                    <p className="text-sm text-muted-foreground">Age {age}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {player.positions && player.positions.length > 0 ? (
                      player.positions.slice(0, 3).map((position) => (
                        <Badge key={position} variant="secondary" className="text-xs">
                          {position}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">No positions</span>
                    )}
                    {player.positions && player.positions.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{player.positions.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground truncate">
                    {player.player_teams && player.player_teams.length > 0
                      ? player.player_teams.map((pt) => pt.teams?.name).filter(Boolean).join(', ')
                      : 'No team'}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Positions</TableHead>
                  <TableHead>Teams</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.map((player) => {
                  const age = differenceInYears(new Date(), new Date(player.dob))
                  return (
                    <TableRow
                      key={player.id}
                      className="cursor-pointer"
                      onClick={() => router.push(detailHref(player.id))}
                    >
                      <TableCell className="font-medium">
                        {player.firstName} {player.lastName}
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
                        {player.player_teams && player.player_teams.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {player.player_teams.map((pt) =>
                              pt.teams ? (
                                <Badge key={pt.teamId} variant="outline" className="text-xs">
                                  {pt.teams.name}
                                </Badge>
                              ) : null
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No team</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
