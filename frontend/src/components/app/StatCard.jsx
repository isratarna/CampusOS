import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { IconChip, Skeleton } from "./primitives"
import { ArrowUpRight } from "lucide-react"

/* ============================================================
   The metric tile from the reference sheet: a filled accent
   square, a tracked caption, an oversized tabular figure, and a
   footnote. Becomes a link when `to` is supplied.
   ============================================================ */

export function StatCard({ icon, label, value, caption, tone = "ink", to, loading, className }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <IconChip icon={icon} tone={tone} />
        {to && (
          <ArrowUpRight
            className="size-4 text-mut-2 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
            strokeWidth={2.2}
          />
        )}
      </div>

      <div className="mt-4">
        <p className="co-eyebrow">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-9 w-20" />
        ) : (
          <p className="co-num mt-1 text-[34px] leading-none text-ink">{value}</p>
        )}
        {caption && <p className="mt-2 text-[11px] leading-relaxed text-mut">{caption}</p>}
      </div>
    </>
  )

  const classes = cn(
    "group relative block rounded-md border border-line bg-paper p-4 shadow-paper",
    to && "co-lift hover:border-ink/25",
    className
  )

  return to ? (
    <Link to={to} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  )
}

/* ============================================================
   The grid the tiles sit in. Four across on wide screens, two
   on small; pass `className` with an `xl:grid-cols-*` to suit
   rows that hold a different number of tiles.
   ============================================================ */

export function StatRow({ className, children, ...props }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)} {...props}>
      {children}
    </div>
  )
}
