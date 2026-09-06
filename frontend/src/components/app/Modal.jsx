import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "./primitives"
import { AlertTriangle, X } from "lucide-react"

/* ============================================================
   Modal + confirm dialog.

   Forms used to sit inline and push the whole page down; they now
   open here, which keeps each page a single readable column.
   Closes on Escape and on scrim click, and locks body scroll.
   ============================================================ */

export function Modal({ open, onClose, title, caption, icon: Icon, children, footer, size = "md" }) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === "Escape" && onClose?.()
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div
        className="co-fade fixed inset-0 bg-ink/45 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "co-pop relative my-auto w-full rounded-lg border border-line bg-paper shadow-pop",
          sizes[size]
        )}
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          {Icon && (
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-sm bg-ink text-paper">
              <Icon className="size-4" strokeWidth={2.2} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-[-0.02em] text-ink">{title}</h2>
            {caption && <p className="mt-0.5 text-xs text-mut">{caption}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="co-press grid size-8 shrink-0 place-items-center rounded-sm text-mut hover:bg-bone-2 hover:text-ink"
          >
            <X className="size-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="co-scroll max-h-[68vh] overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line bg-bone-2/40 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/** Destructive confirmation. Never assume; always ask before deleting. */
export function ConfirmDialog({ open, onCancel, onConfirm, title, message, confirmLabel = "Delete", busy }) {
  return (
    <Modal open={open} onClose={busy ? undefined : onCancel} title={title} icon={AlertTriangle} size="sm">
      <p className="text-[13px] leading-relaxed text-mut">{message}</p>
      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="co-press rounded-sm border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-bone-2 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="co-press inline-flex items-center gap-2 rounded-sm bg-red px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-red/90 disabled:opacity-50"
        >
          {busy && <Spinner className="size-3.5" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
