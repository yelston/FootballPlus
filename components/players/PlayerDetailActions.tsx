'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

interface PlayerDetailActionsProps {
  playerId: string
  playerName: string
  fallbackHref: string
}

export function PlayerDetailActions({ playerId, playerName, fallbackHref }: PlayerDetailActionsProps) {
  const router = useRouter()
  const toast = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from('players').delete().eq('id', playerId)

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Player deleted')
    setLoading(false)
    router.push(fallbackHref)
    router.refresh()
  }

  return (
    <>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete player?"
        description={`This will permanently delete ${playerName}.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={loading}
      />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/players/${playerId}/edit`}>Edit</Link>
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
          Delete
        </Button>
      </div>
    </>
  )
}
