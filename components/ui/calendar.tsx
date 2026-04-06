"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  mode?: "single"
  showOutsideDays?: boolean
  showTimePicker?: boolean
  defaultHour?: number
  defaultMinute?: number
  disabled?: (date: Date) => boolean
  className?: string
  initialFocus?: boolean
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

export function Calendar({
  selected,
  onSelect,
  disabled,
  showOutsideDays = true,
  showTimePicker = false,
  defaultHour = 18,
  defaultMinute = 0,
  className,
}: CalendarProps) {
  const today = new Date()

  const [viewYear, setViewYear] = React.useState(
    selected ? selected.getFullYear() : today.getFullYear()
  )
  const [viewMonth, setViewMonth] = React.useState(
    selected ? selected.getMonth() : today.getMonth()
  )

  // Time state — defaults to defaultHour/defaultMinute when no date is selected yet
  const [hours, setHours] = React.useState(selected ? selected.getHours() : defaultHour)
  const [minutes, setMinutes] = React.useState(selected ? selected.getMinutes() : defaultMinute)
  const [useCustomTime, setUseCustomTime] = React.useState(false)

  // Build grid
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const daysInPrev = getDaysInMonth(viewYear, viewMonth - 1)

  const cells: { date: Date; outside: boolean }[] = []
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    cells.push({ date: new Date(viewYear, viewMonth - 1, daysInPrev - i), outside: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(viewYear, viewMonth, d), outside: false })
  }
  let next = 1
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(viewYear, viewMonth + 1, next++), outside: true })
  }

  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const buildDate = (base: Date, h: number, m: number) => {
    const d = new Date(base)
    d.setHours(h, m, 0, 0)
    return d
  }

  const handleDayClick = (date: Date, outside: boolean) => {
    if (!showOutsideDays && outside) return
    if (disabled?.(date)) return
    if (selected && isSameDay(selected, date)) {
      onSelect?.(undefined)
    } else {
      const h = useCustomTime ? hours : defaultHour
      const m = useCustomTime ? minutes : defaultMinute
      onSelect?.(buildDate(date, h, m))
    }
  }

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setHours(newHours)
    setMinutes(newMinutes)
    if (selected) {
      onSelect?.(buildDate(selected, newHours, newMinutes))
    }
  }

  return (
    <div className={cn("p-3 select-none w-[280px]", className)}>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="h-7 w-7 flex items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="h-7 w-7 flex items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[0.75rem] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map(({ date, outside }, di) => {
              const isSelected = selected ? isSameDay(selected, date) : false
              const isToday = isSameDay(date, today)
              const isDisabled = disabled?.(date) ?? false
              const hide = outside && !showOutsideDays

              return (
                <div key={di} className="flex items-center justify-center">
                  {hide ? (
                    <span className="h-9 w-9" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDayClick(date, outside)}
                      disabled={isDisabled}
                      className={cn(
                        "h-9 w-9 rounded-md text-sm transition-colors flex items-center justify-center",
                        outside && "text-muted-foreground opacity-50",
                        isToday && !isSelected && "ring-2 ring-primary text-primary font-semibold",
                        isSelected && "bg-primary text-primary-foreground font-semibold",
                        !isSelected && !isDisabled && "hover:bg-primary/15 hover:text-primary",
                        isDisabled && "opacity-30 cursor-not-allowed"
                      )}
                    >
                      {date.getDate()}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Time picker */}
      {showTimePicker && (
        <div className="mt-3 border-t pt-3 space-y-2">
          {/* Toggle custom time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Set time</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !useCustomTime
                setUseCustomTime(next)
                if (selected) {
                  const h = next ? hours : selected.getHours()
                  const m = next ? minutes : selected.getMinutes()
                  onSelect?.(buildDate(selected, h, m))
                }
              }}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                useCustomTime ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                  useCustomTime ? "translate-x-4" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {/* Time inputs */}
          {useCustomTime && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Hour</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={pad(hours)}
                  onChange={e => {
                    const v = Math.min(23, Math.max(0, parseInt(e.target.value) || 0))
                    handleTimeChange(v, minutes)
                  }}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <span className="text-lg font-semibold text-muted-foreground mt-4">:</span>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Minute</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={pad(minutes)}
                  onChange={e => {
                    const v = Math.min(59, Math.max(0, parseInt(e.target.value) || 0))
                    handleTimeChange(hours, v)
                  }}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {/* Quick presets */}
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Preset</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-1 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  value=""
                  onChange={e => {
                    const [h, m] = e.target.value.split(":").map(Number)
                    handleTimeChange(h, m)
                  }}
                >
                  <option value="">--</option>
                  <option value="6:0">6:00 AM</option>
                  <option value="8:0">8:00 AM</option>
                  <option value="9:0">9:00 AM</option>
                  <option value="12:0">12:00 PM</option>
                  <option value="14:0">2:00 PM</option>
                  <option value="17:0">5:00 PM</option>
                  <option value="18:0">6:00 PM</option>
                  <option value="20:0">8:00 PM</option>
                </select>
              </div>
            </div>
          )}

          {/* Display selected datetime */}
          {selected && (
            <p className="text-xs text-center text-muted-foreground pt-1">
              {selected.toLocaleDateString()} at{" "}
              <span className="font-medium text-foreground">
                {pad(selected.getHours())}:{pad(selected.getMinutes())}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

Calendar.displayName = "Calendar"
export default Calendar
