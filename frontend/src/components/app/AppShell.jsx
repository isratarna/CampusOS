import * as React from "react"
import { useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Sidebar, useSidebarState } from "./Sidebar"
import { Topbar } from "./Topbar"
import { AssistantDock } from "./AssistantDock"
import { Decor } from "./Decor"

/* ============================================================
   The frame every authenticated page renders inside: rail, topbar,
   assistant drawer and the paper ground. Pages supply content only,
   so spacing and chrome stay identical across the app.
   ============================================================ */

export function AppShell({ children }) {
  const [expanded, setExpanded] = useSidebarState()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [assistantOpen, setAssistantOpen] = React.useState(false)
  const { pathname } = useLocation()

  // route change closes the mobile drawer and returns to the top
  React.useEffect(() => {
    setMobileOpen(false)
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="co-paper co-grain min-h-screen">
      <Decor />

      <Sidebar
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        onOpenAssistant={() => setAssistantOpen(true)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          "relative z-10 transition-[padding-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          expanded ? "lg:pl-[244px]" : "lg:pl-[76px]"
        )}
      >
        <Topbar
          onOpenMobile={() => setMobileOpen(true)}
          onOpenAssistant={() => setAssistantOpen(true)}
        />

        {/* keyed on the route so each page plays its entrance once */}
        <main key={pathname} className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="mx-auto w-full max-w-[1440px] px-4 pb-10 sm:px-6 lg:px-8">
          <div className="co-rule mb-3" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="co-index">CampusOS · Your campus, sorted</span>
            <span className="co-index">
              {new Date().getFullYear()} · Scheduling Office
            </span>
          </div>
        </footer>
      </div>

      <AssistantDock open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  )
}
