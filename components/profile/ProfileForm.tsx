'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '@/lib/auth'
import Image from 'next/image'

// Add to next.config.js if not already present

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const [contactNumber, setContactNumber] = useState(user.contactNumber || '')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(user.profileImageUrl)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()

    try {
      let profileImageUrl = user.profileImageUrl

      // Upload profile image if selected
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop()
        const fileName = `${user.id}-${Math.random()}.${fileExt}`
        const filePath = `profile-photos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, profileImage)

        if (uploadError) {
          throw uploadError
        }

        const { data } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath)

        profileImageUrl = data.publicUrl
      }

      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({
          contactNumber: contactNumber || null,
          profileImageUrl,
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      router.refresh()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-500/15 text-green-700 dark:text-green-400'
              : 'bg-destructive/15 text-destructive'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="profileImage">Profile Photo</Label>
        <div className="flex items-center gap-4">
          {preview && (
            <div className="relative h-20 w-20 overflow-hidden rounded-full border">
              <Image
                src={preview}
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
          )}
          <Input
            id="profileImage"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
            className="max-w-xs"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactNumber">Contact Number</Label>
        <Input
          id="contactNumber"
          type="tel"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          placeholder="+1 (555) 123-4567"
          disabled={loading}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Profile'}
      </Button>
    </form>
  )
}
