import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronLeft } from 'lucide-react'
import type { Database } from '@/types/database'

type TeamRow = Database['public']['Tables']['teams']['Row']
type UserRow = Database['public']['Tables']['users']['Row']
type PlayerRow = Database['public']['Tables']['players']['Row']

export default async function TeamDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()
  const { data: teamData } = await supabase
    .from('teams')
    .select('*')
    .returns<TeamRow[]>()
    .eq('id', params.id)
    .single()
  
  // Get related users
  const userIds = [
    teamData?.mainCoachId,
    ...(teamData?.coachIds || []),
    ...(teamData?.volunteerIds || [])
  ].filter(Boolean) as string[]
  
  const { data: relatedUsers } = userIds.length > 0
    ? await supabase
        .from('users')
        .select('id, name, email, role')
        .in('id', userIds)
        .returns<Pick<UserRow, 'id' | 'name' | 'email' | 'role'>[]>()
    : { data: [] }
  
  const team = teamData ? {
    ...teamData,
    mainCoach: relatedUsers?.find(u => u.id === teamData.mainCoachId) || null,
    coaches: relatedUsers?.filter(u => teamData.coachIds?.includes(u.id)) || [],
    volunteers: relatedUsers?.filter(u => teamData.volunteerIds?.includes(u.id)) || []
  } : null

  if (!team) {
    notFound()
  }

  const { data: players } = await supabase
    .from('players')
    .select('id, firstName, lastName, positions')
    .returns<Pick<PlayerRow, 'id' | 'firstName' | 'lastName' | 'positions'>[]>()
    .eq('teamId', params.id)
    .order('firstName')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link href="/teams" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            Back to Teams
          </Link>
        </Button>
        <div className="text-left sm:text-right">
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-muted-foreground">Team Details</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Main Coach</p>
              <p className="text-lg">
                {team.mainCoach?.name || 'Not assigned'}
              </p>
              {team.mainCoach?.email && (
                <p className="text-sm text-muted-foreground">
                  {team.mainCoach.email}
                </p>
              )}
            </div>
            {team.coaches && team.coaches.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Additional Coaches
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {team.coaches.map((coach) => (
                    <Badge key={coach.id} variant="secondary">
                      {coach.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {team.volunteers && team.volunteers.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Volunteers
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {team.volunteers.map((volunteer) => (
                    <Badge key={volunteer.id} variant="outline">
                      {volunteer.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {team.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="text-lg whitespace-pre-wrap">{team.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Players ({players?.length || 0})</CardTitle>
            <CardDescription>Players assigned to this team</CardDescription>
          </CardHeader>
          <CardContent>
            {players && players.length > 0 ? (
              <>
                <div className="space-y-3 md:hidden">
                  {players.map((player) => (
                    <div key={player.id} className="rounded-md border p-3">
                      <Link
                        href={`/players/${player.id}`}
                        className="font-semibold hover:underline"
                      >
                        {player.firstName} {player.lastName}
                      </Link>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {player.positions && player.positions.length > 0 ? (
                          player.positions.slice(0, 2).map((position) => (
                            <Badge key={position} variant="secondary" className="text-xs">
                              {position}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Positions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {players.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/players/${player.id}`}
                              className="hover:underline"
                            >
                              {player.firstName} {player.lastName}
                            </Link>
                          </TableCell>
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
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No players assigned to this team.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
