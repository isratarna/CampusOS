import { cn } from "@/lib/utils"
import { Eyebrow } from "./primitives"
import { Segmented, useView as useViewParam } from "./Segmented"
import { navItem } from "./nav"

/* ============================================================
   The masthead every page opens with: section eyebrow, title,
   one line of orientation, actions, and the page's sub-menu
   docked underneath on its own rule.

   Pass `navId` and the eyebrow, title and description are taken
   from the destination's entry in nav.js, so the masthead and the
   sidebar can never drift apart. Any of the three can still be
   passed explicitly to override the registry.
   ============================================================ */

export function PageHeader({
  navId,
  eyebrow,
  title,
  description,
  actions,
  tabs,
  menu,
  className,
}) {
  const item = navId ? navItem(navId) : undefined
  const head = eyebrow ?? item?.section
  const heading = title ?? item?.label
  const blurb = description ?? item?.description
  const submenu = tabs ?? menu

  return (
    <header className={cn("co-rise", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          {head && (
            <div className="mb-2 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-amber" />
              <Eyebrow>{head}</Eyebrow>
            </div>
          )}
          <h1 className="text-[30px] font-bold leading-[1.05] tracking-[-0.04em] text-ink sm:text-[34px]">
            {heading}
          </h1>
          {blurb && (
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-mut">{blurb}</p>
          )}
        </div>

        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {submenu && (
        <div className="mt-5 flex items-center gap-4 border-b border-line pb-4">
          {submenu}
        </div>
      )}
    </header>
  )
}

/* The sub-menu itself — the segmented control bound to a page's
   declared views. Entries may carry a `count` badge. */
export function ViewTabs({ views = [], value, onChange, className }) {
  return <Segmented items={views} value={value} onChange={onChange} className={className} />
}

/**
 * The selected view for a destination, keyed by its nav id.
 * Returns the id, a setter that mirrors into ?view=, and the
 * destination's declared views so a page can decorate them.
 */
export function useView(navId) {
  const views = navItem(navId)?.views ?? []
  const [view, setView] = useViewParam(views)
  return [view, setView, views]
}
