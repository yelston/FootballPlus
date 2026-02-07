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
import type { Database } from '@/types/database'

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

interface PlayerFormPageProps {
  mode: PlayerFormMode
  teams: TeamOption[]
  positions: PositionOption[]
  player?: PlayerRow
}

export function PlayerFormPage({ mode, teams, positions, player }: PlayerFormPageProps) {
  const router = useRouter()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [dobDate, setDobDate] = useState<Date | undefined>(
    player?.dob ? new Date(player.dob) : undefined
  )

  const [selectedPositions, setSelectedPositions] = useState<string[]>(player?.positions || [])
  const [positionsPopoverOpen, setPositionsPopoverOpen] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string>(player?.teamId || '')
  const [contactNumber, setContactNumber] = useState<string>(player?.contactNumber || '')
  const [guardianPhone, setGuardianPhone] = useState<string>(player?.guardianPhone || '')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string>(
    player?.emergencyContactPhone || ''
  )
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)

  const [photoConsent, setPhotoConsent] = useState<boolean>(player?.photoConsent || false)
  const [medicalConsent, setMedicalConsent] = useState<boolean>(player?.medicalConsent || false)
  const [transportConsent, setTransportConsent] = useState<boolean>(player?.transportConsent || false)

  const positionNames = useMemo(() => positions.map((p) => p.name), [positions])
  const isEditing = mode === 'edit'

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
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const getProfileImageUrl = () => {
    return profileImagePreview || player?.profileImageUrl || null
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

    if (!firstName) {
      errors.firstName = 'First name is required'
    }

    if (!lastName) {
      errors.lastName = 'Last name is required'
    }

    if (!dobDate) {
      errors.dob = 'Date of birth is required'
    }

    if (!selectedTeamId) {
      errors.teamId = 'Please select a team'
    }

    if (positionNames.length > 0 && selectedPositions.length === 0) {
      errors.positions = 'At least one position is required'
    }

    if (!guardianName) {
      errors.guardianName = 'Guardian name is required'
    }

    if (!guardianPhoneValue) {
      errors.guardianPhone = 'Guardian phone is required'
    }

    if (guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) {
      errors.guardianEmail = 'Enter a valid guardian email'
    }

    if (jerseyNumberValue) {
      const jerseyNumber = Number(jerseyNumberValue)
      if (!Number.isInteger(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99) {
        errors.jerseyNumber = 'Jersey number must be an integer from 1 to 99'
      }
    }

    const injuryStatus = String(formData.get('injuryStatus') || 'none')
    if (!['none', 'rehab', 'restricted', 'unavailable'].includes(injuryStatus)) {
      errors.injuryStatus = 'Invalid injury status'
    }

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

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data } = supabase.storage.from('player-photos').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!validateForm(e.currentTarget)) {
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    try {
      const profileImageUrl = await uploadProfileImageIfAny(formData)
      const jerseyNumberRaw = String(formData.get('jerseyNumber') || '').trim()

      const payload = {
        firstName: String(formData.get('firstName') || '').trim(),
        lastName: String(formData.get('lastName') || '').trim(),
        preferredName: String(formData.get('preferredName') || '').trim() || null,
        dob: dobDate ? dobDate.toISOString().split('T')[0] : null,
        positions: selectedPositions,
        teamId: selectedTeamId || null,
        profileImageUrl,
        contactNumber: String(formData.get('contactNumber') || '').trim() || null,
        guardianName: String(formData.get('guardianName') || '').trim() || null,
        guardianRelationship: String(formData.get('guardianRelationship') || '').trim() || null,
        guardianPhone: String(formData.get('guardianPhone') || '').trim() || null,
        guardianEmail: String(formData.get('guardianEmail') || '').trim() || null,
        emergencyContactName: String(formData.get('emergencyContactName') || '').trim() || null,
        emergencyContactRelationship:
          String(formData.get('emergencyContactRelationship') || '').trim() || null,
        emergencyContactPhone: String(formData.get('emergencyContactPhone') || '').trim() || null,
        dominantFoot: String(formData.get('dominantFoot') || '').trim() || null,
        jerseyNumber: jerseyNumberRaw ? Number(jerseyNumberRaw) : null,
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
      }

      if (isEditing && player) {
        const playersTable = supabase.from('players') as any
        const { error: updateError } = await playersTable.update(payload).eq('id', player.id)

        if (updateError) {
          throw new Error(updateError.message)
        }

        toast.success('Player updated')
        router.push(`/players/${player.id}`)
      } else {
        const playersTable = supabase.from('players') as any
        const { data, error: insertError } = await playersTable.insert(payload).select('id').single()

        if (insertError || !data) {
          throw new Error(insertError?.message || 'Failed to create player')
        }

        toast.success('Player created')
        router.push(`/players/${data.id}`)
      }

      router.refresh()
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : 'Failed to save player'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">{isEditing ? 'Edit Player' : 'New Player'}</h1>
        <p className="text-muted-foreground">
          {isEditing ? 'Update player profile information.' : 'Create a complete youth academy profile.'}
        </p>
      </div>

      <form id="player-form" onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
        )}

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
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={player?.firstName || ''}
                disabled={loading}
                className={cn(fieldErrors.firstName && 'border-destructive')}
              />
              {fieldErrors.firstName && <p className="text-sm text-destructive">{fieldErrors.firstName}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={player?.lastName || ''}
                disabled={loading}
                className={cn(fieldErrors.lastName && 'border-destructive')}
              />
              {fieldErrors.lastName && <p className="text-sm text-destructive">{fieldErrors.lastName}</p>}
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
              <Label htmlFor="dob">Date of Birth *</Label>
              <div className={cn(fieldErrors.dob && 'rounded-md ring-2 ring-destructive ring-offset-2')}>
                <DateOfBirthPicker date={dobDate} onSelect={setDobDate} disabled={loading} />
              </div>
              {fieldErrors.dob && <p className="text-sm text-destructive">{fieldErrors.dob}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dominantFoot">Dominant Foot</Label>
              <Select id="dominantFoot" name="dominantFoot" defaultValue={player?.dominantFoot || ''}>
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

            <div className="grid gap-2">
              <Label htmlFor="teamId">Team *</Label>
              <Select
                id="teamId"
                name="teamId"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={loading}
                className={cn(fieldErrors.teamId && 'border-destructive')}
              >
                <option value="">Select a team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
              {fieldErrors.teamId && <p className="text-sm text-destructive">{fieldErrors.teamId}</p>}
            </div>

            <div className="grid gap-2">
              <Label>Positions *</Label>
              <div className={cn('relative', fieldErrors.positions && 'rounded-md ring-2 ring-destructive ring-offset-2')}>
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
                                  setSelectedPositions(selectedPositions.filter((p) => p !== position))
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
                      <Button type="button" size="sm" variant="secondary" onClick={() => setPositionsPopoverOpen(false)}>
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {fieldErrors.positions && <p className="text-sm text-destructive">{fieldErrors.positions}</p>}
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
              <Label htmlFor="guardianName">Guardian Name *</Label>
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
              <Label htmlFor="guardianPhone">Guardian Phone *</Label>
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
              <Label htmlFor="emergencyContactRelationship">Emergency Contact Relationship</Label>
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
                  <Checkbox checked={photoConsent} onCheckedChange={(v) => setPhotoConsent(!!v)} />
                  <span className="text-sm">Photo consent</span>
                </label>
                <label className="flex cursor-pointer items-center space-x-2">
                  <Checkbox checked={medicalConsent} onCheckedChange={(v) => setMedicalConsent(!!v)} />
                  <span className="text-sm">Medical consent</span>
                </label>
                <label className="flex cursor-pointer items-center space-x-2">
                  <Checkbox checked={transportConsent} onCheckedChange={(v) => setTransportConsent(!!v)} />
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
              <Textarea id="strengths" name="strengths" rows={3} defaultValue={player?.strengths || ''} disabled={loading} />
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
            <div className="grid gap-2">
              <Label htmlFor="notes">General Notes</Label>
              <Textarea id="notes" name="notes" rows={3} defaultValue={player?.notes || ''} disabled={loading} />
            </div>
          </div>
        </section>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-3 p-4">
          <Button type="button" variant="outline" asChild>
            <Link href={isEditing && player ? `/players/${player.id}` : '/players'}>Cancel</Link>
          </Button>
          <Button form="player-form" type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Player'}
          </Button>
        </div>
      </div>
    </div>
  )
}
