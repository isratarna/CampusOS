import * as React from "react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"
import { api, apiError } from "@/lib/api"
import { useAssistantContext } from "./CampusProvider"
import { Eyebrow, Spinner } from "./primitives"
import { ArrowUp, Sparkles, TriangleAlert, X } from "lucide-react"

/* ============================================================
   Assistant drawer.

   Slides in over the working area rather than floating above it,
   so the conversation reads as another panel of the same document.
   Every question is sent with a snapshot of the loaded collections,
   which is what lets it answer about *this* campus.
   ============================================================ */

const OPENERS = [
  "Which rooms are over capacity this semester?",
  "Who has the heaviest teaching load?",
  "Summarise the clashes in my latest timetable.",
]

function Bubble({ message }) {
  const mine = message.sender === "user"

  return (
    <div className={cn("co-rise flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[86%] rounded-md px-3.5 py-2.5 text-[13px] leading-relaxed",
          mine
            ? "bg-ink text-paper"
            : message.error
              ? "border border-red/30 bg-red-soft text-red"
              : "border border-line bg-bone text-ink"
        )}
      >
        {mine ? (
          message.text
        ) : (
          <div
            className={cn(
              "[&_a]:text-blue [&_a]:underline",
              "[&_code]:rounded-[3px] [&_code]:bg-ink/8 [&_code]:px-1 [&_code]:py-px [&_code]:font-mono [&_code]:text-[11.5px]",
              "[&_li]:my-0.5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-4",
              "[&_p]:my-1.5 first:[&_p]:mt-0 last:[&_p]:mb-0",
              "[&_strong]:font-semibold",
              "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-4"
            )}
          >
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

export function AssistantDock({ open, onClose }) {
  const [messages, setMessages] = React.useState([])
  const [input, setInput] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const endRef = React.useRef(null)
  const inputRef = React.useRef(null)
  const context = useAssistantContext()

  React.useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 320)
      return () => clearTimeout(id)
    }
  }, [open])

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, sending])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const send = async (text) => {
    const question = (text ?? input).trim()
    if (!question || sending) return

    setMessages((prev) => [...prev, { sender: "user", text: question }])
    setInput("")
    setSending(true)

    try {
      const res = await api.post("/ai/chat", { message: question, context })
      setMessages((prev) => [...prev, { sender: "bot", text: res.data.response }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", error: true, text: apiError(err, "The assistant is unavailable.") },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-50 bg-ink/25 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        role="dialog"
        aria-label="FacultyOS assistant"
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-line bg-paper shadow-pop",
          "transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* head */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="grid size-9 place-items-center rounded-sm bg-amber">
            <Sparkles className="size-4 text-ink" strokeWidth={2.3} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">Assistant</h2>
            <p className="flex items-center gap-1.5 text-[11px] text-mut">
              <span className="co-ping size-1.5 rounded-full bg-green" />
              Reading {context.counts.courses} courses · {context.counts.rooms} rooms
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="co-press grid size-8 place-items-center rounded-sm text-mut hover:bg-bone-2 hover:text-ink"
            aria-label="Close assistant"
          >
            <X className="size-4" strokeWidth={2.2} />
          </button>
        </div>

        {/* transcript */}
        <div className="co-scroll flex-1 space-y-3 overflow-y-auto px-5 py-5">
          {messages.length === 0 ? (
            <div className="co-fade">
              <p className="text-[13px] leading-relaxed text-mut">
                Ask about the timetable, teaching load or room capacity. The assistant sees the
                data currently loaded in FacultyOS.
              </p>
              <Eyebrow className="mt-6 block">Try one</Eyebrow>
              <div className="mt-2 space-y-1.5">
                {OPENERS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="co-press block w-full rounded-sm border border-line bg-bone px-3 py-2.5 text-left text-[12.5px] leading-snug text-ink hover:border-amber hover:bg-amber/10"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => <Bubble key={i} message={m} />)
          )}

          {sending && (
            <div className="co-fade flex items-center gap-2 text-[12px] text-mut">
              <Spinner className="size-3.5" />
              Thinking…
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
          className="border-t border-line p-4"
        >
          <div className="flex items-end gap-2 rounded-sm border border-line bg-bone p-2 transition-colors duration-200 focus-within:border-blue focus-within:bg-paper">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Ask about your schedule…"
              className="co-scroll max-h-28 min-h-[26px] flex-1 resize-none bg-transparent px-1.5 py-1 text-[13px] text-ink placeholder:text-mut-2 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Send"
              className="co-press grid size-8 shrink-0 place-items-center rounded-sm bg-ink text-paper disabled:opacity-30"
            >
              <ArrowUp className="size-4" strokeWidth={2.4} />
            </button>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-mut-2">
            <TriangleAlert className="size-3 shrink-0" strokeWidth={2.2} />
            Answers are generated — double-check anything you publish.
          </p>
        </form>
      </aside>
    </>
  )
}
