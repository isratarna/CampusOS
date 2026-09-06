import * as React from "react"
import { cn } from "@/lib/utils"
import { CircleCheck, CircleX, Info, X } from "lucide-react"

/* ============================================================
   Toasts. Mutations are optimistic-feeling but silent otherwise;
   this is the confirmation that a save or delete actually landed.
   ============================================================ */

const ToastContext = React.createContext(null)

const TONES = {
  success: { icon: CircleCheck, bar: "bg-green", text: "text-green" },
  error: { icon: CircleX, bar: "bg-red", text: "text-red" },
  info: { icon: Info, bar: "bg-blue", text: "text-blue" },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([])
  const timers = React.useRef(new Map())

  const dismiss = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = React.useCallback(
    (message, tone = "success", duration = 4000) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, message, tone }])
      timers.current.set(id, setTimeout(() => dismiss(id), duration))
      return id
    },
    [dismiss]
  )

  React.useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const value = React.useMemo(
    () => ({
      toast: push,
      success: (m) => push(m, "success"),
      error: (m) => push(m, "error", 6000),
      info: (m) => push(m, "info"),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-1/2 z-[70] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:left-auto sm:right-6 sm:translate-x-0"
      >
        {toasts.map((t) => {
          const tone = TONES[t.tone] || TONES.info
          const Icon = tone.icon
          return (
            <div
              key={t.id}
              className={cn(
                "co-rise pointer-events-auto relative flex items-start gap-2.5 overflow-hidden",
                "rounded-md border border-line bg-paper py-3 pl-4 pr-3 shadow-pop"
              )}
            >
              <span className={cn("absolute inset-y-0 left-0 w-1", tone.bar)} />
              <Icon className={cn("mt-px size-4 shrink-0", tone.text)} strokeWidth={2.3} />
              <p className="flex-1 text-[12.5px] leading-relaxed text-ink">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="co-press grid size-5 shrink-0 place-items-center rounded-sm text-mut-2 hover:bg-bone-2 hover:text-ink"
              >
                <X className="size-3" strokeWidth={2.6} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>")
  return ctx
}
