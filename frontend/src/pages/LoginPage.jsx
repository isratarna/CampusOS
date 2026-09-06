import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  ArrowRight,
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { SelectField, TextField } from "@/components/app/Form"
import {
  CropMarks,
  ErrorNote,
  Eyebrow,
  IconChip,
  Spinner,
  StatusTag,
} from "@/components/app/primitives"
import { Button } from "@/components/ui/button"
import { apiError } from "@/lib/api"
import { cn } from "@/lib/utils"

/* ============================================================
   Sign in.

   Two panels on the paper ground: the demo profiles on the left,
   the credential form on the right. Both sit inside the same
   editorial frame as the rest of the app — hairline borders, warm
   ground, barely-rounded corners — so signing in does not feel
   like a different product from the workspace behind it.
   ============================================================ */

const ROLE_META = {
  admin: { icon: ShieldCheck, tone: "amber", label: "Admin" },
  faculty: { icon: Sparkles, tone: "violet", label: "Faculty" },
  student: { icon: GraduationCap, tone: "green", label: "Student" },
}

const ROLE_OPTIONS = [
  { value: "faculty", label: "Faculty member" },
  { value: "admin", label: "Administrator" },
  { value: "student", label: "Student" },
]

/** One seeded profile: fill the form, or go straight in. */
function DemoCard({ account, filled, onFill, onEnter, busy }) {
  const meta = ROLE_META[account.role] || ROLE_META.faculty

  return (
    <li
      className={cn(
        "rounded-md border bg-paper p-4 transition-colors duration-200",
        filled ? "border-amber bg-amber/[0.06]" : "border-line hover:border-mut-2/60"
      )}
    >
      <div className="flex items-start gap-3">
        <IconChip icon={meta.icon} tone={meta.tone} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[13px] font-semibold text-ink">{account.name}</p>
            <StatusTag tone={meta.tone}>{meta.label}</StatusTag>
          </div>
          <p className="co-index mt-0.5 truncate">{account.email}</p>
          {account.description && (
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-mut">{account.description}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Button size="sm" onClick={() => onEnter(account)} disabled={busy}>
            Enter <ArrowRight />
          </Button>
          <button
            type="button"
            onClick={() => onFill(account)}
            className="text-[11px] font-medium text-mut underline-offset-2 hover:text-ink hover:underline"
          >
            Fill the form
          </button>
        </div>
      </div>
    </li>
  )
}

export default function LoginPage() {
  const { login, register, demoAccounts, quickSwitchDemoUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [registering, setRegistering] = React.useState(false)
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "faculty",
    department: "Computer Science",
  })
  const [error, setError] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [filled, setFilled] = React.useState(null)

  // come back to whatever the guard bounced them off, else the dashboard
  const destination = location.state?.from?.pathname || "/dashboard"

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const fill = (account) => {
    setForm((f) => ({ ...f, email: account.email, password: account.password }))
    setFilled(account.role)
    setError("")
  }

  const enter = async (account) => {
    setBusy(true)
    setError("")
    try {
      await quickSwitchDemoUser(account.role)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(apiError(err, "Could not sign in with that demo profile."))
    } finally {
      setBusy(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      if (registering) {
        await register(form)
      } else {
        await login(form.email, form.password)
      }
      navigate(destination, { replace: true })
    } catch (err) {
      setError(apiError(err, "Those details were not accepted."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="co-paper co-grain min-h-screen px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto w-full max-w-5xl">
        {/* masthead */}
        <header className="mb-8 flex items-center gap-3">
          <Link to="/" className="co-press flex items-center gap-2.5 rounded-sm" title="FacultyOS home">
            <span className="relative grid size-9 shrink-0 place-items-center rounded-sm bg-amber">
              <span className="absolute h-3.5 w-1.5 -translate-x-1 rounded-[1px] bg-ink" />
              <span className="absolute h-2 w-1.5 translate-x-1 translate-y-1 rounded-[1px] bg-ink/70" />
            </span>
            <span>
              <span className="block text-[15px] font-bold tracking-[-0.03em] text-ink">FacultyOS</span>
              <Eyebrow className="block">Your campus, sorted</Eyebrow>
            </span>
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* demo profiles */}
          <section className="lg:col-span-7">
            <div className="relative rounded-lg border border-line bg-bone/60 p-5 sm:p-6">
              <CropMarks />
              <Eyebrow className="block">Try it as someone</Eyebrow>
              <h2 className="mt-1.5 text-[19px] font-bold tracking-[-0.025em] text-ink">
                Every role sees a different campus
              </h2>
              <p className="mt-1.5 max-w-lg text-[12.5px] leading-relaxed text-mut">
                Admins and faculty get the whole estate — courses, rooms, the AI studio. Students get
                their timetable and their alerts. Pick a profile to see the difference.
              </p>

              {demoAccounts.length === 0 ? (
                <p className="mt-6 rounded-md border border-dashed border-line bg-paper px-4 py-6 text-center text-[12px] text-mut">
                  No demo profiles are available — the API may still be starting. Sign in with your own
                  details instead.
                </p>
              ) : (
                <ul className="co-stagger mt-5 space-y-3">
                  {demoAccounts.map((account) => (
                    <DemoCard
                      key={account.role}
                      account={account}
                      filled={filled === account.role}
                      onFill={fill}
                      onEnter={enter}
                      busy={busy}
                    />
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* credentials */}
          <section className="lg:col-span-5">
            <div className="rounded-lg border border-line bg-paper p-5 shadow-paper sm:p-6">
              <Eyebrow className="block">{registering ? "New account" : "Sign in"}</Eyebrow>
              <h1 className="mt-1 text-[19px] font-bold tracking-[-0.025em] text-ink">
                {registering ? "Join your campus" : "Welcome back"}
              </h1>

              <p className="mt-1.5 text-[12px] leading-relaxed text-mut">
                {registering
                  ? "Tell us who you are and which department you sit in."
                  : "Use your campus email, or take one of the profiles on the left."}
              </p>

              {error && (
                <div className="mt-4">
                  <ErrorNote icon={ShieldAlert}>{error}</ErrorNote>
                </div>
              )}

              <form onSubmit={submit} className="mt-5 space-y-4">
                {registering && (
                  <>
                    <TextField
                      label="Full name"
                      required
                      placeholder="Dr Amara Osei"
                      value={form.name}
                      onChange={set("name")}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SelectField
                        label="Role"
                        options={ROLE_OPTIONS}
                        value={form.role}
                        onChange={set("role")}
                      />
                      <TextField
                        label="Department"
                        placeholder="Computer Science"
                        value={form.department}
                        onChange={set("department")}
                      />
                    </div>
                  </>
                )}

                <TextField
                  label="Email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@campus.edu"
                  value={form.email}
                  onChange={set("email")}
                />

                <TextField
                  label="Password"
                  type="password"
                  required
                  autoComplete={registering ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  hint={registering ? "At least six characters." : undefined}
                  value={form.password}
                  onChange={set("password")}
                />

                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? (
                    <>
                      <Spinner /> Checking
                    </>
                  ) : registering ? (
                    "Create account"
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              <div className="co-rule my-5" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-mut">
                  {registering ? "Already registered?" : "No account yet?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRegistering((v) => !v)
                    setError("")
                  }}
                  className="text-[12px] font-semibold text-blue underline-offset-2 hover:underline"
                >
                  {registering ? "Sign in instead" : "Create one"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
