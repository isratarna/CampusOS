import * as React from "react"
import { Link, useLocation, useSearchParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import { NAV_SECTIONS } from "./nav"
import { Eyebrow } from "./primitives"
import { PanelLeftClose, PanelLeftOpen, Sparkles, X } from "lucide-react"

/* ============================================================
   The rail.

   Collapsed it is the icon rail from the reference sheet: stacked
   glyph-over-caption blocks on ink, the active one filled amber.
   Expanded it becomes a full menu, revealing section headings and
   the sub-menus inside the destination you are currently in.
   ============================================================ */

const STORAGE_KEY = "FacultyOS:sidebar-expanded"

export function useSidebarState() {
  const [expanded, setExpanded] = React.useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      return false
    }
  })

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, expanded ? "1" : "0")
    } catch {
      /* storage blocked; the rail just resets next visit */
    }
  }, [expanded])

  return [expanded, setExpanded]
}

function BrandMark({ expanded }) {
  return (
    <Link
      to="/"
      className="co-press group flex items-center gap-2.5 rounded-sm px-1 py-1 hover:bg-white/8"
      title="FacultyOS home"
    >
      <span className="relative grid size-9 shrink-0 place-items-center rounded-sm bg-amber">
        {/* Two offset bars: the mark reads as a stacked timetable block */}
        <span className="absolute h-3.5 w-1.5 -translate-x-1 rounded-[1px] bg-ink transition-transform duration-300 group-hover:-translate-x-1.5" />
        <span className="absolute h-2 w-1.5 translate-x-1 translate-y-1 rounded-[1px] bg-ink/70 transition-transform duration-300 group-hover:translate-x-1.5" />
      </span>
      <span
        className={cn(
          "min-w-0 overflow-hidden transition-all duration-300",
          expanded ? "w-32 opacity-100" : "w-0 opacity-0"
        )}
      >
        <span className="block truncate text-[15px] font-bold tracking-[-0.03em] text-white">
          FacultyOS
        </span>
        <span className="block truncate text-[9px] font-medium uppercase tracking-[0.14em] text-white/45">
          Your campus, sorted
        </span>
      </span>
    </Link>
  )
}

function RailItem({ item, active, expanded, currentView }) {
  const Icon = item.icon

  return (
    <li>
      <Link
        to={item.path}
        aria-current={active ? "page" : undefined}
        title={expanded ? undefined : item.label}
        className={cn(
          "co-press relative flex items-center rounded-sm outline-offset-2",
          expanded ? "gap-3 px-3 py-2.5" : "flex-col gap-1.5 px-2 py-2.5",
          active
            ? "bg-amber text-ink"
            : "text-white/60 hover:bg-white/8 hover:text-white"
        )}
      >
        <Icon className={cn("shrink-0", expanded ? "size-[17px]" : "size-[19px]")} strokeWidth={2.1} />
        {expanded ? (
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-[-0.01em]">
            {item.label}
          </span>
        ) : (
          <span className="max-w-full truncate text-[8.5px] font-bold uppercase tracking-[0.1em]">
            {item.rail}
          </span>
        )}
        {/* left tick marks the active row when collapsed */}
        {active && !expanded && (
          <span className="absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-sm bg-amber" />
        )}
      </Link>

      {/* sub-menu: only the destination you are inside expands */}
      {expanded && active && item.views?.length > 0 && (
        <ul className="co-fade mt-1 ml-[19px] space-y-px border-l border-white/12 pl-3">
          {item.views.map((view) => {
            const on = currentView === view.id
            return (
              <li key={view.id}>
                <Link
                  to={`${item.path}?view=${view.id}`}
                  className={cn(
                    "co-press block rounded-sm px-2.5 py-1.5 text-[12px] font-medium",
                    on ? "bg-white/12 text-white" : "text-white/45 hover:bg-white/8 hover:text-white/85"
                  )}
                >
                  {view.label}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

export function Sidebar({ expanded, onToggle, onOpenAssistant, mobileOpen, onCloseMobile }) {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const currentView = params.get("view")

  return (
    <>
      {/* scrim, mobile only */}
      <div
        onClick={onCloseMobile}
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden
      />

      <aside
        className={cn(
          "co-scroll fixed inset-y-0 left-0 z-50 flex flex-col overflow-y-auto bg-ink",
          "transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          expanded ? "w-[244px]" : "w-[76px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* brand */}
        <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-4">
          <BrandMark expanded={expanded} />
          <button
            type="button"
            onClick={onCloseMobile}
            className="co-press grid size-8 place-items-center rounded-sm text-white/50 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="mx-3 h-px bg-white/10" />

        {/* sections */}
        <nav className="flex-1 px-3 py-3">
          {NAV_SECTIONS.map((section, i) => (
            <div key={section.id} className={cn(i > 0 && "mt-4")}>
              {expanded ? (
                <Eyebrow className="mb-1.5 block px-3 text-white/30">{section.label}</Eyebrow>
              ) : (
                i > 0 && <div className="mx-2 mb-2.5 h-px bg-white/10" />
              )}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <RailItem
                    key={item.id}
                    item={item}
                    active={pathname === item.path}
                    expanded={expanded}
                    currentView={currentView || item.views?.[0]?.id}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* footer: assistant + rail toggle */}
        <div className="sticky bottom-0 space-y-1 bg-ink px-3 pb-4 pt-2">
          <div className="mb-2 h-px bg-white/10" />

          <button
            type="button"
            onClick={onOpenAssistant}
            title={expanded ? undefined : "Assistant"}
            className={cn(
              "co-press flex w-full items-center rounded-sm text-white/60 hover:bg-white/8 hover:text-white",
              expanded ? "gap-3 px-3 py-2.5" : "flex-col gap-1.5 px-2 py-2.5"
            )}
          >
            <Sparkles className={cn("shrink-0", expanded ? "size-[17px]" : "size-[19px]")} strokeWidth={2.1} />
            {expanded ? (
              <span className="flex-1 truncate text-left text-[13px] font-semibold">Assistant</span>
            ) : (
              <span className="text-[8.5px] font-bold uppercase tracking-[0.1em]">Ask</span>
            )}
            {expanded && (
              <span className="size-1.5 rounded-full bg-green" />
            )}
          </button>

          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "co-press hidden w-full items-center rounded-sm text-white/40 hover:bg-white/8 hover:text-white lg:flex",
              expanded ? "gap-3 px-3 py-2.5" : "flex-col gap-1.5 px-2 py-2.5"
            )}
          >
            {expanded ? (
              <>
                <PanelLeftClose className="size-[17px] shrink-0" strokeWidth={2.1} />
                <span className="flex-1 truncate text-left text-[13px] font-medium">Collapse</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="size-[19px]" strokeWidth={2.1} />
                <span className="text-[8.5px] font-bold uppercase tracking-[0.1em]">Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
