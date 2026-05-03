import {
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from 'date-fns'

export type DashboardPreset =
  | 'thisWeek'
  | 'nextWeek'
  | 'thisMonth'
  | 'nextMonth'
  | 'thisQuarter'
  | 'nextQuarter'
  | 'thisYear'
  | 'nextYear'

export const DASHBOARD_PRESET_OPTIONS: Array<{ value: DashboardPreset; label: string }> = [
  { value: 'thisWeek', label: 'This Week' },
  { value: 'nextWeek', label: 'Next Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'nextMonth', label: 'Next Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'nextQuarter', label: 'Next Quarter' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'nextYear', label: 'Next Year' },
]

export interface DateRange {
  from: string
  to: string
}

const toDate = (d: Date) => format(d, 'yyyy-MM-dd')

export function getDateRangeForPreset(preset: DashboardPreset, now: Date = new Date()): DateRange {
  switch (preset) {
    case 'thisWeek':
      return {
        from: toDate(startOfWeek(now, { weekStartsOn: 1 })),
        to: toDate(endOfWeek(now, { weekStartsOn: 1 })),
      }
    case 'nextWeek': {
      const next = addWeeks(now, 1)
      return {
        from: toDate(startOfWeek(next, { weekStartsOn: 1 })),
        to: toDate(endOfWeek(next, { weekStartsOn: 1 })),
      }
    }
    case 'thisMonth':
      return {
        from: toDate(startOfMonth(now)),
        to: toDate(endOfMonth(now)),
      }
    case 'nextMonth': {
      const next = addMonths(now, 1)
      return {
        from: toDate(startOfMonth(next)),
        to: toDate(endOfMonth(next)),
      }
    }
    case 'thisQuarter':
      return {
        from: toDate(startOfQuarter(now)),
        to: toDate(endOfQuarter(now)),
      }
    case 'nextQuarter': {
      const next = addQuarters(now, 1)
      return {
        from: toDate(startOfQuarter(next)),
        to: toDate(endOfQuarter(next)),
      }
    }
    case 'thisYear':
      return {
        from: toDate(startOfYear(now)),
        to: toDate(endOfYear(now)),
      }
    case 'nextYear': {
      const next = addYears(now, 1)
      return {
        from: toDate(startOfYear(next)),
        to: toDate(endOfYear(next)),
      }
    }
  }
}

export function isFutureRange(range: DateRange): boolean {
  return new Date(range.from) > new Date()
}
