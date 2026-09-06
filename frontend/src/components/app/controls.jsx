import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Spinner } from "./primitives"
import { Check, ChevronDown, X } from "lucide-react"

/* ============================================================
   Buttons and form controls.

   Variants follow the reference sheet: primary is amber on ink
   text, secondary is a bone fill, ghost is paper with a hairline,
   destructive is red. Every one of them shares .co-press so the
   click feel is identical across the app.
   ============================================================ */

const VARIANTS = {
  primary: "bg-amber text-ink hover:bg-amber-deep",
  secondary: "bg-bone-2 text-ink hover:bg-line",
  ghost: "border border-line bg-paper text-ink hover:bg-bone-2",
  quiet: "text-mut hover:bg-bone-2 hover:text-ink",
  ink: "bg-ink text-paper hover:bg-ink-2",
  destructive: "bg-red text-white hover:bg-red/90",
}

const SIZES = {
  sm: "h-8 gap-1.5 px-2.5 text-[12px] [&>svg]:size-3.5",
  md: "h-9 gap-2 px-3.5 text-[13px] [&>svg]:size-4",
  lg: "h-10 gap-2 px-5 text-sm [&>svg]:size-4",
  icon: "size-9 [&>svg]:size-4",
}

export function Button({
  variant = "ghost",
  size = "md",
  loading = false,
  icon: Icon,
  to,
  className,
  children,
  disabled,
  ...props
}) {
  const classes = cn(
    "co-press inline-flex shrink-0 items-center justify-center rounded-sm font-semibold tracking-[-0.01em]",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className
  )

  const content = (
    <>
      {loading ? <Spinner className="size-3.5" /> : Icon && <Icon strokeWidth={2.2} />}
      {children}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  )
}

/* ---------- fields ---------- */

const FIELD_BASE = cn(
  "w-full rounded-sm border border-line bg-paper px-3 text-[13px] text-ink",
  "placeholder:text-mut-2",
  "transition-[border-color,box-shadow] duration-200",
  "focus:border-blue focus:outline-none focus:ring-[3px] focus:ring-blue/15",
  "disabled:cursor-not-allowed disabled:bg-bone-2 disabled:text-mut-2",
  "aria-[invalid=true]:border-red aria-[invalid=true]:ring-red/15"
)

/** Label + control + hint/error wrapper. */
export function Field({ label, hint, error, required, htmlFor, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1 text-[11px] font-semibold tracking-[0.02em] text-ink"
        >
          {label}
          {required && <span className="text-red">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-red">{error}</p>
      ) : (
        hint && <p className="text-[11px] text-mut">{hint}</p>
      )}
    </div>
  )
}

export function TextInput({ className, invalid, ...props }) {
  return <input aria-invalid={invalid || undefined} className={cn(FIELD_BASE, "h-9", className)} {...props} />
}

export function TextArea({ className, invalid, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(FIELD_BASE, "resize-y py-2 leading-relaxed", className)}
      {...props}
    />
  )
}

/** Native select, restyled — keeps keyboard and mobile behaviour intact. */
export function SelectInput({ className, children, invalid, ...props }) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(FIELD_BASE, "h-9 cursor-pointer appearance-none pr-8", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-mut-2"
        strokeWidth={2.2}
      />
    </div>
  )
}

/**
 * Comma/Enter separated tag entry — used for specialisations,
 * equipment and prerequisites, which are all string arrays.
 */
export function TagInput({ value = [], onChange, placeholder = "Type and press Enter", id }) {
  const [draft, setDraft] = React.useState("")

  const commit = (raw) => {
    const parts = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => !value.includes(p))
    if (parts.length) onChange([...value, ...parts])
    setDraft("")
  }

  return (
    <div
      className={cn(
        "min-h-9 rounded-sm border border-line bg-paper p-1.5",
        "transition-[border-color,box-shadow] duration-200 focus-within:border-blue focus-within:ring-[3px] focus-within:ring-blue/15"
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="co-pop inline-flex items-center gap-1 rounded-sm bg-bone-2 py-0.5 pl-2 pr-1 text-[12px] font-medium text-ink"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              className="co-press grid size-4 place-items-center rounded-[2px] text-mut hover:bg-red-soft hover:text-red"
            >
              <X className="size-2.5" strokeWidth={2.6} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              commit(draft)
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={() => draft && commit(draft)}
          placeholder={value.length ? "" : placeholder}
          className="h-6 min-w-[8rem] flex-1 bg-transparent px-1 text-[13px] text-ink placeholder:text-mut-2 focus:outline-none"
        />
      </div>
    </div>
  )
}

/** Small pill toggle used for filter rows. */
export function FilterChip({ active, onClick, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "co-press inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[12px] font-semibold",
        active
          ? "border-ink bg-ink text-paper"
          : "border-line bg-paper text-mut hover:border-ink/25 hover:text-ink"
      )}
    >
      {active && <Check className="size-3" strokeWidth={2.6} />}
      {children}
      {count != null && <span className="co-num opacity-60">{count}</span>}
    </button>
  )
}
