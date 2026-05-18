'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, EyeOff, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SelectRoot, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface TechnicalPlayer {
  id: string
  dob: string
  technicalSprint: number | null
  technicalDribbling: number | null
  technicalJuggling: number | null
  technicalYoyo: number | null
}

export interface PlayerTeamLink {
  playerId: string
  teamId: string
}

export interface IndexTeam {
  id: string
  name: string
  category: string | null
}

interface PlayersIndexTabProps {
  players: TechnicalPlayer[]
  playerTeamLinks: PlayerTeamLink[]
  teams: IndexTeam[]
}

function calcAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000))
}

const RATING_LABELS = ['Low', 'Average', 'Moderately Good', 'Good', 'Excellent'] as const
const RATING_COLORS = [
  'bg-red-100 text-red-800',
  'bg-orange-100 text-orange-800',
  'bg-yellow-100 text-yellow-800',
  'bg-green-100 text-green-800',
  'bg-emerald-100 text-emerald-800',
] as const

type AgeGroupDef = { label: string; min: number; max: number }

const JUGGLING_GROUPS: AgeGroupDef[] = [
  { label: '5–6', min: 5, max: 6 },
  { label: '7–8', min: 7, max: 8 },
  { label: '9–10', min: 9, max: 10 },
  { label: '11–12', min: 11, max: 12 },
  { label: '13–14', min: 13, max: 14 },
  { label: '15+', min: 15, max: 99 },
]

const SPRINT_GROUPS: AgeGroupDef[] = [
  { label: '6', min: 6, max: 6 },
  { label: '7', min: 7, max: 7 },
  { label: '8', min: 8, max: 8 },
  { label: '9', min: 9, max: 9 },
  { label: '10', min: 10, max: 10 },
  { label: '11', min: 11, max: 11 },
  { label: '12', min: 12, max: 12 },
  { label: '13', min: 13, max: 13 },
  { label: '14', min: 14, max: 14 },
  { label: '15+', min: 15, max: 99 },
]

const YOYO_GROUPS: AgeGroupDef[] = [
  { label: '12', min: 12, max: 12 },
  { label: '13', min: 13, max: 13 },
  { label: '14', min: 14, max: 14 },
  { label: '15+', min: 15, max: 99 },
]

interface IndexTableProps {
  title: string
  subtitle: string
  ageGroups: AgeGroupDef[]
  minAge: number
  players: TechnicalPlayer[]
  metric: 'technicalJuggling' | 'technicalSprint' | 'technicalYoyo'
  hideNoData: boolean
}

function IndexTable({ title, subtitle, ageGroups, minAge, players, metric, hideNoData }: IndexTableProps) {
  const [collapsed, setCollapsed] = useState(false)

  const rows = useMemo(() => {
    return ageGroups.map((group) => {
      const inGroup = players.filter((p) => {
        const age = calcAge(p.dob)
        return age >= group.min && age <= group.max
      })
      const counts = [0, 0, 0, 0, 0]
      let noData = 0
      for (const p of inGroup) {
        const score = p[metric]
        if (score == null || score < 1 || score > 5) {
          noData++
        } else {
          counts[score - 1]++
        }
      }
      const ratedTotal = counts.reduce((a, b) => a + b, 0)
      return { label: group.label, counts, noData, total: hideNoData ? ratedTotal : inGroup.length }
    })
  }, [ageGroups, players, metric, hideNoData])

  const totals = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]
    let noData = 0
    let total = 0
    for (const row of rows) {
      row.counts.forEach((c, i) => { counts[i] += c })
      noData += row.noData
      total += row.total
    }
    return { counts, noData, total }
  }, [rows])

  const eligiblePlayers = players.filter((p) => calcAge(p.dob) >= minAge)
  const hasAnyData = eligiblePlayers.length > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-start gap-2 text-left"
        >
          <span className="mt-0.5 shrink-0 text-muted-foreground">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </button>
      </CardHeader>
      {!collapsed && (
        <CardContent>
          {!hasAnyData ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No players in the applicable age range.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap border-b">Age</th>
                    {RATING_LABELS.map((label, i) => (
                      <th key={i} className="px-3 py-2 text-center font-medium text-muted-foreground whitespace-nowrap border-b">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${RATING_COLORS[i]}`}>
                          {i + 1}
                        </span>
                        <span className="ml-1">{label}</span>
                      </th>
                    ))}
                    {!hideNoData && (
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground whitespace-nowrap border-b">No Data</th>
                    )}
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground whitespace-nowrap border-b">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{row.label}</td>
                      {row.counts.map((count, j) => (
                        <td key={j} className="px-3 py-2 text-center whitespace-nowrap">
                          {count > 0 ? (
                            <span className={`inline-block min-w-[28px] px-2 py-0.5 rounded font-semibold ${RATING_COLORS[j]}`}>
                              {count}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                      ))}
                      {!hideNoData && (
                        <td className="px-3 py-2 text-center whitespace-nowrap text-muted-foreground">
                          {row.noData > 0 ? row.noData : <span className="text-muted-foreground/40">—</span>}
                        </td>
                      )}
                      <td className="px-3 py-2 text-center whitespace-nowrap font-medium text-muted-foreground">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/50 font-semibold">
                    <td className="px-3 py-2 whitespace-nowrap">Total</td>
                    {totals.counts.map((count, j) => (
                      <td key={j} className="px-3 py-2 text-center whitespace-nowrap">
                        {count > 0 ? (
                          <span className={`inline-block min-w-[28px] px-2 py-0.5 rounded font-semibold ${RATING_COLORS[j]}`}>
                            {count}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    ))}
                    {!hideNoData && (
                      <td className="px-3 py-2 text-center whitespace-nowrap text-muted-foreground">{totals.noData || '—'}</td>
                    )}
                    <td className="px-3 py-2 text-center whitespace-nowrap">{totals.total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export function PlayersIndexTab({ players, playerTeamLinks, teams }: PlayersIndexTabProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [hideNoData, setHideNoData] = useState(false)

  const categories = useMemo(() => {
    const cats = new Set<string>()
    for (const t of teams) {
      if (t.category) cats.add(t.category)
    }
    return Array.from(cats).sort()
  }, [teams])

  const filteredTeams = useMemo(() => {
    if (selectedCategory === 'all') return teams
    return teams.filter((t) => t.category === selectedCategory)
  }, [teams, selectedCategory])

  const filteredPlayers = useMemo(() => {
    if (selectedCategory === 'all' && selectedTeam === 'all') return players

    const relevantTeamIds = selectedTeam !== 'all'
      ? new Set([selectedTeam])
      : new Set(filteredTeams.map((t) => t.id))

    const playerIds = new Set(
      playerTeamLinks
        .filter((link) => relevantTeamIds.has(link.teamId))
        .map((link) => link.playerId)
    )
    return players.filter((p) => playerIds.has(p.id))
  }, [players, playerTeamLinks, selectedCategory, selectedTeam, filteredTeams])

  function handleCategoryChange(value: string) {
    setSelectedCategory(value)
    setSelectedTeam('all')
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Category</span>
          <SelectRoot value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Team</span>
          <SelectRoot value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="h-8 w-48 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {filteredTeams.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHideNoData((v) => !v)}
            className="h-8 gap-1.5 text-xs"
          >
            {hideNoData ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {hideNoData ? 'Show No Data' : 'Exclude No Data'}
          </Button>
          <span className="text-xs text-muted-foreground">
            {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Rating Scale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {RATING_LABELS.map((label, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium ${RATING_COLORS[i]}`}
              >
                <span className="font-bold">{i + 1}</span>
                <span>{label}</span>
              </span>
            ))}
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-muted text-muted-foreground">
              No Data
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Each cell shows the number of current players in that age group and performance band. Ratings 1–5 are assigned by coaches and mapped against the normative benchmarks below each table title. Players with no recorded score appear in the No Data column.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>Juggling: ages 5–15+</span>
            <span>30m Sprint: ages 6–15+</span>
            <span>Yo-Yo: ages 12–15+</span>
          </div>
        </CardContent>
      </Card>

      {/* Tables */}
      <IndexTable
        title="Football Juggling Normative Data (Ages 5–15)"
        subtitle="Score = Max consecutive juggles · Rating scale: 1 (Low) to 5 (Excellent)"
        ageGroups={JUGGLING_GROUPS}
        minAge={5}
        players={filteredPlayers}
        metric="technicalJuggling"
        hideNoData={hideNoData}
      />
      <IndexTable
        title="30m Sprint Normative Data (Ages 6–15)"
        subtitle="Score = Time in seconds (lower is better) · Rating scale: 1 (Low) to 5 (Excellent)"
        ageGroups={SPRINT_GROUPS}
        minAge={6}
        players={filteredPlayers}
        metric="technicalSprint"
        hideNoData={hideNoData}
      />
      <IndexTable
        title="Yo-Yo Test Normative Data (Ages 12–15)"
        subtitle="Score = Level.Shuttle (YYIR1 equivalent) · Rating scale: 1 (Low) to 5 (Excellent)"
        ageGroups={YOYO_GROUPS}
        minAge={12}
        players={filteredPlayers}
        metric="technicalYoyo"
        hideNoData={hideNoData}
      />
    </div>
  )
}
