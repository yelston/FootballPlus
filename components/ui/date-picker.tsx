"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: boolean
  placeholder?: string
  fromYear?: number
  toYear?: number
  className?: string
}

const MONTHS = [
  { value: 0, label: "Jan" },
  { value: 1, label: "Feb" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Apr" },
  { value: 4, label: "May" },
  { value: 5, label: "Jun" },
  { value: 6, label: "Jul" },
  { value: 7, label: "Aug" },
  { value: 8, label: "Sep" },
  { value: 9, label: "Oct" },
  { value: 10, label: "Nov" },
  { value: 11, label: "Dec" },
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
  )
}

export function DatePicker({
  date,
  onSelect,
  disabled = false,
  placeholder = "Select date",
  fromYear = 1900,
  toYear = new Date().getFullYear(),
  className,
}: DatePickerProps) {
  const [selectedYear, setSelectedYear] = React.useState<number | undefined>(
    date?.getFullYear()
  )
  const [selectedMonth, setSelectedMonth] = React.useState<number | undefined>(
    date?.getMonth()
  )
  const [selectedDay, setSelectedDay] = React.useState<number | undefined>(
    date?.getDate()
  )

  // Update local state when date prop changes
  React.useEffect(() => {
    if (date) {
      setSelectedYear(date.getFullYear())
      setSelectedMonth(date.getMonth())
      setSelectedDay(date.getDate())
    } else {
      setSelectedYear(undefined)
      setSelectedMonth(undefined)
      setSelectedDay(undefined)
    }
  }, [date])

  // Generate years array
  const years = React.useMemo(() => {
    const yearArray: number[] = []
    for (let year = toYear; year >= fromYear; year--) {
      yearArray.push(year)
    }
    return yearArray
  }, [fromYear, toYear])

  // Generate days array based on selected month and year
  const days = React.useMemo(() => {
    if (selectedYear === undefined || selectedMonth === undefined) {
      return Array.from({ length: 31 }, (_, i) => i + 1)
    }
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }, [selectedYear, selectedMonth])

  // Validate and create date when any value changes
  React.useEffect(() => {
    if (
      selectedYear !== undefined &&
      selectedMonth !== undefined &&
      selectedDay !== undefined
    ) {
      // Validate the date
      if (isValidDate(selectedYear, selectedMonth, selectedDay)) {
        const newDate = new Date(selectedYear, selectedMonth, selectedDay)
        // Prevent future dates
        if (newDate <= new Date()) {
          onSelect?.(newDate)
        } else {
          onSelect?.(undefined)
        }
      } else {
        onSelect?.(undefined)
      }
    } else {
      onSelect?.(undefined)
    }
  }, [selectedYear, selectedMonth, selectedDay, onSelect])

  // Adjust day if it's invalid for the selected month/year
  React.useEffect(() => {
    if (
      selectedYear !== undefined &&
      selectedMonth !== undefined &&
      selectedDay !== undefined
    ) {
      const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
      if (selectedDay > daysInMonth) {
        setSelectedDay(daysInMonth)
      }
    }
  }, [selectedYear, selectedMonth, selectedDay])

  const handleYearChange = (value: string) => {
    const year = parseInt(value, 10)
    setSelectedYear(year)
  }

  const handleMonthChange = (value: string) => {
    const month = parseInt(value, 10)
    setSelectedMonth(month)
  }

  const handleDayChange = (value: string) => {
    const day = parseInt(value, 10)
    setSelectedDay(day)
  }

  const displayValue = React.useMemo(() => {
    if (
      selectedYear !== undefined &&
      selectedMonth !== undefined &&
      selectedDay !== undefined
    ) {
      const tempDate = new Date(selectedYear, selectedMonth, selectedDay)
      if (isValidDate(selectedYear, selectedMonth, selectedDay)) {
        return format(tempDate, "PPP")
      }
    }
    return null
  }, [selectedYear, selectedMonth, selectedDay])

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <SelectRoot
          value={selectedDay?.toString()}
          onValueChange={handleDayChange}
          disabled={disabled}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent>
            {days.map((day) => (
              <SelectItem key={day} value={day.toString()}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>

        <SelectRoot
          value={selectedMonth?.toString()}
          onValueChange={handleMonthChange}
          disabled={disabled}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month) => (
              <SelectItem key={month.value} value={month.value.toString()}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>

        <SelectRoot
          value={selectedYear?.toString()}
          onValueChange={handleYearChange}
          disabled={disabled}
        >
          <SelectTrigger className="flex-[1.5]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      </div>
      {displayValue && (
        <div className="text-sm text-muted-foreground">{displayValue}</div>
      )}
    </div>
  )
}

interface DateOfBirthPickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: boolean
}

export function DateOfBirthPicker({
  date,
  onSelect,
  disabled = false,
}: DateOfBirthPickerProps) {
  return (
    <DatePicker
      date={date}
      onSelect={onSelect}
      disabled={disabled}
      placeholder="Select date"
      fromYear={2000}
      toYear={2040}
    />
  )
}
