import * as React from "react"
import { cn } from "@/lib/utils"
import { DAY_KEYS, DAYS, slotMinutes } from "@/lib/domain"
import { Button } from "@/components/ui/button"
import { control } from "./Form"
import { Eyebrow } from "./primitives"
import { Plus, X } from "lucide-react"

/* ============================================================
   Weekly availability.

   Faculty and Rooms carry the same { monday: [{start,end}], … }
   shape, so the editor and the read-only strip are written once
   and shared by both pages.
   ============================================================ */

export const EMPTY_AVAILABILITY = Object.fromEntries(DAY_KEYS.map((d) => [d, []]))

/** Normalise whatever the API returned into all seven day keys. */
export function toAvailability(value) {
  return Object.fromEntries(
    DAY_KEYS.map((day) => [
      day,
      (value?.[day] || []).map(({ start, end }) => ({ start, end })),
    ])
  )
}

export function totalHours(availability) {
  return (
    DAY_KEYS.reduce(
      (mins, day) =>
        mins +
        (availability?.[day] || []).reduce((n, s) => n + slotMinutes(s.start, s.end), 0),
      0
    ) / 60
  )
}

/* ---------------- editor ---------------- */

export function AvailabilityEditor({ value, onChange, className }) {
  const [day, setDay] = React.useState("monday")
  const [start, setStart] = React.useState("09:00")
  const [end, setEnd] = React.useState("11:00")
  const [error, setError] = React.useState(null)

  const add = () => {
    if (!start || !end) return setError("Pick both a start and an end time.")
    if (slotMinutes(start, end) <= 0) return setError("The end time must come after the start.")

    const existing = value[day] || []
    const overlaps = existing.some((s) => start < s.end && end > s.start)
    if (overlaps) return setError("That overlaps a slot already on this day.")

    setError(null)
    onChange({
      ...value,
      [day]: [...existing, { start, end }].sort((a, b) => a.start.localeCompare(b.start)),
    })
  }

  const remove = (dayKey, index) =>
    onChange({ ...value, [dayKey]: value[dayKey].filter((_, i) => i !== index) })

  const hours = totalHours(value)

  return (
    <div className={cn("space-y-3", className)}>
      {/* add a slot */}
      <div className="rounded-sm border border-line bg-bone p-3">
        <Eyebrow className="mb-2 block text-ink">Add a slot</Eyebrow>
        <div className="flex flex-wrap items-end gap-2">
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            aria-label="Day"
            className={cn(control, "h-8 w-auto min-w-[7.5rem] cursor-pointer text-[12.5px]")}
          >
            {DAYS.map((d) => (
              <option key={d} value={d.toLowerCase()}>
                {d}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            aria-label="Start time"
            className={cn(control, "h-8 w-auto text-[12.5px]")}
          />
          <span className="pb-1.5 text-xs text-mut-2">to</span>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            aria-label="End time"
            className={cn(control, "h-8 w-auto text-[12.5px]")}
          />
          <Button type="button" size="sm" variant="ink" onClick={add}>
            <Plus /> Add
          </Button>
        </div>
        {error && <p className="mt-2 text-[11px] font-medium text-red">{error}</p>}
      </div>

      {/* the week */}
      <div className="overflow-hidden rounded-sm border border-line">
        {DAYS.map((label, i) => {
          const key = label.toLowerCase()
          const slots = value[key] || []
          return (
            <div
              key={key}
              className={cn(
                "flex min-h-11 flex-wrap items-center gap-2 px-3 py-2",
                i > 0 && "border-t border-line-2",
                slots.length === 0 && "bg-bone/60"
              )}
            >
              <span className="w-24 shrink-0 text-[12px] font-semibold text-ink">{label}</span>
              {slots.length === 0 ? (
                <span className="text-[11.5px] text-mut-2">Unavailable</span>
              ) : (
                slots.map((s, index) => (
                  <span
                    key={`${s.start}-${s.end}`}
                    className="co-pop inline-flex items-center gap-1 rounded-[3px] border border-blue/25 bg-blue-soft py-0.5 pl-2 pr-1 font-mono text-[11px] font-medium text-blue"
                  >
                    {s.start}–{s.end}
                    <button
                      type="button"
                      onClick={() => remove(key, index)}
                      aria-label={`Remove ${label} ${s.start} to ${s.end}`}
                      className="co-press grid size-4 place-items-center rounded-[2px] hover:bg-red-soft hover:text-red"
                    >
                      <X className="size-3" strokeWidth={2.6} />
                    </button>
                  </span>
                ))
              )}
            </div>
          )
        })}
      </div>

      <p className="co-index">
        {hours ? `${hours.toFixed(1)} hours available per week` : "No availability set"}
      </p>
    </div>
  )
}

/* ---------------- read-only strip ---------------- */

/** Seven compact columns showing which days carry slots. */
export function AvailabilityStrip({ value, className }) {
  return (
    <div className={cn("flex gap-1", className)}>
      {DAYS.map((label) => {
        const slots = value?.[label.toLowerCase()] || []
        const has = slots.length > 0
        return (
          <div
            key={label}
            title={
              has
                ? `${label}: ${slots.map((s) => `${s.start}–${s.end}`).join(", ")}`
                : `${label}: unavailable`
            }
            className={cn(
              "grid h-6 flex-1 place-items-center rounded-[2px] text-[9.5px] font-bold uppercase transition-colors duration-200",
              has ? "bg-green-soft text-green" : "bg-bone-2 text-mut-2"
            )}
          >
            {label.slice(0, 1)}
          </div>
        )
      })}
    </div>
  )
}
