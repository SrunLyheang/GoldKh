"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function parseDateKey(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  const [, y, m, d] = match
  return new Date(Number(y), Number(m) - 1, Number(d))
}

// Hand-rolled month grid instead of a new dependency (react-day-picker,
// etc.) — the project has stayed dependency-light apart from recharts
// (an explicit user choice), and a plain "pick a day from a grid" calendar
// doesn't need a library.
export function Calendar({
  value,
  onSelect,
  className,
}: {
  value?: string
  onSelect: (dateKey: string) => void
  className?: string
}) {
  const selected = value ? parseDateKey(value) : undefined
  const [viewDate, setViewDate] = React.useState(() => selected ?? new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = toDateKey(new Date())

  const cells: Array<{ date: Date; inMonth: boolean }> = []
  for (let i = 0; i < startWeekday; i++) {
    const d = new Date(year, month, 1 - (startWeekday - i))
    cells.push({ date: d, inMonth: false })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), inMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false })
  }

  return (
    <div className={cn("w-64", className)}>
      <div className="mb-2 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-[13.5px] font-medium text-foreground">
          {viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="flex h-7 items-center justify-center text-[11px] font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
        {cells.map(({ date, inMonth }) => {
          const key = toDateKey(date)
          const isSelected = key === value
          const isToday = key === today
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md text-[12.5px] tabular-nums transition-colors",
                !inMonth && "text-muted-foreground/40",
                inMonth && !isSelected && "text-foreground hover:bg-accent",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && isToday && "ring-1 ring-inset ring-border"
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
