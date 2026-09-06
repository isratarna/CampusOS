import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { cn } from "@/lib/utils"

/* ============================================================
   The in-page sub-menu.

   One control per page, driven by the `views` declared for that
   destination in nav.js, with the selection mirrored into ?view=
   so a sub-menu is linkable and survives a refresh.
   ============================================================ */

/**
 * Keeps a view id in sync with the ?view= query parameter.
 * Falls back to the first view when the URL names one we don't have.
 */
export function useView(views = []) {
  const [params, setParams] = useSearchParams()
  const ids = views.map((v) => v.id)
  const fromUrl = params.get("view")
  const view = ids.includes(fromUrl) ? fromUrl : ids[0]

  const setView = React.useCallback(
    (next) => {
      const p = new URLSearchParams(params)
      if (next === ids[0]) p.delete("view")
      else p.set("view", next)
      setParams(p, { replace: true })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, setParams, ids.join("|")]
  )

  return [view, setView]
}

export function Segmented({ items = [], value, onChange, className }) {
  const wrapRef = React.useRef(null)
  const [indicator, setIndicator] = React.useState(null)

  /* Measure the active tab so the marker can slide between them. */
  React.useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const measure = () => {
      const active = wrap.querySelector('[data-active="true"]')
      if (!active) return setIndicator(null)
      setIndicator({ left: active.offsetLeft, width: active.offsetWidth })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [value, items])

  return (
    <div
      ref={wrapRef}
      role="tablist"
      className={cn(
        "relative inline-flex items-center gap-0.5 rounded-md border border-line bg-bone-2/70 p-1",
        className
      )}
    >
      {/* sliding marker */}
      {indicator && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-sm bg-paper shadow-paper"
          style={{
            left: indicator.left,
            width: indicator.width,
            transition:
              "left 0.34s var(--ease-out-quint), width 0.34s var(--ease-out-quint)",
          }}
        />
      )}

      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "co-press relative z-10 inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5",
              "text-[12.5px] font-semibold tracking-[-0.01em] whitespace-nowrap",
              active ? "text-ink" : "text-mut hover:text-ink"
            )}
          >
            {item.label}
            {item.count != null && (
              <span
                className={cn(
                  "co-num rounded-full px-1.5 py-px text-[10px] transition-colors duration-200",
                  active ? "bg-ink text-paper" : "bg-ink/8 text-mut"
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
