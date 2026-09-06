/* ============================================================
   Page furniture lifted from the reference sheet's background:
   flat Bauhaus blocks, halftone patches, crop lines and a
   registration mark.

   Held deliberately quiet. Shapes sit at the extreme edges, mostly
   cropped off-canvas, and content panels are opaque paper on top —
   so this reads as the texture of the page, never as content.
   Purely decorative and non-interactive.
   ============================================================ */

function Halftone({ className, style }) {
  return <div aria-hidden className={`co-halftone ${className}`} style={style} />
}

/** Printer's registration target. */
function RegMark({ className }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <circle cx="20" cy="20" r="9" />
      <path d="M20 0v13M20 27v13M0 20h13M27 20h13" />
    </svg>
  )
}

export function Decor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* ---- top edge ---- */}
      <div className="absolute -top-6 left-[13%] h-14 w-20 bg-blue/12" />
      <div className="absolute -top-2 left-[19%] h-10 w-4 bg-ink/10" />
      <Halftone className="absolute left-[23%] top-0 h-16 w-12" style={{ opacity: 0.06 }} />

      {/* ---- right edge ---- */}
      <div className="absolute -right-16 top-24 size-36 rounded-full bg-red/12" />
      <div className="absolute -right-10 bottom-[22%] h-52 w-16 bg-amber/16" />
      <div
        className="absolute -right-8 top-[46%] size-32 bg-violet/10"
        style={{ borderRadius: "100% 0 0 0" }}
      />

      {/* ---- bottom edge ---- */}
      <div className="absolute -bottom-28 left-[8%] size-64 rounded-full bg-violet/10" />
      <Halftone className="absolute bottom-6 right-[26%] h-16 w-20" style={{ opacity: 0.06 }} />

      {/* ---- press marks ---- */}
      <div className="absolute right-[8%] top-9 h-px w-40 bg-ink/12" />
      <div className="absolute right-[8%] top-9 size-1 -translate-y-px rounded-full bg-ink/25" />
      <div className="absolute left-[46%] top-0 h-12 w-px bg-ink/10" />
      <div className="absolute bottom-0 left-[31%] h-16 w-px bg-ink/8" />
      <RegMark className="absolute bottom-16 right-[14%] size-8 text-ink/12" />
    </div>
  )
}
