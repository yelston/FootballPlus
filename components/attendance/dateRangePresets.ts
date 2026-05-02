import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'

export type DateRangePreset = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom'

export const DATE_RANGE_PRESET_OPTIONS: Array<{
  value: DateRangePreset
  label: string
}> = [
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'custom', label: 'Custom' },
]

interface DateRange {
  from: string
  to: string
}

const toDateInputValue = (date: Date) => format(date, 'yyyy-MM-dd')

export const getDateRangeForPreset = (
  preset: Exclude<DateRangePreset, 'custom'>,
  now: Date = new Date()
): DateRange => {
  if (preset === 'thisWeek') {
    return {
      from: toDateInputValue(startOfWeek(now, { weekStartsOn: 1 })),
      to: toDateInputValue(endOfWeek(now, { weekStartsOn: 1 })),
    }
  }

  if (preset === 'lastWeek') {
    const lastWeekDate = subWeeks(now, 1)
    return {
      from: toDateInputValue(startOfWeek(lastWeekDate, { weekStartsOn: 1 })),
      to: toDateInputValue(endOfWeek(lastWeekDate, { weekStartsOn: 1 })),
    }
  }

  if (preset === 'thisMonth') {
    return {
      from: toDateInputValue(startOfMonth(now)),
      to: toDateInputValue(endOfMonth(now)),
    }
  }

  const lastMonthDate = subMonths(now, 1)
  return {
    from: toDateInputValue(startOfMonth(lastMonthDate)),
    to: toDateInputValue(endOfMonth(lastMonthDate)),
  }
}
