'use client'

import { Loader2 } from 'lucide-react'
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DASHBOARD_PRESET_OPTIONS,
  getDateRangeForPreset,
  type DashboardPreset,
} from './dashboardPresets'
import { format } from 'date-fns'

interface DashboardHeaderProps {
  userName: string
  preset: DashboardPreset
  onPresetChange: (preset: DashboardPreset) => void
  loading: boolean
}

export function DashboardHeader({ userName, preset, onPresetChange, loading }: DashboardHeaderProps) {
  const range = getDateRangeForPreset(preset)
  const label = `${format(new Date(range.from + 'T00:00:00'), 'd MMM yyyy')} – ${format(new Date(range.to + 'T00:00:00'), 'd MMM yyyy')}`

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {userName}</p>
      </div>
      <div className="flex flex-col items-start gap-1 sm:items-end sm:mt-1">
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <SelectRoot value={preset} onValueChange={(v) => onPresetChange(v as DashboardPreset)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DASHBOARD_PRESET_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
