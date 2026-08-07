'use client'

import { useEffect, useMemo, useState } from 'react'
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Plus, Search, ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import { differenceInYears } from 'date-fns'
import Link from 'next/link'
import type { Database } from '@/types/database'
import { exportPlayersPdf } from '@/lib/exportPlayersPdf'

type PlayerTeamEntry = { teamId: string; teams: { id: string; name: string } | null }
type Player = Database['public']['Tables']['players']['Row'] & { player_teams?: PlayerTeamEntry[] }

interface Team {
  id: string
  name: string
  category: 'Schools' | 'Academy' | null
}

interface PlayersListProps {
  initialPlayers: Player[]
  teams: Team[]
  canEdit: boolean
}

const CATEGORIES = ['Schools', 'Academy'] as const

export function PlayersList({ initialPlayers, teams, canEdit }: PlayersListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialSearchQuery = searchParams.get('q') || ''
  const initialTeamFilter = searchParams.get('team')?.split(',').filter(Boolean) || []
  const initialCategoryFilter = searchParams.get('category') || null
  const initialPage = parseInt(searchParams.get('page') || '1', 10)

  const PAGE_SIZE = 20

  const [players] = useState<Player[]>(initialPlayers)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [teamFilter, setTeamFilter] = useState<string[]>(initialTeamFilter)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(initialCategoryFilter)
  const [currentPage, setCurrentPage] = useState(initialPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, teamFilter, categoryFilter])

  useEffect(() => {
    const params = new URLSearchParams()

    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (teamFilter.length > 0) params.set('team', teamFilter.join(','))
    if (categoryFilter) params.set('category', categoryFilter)
    if (currentPage > 1) params.set('page', String(currentPage))

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [searchQuery, teamFilter, categoryFilter, currentPage, pathname, router])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (teamFilter.length > 0) params.set('team', teamFilter.join(','))
    if (categoryFilter) params.set('category', categoryFilter)
    return params.toString()
  }, [searchQuery, teamFilter, categoryFilter])

  const filteredPlayers = useMemo(() => players.filter((player) => {
    const matchesSearch =
      searchQuery === '' ||
      `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())

    const playerTeamIds = player.player_teams?.map((pt) => pt.teamId) ?? []
    const matchesTeam =
      teamFilter.length === 0 ||
      (teamFilter.includes('none') && playerTeamIds.length === 0) ||
      playerTeamIds.some((id) => teamFilter.includes(id))

    const matchesCategory =
      categoryFilter === null ||
      player.player_teams?.some((pt) => {
        const team = teams.find((t) => t.id === pt.teamId)
        return team?.category === categoryFilter
      })

    return matchesSearch && matchesTeam && matchesCategory
  }), [players, searchQuery, teamFilter, categoryFilter, teams])

  // Counts per team membership — a player on 2 teams increments both teams' counts.
  const teamCounts = useMemo(() => {
    const counts = new Map<string, number>()
    teams.forEach((t) => counts.set(t.id, 0))
    let noTeam = 0
    filteredPlayers.forEach((player) => {
      const pts = player.player_teams ?? []
      if (pts.length === 0) {
        noTeam += 1
      } else {
        pts.forEach((pt) => {
          counts.set(pt.teamId, (counts.get(pt.teamId) ?? 0) + 1)
        })
      }
    })
    return { counts, noTeam }
  }, [filteredPlayers, teams])

  // Counts per category, deduped per player — a player with two "Schools" teams counts once.
  const categoryCounts = useMemo(() => {
    const counts: { Schools: number; Academy: number } = { Schools: 0, Academy: 0 }
    filteredPlayers.forEach((player) => {
      const cats = new Set(
        (player.player_teams ?? [])
          .map((pt) => teams.find((t) => t.id === pt.teamId)?.category)
          .filter((c): c is 'Schools' | 'Academy' => c === 'Schools' || c === 'Academy')
      )
      cats.forEach((c) => { counts[c] += 1 })
    })
    return counts
  }, [filteredPlayers, teams])

  const handleExportPdf = () => {
    const rows = filteredPlayers.flatMap((player) => {
      const age = differenceInYears(new Date(), new Date(player.dob))
      const name = `${player.firstName} ${player.lastName}`
      const pts = player.player_teams ?? []
      if (pts.length === 0) {
        return [{ name, age, category: 'No Team' as const, team: 'No Team' }]
      }
      return pts.map((pt) => {
        const team = teams.find((t) => t.id === pt.teamId)
        return {
          name,
          age,
          category: (team?.category ?? 'No Team') as 'Schools' | 'Academy' | 'No Team',
          team: pt.teams?.name ?? 'Unknown Team',
        }
      })
    }).sort((a, b) => a.team.localeCompare(b.team) || a.name.localeCompare(b.name))

    exportPlayersPdf(rows, {
      teamCounts: teams.map((t) => ({ name: t.name, count: teamCounts.counts.get(t.id) ?? 0 })),
      noTeamCount: teamCounts.noTeam,
      categoryCounts,
    })
  }

  const totalPages = Math.ceil(filteredPlayers.length / PAGE_SIZE)
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1))
  const paginatedPlayers = filteredPlayers.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  )

  const detailHref = (playerId: string) =>
    queryString ? `/players/${playerId}?${queryString}` : `/players/${playerId}`

  const toggleTeam = (id: string) =>
    setTeamFilter((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )

  const toggleCategory = (cat: string) =>
    setCategoryFilter((prev) => (prev === cat ? null : cat))

  return (
    <div className="space-y-4">
      {/* Search + Add Player */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={handleExportPdf}
            disabled={filteredPlayers.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          {canEdit && (
            <Button asChild className="flex-1 sm:flex-none">
              <Link href="/players/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Player
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground shrink-0">Category:</span>
        <Button
          variant={categoryFilter === null ? 'default' : 'outline'}
          size="sm"
          className="rounded-full h-7 px-3 text-xs"
          onClick={() => setCategoryFilter(null)}
        >
          All
        </Button>
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={categoryFilter === cat ? 'default' : 'outline'}
            size="sm"
            className="rounded-full h-7 px-3 text-xs"
            onClick={() => toggleCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Teams filter — horizontal scroll on mobile */}
      {teams.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <span className="text-sm text-muted-foreground shrink-0">Team:</span>
          <Button
            variant={teamFilter.includes('none') ? 'default' : 'outline'}
            size="sm"
            className="rounded-full h-7 px-3 text-xs shrink-0"
            onClick={() => toggleTeam('none')}
          >
            No Team
          </Button>
          {teams.map((team) => (
            <Button
              key={team.id}
              variant={teamFilter.includes(team.id) ? 'default' : 'outline'}
              size="sm"
              className="rounded-full h-7 px-3 text-xs shrink-0"
              onClick={() => toggleTeam(team.id)}
            >
              {team.name}
            </Button>
          ))}
        </div>
      )}

      {/* Summary: counts per team/category */}
      {filteredPlayers.length > 0 && (
        <Accordion type="single" collapsible className="rounded-md border bg-muted px-3">
          <AccordionItem value="summary" className="border-b-0">
            <AccordionTrigger className="text-sm">
              Player Summary ({filteredPlayers.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team / Category</TableHead>
                      <TableHead className="text-right">Players</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell>{team.name}</TableCell>
                        <TableCell className="text-right">{teamCounts.counts.get(team.id) ?? 0}</TableCell>
                      </TableRow>
                    ))}
                    {teamCounts.noTeam > 0 && (
                      <TableRow>
                        <TableCell>No Team</TableCell>
                        <TableCell className="text-right">{teamCounts.noTeam}</TableCell>
                      </TableRow>
                    )}
                    <TableRow className="border-t-2">
                      <TableCell className="font-medium">Schools</TableCell>
                      <TableCell className="text-right font-medium">{categoryCounts.Schools}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Academy</TableCell>
                      <TableCell className="text-right font-medium">{categoryCounts.Academy}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Results */}
      {filteredPlayers.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            {searchQuery || teamFilter.length > 0 || categoryFilter
              ? 'No players found matching your filters.'
              : 'No players yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {paginatedPlayers.map((player) => {
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
                  <div className="mt-2 text-sm text-muted-foreground truncate">
                    {player.player_teams && player.player_teams.length > 0
                      ? player.player_teams.map((pt) => pt.teams?.name).filter(Boolean).join(', ')
                      : 'No team'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Teams</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPlayers.map((player) => {
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {(safeCurrentPage - 1) * PAGE_SIZE + 1}–{Math.min(safeCurrentPage * PAGE_SIZE, filteredPlayers.length)} of {filteredPlayers.length} players
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={safeCurrentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm">
              {safeCurrentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={safeCurrentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
