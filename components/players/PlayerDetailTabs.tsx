'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { LiteracySessionLogs } from '@/components/players/LiteracySessionLogs'
import { PlayerNoteLogs } from '@/components/players/PlayerNoteLogs'
import type { PlayerDetailViewModel } from '@/types/player'

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

function toDisplayDate(date: string | null | undefined) {
  if (!date) return 'N/A'
  return format(new Date(date), 'dd MMM yyyy')
}

function ScorePips({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-sm text-muted-foreground">Not set</span>
  return (
    <div className="h-7 w-7 rounded-md border border-primary bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
      {value}
    </div>
  )
}

const JUGGLING_DATA = {
  title: 'Football Juggling Normative Data (Ages 5–15)',
  subtitle: 'Score = Max consecutive juggles',
  headers: ['Age', 'Low (Below Norm)', 'Average (Norm)', 'Moderately Good', 'Good', 'Excellent'],
  rows: [
    ['5–6', '0–2', '3–5', '6–8', '9–12', '13–15'],
    ['7–8', '0–4', '5–10', '11–18', '19–25', '26–30'],
    ['9–10', '0–10', '11–25', '26–45', '46–65', '66–80'],
    ['11–12', '0–18', '19–40', '41–70', '71–100', '101–120'],
    ['13–14', '0–30', '31–60', '61–110', '111–160', '161–200'],
    ['15', '0–45', '46–80', '81–140', '141–220', '221–300+'],
  ],
}

const SPRINT_DATA = {
  title: '30m Sprint Normative Data (Ages 6–15)',
  subtitle: 'Score = Time in seconds (lower is better)',
  headers: ['Age', '1 – Low (Below Norm)', '2 – Average (Norm)', '3 – Moderately Good', '4 – Good', '5 – Excellent'],
  rows: [
    ['6', '>7.8', '7.2–7.8', '6.8–7.1', '6.4–6.7', '<6.4'],
    ['7', '>7.5', '6.9–7.5', '6.5–6.8', '6.1–6.4', '<6.1'],
    ['8', '>7.2', '6.6–7.2', '6.2–6.5', '5.9–6.1', '<5.9'],
    ['9', '>6.9', '6.3–6.9', '5.9–6.2', '5.6–5.8', '<5.6'],
    ['10', '>6.6', '6.0–6.6', '5.7–5.9', '5.3–5.6', '<5.3'],
    ['11', '>6.3', '5.7–6.3', '5.4–5.6', '5.1–5.3', '<5.1'],
    ['12', '>6.0', '5.4–6.0', '5.1–5.3', '4.8–5.0', '<4.8'],
    ['13', '>5.8', '5.2–5.8', '4.9–5.1', '4.6–4.8', '<4.6'],
    ['14', '>5.6', '5.0–5.6', '4.7–4.9', '4.4–4.6', '<4.4'],
    ['15', '>5.4', '4.8–5.4', '4.5–4.7', '4.2–4.4', '<4.2'],
  ],
}

const YOYO_DATA = {
  title: 'Yo-Yo Test Normative Data (General Youth, Ages 12–15)',
  subtitle: 'Score = Level.Shuttle (YYIR1 equivalent)',
  headers: ['Age', 'Low (Below Norm)', 'Average (Norm)', 'Moderately Good', 'Good', 'Excellent'],
  rows: [
    ['12', '<13.0', '13.0–14.2', '14.3–15.2', '15.3–16.2', '16.3+'],
    ['13', '<13.5', '13.5–14.8', '14.9–15.8', '15.9–16.8', '16.9+'],
    ['14', '<14.0', '14.0–15.2', '15.3–16.2', '16.3–17.2', '17.3+'],
    ['15', '<14.5', '14.5–15.8', '15.9–16.8', '16.9–17.8', '17.9+'],
  ],
}

function NormativeTable({
  subtitle,
  headers,
  rows,
}: {
  title: string
  subtitle: string
  headers: string[]
  rows: string[][]
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap border-b"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-2 py-1.5 whitespace-nowrap ${j === 0 ? 'font-medium' : 'text-muted-foreground'}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DeltaBadge({ value }: { value: number | null | undefined }) {
  if (value == null) return null
  return (
    <Badge
      variant="secondary"
      className={`text-sm font-semibold ${value > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-muted text-muted-foreground'}`}
    >
      {value > 0 ? '+' : ''}
      {value}
    </Badge>
  )
}

interface Props {
  viewModel: PlayerDetailViewModel
  age: number
  canViewSensitive: boolean
  canEdit: boolean
  start?: ReactNode
  end?: ReactNode
}

export function PlayerDetailTabs({ viewModel, age, canViewSensitive, canEdit, start, end }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'profile'

  const injuryStatusLabel =
    viewModel.injuryStatus.charAt(0).toUpperCase() + viewModel.injuryStatus.slice(1)

  function handleTabChange(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <div className="sticky top-0 z-20 bg-background pb-2">
        <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2">
          {start}
          <div className="flex-1 min-w-0 overflow-x-auto">
          <TabsList className="flex h-auto w-max gap-1 rounded-lg bg-muted p-1">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="behaviour">Behaviour</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="literacy">Literacy</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
          </div>
          {end}
        </div>
      </div>

      {/* ── Profile Tab ── */}
      <TabsContent value="profile" className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
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
                      alt={`${viewModel.firstName} ${viewModel.lastName}`}
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
                <StatRow label="Preferred Name" value={viewModel.preferredName || 'Not set'} />
                <StatRow label="Player Contact" value={viewModel.contactNumber || 'Not set'} />
                <StatRow label="Registered" value={toDisplayDate(viewModel.registeredAt)} />
                <StatRow label="Last Updated" value={toDisplayDate(viewModel.updatedAt)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Soccer Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <StatRow
                label="Teams"
                value={
                  viewModel.teams.length > 0
                    ? viewModel.teams.map((t) => t.name).join(', ')
                    : 'No teams assigned'
                }
              />
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
              <StatRow
                label="House"
                value={viewModel.house ? viewModel.house.name : 'Not assigned'}
              />
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
                  <StatRow
                    label="Relationship"
                    value={viewModel.guardianRelationship || 'Not set'}
                  />
                  <StatRow label="Guardian Phone" value={viewModel.guardianPhone || 'Not set'} />
                  <StatRow label="Guardian Email" value={viewModel.guardianEmail || 'Not set'} />
                  <StatRow
                    label="Emergency Contact"
                    value={viewModel.emergencyContactName || 'Not set'}
                  />
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
                    <p className="whitespace-pre-wrap">
                      {viewModel.medicalNotes || 'No medical notes recorded.'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Medication Notes</p>
                    <p className="whitespace-pre-wrap">
                      {viewModel.medicationNotes || 'No medication notes recorded.'}
                    </p>
                  </div>
                  <div className="space-y-1 pt-1">
                    <StatRow
                      label="Photo Consent"
                      value={viewModel.photoConsent ? 'Yes' : 'No'}
                    />
                    <StatRow
                      label="Medical Consent"
                      value={viewModel.medicalConsent ? 'Yes' : 'No'}
                    />
                    <StatRow
                      label="Transport Consent"
                      value={viewModel.transportConsent ? 'Yes' : 'No'}
                    />
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Medical and safeguarding details are restricted to admin and coach roles.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Development Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm lg:grid-cols-3">
              <div>
                <p className="text-muted-foreground mb-1">Strengths</p>
                <p className="whitespace-pre-wrap">
                  {viewModel.strengths || 'No strengths recorded.'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Development Focus</p>
                <p className="whitespace-pre-wrap">
                  {viewModel.developmentFocus || 'No development focus recorded.'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Coach Summary</p>
                <p className="whitespace-pre-wrap">
                  {viewModel.coachSummary || 'No coach summary recorded.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* ── Basic Info Tab ── */}
      <TabsContent value="basic-info">
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <StatRow label="Date Joined" value={toDisplayDate(viewModel.dateJoined)} />
            <StatRow label="Review Date" value={toDisplayDate(viewModel.reviewDate)} />
            <div className="pt-2 pb-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Attendance (Last 30 Days)
              </p>
              <div className="mb-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Attendance Rate</span>
                  <span className="font-semibold">
                    {viewModel.attendanceSummary.last30DaysAttendancePct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${viewModel.attendanceSummary.last30DaysAttendancePct}%`,
                    }}
                  />
                </div>
              </div>
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
      </TabsContent>

      {/* ── Technical Tab ── */}
      <TabsContent value="technical" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Technical</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {viewModel.avgTechnicalScore != null && (
              <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                <span className="text-sm font-medium">Avg Technical Score</span>
                <Badge variant="secondary" className="text-sm font-semibold">
                  {Number(viewModel.avgTechnicalScore).toFixed(2)} / 5
                </Badge>
              </div>
            )}
            <div className="space-y-3">
              {(
                [
                  ['30m Sprint', viewModel.technicalSprint],
                  ['Dribbling', viewModel.technicalDribbling],
                  ['Passing', viewModel.technicalPassing],
                  ['Juggling', viewModel.technicalJuggling],
                  ['Yo-yo Test', viewModel.technicalYoyo],
                ] as [string, number | null][]
              ).map(([label, val]) => (
                <div key={label} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b pb-3 last:border-b-0 last:pb-0">
                  <span className="text-sm text-muted-foreground min-w-[140px]">{label}</span>
                  <ScorePips value={val} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Normative Reference Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {[
                { id: 'juggling', data: JUGGLING_DATA },
                { id: 'sprint', data: SPRINT_DATA },
                { id: 'yoyo', data: YOYO_DATA },
              ].map(({ id, data }) => (
                <AccordionItem key={id} value={id}>
                  <AccordionTrigger className="text-xs font-medium text-foreground">
                    {data.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <NormativeTable {...data} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Behaviour Tab ── */}
      <TabsContent value="behaviour">
        <Card>
          <CardHeader>
            <CardTitle>Behaviour</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {viewModel.avgBehaviourScore != null && (
              <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                <span className="text-sm font-medium">Avg Behavioural Score</span>
                <Badge variant="secondary" className="text-sm font-semibold">
                  {Number(viewModel.avgBehaviourScore).toFixed(2)} / 5
                </Badge>
              </div>
            )}
            <div className="space-y-3">
              {(
                [
                  ['Teamwork', viewModel.behaviourTeamwork],
                  ['Attitude', viewModel.behaviourAttitude],
                  ['Communication', viewModel.behaviourCommunication],
                ] as [string, number | null][]
              ).map(([label, val]) => (
                <div key={label} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b pb-3 last:border-b-0 last:pb-0">
                  <span className="text-sm text-muted-foreground min-w-[140px]">{label}</span>
                  <ScorePips value={val} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Progress Tab ── */}
      <TabsContent value="progress">
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <StatRow
              label="Academic / School Concern"
              value={
                viewModel.academicSchoolConcern === 'no'
                  ? 'No'
                  : viewModel.academicSchoolConcern === 'monitor'
                    ? 'Monitor'
                    : viewModel.academicSchoolConcern === 'yes_discuss_school'
                      ? 'Yes — Discuss with School'
                      : 'Not assessed'
              }
            />
            <StatRow
              label="Progressed to Higher Level"
              value={
                viewModel.progressedToHigherLevel === true
                  ? 'Yes'
                  : viewModel.progressedToHigherLevel === false
                    ? 'No'
                    : 'Not assessed'
              }
            />
            <StatRow
              label="Completed Full Season"
              value={
                viewModel.completedFullSeason === true
                  ? 'Yes'
                  : viewModel.completedFullSeason === false
                    ? 'No'
                    : 'Not assessed'
              }
            />
            <StatRow
              label="Joined School / Regional Team"
              value={
                viewModel.joinedSchoolRegionalTeam === true
                  ? 'Yes'
                  : viewModel.joinedSchoolRegionalTeam === false
                    ? 'No'
                    : 'Not assessed'
              }
            />
            {viewModel.nextStepGoal && (
              <div className="pt-3">
                <p className="text-sm text-muted-foreground mb-1">Next Step / Goal</p>
                <p className="text-sm whitespace-pre-wrap">{viewModel.nextStepGoal}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Academics Tab ── */}
      <TabsContent value="academics">
        <Card>
          <CardHeader>
            <CardTitle>Academics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
              <span className="text-sm text-muted-foreground min-w-[160px]">
                Academic Baseline
              </span>
              <ScorePips value={viewModel.academicBaseline} />
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
              <span className="text-sm text-muted-foreground min-w-[160px]">
                Academic Current
              </span>
              <ScorePips value={viewModel.academicCurrent} />
            </div>
            {viewModel.academicImprovement != null && (
              <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                <span className="text-sm font-medium">Academic Improvement</span>
                <DeltaBadge value={viewModel.academicImprovement} />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Literacy Tab ── */}
      <TabsContent value="literacy" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Literacy Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatRow
              label="Literacy Enrolled"
              value={
                viewModel.literacyEnrolled === true
                  ? 'Yes'
                  : viewModel.literacyEnrolled === false
                    ? 'No'
                    : 'Not set'
              }
            />
            <StatRow
              label="Literacy Sessions Attended"
              value={
                viewModel.literacySessionsAttended != null
                  ? String(viewModel.literacySessionsAttended)
                  : 'Not set'
              }
            />
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
              <span className="text-sm text-muted-foreground min-w-[180px]">
                Reading Level Baseline
              </span>
              <ScorePips value={viewModel.literacyReadingBaseline} />
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
              <span className="text-sm text-muted-foreground min-w-[180px]">
                Reading Level Current
              </span>
              <ScorePips value={viewModel.literacyReadingCurrent} />
            </div>
            {viewModel.literacyReadingImprovement != null && (
              <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                <span className="text-sm font-medium">Reading Improvement</span>
                <DeltaBadge value={viewModel.literacyReadingImprovement} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <LiteracySessionLogs
              sessions={viewModel.literacySessions}
              playerId={viewModel.id}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Notes Tab ── */}
      <TabsContent value="notes" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">General Notes</p>
              <p className="whitespace-pre-wrap">{viewModel.notes || 'No general notes.'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <PlayerNoteLogs
              notes={viewModel.playerNotes}
              playerId={viewModel.id}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
