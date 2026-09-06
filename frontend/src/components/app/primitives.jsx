import * as React from "react"
import { cn } from "@/lib/utils"
import { accent } from "@/lib/domain"
import { Loader2 } from "lucide-react"

/* ============================================================
   FacultyOS editorial primitives.
   Flat paper surfaces, hairline rules, print-shop detailing.
   ============================================================ */

/** Small tracked uppercase label. The workhorse of the whole system. */
export function Eyebrow({ className, children, ...props }) {
  return (
    <span className={cn("co-eyebrow", className)} {...props}>
      {children}
    </span>
  )
}

/** Numbered section heading: "01 OVERVIEW", rule trailing to the edge. */
export function SectionLabel({ index, title, action, className }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {index != null && <span className="co-index">{String(index).padStart(2, "0")}</span>}
      <Eyebrow className="text-ink">{title}</Eyebrow>
      <div className="co-rule flex-1" />
      {action}
    </div>
  )
}

/**
 * The base surface. Everything that holds content is a Panel, so borders,
 * radii and header rules never drift between pages.
 */
export function Panel({ className, children, flush = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-md border border-line bg-paper shadow-paper",
        !flush && "p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/** Panel header with a hairline beneath: title left, actions right. */
export function PanelHead({ icon: Icon, title, caption, action, className }) {
  return (
    <div className={cn("flex items-start gap-3 border-b border-line px-5 py-4", className)}>
      {Icon && (
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-sm bg-ink/8 text-ink">
          <Icon className="size-3.5" strokeWidth={2.2} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-ink">{title}</h2>
        {caption && <p className="mt-0.5 truncate text-xs text-mut">{caption}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Filled square holding an icon: the reference sheet's stat marker motif. */
export function IconChip({ icon: Icon, tone = "ink", size = "md", className }) {
  const sizes = {
    sm: "size-7 rounded-sm [&>svg]:size-3.5",
    md: "size-10 rounded-md [&>svg]:size-[18px]",
    lg: "size-12 rounded-md [&>svg]:size-5",
  }
  return (
    <span
      className={cn("grid shrink-0 place-items-center", sizes[size], accent(tone).solid, className)}
    >
      {Icon && <Icon strokeWidth={2.2} />}
    </span>
  )
}

/** Status pill. Soft fill plus hairline, per the design sheet's tag row. */
export function StatusTag({ tone = "ink", children, icon: Icon, className }) {
  const a = accent(tone)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-[3px]",
        "text-[11px] font-semibold tracking-[0.02em]",
        a.soft,
        a.ring,
        className
      )}
    >
      {Icon && <Icon className="size-3" strokeWidth={2.4} />}
      {children}
    </span>
  )
}

/** Horizontal meter with an animated fill. */
export function Meter({ label, value = 0, tone = "blue", caption, className }) {
  const [width, setWidth] = React.useState(0)

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(value))
    return () => cancelAnimationFrame(id)
  }, [value])

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-ink">{label}</span>
        <div className="co-leader" />
        <span className="co-num text-xs text-ink">{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bone-2">
        <div
          className={cn("h-full rounded-full", accent(tone).bar)}
          style={{ width: width + "%", transition: "width 0.9s var(--ease-out-quint)" }}
        />
      </div>
      {caption && <p className="text-[11px] text-mut">{caption}</p>}
    </div>
  )
}

/** Multi-segment bar: the occupancy strip on the reference sheet. */
export function SegmentBar({ segments = [], className }) {
  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0) || 1

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex h-6 w-full overflow-hidden rounded-sm bg-bone-2">
        {segments.map((s, i) => (
          <div
            key={s.label}
            className={accent(s.tone).bar}
            title={s.label + ": " + s.value}
            style={{
              width: (s.value / total) * 100 + "%",
              transition: "width 0.9s var(--ease-out-quint)",
              transitionDelay: i * 60 + "ms",
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-[11px] text-mut">
            <span className={cn("size-2 rounded-full", accent(s.tone).dot)} />
            <span className="co-num font-semibold text-ink">{s.value}</span>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Empty state: icon block, one line of explanation, optional action. */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("co-fade flex flex-col items-center px-6 py-14 text-center", className)}>
      <span className="grid size-12 place-items-center rounded-md border border-line bg-bone">
        {Icon && <Icon className="size-5 text-mut-2" strokeWidth={1.8} />}
      </span>
      <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-mut">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Shimmering placeholder block. */
export function Skeleton({ className }) {
  return <div className={cn("co-skeleton rounded-sm", className)} />
}

export function Spinner({ className }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} strokeWidth={2.4} />
}

/** Inline error strip. */
export function ErrorNote({ children, icon: Icon, className }) {
  return (
    <div
      className={cn(
        "co-rise flex items-start gap-2.5 rounded-sm border border-red/30 bg-red-soft px-3.5 py-2.5 text-xs text-red",
        className
      )}
    >
      {Icon && <Icon className="mt-px size-3.5 shrink-0" strokeWidth={2.2} />}
      <span className="leading-relaxed">{children}</span>
    </div>
  )
}

/** Key/value row with a dotted leader, used across detail panels. */
export function DetailRow({ label, children, className }) {
  return (
    <div className={cn("flex items-baseline gap-2 py-1.5", className)}>
      <span className="shrink-0 text-xs text-mut">{label}</span>
      <div className="co-leader" />
      <span className="max-w-[60%] truncate text-xs font-medium text-ink">{children}</span>
    </div>
  )
}

/** Print crop marks drawn at a container's corners. Decorative only. */
export function CropMarks({ className }) {
  const mark = "absolute size-3 border-ink/25"
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <span className={cn(mark, "-left-px -top-px border-l border-t")} />
      <span className={cn(mark, "-right-px -top-px border-r border-t")} />
      <span className={cn(mark, "-bottom-px -left-px border-b border-l")} />
      <span className={cn(mark, "-bottom-px -right-px border-b border-r")} />
    </div>
  )
}
