import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { differenceInYears } from 'date-fns'
import Image from 'next/image'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PlayerWithTeam = PlayerRow & { teams: { name: string } | null }

export default async function PlayerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()
  const { data: player } = await supabase
    .from('players')
    .select('*, teams(name)')
    .returns<PlayerWithTeam[]>()
    .eq('id', params.id)
    .single()

  if (!player) {
    notFound()
  }

  const age = differenceInYears(new Date(), new Date(player.dob))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {player.firstName} {player.lastName}
        </h1>
        <p className="text-muted-foreground">Player Profile</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {player.profileImageUrl && (
              <div className="relative w-full max-w-xs aspect-square overflow-hidden rounded-lg border mx-auto sm:mx-0">
                <Image
                  src={player.profileImageUrl}
                  alt={`${player.firstName} ${player.lastName}`}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg">
                {player.firstName} {player.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
              <p className="text-lg">
                {new Date(player.dob).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Age</p>
              <p className="text-lg">{age} years old</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Positions</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {player.positions && player.positions.length > 0 ? (
                  player.positions.map((position) => (
                    <Badge key={position} variant="secondary">
                      {position}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">No positions set</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Team</p>
              <p className="text-lg">
                {player.teams?.name || 'No team assigned'}
              </p>
            </div>
            {player.contactNumber && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                <p className="text-lg">{player.contactNumber}</p>
              </div>
            )}
            {player.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="text-lg whitespace-pre-wrap">{player.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
