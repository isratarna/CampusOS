import { Link, Navigate, useLocation } from "react-router-dom"
import { ShieldAlert } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { IconChip, Spinner } from "@/components/app/primitives"
import { Button } from "@/components/ui/button"

/* ============================================================
   Route guard.

   Three outcomes: still checking, not signed in, or signed in
   without the role this destination needs. The last one is a real
   page rather than a redirect, because bouncing someone silently
   reads as a broken link.
   ============================================================ */

const ROLE_LABELS = { admin: "Admin", faculty: "Faculty", student: "Student" }

function label(role) {
  return ROLE_LABELS[role] || role
}

/** Centred card on the paper ground, used by both waiting and refusal. */
function Notice({ children }) {
  return (
    <div className="co-paper co-grain grid min-h-screen place-items-center px-6">
      <div className="co-rise w-full max-w-md rounded-lg border border-line bg-paper p-8 text-center shadow-paper">
        {children}
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <Notice>
        <Spinner className="mx-auto text-mut" />
        <p className="mt-4 text-[13px] font-semibold text-ink">Checking your session</p>
        <p className="mt-1 text-[11.5px] text-mut">One moment while we confirm your role.</p>
      </Notice>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Notice>
        <div className="flex justify-center">
          <IconChip icon={ShieldAlert} tone="red" />
        </div>
        <h1 className="mt-4 text-[17px] font-bold tracking-[-0.02em] text-ink">
          Not available to your role
        </h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-mut">
          You are signed in as <span className="font-semibold text-ink">{label(user.role)}</span>.
          This page is open to {allowedRoles.map(label).join(" and ")} only.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild size="sm">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/login">Sign in as someone else</Link>
          </Button>
        </div>
      </Notice>
    )
  }

  return children
}
