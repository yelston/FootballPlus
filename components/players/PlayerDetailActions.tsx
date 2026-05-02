'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'profile'
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
        description={`This will permanently delete ${playerName}. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={loading}
        requireTypedConfirmation="delete"
      />

      {/* Desktop */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/players/${playerId}/edit?tab=${currentTab}`}>Edit</Link>
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
          Delete
        </Button>
      </div>

      {/* Mobile */}
      <div className="flex sm:hidden shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/players/${playerId}/edit?tab=${currentTab}`} className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive flex items-center gap-2"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
