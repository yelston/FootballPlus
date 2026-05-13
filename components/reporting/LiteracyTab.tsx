'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'

type PlayerLiteracyRow = Pick<
  Database['public']['Tables']['players']['Row'],
  | 'id'
  | 'firstName'
  | 'lastName'
  | 'preferredName'
  | 'literacyEnrolled'
  | 'literacyReadingBaseline'
  | 'literacyReadingCurrent'
  | 'literacyReadingImprovement'
  | 'literacySessionsAttended'
>

type LiteracySessionRow = Database['public']['Tables']['literacy_sessions']['Row']

interface Props {
  players: PlayerLiteracyRow[]
  sessions: LiteracySessionRow[]
}

function displayScore(val: number | null) {
  return val != null ? `${val}/5` : '—'
}

function ImprovementCell({ val }: { val: number | null }) {
  if (val == null) return <span className="text-muted-foreground">—</span>
  if (val > 0) return <span className="font-medium text-green-600">+{val}</span>
  if (val < 0) return <span className="font-medium text-destructive">{val}</span>
  return <span className="text-muted-foreground">0</span>
}

export function LiteracyTab({ players, sessions }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const sessionsByPlayer = sessions.reduce<Record<string, LiteracySessionRow[]>>((acc, s) => {
    if (!acc[s.playerId]) acc[s.playerId] = []
    acc[s.playerId].push(s)
    return acc
  }, {})

  const enrolledPlayers = players.filter((p) => p.literacyEnrolled)
  const enrolledCount = enrolledPlayers.length
  // Only count sessions belonging to enrolled players
  const totalSessions = enrolledPlayers.reduce(
    (sum, p) => sum + (sessionsByPlayer[p.id]?.length ?? 0),
    0,
  )
  const improvements = enrolledPlayers
    .map((p) => p.literacyReadingImprovement)
    .filter((v): v is number => v != null)
  const avgImprovement =
    improvements.length > 0
      ? (improvements.reduce((a, b) => a + b, 0) / improvements.length).toFixed(1)
      : null

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Enrolled Players</p>
          <p className="mt-1 text-2xl font-bold">{enrolledCount}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Sessions Logged</p>
          <p className="mt-1 text-2xl font-bold">{totalSessions}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Avg Reading Improvement</p>
          <p className="mt-1 text-2xl font-bold">
            {avgImprovement != null ? `+${avgImprovement}` : '—'}
          </p>
        </div>
      </div>

      {/* Player table */}
      <div className="rounded-md border">
        {/* Header */}
        <div className="hidden grid-cols-[1.5rem_1fr_5rem_5rem_5rem] gap-3 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground lg:grid">
          <span />
          <span>Player</span>
          <span>Current</span>
          <span>Improvement</span>
          <span>Sessions</span>
        </div>

        {enrolledPlayers.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No enrolled players found.</p>
        )}

        {enrolledPlayers.map((player) => {
          const playerSessions = sessionsByPlayer[player.id] ?? []
          const isOpen = expanded.has(player.id)
          const displayName = player.preferredName ?? player.firstName

          return (
            <div key={player.id} className="divide-y">
              {/* Player row */}
              <button
                onClick={() => toggle(player.id)}
                className="w-full text-left"
              >
                <div className="grid grid-cols-[1.5rem_1fr] gap-3 px-3 py-2.5 hover:bg-muted/30 lg:grid-cols-[1.5rem_1fr_5rem_5rem_5rem]">
                  <span className="flex items-center text-muted-foreground">
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </span>

                  <span className="flex items-center font-medium text-sm">
                    {displayName} {player.lastName}
                  </span>

                  <span className="hidden items-center text-sm lg:flex">
                    {displayScore(player.literacyReadingCurrent)}
                  </span>
                  <span className="hidden items-center text-sm lg:flex">
                    <ImprovementCell val={player.literacyReadingImprovement} />
                  </span>
                  <span className="hidden items-center text-sm lg:flex">
                    {playerSessions.length}
                  </span>
                </div>

                {/* Mobile summary line */}
                <div className="flex flex-wrap gap-2 px-7 pb-2 text-xs text-muted-foreground lg:hidden">
                  <span>Current: {displayScore(player.literacyReadingCurrent)}</span>
                  <span>Sessions: {playerSessions.length}</span>
                </div>
              </button>

              {/* Expanded session logs */}
              {isOpen && (
                <div className="bg-muted/20 px-6 pb-3 pt-2 space-y-2">
                  {playerSessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No sessions logged.</p>
                  ) : (
                    <div className="rounded-md border bg-background">
                      <div className="grid grid-cols-[2.5rem_5rem_1fr_1fr_1fr] gap-2 border-b px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        <span>#</span>
                        <span>Date</span>
                        <span>Phonics</span>
                        <span>Sight Words</span>
                        <span>Readers</span>
                      </div>
                      {playerSessions.map((s, idx) => (
                        <div
                          key={s.id}
                          className="grid grid-cols-[2.5rem_5rem_1fr_1fr_1fr] gap-2 border-b px-3 py-1.5 text-xs last:border-0"
                        >
                          <span className="font-semibold text-primary">{idx + 1}</span>
                          <span className="text-muted-foreground">
                            {format(parseISO(s.date), 'dd MMM yy')}
                          </span>
                          <span className="truncate">{s.phonics || <em className="text-muted-foreground">—</em>}</span>
                          <span className="truncate">{s.sightwords || <em className="text-muted-foreground">—</em>}</span>
                          <span className="truncate">{s.readers || <em className="text-muted-foreground">—</em>}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button asChild size="sm" variant="ghost" className="h-7 px-2">
                      <Link href={`/players/${player.id}?tab=literacy`}>
                        <ExternalLink className="mr-1 h-3 w-3" />
                        View Player
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
