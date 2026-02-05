'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarView } from './CalendarView'
import { ListView } from './ListView'
import { AnalyticsView } from './AnalyticsView'

interface Team {
  id: string
  name: string
}

interface Player {
  id: string
  firstName: string
  lastName: string
  teamId: string | null
}

interface AttendanceViewProps {
  teams: Team[]
  players: Player[]
  canEdit: boolean
}

export function AttendanceView({ teams, players, canEdit }: AttendanceViewProps) {
  return (
    <Tabs defaultValue="calendar" className="w-full min-w-0 overflow-hidden">
      <TabsList className="grid h-auto w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] overflow-hidden lg:h-10">
        <TabsTrigger value="calendar" className="min-w-0 truncate px-2 sm:px-3">
          Calendar
        </TabsTrigger>
        <TabsTrigger value="list" className="min-w-0 truncate px-2 sm:px-3">
          List
        </TabsTrigger>
        <TabsTrigger value="analytics" className="min-w-0 truncate px-2 sm:px-3">
          Analytics
        </TabsTrigger>
      </TabsList>
      <TabsContent value="calendar" className="mt-2 lg:mt-6">
        <CalendarView teams={teams} players={players} canEdit={canEdit} />
      </TabsContent>
      <TabsContent value="list" className="mt-2 lg:mt-6">
        <ListView teams={teams} players={players} canEdit={canEdit} />
      </TabsContent>
      <TabsContent value="analytics" className="mt-2 lg:mt-6">
        <AnalyticsView teams={teams} />
      </TabsContent>
    </Tabs>
  )
}
