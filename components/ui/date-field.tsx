"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar, toDateKey } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function formatDisplay(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// Backs a `name`d form field with a hidden input (so the surrounding
// <form action={...}> keeps reading it via FormData like every other
// field) while the visible control is a calendar popover instead of a
// native <input type="date">. Defaults to today rather than empty — a
// hidden input's `required` isn't enforced by the browser, so an empty
// default would only be caught server-side after submit.
export function DateField({
  name,
  defaultValue,
}: {
  name: string
  defaultValue?: string
}) {
  const [value, setValue] = React.useState(defaultValue ?? toDateKey(new Date()))
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className={cn(
                "flex h-8 w-full items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-[13.5px] text-foreground outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {formatDisplay(value)}
            </button>
          }
        />
        <PopoverContent>
          <Calendar
            value={value}
            onSelect={(dateKey) => {
              setValue(dateKey)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </>
  )
}
