'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { DateOfBirthPicker } from '@/components/ui/date-picker'
import { useToast } from '@/components/ui/toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LiteracySessionLogs } from '@/components/players/LiteracySessionLogs'
import { PlayerNoteLogs } from '@/components/players/PlayerNoteLogs'
import type { Database } from '@/types/database'
import type { LiteracySession, PlayerNote } from '@/types/player'

type PlayerRow = Database['public']['Tables']['players']['Row']

type PlayerFormMode = 'create' | 'edit'

interface TeamOption {
  id: string
  name: string
}

interface PositionOption {
  id: string
  name: string
}

interface HouseOption {
  id: string
  name: string
}

interface PlayerFormPageProps {
  mode: PlayerFormMode
  teams: TeamOption[]
  positions: PositionOption[]
  houses: HouseOption[]
  player?: PlayerRow
  initialTeamIds?: string[]
  initialTab?: string
  literacySessions?: LiteracySession[]
  playerNotes?: PlayerNote[]
}

function ScoreInput({
  id,
  name,
  value,
  onChange,
  disabled,
}: {
  id: string
  name: string
  value: number | null
  onChange: (v: number | null) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === n ? null : n)}
          className={cn(
            'h-9 w-9 rounded-md border text-sm font-medium transition-colors',
            value === n
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground hover:bg-muted'
          )}
        >
          {n}
        </button>
      ))}
      <input type="hidden" id={id} name={name} value={value ?? ''} />
    </div>
  )
}

function ScoreDisplay({ value }: { value: number | null }) {
  if (value === null) return <span className="text-sm text-muted-foreground">Not set</span>
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className={cn(
            'h-7 w-7 rounded-md border text-xs font-medium flex items-center justify-center',
            n === value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-muted text-muted-foreground'
          )}
        >
          {n}
        </div>
      ))}
    </div>
  )
}

function AvgBadge({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <Badge variant="secondary" className="text-sm font-semibold">
        {Number(value).toFixed(2)} / 5
      </Badge>
    </div>
  )
}

function NullableSelect({
  id,
  name,
  value,
  onChange,
  disabled,
  children,
  className,
}: {
  id: string
  name: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <Select
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={className}
    >
      {children}
    </Select>
  )
}

export function PlayerFormPage({ mode, teams, positions, houses, player, initialTeamIds, initialTab, literacySessions, playerNotes }: PlayerFormPageProps) {
  const router = useRouter()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState(initialTab || 'profile')

  const [dobDate, setDobDate] = useState<Date | undefined>(
    player?.dob ? new Date(player.dob) : undefined
  )
  const [dateJoined, setDateJoined] = useState<string>(player?.dateJoined || '')
  const [reviewDate, setReviewDate] = useState<string>(player?.reviewDate || '')

  const [selectedPositions, setSelectedPositions] = useState<string[]>(player?.positions || [])
  const [positionsPopoverOpen, setPositionsPopoverOpen] = useState(false)
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(initialTeamIds ?? [])
  const [selectedHouseId, setSelectedHouseId] = useState<string>(player?.houseId ?? '')
  const [contactNumber, setContactNumber] = useState<string>(player?.contactNumber || '')
  const [guardianPhone, setGuardianPhone] = useState<string>(player?.guardianPhone || '')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string>(
    player?.emergencyContactPhone || ''
  )
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)

  const [photoConsent, setPhotoConsent] = useState<boolean>(player?.photoConsent || false)
  const [medicalConsent, setMedicalConsent] = useState<boolean>(player?.medicalConsent || false)
  const [transportConsent, setTransportConsent] = useState<boolean>(
    player?.transportConsent || false
  )

  // Technical scores
  const [technicalSprint, setTechnicalSprint] = useState<number | null>(
    player?.technicalSprint ?? null
  )
  const [technicalDribbling, setTechnicalDribbling] = useState<number | null>(
    player?.technicalDribbling ?? null
  )
  const [technicalPassing, setTechnicalPassing] = useState<number | null>(
    player?.technicalPassing ?? null
  )
  const [technicalJuggling, setTechnicalJuggling] = useState<number | null>(
    player?.technicalJuggling ?? null
  )
  const [technicalYoyo, setTechnicalYoyo] = useState<number | null>(
    player?.technicalYoyo ?? null
  )

  // Behaviour scores
  const [behaviourTeamwork, setBehaviourTeamwork] = useState<number | null>(
    player?.behaviourTeamwork ?? null
  )
  const [behaviourAttitude, setBehaviourAttitude] = useState<number | null>(
    player?.behaviourAttitude ?? null
  )
  const [behaviourCommunication, setBehaviourCommunication] = useState<number | null>(
    player?.behaviourCommunication ?? null
  )

  // Progress
  const [academicSchoolConcern, setAcademicSchoolConcern] = useState<string>(
    player?.academicSchoolConcern || ''
  )
  const [progressedToHigherLevel, setProgressedToHigherLevel] = useState<string>(
    player?.progressedToHigherLevel === true
      ? 'yes'
      : player?.progressedToHigherLevel === false
        ? 'no'
        : ''
  )
  const [completedFullSeason, setCompletedFullSeason] = useState<string>(
    player?.completedFullSeason === true
      ? 'yes'
      : player?.completedFullSeason === false
        ? 'no'
        : ''
  )
  const [joinedSchoolRegionalTeam, setJoinedSchoolRegionalTeam] = useState<string>(
    player?.joinedSchoolRegionalTeam === true
      ? 'yes'
      : player?.joinedSchoolRegionalTeam === false
        ? 'no'
        : ''
  )

  // Academics
  const [academicBaseline, setAcademicBaseline] = useState<number | null>(
    player?.academicBaseline ?? null
  )
  const [academicCurrent, setAcademicCurrent] = useState<number | null>(
    player?.academicCurrent ?? null
  )

  // Stay In The Game
  const [sitgPreSurveyScore, setSitgPreSurveyScore] = useState<string>(
    player?.sitgPreSurveyScore != null ? String(player.sitgPreSurveyScore) : ''
  )
  const [sitgPostSurveyScore, setSitgPostSurveyScore] = useState<string>(
    player?.sitgPostSurveyScore != null ? String(player.sitgPostSurveyScore) : ''
  )
  const [sitgSatisfactionRating, setSitgSatisfactionRating] = useState<string>(
    player?.sitgSatisfactionRating != null ? String(player.sitgSatisfactionRating) : ''
  )

  // Literacy
  const [literacyEnrolled, setLiteracyEnrolled] = useState<boolean>(
    player?.literacyEnrolled || false
  )
  const [literacyReadingBaseline, setLiteracyReadingBaseline] = useState<number | null>(
    player?.literacyReadingBaseline ?? null
  )
  const [literacyReadingCurrent, setLiteracyReadingCurrent] = useState<number | null>(
    player?.literacyReadingCurrent ?? null
  )
  const [literacySessionsAttended, setLiteracySessionsAttended] = useState<string>(
    player?.literacySessionsAttended != null ? String(player.literacySessionsAttended) : ''
  )

  const positionNames = useMemo(() => positions.map((p) => p.name), [positions])
  const isEditing = mode === 'edit'

  const computedAvgTechnical = useMemo(() => {
    const vals = [
      technicalSprint,
      technicalDribbling,
      technicalPassing,
      technicalJuggling,
      technicalYoyo,
    ].filter((v): v is number => v !== null)
    if (vals.length === 0) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }, [technicalSprint, technicalDribbling, technicalPassing, technicalJuggling, technicalYoyo])

  const computedAvgBehaviour = useMemo(() => {
    const vals = [behaviourTeamwork, behaviourAttitude, behaviourCommunication].filter(
      (v): v is number => v !== null
    )
    if (vals.length === 0) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }, [behaviourTeamwork, behaviourAttitude, behaviourCommunication])

  const computedAcademicImprovement = useMemo(() => {
    if (academicBaseline === null || academicCurrent === null) return null
    return academicCurrent - academicBaseline
  }, [academicBaseline, academicCurrent])

  const computedLiteracyImprovement = useMemo(() => {
    if (literacyReadingBaseline === null || literacyReadingCurrent === null) return null
    return literacyReadingCurrent - literacyReadingBaseline
  }, [literacyReadingBaseline, literacyReadingCurrent])

  const sitgScoreChange = useMemo(() => {
    const pre = sitgPreSurveyScore ? parseInt(sitgPreSurveyScore, 10) : NaN
    const post = sitgPostSurveyScore ? parseInt(sitgPostSurveyScore, 10) : NaN
    if (isNaN(pre) || isNaN(post)) return null
    return post - pre
  }, [sitgPreSurveyScore, sitgPostSurveyScore])

  const isInSitgTeam = teams.some(
    (t) => t.name === 'Stay In The Game' && selectedTeamIds.includes(t.id)
  )

  const normalizePhone = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '')
    return value.trimStart().startsWith('+') ? `+${digitsOnly}` : digitsOnly
  }

  const handlePhoneChange = (
    setter: (value: string) => void,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setter(normalizePhone(e.target.value))
  }

  const handleProfileImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const getProfileImageUrl = () => {
    return profileImagePreview || player?.profileImageUrl || null
  }

  const parseBooleanSelect = (v: string): boolean | null => {
    if (v === 'yes') return true
    if (v === 'no') return false
    return null
  }

  const validateForm = (form: HTMLFormElement) => {
    const formData = new FormData(form)
    const errors: Record<string, string> = {}

    const firstName = String(formData.get('firstName') || '').trim()
    const lastName = String(formData.get('lastName') || '').trim()
    const guardianName = String(formData.get('guardianName') || '').trim()
    const guardianPhoneValue = String(formData.get('guardianPhone') || '').trim()
    const guardianEmail = String(formData.get('guardianEmail') || '').trim()
    const jerseyNumberValue = String(formData.get('jerseyNumber') || '').trim()

    if (!firstName) errors.firstName = 'First name is required'
    if (!lastName) errors.lastName = 'Last name is required'
    if (!dobDate) errors.dob = 'Date of birth is required'
    if (selectedTeamIds.length === 0) errors.teamId = 'Please select at least one team'
    if (positionNames.length > 0 && selectedPositions.length === 0)
      errors.positions = 'At least one position is required'
    if (!guardianName) errors.guardianName = 'Guardian name is required'
    if (!guardianPhoneValue) errors.guardianPhone = 'Guardian phone is required'
    if (guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail))
      errors.guardianEmail = 'Enter a valid guardian email'
    if (jerseyNumberValue) {
      const jerseyNumber = Number(jerseyNumberValue)
      if (!Number.isInteger(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99)
        errors.jerseyNumber = 'Jersey number must be an integer from 1 to 99'
    }

    const injuryStatus = String(formData.get('injuryStatus') || 'none')
    if (!['none', 'rehab', 'restricted', 'unavailable'].includes(injuryStatus))
      errors.injuryStatus = 'Invalid injury status'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const uploadProfileImageIfAny = async (formData: FormData) => {
    const supabase = createClient()
    const profileImageFile = formData.get('profileImage') as File | null

    if (!profileImageFile || profileImageFile.size === 0) {
      return player?.profileImageUrl || null
    }

    const fileExt = profileImageFile.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
    const filePath = `player-photos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('player-photos')
      .upload(filePath, profileImageFile)

    if (uploadError) throw new Error(uploadError.message)

    const { data } = supabase.storage.from('player-photos').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!validateForm(e.currentTarget)) {
      setActiveTab('profile')
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    try {
      const profileImageUrl = await uploadProfileImageIfAny(formData)
      const jerseyNumberRaw = String(formData.get('jerseyNumber') || '').trim()
      const literacySessionsRaw = literacySessionsAttended.trim()

      const payload = {
        firstName: String(formData.get('firstName') || '').trim(),
        lastName: String(formData.get('lastName') || '').trim(),
        preferredName: String(formData.get('preferredName') || '').trim() || null,
        dob: dobDate ? dobDate.toISOString().split('T')[0] : null,
        positions: selectedPositions,
        profileImageUrl,
        contactNumber: String(formData.get('contactNumber') || '').trim() || null,
        guardianName: String(formData.get('guardianName') || '').trim() || null,
        guardianRelationship: String(formData.get('guardianRelationship') || '').trim() || null,
        guardianPhone: String(formData.get('guardianPhone') || '').trim() || null,
        guardianEmail: String(formData.get('guardianEmail') || '').trim() || null,
        emergencyContactName: String(formData.get('emergencyContactName') || '').trim() || null,
        emergencyContactRelationship:
          String(formData.get('emergencyContactRelationship') || '').trim() || null,
        emergencyContactPhone:
          String(formData.get('emergencyContactPhone') || '').trim() || null,
        dominantFoot: String(formData.get('dominantFoot') || '').trim() || null,
        jerseyNumber: jerseyNumberRaw ? Number(jerseyNumberRaw) : null,
        houseId: selectedHouseId || null,
        medicalNotes: String(formData.get('medicalNotes') || '').trim() || null,
        injuryStatus: String(formData.get('injuryStatus') || 'none').trim(),
        medicationNotes: String(formData.get('medicationNotes') || '').trim() || null,
        photoConsent,
        medicalConsent,
        transportConsent,
        strengths: String(formData.get('strengths') || '').trim() || null,
        developmentFocus: String(formData.get('developmentFocus') || '').trim() || null,
        coachSummary: String(formData.get('coachSummary') || '').trim() || null,
        notes: String(formData.get('notes') || '').trim() || null,
        // Group 1
        dateJoined: dateJoined || null,
        reviewDate: reviewDate || null,
        // Group 2
        technicalSprint,
        technicalDribbling,
        technicalPassing,
        technicalJuggling,
        technicalYoyo,
        // Group 3
        behaviourTeamwork,
        behaviourAttitude,
        behaviourCommunication,
        // Group 4
        academicSchoolConcern: (academicSchoolConcern || null) as
          | 'no'
          | 'monitor'
          | 'yes_discuss_school'
          | null,
        progressedToHigherLevel: parseBooleanSelect(progressedToHigherLevel),
        nextStepGoal: String(formData.get('nextStepGoal') || '').trim() || null,
        completedFullSeason: parseBooleanSelect(completedFullSeason),
        joinedSchoolRegionalTeam: parseBooleanSelect(joinedSchoolRegionalTeam),
        // Group 5
        academicBaseline,
        academicCurrent,
        // Group 7
        literacyEnrolled,
        literacyReadingBaseline,
        literacyReadingCurrent,
        literacySessionsAttended: literacySessionsRaw ? Number(literacySessionsRaw) : null,
        // Group 8: Stay In The Game
        sitgPreSurveyScore: sitgPreSurveyScore ? Math.min(65, Math.max(1, parseInt(sitgPreSurveyScore, 10))) || null : null,
        sitgPostSurveyScore: sitgPostSurveyScore ? Math.min(65, Math.max(1, parseInt(sitgPostSurveyScore, 10))) || null : null,
        sitgSatisfactionRating: sitgSatisfactionRating ? Math.min(5, Math.max(1, parseInt(sitgSatisfactionRating, 10))) || null : null,
      }

      if (isEditing && player) {
        const playersTable = supabase.from('players') as any
        const { error: updateError } = await playersTable.update(payload).eq('id', player.id)
        if (updateError) throw new Error(updateError.message)

        const ptTable = supabase.from('player_teams') as any
        const { error: deleteError } = await ptTable.delete().eq('playerId', player.id)
        if (deleteError) throw new Error(deleteError.message)
        if (selectedTeamIds.length > 0) {
          const { error: ptError } = await ptTable.insert(
            selectedTeamIds.map((teamId) => ({ playerId: player.id, teamId }))
          )
          if (ptError) throw new Error(ptError.message)
        }

        toast.success('Player updated')
        router.push(`/players/${player.id}?tab=${activeTab}`)
      } else {
        const playersTable = supabase.from('players') as any
        const { data, error: insertError } = await playersTable
          .insert(payload)
          .select('id')
          .single()
        if (insertError || !data) throw new Error(insertError?.message || 'Failed to create player')

        if (selectedTeamIds.length > 0) {
          const ptTable = supabase.from('player_teams') as any
          const { error: ptError } = await ptTable.insert(
            selectedTeamIds.map((teamId) => ({ playerId: data.id, teamId }))
          )
          if (ptError) throw new Error(ptError.message)
        }

        toast.success('Player created')
        router.push(`/players/${data.id}`)
      }

      router.refresh()
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : 'Failed to save player'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <form id="player-form" onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="sticky top-0 z-20 bg-background pb-2 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-card p-3">
              <div className="space-y-0.5">
                <h1 className="text-xl font-bold leading-tight">{isEditing ? 'Edit Player' : 'New Player'}</h1>
                <p className="text-sm text-muted-foreground">
                  {isEditing
                    ? 'Update player profile information.'
                    : 'Create a complete youth academy profile.'}{' '}
                  <span className="text-destructive">*</span> Required
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={isEditing && player ? `/players/${player.id}` : '/players'}>Cancel</Link>
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Player'}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
            <TabsList className="flex h-auto w-max gap-1 rounded-lg bg-muted p-1">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="behaviour">Behaviour</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="academics">Academics</TabsTrigger>
              <TabsTrigger value="literacy">Literacy</TabsTrigger>
              <TabsTrigger value="stay-in-the-game">Stay In The Game</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            </div>
          </div>

          {/* ── Profile Tab ── */}
          <TabsContent forceMount value="profile" className="space-y-6 data-[state=inactive]:hidden">
            <section className="rounded-lg border p-4 md:p-5">
              <h2 className="text-base font-semibold">Profile Photo</h2>
              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleProfileImageClick}
                  disabled={loading}
                  className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border"
                >
                  {getProfileImageUrl() ? (
                    <Image
                      src={getProfileImageUrl()!}
                      alt="Player"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                      Add photo
                    </div>
                  )}
                </button>
                <div className="text-sm text-muted-foreground">
                  Tap the avatar to upload or replace the player photo.
                </div>
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
            </section>

            <section className="rounded-lg border p-4 md:p-5">
              <h2 className="text-base font-semibold">Identity</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={player?.firstName || ''}
                    disabled={loading}
                    className={cn(fieldErrors.firstName && 'border-destructive')}
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
                    defaultValue={player?.lastName || ''}
                    disabled={loading}
                    className={cn(fieldErrors.lastName && 'border-destructive')}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-sm text-destructive">{fieldErrors.lastName}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="preferredName">Preferred Name</Label>
                  <Input
                    id="preferredName"
                    name="preferredName"
                    defaultValue={player?.preferredName || ''}
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dob">Date of Birth <span className="text-destructive">*</span></Label>
                  <div
                    className={cn(
                      fieldErrors.dob && 'rounded-md ring-2 ring-destructive ring-offset-2'
                    )}
                  >
                    <DateOfBirthPicker date={dobDate} onSelect={setDobDate} disabled={loading} />
                  </div>
                  {fieldErrors.dob && (
                    <p className="text-sm text-destructive">{fieldErrors.dob}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dominantFoot">Dominant Foot</Label>
                  <Select
                    id="dominantFoot"
                    name="dominantFoot"
                    defaultValue={player?.dominantFoot || ''}
                  >
                    <option value="">Select dominant foot...</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="both">Both</option>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="jerseyNumber">Jersey Number</Label>
                  <Input
                    id="jerseyNumber"
                    name="jerseyNumber"
                    type="number"
                    min={1}
                    max={99}
                    defaultValue={player?.jerseyNumber || ''}
                    disabled={loading}
                    className={cn(fieldErrors.jerseyNumber && 'border-destructive')}
                  />
                  {fieldErrors.jerseyNumber && (
                    <p className="text-sm text-destructive">{fieldErrors.jerseyNumber}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="houseId">House</Label>
                  <Select
                    id="houseId"
                    name="houseId"
                    value={selectedHouseId}
                    onChange={(e) => setSelectedHouseId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">No house assigned</option>
                    {houses.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Teams <span className="text-destructive">*</span></Label>
                  <div
                    className={cn(
                      'rounded-md border p-3 space-y-2 max-h-48 overflow-y-auto',
                      fieldErrors.teamId && 'border-destructive'
                    )}
                  >
                    {teams.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No teams available.</p>
                    ) : (
                      teams.map((team) => (
                        <label key={team.id} className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={selectedTeamIds.includes(team.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTeamIds([...selectedTeamIds, team.id])
                              } else {
                                setSelectedTeamIds(selectedTeamIds.filter((id) => id !== team.id))
                              }
                            }}
                            disabled={loading}
                          />
                          <span className="text-sm">{team.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {fieldErrors.teamId && (
                    <p className="text-sm text-destructive">{fieldErrors.teamId}</p>
                  )}
                  {selectedTeamIds.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedTeamIds.map((id) => {
                        const team = teams.find((t) => t.id === id)
                        return team ? (
                          <Badge key={id} variant="secondary" className="text-xs">
                            {team.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>Positions <span className="text-destructive">*</span></Label>
                  <div
                    className={cn(
                      'relative',
                      fieldErrors.positions &&
                        'rounded-md ring-2 ring-destructive ring-offset-2'
                    )}
                  >
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
                                className="flex cursor-pointer select-none items-center space-x-2 rounded-md p-2 hover:bg-accent"
                              >
                                <Checkbox
                                  checked={selectedPositions.includes(position)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedPositions([...selectedPositions, position])
                                    } else {
                                      setSelectedPositions(
                                        selectedPositions.filter((p) => p !== position)
                                      )
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
                  {fieldErrors.positions && (
                    <p className="text-sm text-destructive">{fieldErrors.positions}</p>
                  )}
                  {selectedPositions.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedPositions.map((position) => (
                        <Badge key={position} variant="secondary" className="text-xs">
                          {position}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contactNumber">Player Contact Number</Label>
                  <Input
                    id="contactNumber"
                    name="contactNumber"
                    type="tel"
                    inputMode="numeric"
                    placeholder="e.g. +1234567890"
                    value={contactNumber}
                    onChange={(e) => handlePhoneChange(setContactNumber, e)}
                    disabled={loading}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border p-4 md:p-5">
              <h2 className="text-base font-semibold">Guardian & Emergency</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="guardianName">Guardian Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="guardianName"
                    name="guardianName"
                    defaultValue={player?.guardianName || ''}
                    disabled={loading}
                    className={cn(fieldErrors.guardianName && 'border-destructive')}
                  />
                  {fieldErrors.guardianName && (
                    <p className="text-sm text-destructive">{fieldErrors.guardianName}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="guardianRelationship">Guardian Relationship</Label>
                  <Input
                    id="guardianRelationship"
                    name="guardianRelationship"
                    defaultValue={player?.guardianRelationship || ''}
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="guardianPhone">Guardian Phone <span className="text-destructive">*</span></Label>
                  <Input
                    id="guardianPhone"
                    name="guardianPhone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="e.g. +1234567890"
                    value={guardianPhone}
                    onChange={(e) => handlePhoneChange(setGuardianPhone, e)}
                    disabled={loading}
                    className={cn(fieldErrors.guardianPhone && 'border-destructive')}
                  />
                  {fieldErrors.guardianPhone && (
                    <p className="text-sm text-destructive">{fieldErrors.guardianPhone}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="guardianEmail">Guardian Email</Label>
                  <Input
                    id="guardianEmail"
                    name="guardianEmail"
                    type="email"
                    defaultValue={player?.guardianEmail || ''}
                    disabled={loading}
                    className={cn(fieldErrors.guardianEmail && 'border-destructive')}
                  />
                  {fieldErrors.guardianEmail && (
                    <p className="text-sm text-destructive">{fieldErrors.guardianEmail}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    defaultValue={player?.emergencyContactName || ''}
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="emergencyContactRelationship">
                    Emergency Contact Relationship
                  </Label>
                  <Input
                    id="emergencyContactRelationship"
                    name="emergencyContactRelationship"
                    defaultValue={player?.emergencyContactRelationship || ''}
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="e.g. +1234567890"
                    value={emergencyContactPhone}
                    onChange={(e) => handlePhoneChange(setEmergencyContactPhone, e)}
                    disabled={loading}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border p-4 md:p-5">
              <h2 className="text-base font-semibold">Medical & Safeguarding</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="injuryStatus">Injury Status</Label>
                  <Select
                    id="injuryStatus"
                    name="injuryStatus"
                    defaultValue={player?.injuryStatus || 'none'}
                    className={cn(fieldErrors.injuryStatus && 'border-destructive')}
                  >
                    <option value="none">None</option>
                    <option value="rehab">Rehab</option>
                    <option value="restricted">Restricted</option>
                    <option value="unavailable">Unavailable</option>
                  </Select>
                  {fieldErrors.injuryStatus && (
                    <p className="text-sm text-destructive">{fieldErrors.injuryStatus}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="medicationNotes">Medication Notes</Label>
                  <Textarea
                    id="medicationNotes"
                    name="medicationNotes"
                    rows={3}
                    defaultValue={player?.medicationNotes || ''}
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="medicalNotes">Medical Notes</Label>
                  <Textarea
                    id="medicalNotes"
                    name="medicalNotes"
                    rows={3}
                    defaultValue={player?.medicalNotes || ''}
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label>Consent Flags</Label>
                  <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
                    <label className="flex cursor-pointer items-center space-x-2">
                      <Checkbox
                        checked={photoConsent}
                        onCheckedChange={(v) => setPhotoConsent(!!v)}
                      />
                      <span className="text-sm">Photo consent</span>
                    </label>
                    <label className="flex cursor-pointer items-center space-x-2">
                      <Checkbox
                        checked={medicalConsent}
                        onCheckedChange={(v) => setMedicalConsent(!!v)}
                      />
                      <span className="text-sm">Medical consent</span>
                    </label>
                    <label className="flex cursor-pointer items-center space-x-2">
                      <Checkbox
                        checked={transportConsent}
                        onCheckedChange={(v) => setTransportConsent(!!v)}
                      />
                      <span className="text-sm">Transport consent</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border p-4 md:p-5">
              <h2 className="text-base font-semibold">Development</h2>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="strengths">Strengths</Label>
                  <Textarea
                    id="strengths"
                    name="strengths"
                    rows={3}
                    defaultValue={player?.strengths || ''}
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="developmentFocus">Development Focus</Label>
                  <Textarea
                    id="developmentFocus"
                    name="developmentFocus"
                    rows={3}
                    defaultValue={player?.developmentFocus || ''}
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="coachSummary">Coach Summary</Label>
                  <Textarea
                    id="coachSummary"
                    name="coachSummary"
                    rows={3}
                    defaultValue={player?.coachSummary || ''}
                    disabled={loading}
                  />
                </div>
              </div>
            </section>
          </TabsContent>

          {/* ── Basic Info Tab ── */}
          <TabsContent forceMount value="basic-info" className="space-y-6 data-[state=inactive]:hidden">
            <section className="rounded-lg border p-4 md:p-5">
              <h2 className="text-base font-semibold">Basic Info</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="dateJoined">Date Joined</Label>
                  <Input
                    id="dateJoined"
                    name="dateJoined"
                    type="date"
                    value={dateJoined}
                    onChange={(e) => setDateJoined(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reviewDate">Review Date</Label>
                  <Input
                    id="reviewDate"
                    name="reviewDate"
                    type="date"
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="rounded-md border bg-muted/40 p-3 md:col-span-2">
                  <p className="text-sm text-muted-foreground">
                    Sessions Attended and Attendance % are calculated automatically from session
                    records and shown on the player profile.
                  </p>
                </div>
              </div>
            </section>
          </TabsContent>

          {/* ── Technical Tab ── */}
          <TabsContent forceMount value="technical" className="space-y-6 data-[state=inactive]:hidden">
            <section className="rounded-lg border p-4 md:p-5">
              <h2 className="text-base font-semibold">Technical Scores</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Rate each skill from 1 (lowest) to 5 (highest). Tap again to clear.
              </p>
              <div className="mt-4 space-y-4">
                {(
                  [
                    ['30m Sprint', technicalSprint, setTechnicalSprint, 'technicalSprint'],
                    [
                      'Dribbling',
                      technicalDribbling,
                      setTechnicalDribbling,
                      'technicalDribbling',
                    ],
                    ['Passing', technicalPassing, setTechnicalPassing, 'technicalPassing'],
                    ['Juggling', technicalJuggling, setTechnicalJuggling, 'technicalJuggling'],
                    ['Yo-yo Test', technicalYoyo, setTechnicalYoyo, 'technicalYoyo'],
                  ] as [string, number | null, (v: number | null) => void, string][]
                ).map(([label, val, setter, fieldName]) => (
                  <div key={fieldName} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Label className="min-w-[140px]">{label}</Label>
                    <ScoreInput
                      id={fieldName}
                      name={fieldName}
                      value={val}
                      onChange={setter}
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <AvgBadge label="Avg Technical Score" value={computedAvgTechnical} />
              </div>
            </section>
          </TabsContent>

          {/* ── Behaviour Tab ── */}
          <TabsContent forceMount value="behaviour" className="space-y-6 data-[state=inactive]:hidden">
            <section className="rounded-lg border p-4 md:p-5">
              <h2 className="text-base font-semibold">Behaviour Scores</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Rate each attribute from 1 (lowest) to 5 (highest). Tap again to clear.
              </p>
              <div className="mt-4 space-y-4">
                {(
                  [
                    ['Teamwork', behaviourTeamwork, setBehaviourTeamwork, 'behaviourTeamwork'],
                    ['Attitude', behaviourAttitude, setBehaviourAttitude, 'behaviourAttitude'],
                    [
                      'Communication',
                      behaviourCommunication,
                      setBehaviourCommunication,
                      'behaviourCommunication',
                    ],
                  ] as [string, number | null, (v: number | null) => void, string][]
                ).map(([label, val, setter, fieldName]) => (
                  <div key={fieldName} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Label className="min-w-[140px]">{label}</Label>
                    <ScoreInput
                      id={fieldName}
                      name={fieldName}
                      value={val}
                      onChange={setter}
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <AvgBadge label="Avg Behavioural Score" value={computedAvgBehaviour} />
              </div>
            </section>
          </TabsContent>

          {/* ── Progress Tab ── */}
          <TabsContent forceMount value="progress" className="space-y-6 data-[state=inactive]:hidden">
            <section className="rounded-lg border p-4 md:p-5">
              <h2 className="text-base font-semibold">Progress</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="academicSchoolConcern">Academic / School Concern?</Label>
                  <NullableSelect
                    id="academicSchoolConcern"
                    name="academicSchoolConcern"
                    value={academicSchoolConcern}
                    onChange={setAcademicSchoolConcern}
                    disabled={loading}
                  >
                    <option value="">Not assessed</option>
                    <option value="no">No</option>
                    <option value="monitor">Monitor</option>
                    <option value="yes_discuss_school">Yes — Discuss with School</option>
                  </NullableSelect>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="progressedToHigherLevel">Progressed to Higher Level?</Label>
                  <NullableSelect
                    id="progressedToHigherLevel"
                    name="progressedToHigherLevel"
                    value={progressedToHigherLevel}
                    onChange={setProgressedToHigherLevel}
                    disabled={loading}
                  >
                    <option value="">Not assessed</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </NullableSelect>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="completedFullSeason">Completed Full Season?</Label>
                  <NullableSelect
                    id="completedFullSeason"
                    name="completedFullSeason"
                    value={completedFullSeason}
                    onChange={setCompletedFullSeason}
                    disabled={loading}
                  >
                    <option value="">Not assessed</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </NullableSelect>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="joinedSchoolRegionalTeam">
                    Joined School / Regional Team?
                  </Label>
                  <NullableSelect
                    id="joinedSchoolRegionalTeam"
                    name="joinedSchoolRegionalTeam"
                    value={joinedSchoolRegionalTeam}
                    onChange={setJoinedSchoolRegionalTeam}
                    disabled={loading}
                  >
                    <option value="">Not assessed</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </NullableSelect>
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="nextStepGoal">Next Step / Goal</Label>
                  <Textarea
                    id="nextStepGoal"
                    name="nextStepGoal"
                    rows={3}
                    defaultValue={player?.nextStepGoal || ''}
                    disabled={loading}
                    placeholder="Describe the player's next development goal..."
                  />
                </div>
              </div>
            </section>
          </TabsContent>

          {/* ── Academics Tab ── */}
          <TabsContent forceMount value="academics" className="space-y-6 data-[state=inactive]:hidden">
            <section className="rounded-lg border p-4 md:p-5">
              <h2 className="text-base font-semibold">Academics</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Rate academic level from 1 (lowest) to 5 (highest). Improvement is calculated
                automatically.
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <Label className="min-w-[160px]">Academic Baseline</Label>
                  <ScoreInput
                    id="academicBaseline"
                    name="academicBaseline"
                    value={academicBaseline}
                    onChange={setAcademicBaseline}
                    disabled={loading}
                  />
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <Label className="min-w-[160px]">Academic Current</Label>
                  <ScoreInput
                    id="academicCurrent"
                    name="academicCurrent"
                    value={academicCurrent}
                    onChange={setAcademicCurrent}
                    disabled={loading}
                  />
                </div>
              </div>
              {computedAcademicImprovement !== null && (
                <div className="mt-4 flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                  <span className="text-sm font-medium">Academic Improvement</span>
                  <Badge
                    variant={
                      computedAcademicImprovement > 0
                        ? 'default'
                        : computedAcademicImprovement < 0
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="text-sm font-semibold"
                  >
                    {computedAcademicImprovement > 0 ? '+' : ''}
                    {computedAcademicImprovement}
                  </Badge>
                </div>
              )}
            </section>
          </TabsContent>

          {/* ── Literacy Tab ── */}
          <TabsContent forceMount value="literacy" className="space-y-6 data-[state=inactive]:hidden">
            <section className="rounded-lg border p-4 md:p-5">
              <h2 className="text-base font-semibold">Literacy</h2>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3 rounded-md border p-3">
                  <Checkbox
                    id="literacyEnrolled"
                    checked={literacyEnrolled}
                    onCheckedChange={(v) => setLiteracyEnrolled(!!v)}
                    disabled={loading}
                  />
                  <Label htmlFor="literacyEnrolled" className="cursor-pointer">
                    Literacy Enrolled?
                  </Label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Reading Level Baseline</Label>
                    <ScoreInput
                      id="literacyReadingBaseline"
                      name="literacyReadingBaseline"
                      value={literacyReadingBaseline}
                      onChange={setLiteracyReadingBaseline}
                      disabled={loading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Reading Level Current</Label>
                    <ScoreInput
                      id="literacyReadingCurrent"
                      name="literacyReadingCurrent"
                      value={literacyReadingCurrent}
                      onChange={setLiteracyReadingCurrent}
                      disabled={loading}
                    />
                  </div>
                </div>

                {computedLiteracyImprovement !== null && (
                  <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                    <span className="text-sm font-medium">Reading Improvement</span>
                    <Badge
                      variant={
                        computedLiteracyImprovement > 0
                          ? 'default'
                          : computedLiteracyImprovement < 0
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="text-sm font-semibold"
                    >
                      {computedLiteracyImprovement > 0 ? '+' : ''}
                      {computedLiteracyImprovement}
                    </Badge>
                  </div>
                )}

                <div className="grid gap-2 md:w-1/2">
                  <Label htmlFor="literacySessionsAttended">Literacy Sessions Attended</Label>
                  <Input
                    id="literacySessionsAttended"
                    name="literacySessionsAttended"
                    type="number"
                    min={0}
                    value={literacySessionsAttended}
                    onChange={(e) => setLiteracySessionsAttended(e.target.value)}
                    disabled={loading}
                    placeholder="0"
                  />
                </div>
              </div>
            </section>

            {isEditing && player && literacySessions !== undefined && (
              <section className="rounded-lg border p-4 md:p-5">
                <LiteracySessionLogs
                  sessions={literacySessions}
                  playerId={player.id}
                  canEdit={true}
                />
              </section>
            )}
          </TabsContent>

          {/* ── Stay In The Game Tab ── */}
          <TabsContent forceMount value="stay-in-the-game" className="space-y-6 data-[state=inactive]:hidden">
            {!isInSitgTeam ? (
              <section className="rounded-lg border p-4 md:p-5">
                <h2 className="text-base font-semibold">Stay In The Game</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  This player is not enrolled in the Stay In The Game programme. Add them to the
                  &quot;Stay In The Game&quot; team on the Profile tab to enable these fields.
                </p>
              </section>
            ) : (
              <section className="rounded-lg border p-4 md:p-5">
                <h2 className="text-base font-semibold">Stay In The Game</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Score Change and Improvement Met are calculated automatically.
                </p>
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="sitgPreSurveyScore">Pre-Survey Score (1–65)</Label>
                      <Input
                        id="sitgPreSurveyScore"
                        type="number"
                        min={1}
                        max={65}
                        placeholder="e.g. 30"
                        value={sitgPreSurveyScore}
                        onChange={(e) => setSitgPreSurveyScore(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sitgPostSurveyScore">Post-Survey Score (1–65)</Label>
                      <Input
                        id="sitgPostSurveyScore"
                        type="number"
                        min={1}
                        max={65}
                        placeholder="e.g. 42"
                        value={sitgPostSurveyScore}
                        onChange={(e) => setSitgPostSurveyScore(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {sitgScoreChange !== null && (
                    <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                      <span className="text-sm font-medium">Score Change</span>
                      <Badge
                        variant={sitgScoreChange >= 8 ? 'default' : sitgScoreChange < 0 ? 'destructive' : 'secondary'}
                        className="text-sm font-semibold"
                      >
                        {sitgScoreChange > 0 ? '+' : ''}{sitgScoreChange}
                      </Badge>
                    </div>
                  )}

                  {sitgScoreChange !== null && (
                    <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                      <span className="text-sm font-medium">Improvement Met? (+8)</span>
                      <Badge
                        variant={sitgScoreChange >= 8 ? 'default' : 'secondary'}
                        className="text-sm font-semibold"
                      >
                        {sitgScoreChange >= 8 ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  )}

                  <div className="grid gap-2 md:w-1/2">
                    <Label htmlFor="sitgSatisfactionRating">Participant Satisfaction Rating (1–5)</Label>
                    <Input
                      id="sitgSatisfactionRating"
                      type="number"
                      min={1}
                      max={5}
                      placeholder="e.g. 4"
                      value={sitgSatisfactionRating}
                      onChange={(e) => setSitgSatisfactionRating(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </section>
            )}
          </TabsContent>

          {/* ── Notes Tab ── */}
          <TabsContent forceMount value="notes" className="space-y-6 data-[state=inactive]:hidden">
            <section className="rounded-lg border p-4 md:p-5">
              <h2 className="text-base font-semibold">Notes</h2>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="notes">General Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    defaultValue={player?.notes || ''}
                    disabled={loading}
                  />
                </div>
              </div>
            </section>

            {isEditing && player && playerNotes !== undefined && (
              <section className="rounded-lg border p-4 md:p-5">
                <PlayerNoteLogs
                  notes={playerNotes}
                  playerId={player.id}
                  canEdit={true}
                />
              </section>
            )}
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}
