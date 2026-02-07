import Image from 'next/image'
import { differenceInYears, format, subDays } from 'date-fns'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayerBackButton } from '@/components/players/PlayerBackButton'
import { PlayerDetailActions } from '@/components/players/PlayerDetailActions'
import type { PlayerDetailViewModel } from '@/types/player'
import type { Database } from '@/types/database'

type AttendanceRow = {
  date: string
  points: number
}
type PlayerRow = Database['public']['Tables']['players']['Row']

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

function toDisplayDate(date: string | null) {
  if (!date) {
    return 'N/A'
  }
  return format(new Date(date), 'dd MMM yyyy')
}

export default async function PlayerDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const canEdit = user.role === 'admin' || user.role === 'coach'
  const canViewSensitive = canEdit

  const q = typeof searchParams.q === 'string' ? searchParams.q : ''
  const team = typeof searchParams.team === 'string' ? searchParams.team : ''
  const position = typeof searchParams.position === 'string' ? searchParams.position : ''

  const fallbackQuery = new URLSearchParams()
  if (q) {
    fallbackQuery.set('q', q)
  }
  if (team) {
    fallbackQuery.set('team', team)
  }
  if (position) {
    fallbackQuery.set('position', position)
  }
  const fallbackHref = fallbackQuery.toString() ? `/players?${fallbackQuery.toString()}` : '/players'

  const supabase = createClient()
  const last30Date = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const [{ data: playerData }, { data: last30Attendance }, { data: latestAttendance }] = await Promise.all([
    supabase.from('players').select('*, teams(name)').eq('id', params.id).single(),
    supabase
      .from('attendance')
      .select('date, points')
      .eq('playerId', params.id)
      .gte('date', last30Date)
      .returns<AttendanceRow[]>(),
    supabase
      .from('attendance')
      .select('date, points')
      .eq('playerId', params.id)
      .order('date', { ascending: false })
      .limit(1)
      .returns<AttendanceRow[]>(),
  ])

  const player = playerData as (PlayerRow & { teams: { name: string } | null }) | null

  if (!player) {
    notFound()
  }

  const age = differenceInYears(new Date(), new Date(player.dob))
  const attendanceRows = last30Attendance || []
  const attendedRows = attendanceRows.filter((row) => row.points > 0)
  const last30Total = attendanceRows.length
  const last30Attended = attendedRows.length
  const last30Pct = last30Total > 0 ? Math.round((last30Attended / last30Total) * 100) : 0
  const lastAttendanceDate = latestAttendance && latestAttendance.length > 0 ? latestAttendance[0].date : null
  const viewModel: PlayerDetailViewModel = {
    ...player,
    attendanceSummary: {
      last30DaysTotalSessions: last30Total,
      last30DaysAttendedSessions: last30Attended,
      last30DaysAttendancePct: last30Pct,
      lastAttendanceDate,
    },
  }

  const injuryStatusLabel =
    viewModel.injuryStatus.charAt(0).toUpperCase() + viewModel.injuryStatus.slice(1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg bg-card p-3">
        <PlayerBackButton fallbackHref={fallbackHref} />

        {canEdit && (
          <PlayerDetailActions
            playerId={player.id}
            playerName={`${player.firstName} ${player.lastName}`}
            fallbackHref={fallbackHref}
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mx-auto w-full max-w-[8.5rem]">
                <div className="relative aspect-square overflow-hidden rounded-md border bg-muted">
                  {viewModel.profileImageUrl ? (
                    <Image
                      src={viewModel.profileImageUrl}
                      alt={`${player.firstName} ${player.lastName}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No photo
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <StatRow label="Date of Birth" value={toDisplayDate(viewModel.dob)} />
                <StatRow label="Age" value={`${age}`} />
                <StatRow label="First Name" value={viewModel.firstName || 'Not set'} />
                <StatRow label="Last Name" value={viewModel.lastName || 'Not set'} />
                <StatRow
                  label="Preferred Name"
                  value={viewModel.preferredName || 'Not set'}
                />
                <StatRow label="Player Contact" value={viewModel.contactNumber || 'Not set'} />
                <StatRow label="Registered" value={toDisplayDate(viewModel.registeredAt)} />
                <StatRow label="Last Updated" value={toDisplayDate(viewModel.updatedAt)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guardian & Emergency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {canViewSensitive ? (
                <>
                  <StatRow label="Guardian" value={viewModel.guardianName || 'Not set'} />
                  <StatRow label="Relationship" value={viewModel.guardianRelationship || 'Not set'} />
                  <StatRow label="Guardian Phone" value={viewModel.guardianPhone || 'Not set'} />
                  <StatRow label="Guardian Email" value={viewModel.guardianEmail || 'Not set'} />
                  <StatRow label="Emergency Contact" value={viewModel.emergencyContactName || 'Not set'} />
                  <StatRow
                    label="Emergency Relationship"
                    value={viewModel.emergencyContactRelationship || 'Not set'}
                  />
                  <StatRow
                    label="Emergency Phone"
                    value={viewModel.emergencyContactPhone || 'Not set'}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Guardian and emergency details are restricted to admin and coach roles.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical & Safeguarding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {canViewSensitive ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Injury Status</span>
                    <Badge
                      variant={viewModel.injuryStatus === 'none' ? 'secondary' : 'destructive'}
                      className="capitalize"
                    >
                      {injuryStatusLabel}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Medical Notes</p>
                    <p className="whitespace-pre-wrap">{viewModel.medicalNotes || 'No medical notes recorded.'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Medication Notes</p>
                    <p className="whitespace-pre-wrap">
                      {viewModel.medicationNotes || 'No medication notes recorded.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <StatRow label="Photo Consent" value={viewModel.photoConsent ? 'Yes' : 'No'} />
                    <StatRow label="Medical Consent" value={viewModel.medicalConsent ? 'Yes' : 'No'} />
                    <StatRow label="Transport Consent" value={viewModel.transportConsent ? 'Yes' : 'No'} />
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Medical and safeguarding details are restricted to admin and coach roles.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Soccer Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <StatRow label="Team" value={viewModel.teams?.name || 'No team assigned'} />
              <StatRow
                label="Primary Positions"
                value={
                  viewModel.positions && viewModel.positions.length > 0
                    ? viewModel.positions.join(', ')
                    : 'No positions'
                }
              />
              <StatRow label="Dominant Foot" value={viewModel.dominantFoot || 'Not set'} />
              <StatRow
                label="Jersey Number"
                value={viewModel.jerseyNumber ? String(viewModel.jerseyNumber) : 'Not set'}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Development Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Strengths</p>
                <p className="whitespace-pre-wrap">{viewModel.strengths || 'No strengths recorded.'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Development Focus</p>
                <p className="whitespace-pre-wrap">
                  {viewModel.developmentFocus || 'No development focus recorded.'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Coach Summary</p>
                <p className="whitespace-pre-wrap">{viewModel.coachSummary || 'No coach summary recorded.'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Attendance Rate</span>
                  <span className="font-semibold">{viewModel.attendanceSummary.last30DaysAttendancePct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${viewModel.attendanceSummary.last30DaysAttendancePct}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <StatRow
                  label="Sessions Attended"
                  value={`${viewModel.attendanceSummary.last30DaysAttendedSessions}`}
                />
                <StatRow
                  label="Sessions Recorded"
                  value={`${viewModel.attendanceSummary.last30DaysTotalSessions}`}
                />
                <StatRow
                  label="Last Attendance"
                  value={toDisplayDate(viewModel.attendanceSummary.lastAttendanceDate)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coach & General Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{viewModel.notes || 'No general notes.'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
