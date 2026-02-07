'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlayerBackButtonProps {
  fallbackHref: string
}

export function PlayerBackButton({ fallbackHref }: PlayerBackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push(fallbackHref)
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleBack}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to Players
    </Button>
  )
}
