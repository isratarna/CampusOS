import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, X } from "lucide-react"

/* ============================================================
   Form controls.

   One `control` recipe drives every input in the app, so a text
   field, a select and a chip box share the same height, border,
   focus colour and transition. Labels are tracked uppercase to
   match the reference sheet's form styling.
   ============================================================ */

export const control = [
  "w-full rounded-sm border border-line bg-bone px-3 text-[13px] text-ink",
  "placeholder:text-mut-2",
  "transition-[border-color,background-color,box-shadow] duration-200",
  "hover:border-mut-2/60",
  "focus:border-blue focus:bg-paper focus:outline-none focus:ring-2 focus:ring-blue/15",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ")

const INVALID = "border-red/60 bg-red-soft/40 focus:border-red focus:ring-red/15"

/** Label + optional hint/error, wrapping any control. */
export function Field({ label, hint, error, required, htmlFor, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="co-eyebrow flex items-center gap-1 text-ink"
        >
          {label}
          {required && <span className="text-red">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-red">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-mut">{hint}</p>
      ) : null}
    </div>
  )
}

export function TextField({ id, label, hint, error, required, className, ...props }) {
  const autoId = React.useId()
  const fieldId = id || autoId
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={fieldId}
      className={className}
    >
      <input
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(control, "h-9", error && INVALID)}
        {...props}
      />
    </Field>
  )
}

export function TextAreaField({ id, label, hint, error, required, rows = 3, className, ...props }) {
  const autoId = React.useId()
  const fieldId = id || autoId
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={fieldId}
      className={className}
    >
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(control, "co-scroll resize-y py-2 leading-relaxed", error && INVALID)}
        {...props}
      />
    </Field>
  )
}

/**
 * Native select, styled to match. Native beats a custom listbox here:
 * it is keyboard- and screen-reader-correct for free and uses the
 * platform picker on touch devices.
 */
export function SelectField({
  id,
  label,
  hint,
  error,
  required,
  options = [],
  placeholder,
  className,
  ...props
}) {
  const autoId = React.useId()
  const fieldId = id || autoId
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={fieldId}
      className={className}
    >
      <div className="relative">
        <select
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(control, "h-9 cursor-pointer appearance-none pr-9", error && INVALID)}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-mut-2"
          strokeWidth={2.2}
        />
      </div>
    </Field>
  )
}

/**
 * Chip input for the array fields on the models — specialisation,
 * equipment, prerequisites. Enter or comma commits a value.
 */
export function TagField({
  label,
  hint,
  error,
  required,
  value = [],
  onChange,
  placeholder = "Type and press Enter",
  className,
}) {
  const [draft, setDraft] = React.useState("")
  const fieldId = React.useId()

  const commit = (raw) => {
    const next = raw.trim().replace(/,$/, "")
    if (!next || value.includes(next)) {
      setDraft("")
      return
    }
    onChange([...value, next])
    setDraft("")
  }

  const remove = (tag) => onChange(value.filter((t) => t !== tag))

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={fieldId}
      className={className}
    >
      <div
        className={cn(
          control,
          "flex min-h-9 flex-wrap items-center gap-1.5 px-2 py-1.5",
          "focus-within:border-blue focus-within:bg-paper focus-within:ring-2 focus-within:ring-blue/15",
          error && INVALID
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="co-pop inline-flex items-center gap-1 rounded-[3px] border border-line bg-paper py-0.5 pl-2 pr-1 text-[11.5px] font-medium text-ink"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={`Remove ${tag}`}
              className="co-press grid size-4 place-items-center rounded-[2px] text-mut-2 hover:bg-red-soft hover:text-red"
            >
              <X className="size-3" strokeWidth={2.6} />
            </button>
          </span>
        ))}
        <input
          id={fieldId}
          value={draft}
          onChange={(e) => {
            const v = e.target.value
            if (v.endsWith(",")) commit(v)
            else setDraft(v)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              commit(draft)
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1])
            }
          }}
          onBlur={() => commit(draft)}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[8ch] flex-1 bg-transparent text-[13px] text-ink placeholder:text-mut-2 focus:outline-none"
        />
      </div>
    </Field>
  )
}

/** Two-column form grid; children can opt out with `sm:col-span-2`. */
export function FormGrid({ children, className }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>
}
