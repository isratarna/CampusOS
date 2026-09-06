import * as React from "react"
import {
  Bell,
  BellOff,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  Info,
  Send,
  Trash2,
  TriangleAlert,
} from "lucide-react"

import { api, apiError } from "@/lib/api"
import { NOTIFICATION_TYPES, accent, option, relativeTime } from "@/lib/domain"
import { cn } from "@/lib/utils"
import { useCampus } from "@/components/app/CampusProvider"
import { useToast } from "@/components/app/Toast"
import { PageHeader, ViewTabs, useView } from "@/components/app/PageHeader"
import { ConfirmDialog } from "@/components/app/Modal"
import { SelectField, TextAreaField, TextField } from "@/components/app/Form"
import {
  EmptyState,
  ErrorNote,
  IconChip,
  Panel,
  PanelHead,
  Skeleton,
  Spinner,
  StatusTag,
} from "@/components/app/primitives"
import { StatCard, StatRow } from "@/components/app/StatCard"
import { Button } from "@/components/ui/button"

/* ============================================================
   Alerts — Inbox (everything), Unread (what still needs a look),
   Compose (publish an announcement).
   ============================================================ */

const TYPE_ICON = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
}

function AlertRow({ notification, onRead, onDelete, busy }) {
  const type = option(NOTIFICATION_TYPES, notification.type)
  const Icon = TYPE_ICON[notification.type] || Info

  return (
    <li
      className={cn(
        "group/row flex gap-3 px-5 py-4 transition-colors duration-150 hover:bg-bone",
        !notification.isRead && "bg-amber/5"
      )}
    >
      <IconChip icon={Icon} tone={type.accent} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "text-[13.5px]",
              notification.isRead ? "font-medium text-mut" : "font-semibold text-ink"
            )}
          >
            {notification.title}
          </p>
          <StatusTag tone={type.accent}>{type.label}</StatusTag>
          {!notification.isRead && (
            <span className={cn("size-1.5 rounded-full", accent("amber").dot)} />
          )}
        </div>

        <p className="mt-1 text-[12.5px] leading-relaxed text-mut">{notification.message}</p>
        <p className="co-index mt-1.5">{relativeTime(notification.createdAt)}</p>
      </div>

      <div className="flex shrink-0 items-start gap-0.5 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover/row:opacity-100">
        {!notification.isRead && (
          <button
            type="button"
            onClick={() => onRead(notification)}
            disabled={busy}
            aria-label="Mark as read"
            title="Mark as read"
            className="co-press grid size-7 place-items-center rounded-sm text-mut-2 hover:bg-green-soft hover:text-green"
          >
            <CheckCheck className="size-3.5" strokeWidth={2.2} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(notification)}
          aria-label="Delete"
          title="Delete"
          className="co-press grid size-7 place-items-center rounded-sm text-mut-2 hover:bg-red-soft hover:text-red"
        >
          <Trash2 className="size-3.5" strokeWidth={2.2} />
        </button>
      </div>
    </li>
  )
}

function AlertList({ items, loading, emptyTitle, emptyBody, onRead, onDelete, busyId }) {
  if (loading) {
    return (
      <Panel flush>
        <ul className="divide-y divide-line-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex gap-3 px-5 py-4">
              <Skeleton className="size-7 rounded-sm" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-full max-w-md" />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    )
  }

  if (items.length === 0) {
    return (
      <Panel flush>
        <EmptyState icon={BellOff} title={emptyTitle} description={emptyBody} />
      </Panel>
    )
  }

  return (
    <Panel flush>
      <ul className="co-stagger divide-y divide-line-2">
        {items.map((n) => (
          <AlertRow
            key={n._id}
            notification={n}
            onRead={onRead}
            onDelete={onDelete}
            busy={busyId === n._id}
          />
        ))}
      </ul>
    </Panel>
  )
}

function ComposeView({ onPublished }) {
  const [form, setForm] = React.useState({ title: "", message: "", type: "info" })
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState(null)
  const toast = useToast()

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await api.post("/notifications", form)
      toast.success("Announcement published.")
      setForm({ title: "", message: "", type: "info" })
      onPublished()
    } catch (err) {
      setError(apiError(err, "Could not publish this announcement."))
    } finally {
      setSending(false)
    }
  }

  const type = option(NOTIFICATION_TYPES, form.type)
  const PreviewIcon = TYPE_ICON[form.type] || Info

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <Panel flush className="lg:col-span-3">
        <PanelHead
          icon={Send}
          title="New announcement"
          caption="Goes out to everyone with access to CampusOS"
        />
        <form onSubmit={submit} className="space-y-5 p-5">
          {error && <ErrorNote icon={CircleAlert}>{error}</ErrorNote>}

          <TextField
            label="Title"
            required
            value={form.title}
            onChange={set("title")}
            placeholder="Room B204 closed for maintenance"
          />
          <SelectField
            label="Severity"
            value={form.type}
            onChange={set("type")}
            options={NOTIFICATION_TYPES}
            hint="Sets the colour and how prominently it is listed."
          />
          <TextAreaField
            label="Message"
            required
            rows={5}
            value={form.message}
            onChange={set("message")}
            placeholder="What has changed, when it takes effect, and what people should do about it."
          />

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setForm({ title: "", message: "", type: "info" })}
              disabled={sending}
            >
              Clear
            </Button>
            <Button type="submit" disabled={sending || !form.title.trim() || !form.message.trim()}>
              {sending ? <Spinner className="size-3.5" /> : <Send />}
              Publish
            </Button>
          </div>
        </form>
      </Panel>

      {/* live preview */}
      <div className="lg:col-span-2">
        <Panel flush className="sticky top-24">
          <PanelHead icon={Bell} title="Preview" caption="How this lands in the inbox" />
          <div className="p-5">
            <div className="flex gap-3 rounded-sm border border-line bg-amber/5 p-4">
              <IconChip icon={PreviewIcon} tone={type.accent} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13.5px] font-semibold text-ink">
                    {form.title.trim() || "Untitled announcement"}
                  </p>
                  <StatusTag tone={type.accent}>{type.label}</StatusTag>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-mut">
                  {form.message.trim() || "Your message will appear here."}
                </p>
                <p className="co-index mt-1.5">just now</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

/* ---------------- page ---------------- */

export default function NotificationsPage() {
  const [view, setView, views] = useView("notifications")
  const { notifications, loading, errors, refresh } = useCampus()
  const toast = useToast()

  const [pendingDelete, setPendingDelete] = React.useState(null)
  const [deleting, setDeleting] = React.useState(false)
  const [busyId, setBusyId] = React.useState(null)
  const [markingAll, setMarkingAll] = React.useState(false)

  const sorted = React.useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    [notifications]
  )
  const unread = sorted.filter((n) => !n.isRead)

  const markRead = async (n) => {
    setBusyId(n._id)
    try {
      await api.put(`/notifications/${n._id}/read`)
      refresh("notifications")
    } catch (err) {
      toast.error(apiError(err, "Could not mark this as read."))
    } finally {
      setBusyId(null)
    }
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    try {
      await Promise.all(unread.map((n) => api.put(`/notifications/${n._id}/read`)))
      toast.success(`${unread.length} alert${unread.length === 1 ? "" : "s"} marked as read.`)
      refresh("notifications")
    } catch (err) {
      toast.error(apiError(err, "Could not mark everything as read."))
    } finally {
      setMarkingAll(false)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/notifications/${pendingDelete._id}`)
      toast.success("Alert deleted.")
      setPendingDelete(null)
      refresh("notifications")
    } catch (err) {
      toast.error(apiError(err, "Could not delete this alert."))
    } finally {
      setDeleting(false)
    }
  }

  const counts = React.useMemo(
    () =>
      NOTIFICATION_TYPES.map((t) => ({
        ...t,
        count: notifications.filter((n) => n.type === t.value).length,
      })),
    [notifications]
  )

  const tabs = views.map((v) => ({
    ...v,
    count:
      v.id === "inbox" ? notifications.length : v.id === "unread" ? unread.length : undefined,
  }))

  return (
    <div className="space-y-7">
      <PageHeader
        navId="notifications"
        actions={
          <>
            {unread.length > 0 && (
              <Button variant="outline" onClick={markAllRead} disabled={markingAll}>
                {markingAll ? <Spinner className="size-3.5" /> : <CheckCheck />}
                Mark all read
              </Button>
            )}
            <Button onClick={() => setView("compose")}>
              <Send /> New announcement
            </Button>
          </>
        }
        tabs={<ViewTabs views={tabs} value={view} onChange={setView} />}
      />

      {errors.notifications && <ErrorNote icon={CircleAlert}>{errors.notifications}</ErrorNote>}

      {view !== "compose" && (
        <StatRow>
          {counts.map((t) => (
            <StatCard
              key={t.value}
              icon={TYPE_ICON[t.value]}
              tone={t.accent}
              label={t.label}
              value={t.count}
              caption={`${
                notifications.filter((n) => n.type === t.value && !n.isRead).length
              } unread`}
              loading={loading.notifications}
            />
          ))}
        </StatRow>
      )}

      {view === "inbox" && (
        <AlertList
          items={sorted}
          loading={loading.notifications}
          emptyTitle="Nothing here yet"
          emptyBody="Announcements and scheduling warnings will collect in this inbox."
          onRead={markRead}
          onDelete={setPendingDelete}
          busyId={busyId}
        />
      )}

      {view === "unread" && (
        <AlertList
          items={unread}
          loading={loading.notifications}
          emptyTitle="All caught up"
          emptyBody="Every alert has been read. New ones will surface here."
          onRead={markRead}
          onDelete={setPendingDelete}
          busyId={busyId}
        />
      )}

      {view === "compose" && <ComposeView onPublished={() => refresh("notifications")} />}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this alert?"
        description={pendingDelete?.title}
      />
    </div>
  )
}
