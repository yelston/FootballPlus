"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-month={day.date.getMonth()}
      data-year={day.date.getFullYear()}
      data-selected={modifiers.selected}
      data-today={modifiers.today}
      data-outside={modifiers.outside}
      data-disabled={modifiers.disabled}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "h-[var(--cell-size,2.25rem)] w-[var(--cell-size,2.25rem)] p-0 font-normal transition-colors",
        "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:opacity-100",
        "data-[today=true]:bg-accent data-[today=true]:text-accent-foreground",
        "data-[outside=true]:text-muted-foreground data-[outside=true]:opacity-50",
        "data-[disabled=true]:text-muted-foreground data-[disabled=true]:opacity-50",
        "data-[range-start=true]:rounded-s-[var(--cell-radius,0.375rem)]",
        "data-[range-end=true]:rounded-e-[var(--cell-radius,0.375rem)]",
        "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()
  const isDropdownLayout = captionLayout === "dropdown"

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code || "en-US", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn(defaultClassNames.root, "relative"),
        months: cn(
          defaultClassNames.months,
          "flex flex-col sm:flex-row gap-y-4 sm:gap-x-4 sm:gap-y-0"
        ),
        month: cn(defaultClassNames.month, "gap-y-4 overflow-x-hidden w-full"),
        month_caption: cn(
          defaultClassNames.month_caption,
          isDropdownLayout
            ? "relative flex h-7 items-center justify-center"
            : "relative mx-10 flex h-7 items-center justify-center"
        ),
        caption_label: cn(
          defaultClassNames.caption_label,
          "truncate text-sm font-medium",
          isDropdownLayout && "!hidden"
        ),
        button_previous: cn(
          defaultClassNames.button_previous,
          isDropdownLayout
            ? "!hidden"
            : "absolute start-0 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        button_next: cn(
          defaultClassNames.button_next,
          isDropdownLayout
            ? "!hidden"
            : "absolute end-0 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        month_grid: cn(defaultClassNames.month_grid, "mt-4"),
        weekdays: cn(defaultClassNames.weekdays, "flex flex-row"),
        weekday: cn(
          defaultClassNames.weekday,
          "w-[var(--cell-size,2.25rem)] text-[0.8rem] font-normal text-muted-foreground"
        ),
        week: cn(defaultClassNames.week, "mt-2 flex w-full"),
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([data-selected=true])]:bg-accent [&:has([data-selected=true][data-outside=true])]:bg-accent/50",
          "[&:first-child[data-selected=true]_button]:rounded-s-[var(--cell-radius,0.375rem)]",
          "[&:last-child[data-selected=true]_button]:rounded-e-[var(--cell-radius,0.375rem)]",
          "[&:nth-child(2)[data-selected=true]_button]:rounded-s-[var(--cell-radius,0.375rem)]"
        ),
        day_button: cn(
          "h-[var(--cell-size,2.25rem)] w-[var(--cell-size,2.25rem)]"
        ),
        range_start: "day-range-start rounded-s-[var(--cell-radius,0.375rem)] after:absolute after:inset-y-0 after:end-0 after:w-1/2 after:bg-accent after:-z-10",
        range_end: "day-range-end rounded-e-[var(--cell-radius,0.375rem)] after:absolute after:inset-y-0 after:start-0 after:w-1/2 after:bg-accent after:-z-10",
        selected: "",
        today: "",
        outside: "",
        disabled: "",
        range_middle: "",
        hidden: "invisible",
        dropdowns: cn(defaultClassNames.dropdowns, "flex gap-2 justify-center"),
        dropdown: cn(
          defaultClassNames.dropdown,
          "h-8 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        ),
        ...classNames,
      }}
      components={{
        ...(isDropdownLayout
          ? {}
          : {
              Chevron: ({ orientation }) =>
                orientation === "left" ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                ),
            }),
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        Dropdown: ({ value, onChange, children, ...props }) => {
          return (
            <select
              className={cn(
                "flex h-8 w-fit items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
                props.className
              )}
              value={value}
              onChange={(e) => {
                const changeEvent = e as React.ChangeEvent<HTMLSelectElement>
                onChange?.(changeEvent)
              }}
            >
              {children}
            </select>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
