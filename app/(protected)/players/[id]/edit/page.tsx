import { notFound } from 'next/navigation'
import { requireAdminCoachOrStaff, getUserAssignedTeamIds } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PlayerFormPage } from '@/components/players/PlayerFormPage'
import type { Database } from '@/types/database'
import type { LiteracySession, PlayerNote } from '@/types/player'

type TeamRow = Database['public']['Tables']['teams']['Row']
type PositionRow = Database['public']['Tables']['positions']['Row']
type PlayerRow = Database['public']['Tables']['players']['Row']
type LiteracySessionRow = Database['public']['Tables']['literacy_sessions']['Row']
type HouseRow = Database['public']['Tables']['houses']['Row']

export default async function EditPlayerPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const user = await requireAdminCoachOrStaff()

  const supabase = createClient()

  const [{ data: playerData }, { data: allTeams }, { data: positions }, { data: playerTeamData }, { data: sessionsData }, { data: notesData }, { data: houses }] =
    await Promise.all([
      supabase.from('players').select('*').eq('id', params.id).single(),
      supabase
        .from('teams')
        .select('id, name')
        .order('name')
        .returns<Pick<TeamRow, 'id' | 'name'>[]>(),
      supabase
        .from('positions')
        .select('id, name')
        .order('sortOrder', { ascending: true })
        .returns<Pick<PositionRow, 'id' | 'name'>[]>(),
      supabase
        .from('player_teams')
        .select('teamId')
        .eq('playerId', params.id) as any,
      supabase
        .from('literacy_sessions')
        .select('*')
        .eq('playerId', params.id)
        .order('date', { ascending: true })
        .order('createdAt', { ascending: true })
        .returns<LiteracySessionRow[]>(),
      (supabase as any)
        .from('player_notes')
        .select('*')
        .eq('playerId', params.id)
        .order('date', { ascending: false })
        .order('createdAt', { ascending: false }),
      supabase
        .from('houses')
        .select('id, name')
        .order('name')
        .returns<Pick<HouseRow, 'id' | 'name'>[]>(),
    ])

  const player = playerData as PlayerRow | null

  if (!player) {
    notFound()
  }

  const initialTeamIds = (playerTeamData as { teamId: string }[] | null)?.map((pt) => pt.teamId) ?? []

  let teams: Pick<TeamRow, 'id' | 'name'>[] = allTeams || []
  if (user.role !== 'admin') {
    const assignedTeamIds = await getUserAssignedTeamIds(user.id)
    const hasAccess = initialTeamIds.some((tid) => assignedTeamIds.includes(tid))
    if (!hasAccess) {
      notFound()
    }
    teams = (allTeams || []).filter((t) => assignedTeamIds.includes(t.id))
  }
  const initialTab = typeof searchParams.tab === 'string' ? searchParams.tab : 'profile'

  const rawSessions = sessionsData || []
  const literacySessions: LiteracySession[] = rawSessions.map((s, i) => ({
    id: s.id,
    playerId: s.playerId,
    sessionNumber: i + 1,
    date: s.date,
    phonics: s.phonics,
    sightwords: s.sightwords,
    readers: s.readers,
    notes: s.notes,
    loggedByUserId: s.loggedByUserId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }))

  const playerNotes: PlayerNote[] = (notesData || []).map((n: any) => ({
    id: n.id,
    playerId: n.playerId,
    date: n.date,
    notes: n.notes,
    loggedByUserId: n.loggedByUserId,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  }))

  return (
    <PlayerFormPage
      mode="edit"
      player={player}
      teams={teams}
      positions={positions || []}
      houses={houses || []}
      initialTeamIds={initialTeamIds}
      initialTab={initialTab}
      literacySessions={literacySessions}
      playerNotes={playerNotes}
    />
  )
}
