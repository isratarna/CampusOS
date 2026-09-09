import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChevronDown, GraduationCap, LogOut, ShieldCheck, Sparkles } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { Eyebrow, StatusTag } from "@/components/app/primitives"
import { initials } from "@/lib/domain"
import { cn } from "@/lib/utils"

/* ============================================================
   Who is signed in, and what that lets them do.

   Lives in the topbar next to the alerts bell, so it borrows the
   same chrome as everything else there: bone ground, hairline
   border, barely-rounded corners. The role tag is the one piece of
   colour — it is the thing that changes what the rail offers.
   ============================================================ */

const ROLE_META = {
  admin: { label: "Admin", caption: "Dean's office", tone: "amber", icon: ShieldCheck },
  faculty: { label: "Faculty", caption: "Teaching staff", tone: "violet", icon: Sparkles },
  student: { label: "Student", caption: "Enrolled", tone: "green", icon: GraduationCap },
}

const SWITCHABLE = ["admin", "faculty", "student"]

export default function RoleNavbarBadge() {
  const { user, logout, demoAccounts, quickSwitchDemoUser } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(null)
  const boxRef = React.useRef(null)
  const navigate = useNavigate()

  // close on outside click, the same behaviour as quick find
  React.useEffect(() => {
    const onDown = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  if (!user) {
    return (
      <Link
        to="/login"
        className="co-press flex h-9 items-center rounded-sm border border-line bg-paper px-3 text-[12px] font-semibold text-ink hover:border-amber hover:bg-amber/10"
      >
        Sign in
      </Link>
    )
  }

  const role = ROLE_META[user.role] || ROLE_META.faculty
  const RoleIcon = role.icon

  const switchTo = async (target) => {
    setBusy(target)
    try {
      await quickSwitchDemoUser(target)
      setOpen(false)
    } catch {
      /* no demo account seeded for that role; leave the menu open */
    } finally {
      setBusy(null)
    }
  }

  const signOut = () => {
    logout()
    navigate("/login")
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "co-press flex h-9 items-center gap-2 rounded-sm border border-line bg-paper pl-1 pr-2 text-ink",
          "hover:bg-bone-2",
          open && "border-mut-2/60 bg-bone-2"
        )}
      >
        <span className="grid size-7 place-items-center rounded-[3px] bg-ink text-[10.5px] font-bold tracking-wide text-paper">
          {initials(user.name)}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[130px] truncate text-[12px] font-semibold leading-tight">
            {user.name}
          </span>
          <span className="co-index block leading-tight">{role.label}</span>
        </span>
        <ChevronDown
          className={cn("size-3 shrink-0 text-mut-2 transition-transform duration-200", open && "rotate-180")}
          strokeWidth={2.4}
        />
      </button>

      {open && (
        <div className="co-pop absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-md border border-line bg-paper shadow-pop">
          <div className="flex items-start gap-3 border-b border-line-2 px-4 py-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-ink text-[11px] font-bold tracking-wide text-paper">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
              <p className="truncate text-[11px] text-mut">{user.email}</p>
              <div className="mt-1.5">
                <StatusTag tone={role.tone} icon={RoleIcon}>
                  {role.label} · {role.caption}
                </StatusTag>
              </div>
            </div>
          </div>

          {demoAccounts.length > 0 && (
            <div className="border-b border-line-2 px-4 py-3">
              <Eyebrow className="mb-2 block">View as</Eyebrow>
              <div className="flex gap-1">
                {SWITCHABLE.filter((r) => demoAccounts.some((a) => a.role === r)).map((r) => {
                  const on = user.role === r
                  return (
                    <button
                      key={r}
                      type="button"
                      disabled={on || busy !== null}
                      onClick={() => switchTo(r)}
                      className={cn(
                        "co-press flex-1 rounded-sm border px-2 py-1.5 text-[11px] font-semibold capitalize",
                        on
                          ? "border-amber bg-amber/15 text-ink"
                          : "border-line bg-bone text-mut hover:border-mut-2/60 hover:text-ink",
                        busy === r && "opacity-60"
                      )}
                    >
                      {busy === r ? "…" : r}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-[10.5px] leading-relaxed text-mut-2">
                Signs you in as the seeded demo account for that role.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[12.5px] font-semibold text-ink transition-colors duration-150 hover:bg-red-soft hover:text-red"
          >
            <LogOut className="size-3.5" strokeWidth={2.3} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
