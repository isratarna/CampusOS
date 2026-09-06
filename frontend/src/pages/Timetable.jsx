import * as React from "react"
import {
  CalendarDays,
  CalendarPlus,
  CircleAlert,
  CircleCheck,
  Download,
  Eye,
  FileJson,
  Layers,
  Send,
  Sheet,
  Sparkles,
  TriangleAlert,
  Undo2,
} from "lucide-react"

import { api, apiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  BREAK_SLOT,
  COURSE_TYPES,
  TIMETABLE_STATUS,
  TIME_SLOTS,
  WEEKDAYS,
  accent,
  formatDate,
  option,
  titleCase,
} from "@/lib/domain"
import { useCampus } from "@/components/app/CampusProvider"
import { useToast } from "@/components/app/Toast"
import { PageHeader, ViewTabs, useView } from "@/components/app/PageHeader"
import { ConfirmDialog } from "@/components/app/Modal"
import { SelectField, TextAreaField, TextField } from "@/components/app/Form"
import {
  DetailRow,
  EmptyState,
  ErrorNote,
  Eyebrow,
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
   Timetables — Schedules (read the week), Generate (build one),
   Conflicts (everything blocking a publish).
   ============================================================ */

/** Resolve the id references stored on a schedule entry. */
function useResolver() {
  const { courses, faculty, rooms } = useCampus()

  return React.useMemo(() => {
    const index = (list) => new Map(list.map((row) => [row._id, row]))
    const byCourse = index(courses)
    const byFaculty = index(faculty)
    const byRoom = index(rooms)

    return (entry) => ({
      course: byCourse.get(entry.courseId),
      lecturer: byFaculty.get(entry.facultyId),
      room: byRoom.get(entry.roomId),
    })
  }, [courses, faculty, rooms])
}

/* ---------------- week grid ---------------- */

function WeekGrid({ timetable }) {
  const resolve = useResolver()

  const cell = (day, slot) =>
    (timetable.schedule || []).find((e) => e.day === day && e.startTime === slot.start)

  return (
    <div className="co-scroll overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr>
            <th className="w-[92px] border-b border-r border-line px-3 py-2.5 text-left">
              <Eyebrow>Time</Eyebrow>
            </th>
            {WEEKDAYS.map((day) => (
              <th key={day} className="border-b border-line px-3 py-2.5 text-left">
                <Eyebrow className="text-ink">{day}</Eyebrow>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {TIME_SLOTS.map((slot, i) => (
            <React.Fragment key={slot.start}>
              {/* lunch divider, in the gap the generator leaves at midday */}
              {i === 3 && (
                <tr>
                  <td
                    colSpan={WEEKDAYS.length + 1}
                    className="border-b border-line bg-bone px-3 py-1.5"
                  >
                    <span className="co-index">
                      {BREAK_SLOT.start}–{BREAK_SLOT.end} · Break
                    </span>
                  </td>
                </tr>
              )}

              <tr>
                <td className="border-b border-r border-line px-3 py-2 align-top">
                  <p className="co-num text-[12px] text-ink">{slot.start}</p>
                  <p className="co-index">{slot.end}</p>
                </td>

                {WEEKDAYS.map((day) => {
                  const entry = cell(day, slot)
                  if (!entry) {
                    return (
                      <td
                        key={day}
                        className="border-b border-line px-1.5 py-1.5 align-top"
                      >
                        <div className="h-full min-h-[52px] rounded-sm border border-dashed border-line-2" />
                      </td>
                    )
                  }

                  const { course, lecturer, room } = resolve(entry)
                  const tone = option(COURSE_TYPES, course?.type).accent

                  return (
                    <td key={day} className="border-b border-line px-1.5 py-1.5 align-top">
                      <div
                        className={cn(
                          "co-lift min-h-[52px] rounded-sm border-l-[3px] bg-bone p-2",
                          "border border-line",
                          accent(tone).ring
                        )}
                        style={{ borderLeftColor: `var(--color-${tone})` }}
                      >
                        <p className="truncate font-mono text-[11px] font-bold text-ink">
                          {course?.code || "Unknown course"}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] leading-tight text-mut">
                          {lecturer?.name || "Unassigned"}
                        </p>
                        <p className="co-index mt-0.5 truncate">{room?.name || "No room"}</p>
                      </div>
                    </td>
                  )
                })}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------------- schedules ---------------- */

function SchedulesView({ selected, onSelect, onPublish, onDelete, busyId }) {
  const { courses, faculty, rooms, timetables, loading } = useCampus()
  const toast = useToast()

  const sorted = React.useMemo(
    () =>
      [...timetables].sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      ),
    [timetables]
  )

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${selected.name.replace(/\s+/g, "_")}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Exported as JSON.")
  }

  const exportCsv = () => {
    const rows = [["Day", "Start", "End", "Course", "Lecturer", "Room"]]
    // resolve ids so the export carries names rather than ObjectIds
    ;(selected.schedule || []).forEach((e) => {
      const course = courses.find((c) => c._id === e.courseId)
      const lecturer = faculty.find((f) => f._id === e.facultyId)
      const room = rooms.find((r) => r._id === e.roomId)
      rows.push([
        e.day,
        e.startTime,
        e.endTime,
        course ? `${course.code} ${course.name}` : e.courseId,
        lecturer?.name || e.facultyId,
        room?.name || e.roomId,
      ])
    })

    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${selected.name.replace(/\s+/g, "_")}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Exported as CSV.")
  }

  if (loading.timetables) return <Skeleton className="h-80 w-full rounded-md" />

  if (sorted.length === 0) {
    return (
      <Panel flush>
        <EmptyState
          icon={CalendarPlus}
          title="No timetables yet"
          description="Once you have courses, faculty and rooms in place, generate your first semester."
        />
      </Panel>
    )
  }

  return (
    <div className="grid gap-5 xl:grid-cols-4">
      {/* list */}
      <Panel flush className="xl:col-span-1">
        <PanelHead icon={Layers} title="Plans" caption={`${sorted.length} in total`} />
        <ul className="co-stagger max-h-[560px] overflow-y-auto co-scroll divide-y divide-line-2">
          {sorted.map((t) => {
            const status = option(TIMETABLE_STATUS, t.status)
            const active = selected?._id === t._id
            return (
              <li key={t._id}>
                <button
                  type="button"
                  onClick={() => onSelect(t)}
                  className={cn(
                    "flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors duration-150",
                    active ? "bg-amber/10" : "hover:bg-bone"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 h-8 w-[3px] shrink-0 rounded-full",
                      active ? "bg-amber" : "bg-line"
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">
                      {t.name}
                    </span>
                    <span className="co-index mt-0.5 block truncate">
                      {titleCase(t.department)} · Sem {t.semester}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1">
                      <StatusTag tone={status.accent}>{status.label}</StatusTag>
                      {t.conflicts?.length > 0 && (
                        <StatusTag tone="red" icon={CircleAlert}>
                          {t.conflicts.length}
                        </StatusTag>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Panel>

      {/* detail */}
      <div className="space-y-5 xl:col-span-3">
        {!selected ? (
          <Panel flush>
            <EmptyState
              icon={Eye}
              title="Pick a plan"
              description="Choose a timetable on the left to read its week."
            />
          </Panel>
        ) : (
          <>
            <Panel flush>
              <PanelHead
                icon={CalendarDays}
                title={selected.name}
                caption={`${titleCase(selected.department)} · Semester ${selected.semester} · ${selected.year}`}
                action={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button size="sm" variant="ghost" onClick={exportCsv} title="Export as CSV">
                      <Sheet /> CSV
                    </Button>
                    <Button size="sm" variant="ghost" onClick={exportJson} title="Export as JSON">
                      <FileJson /> JSON
                    </Button>
                    <Button
                      size="sm"
                      variant={selected.status === "published" ? "outline" : "default"}
                      onClick={() => onPublish(selected)}
                      disabled={
                        busyId === selected._id ||
                        (selected.status !== "published" && selected.conflicts?.length > 0)
                      }
                      title={
                        selected.status !== "published" && selected.conflicts?.length > 0
                          ? "Clear the clashes before publishing"
                          : undefined
                      }
                    >
                      {busyId === selected._id ? (
                        <Spinner className="size-3.5" />
                      ) : selected.status === "published" ? (
                        <Undo2 />
                      ) : (
                        <Send />
                      )}
                      {selected.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button size="sm" variant="subtle" onClick={() => onDelete(selected)}>
                      Delete
                    </Button>
                  </div>
                }
              />

              <div className="grid gap-x-8 gap-y-0 px-5 py-3 sm:grid-cols-3">
                <DetailRow label="Sessions">{selected.schedule?.length || 0}</DetailRow>
                <DetailRow label="Clashes">{selected.conflicts?.length || 0}</DetailRow>
                <DetailRow label="Updated">{formatDate(selected.updatedAt)}</DetailRow>
              </div>
            </Panel>

            {selected.conflicts?.length > 0 && (
              <ErrorNote icon={TriangleAlert}>
                {selected.conflicts.length} clash
                {selected.conflicts.length === 1 ? "" : "es"} in this plan — see the Conflicts tab.
              </ErrorNote>
            )}

            <Panel flush>
              <PanelHead
                icon={CalendarDays}
                title="The week"
                caption="Monday to Friday, teaching slots only"
              />
              {selected.schedule?.length ? (
                <WeekGrid timetable={selected} />
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title="This plan is empty"
                  description="No sessions were placed. Try generating it again with looser constraints."
                />
              )}
            </Panel>
          </>
        )}
      </div>
    </div>
  )
}

/* ---------------- generate ---------------- */

function GenerateView({ onGenerated }) {
  const { courses, faculty, rooms } = useCampus()
  const toast = useToast()

  const [form, setForm] = React.useState({
    department: "",
    semester: "1",
    academicYear: String(new Date().getFullYear()),
    constraintsText: "",
  })
  const [generating, setGenerating] = React.useState(false)
  const [error, setError] = React.useState(null)

  const departments = React.useMemo(
    () => [...new Set(courses.map((c) => c.department).filter(Boolean))].sort(),
    [courses]
  )

  React.useEffect(() => {
    if (!form.department && departments.length) {
      setForm((p) => ({ ...p, department: departments[0] }))
    }
  }, [departments, form.department])

  // readiness: the generator needs all three collections for this department
  const scoped = {
    courses: courses.filter((c) => c.department === form.department),
    faculty: faculty.filter((f) => f.department === form.department),
    rooms,
  }

  const checks = [
    {
      label: "Courses in this department",
      value: scoped.courses.length,
      ok: scoped.courses.length > 0,
      fix: "Add courses under this department first.",
    },
    {
      label: "Lecturers in this department",
      value: scoped.faculty.length,
      ok: scoped.faculty.length > 0,
      fix: "Add faculty so sessions have someone to teach them.",
    },
    {
      label: "Rooms with opening hours",
      value: rooms.filter((r) =>
        Object.values(r.availability || {}).some((slots) => slots?.length > 0)
      ).length,
      ok: rooms.some((r) =>
        Object.values(r.availability || {}).some((slots) => slots?.length > 0)
      ),
      fix: "Give at least one room some weekly availability.",
    },
  ]

  const ready = checks.every((c) => c.ok) && Boolean(form.department)

  const submit = async (e) => {
    e.preventDefault()
    setGenerating(true)
    setError(null)

    let constraints = {}
    if (form.constraintsText.trim()) {
      try {
        constraints = JSON.parse(form.constraintsText)
      } catch {
        // free text is fine — the generator reads it as a note
        constraints = { notes: form.constraintsText.trim() }
      }
    }

    try {
      const res = await api.post("/timetables/generate", {
        department: form.department,
        semester: Number.parseInt(form.semester, 10),
        academicYear: Number.parseInt(form.academicYear, 10),
        constraints,
      })
      toast.success("Timetable generated.")
      onGenerated(res.data)
    } catch (err) {
      setError(apiError(err, "The generator could not build this timetable."))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <Panel flush className="lg:col-span-3">
        <PanelHead
          icon={Sparkles}
          title="Generate a semester"
          caption="The scheduler places every course against faculty availability and room capacity"
        />

        <form onSubmit={submit} className="space-y-5 p-5">
          {error && <ErrorNote icon={CircleAlert}>{error}</ErrorNote>}

          {departments.length > 0 ? (
            <SelectField
              label="Department"
              required
              value={form.department}
              onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
              options={departments.map((d) => ({ value: d, label: titleCase(d) }))}
            />
          ) : (
            <TextField
              label="Department"
              required
              value={form.department}
              onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
              placeholder="Computer Science"
              hint="No departments found — add a course first."
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Semester"
              type="number"
              min="1"
              max="12"
              required
              value={form.semester}
              onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
            />
            <TextField
              label="Academic year"
              type="number"
              required
              value={form.academicYear}
              onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))}
            />
          </div>

          <TextAreaField
            label="Constraints"
            rows={4}
            value={form.constraintsText}
            onChange={(e) => setForm((p) => ({ ...p, constraintsText: e.target.value }))}
            placeholder={'No classes after 4pm on Fridays\n\n…or JSON: {"avoidFriday": true}'}
            hint="Plain English or JSON — both are passed through to the scheduler."
          />

          <div className="flex justify-end border-t border-line pt-4">
            <Button type="submit" disabled={generating || !ready}>
              {generating ? <Spinner className="size-3.5" /> : <Sparkles />}
              {generating ? "Building the week…" : "Generate timetable"}
            </Button>
          </div>
        </form>
      </Panel>

      {/* readiness */}
      <div className="lg:col-span-2">
        <Panel flush className="sticky top-24">
          <PanelHead icon={CircleCheck} title="Before you run it" caption="What the generator needs" />
          <ul className="divide-y divide-line-2">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-3 px-5 py-3.5">
                <IconChip
                  icon={c.ok ? CircleCheck : TriangleAlert}
                  tone={c.ok ? "green" : "amber"}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-ink">{c.label}</p>
                  {!c.ok && <p className="mt-0.5 text-[11px] text-mut">{c.fix}</p>}
                </div>
                <span className="co-num text-[13px] text-ink">{c.value}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-line bg-bone px-5 py-3">
            <p className="text-[11px] leading-relaxed text-mut">
              {ready
                ? "Everything checks out. Generating creates a draft you can review before publishing."
                : "Resolve the warnings above and the generate button unlocks."}
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}

/* ---------------- conflicts ---------------- */

function ConflictsView({ onSelect }) {
  const { timetables, loading } = useCampus()

  const all = React.useMemo(
    () =>
      timetables.flatMap((t) =>
        (t.conflicts || []).map((c, i) => ({ ...c, key: `${t._id}-${i}`, timetable: t }))
      ),
    [timetables]
  )

  if (loading.timetables) return <Skeleton className="h-64 w-full rounded-md" />

  if (all.length === 0) {
    return (
      <Panel flush>
        <EmptyState
          icon={CircleCheck}
          title="No clashes"
          description="Every timetable currently in FacultyOS is free of conflicts."
        />
      </Panel>
    )
  }

  return (
    <div className="space-y-5">
      <ErrorNote icon={TriangleAlert}>
        {all.length} clash{all.length === 1 ? "" : "es"} across{" "}
        {new Set(all.map((c) => c.timetable._id)).size} timetable
        {new Set(all.map((c) => c.timetable._id)).size === 1 ? "" : "s"}. A plan cannot be
        published while it holds any.
      </ErrorNote>

      <Panel flush>
        <PanelHead icon={TriangleAlert} title="Every conflict" caption="Newest plans first" />
        <ul className="co-stagger divide-y divide-line-2">
          {all.map((c) => (
            <li key={c.key} className="flex flex-wrap items-start gap-3 px-5 py-4">
              <IconChip icon={CircleAlert} tone="red" size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusTag tone="red">{titleCase(c.type)}</StatusTag>
                  <span className="co-index">{c.timetable.name}</span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink">{c.message}</p>
                {c.entries?.length > 0 && (
                  <p className="co-index mt-1">{c.entries.length} sessions involved</p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => onSelect(c.timetable)}>
                <Eye /> Open plan
              </Button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

/* ---------------- page ---------------- */

export default function TimetablePage() {
  const [view, setView, views] = useView("timetables")
  const { courses, timetables, loading, errors, refresh } = useCampus()
  const toast = useToast()

  const [selected, setSelected] = React.useState(null)
  const [pendingDelete, setPendingDelete] = React.useState(null)
  const [deleting, setDeleting] = React.useState(false)
  const [busyId, setBusyId] = React.useState(null)

  // default to the most recently touched plan, and keep it fresh
  React.useEffect(() => {
    if (!timetables.length) {
      setSelected(null)
      return
    }
    setSelected((prev) => {
      const match = prev && timetables.find((t) => t._id === prev._id)
      if (match) return match
      return [...timetables].sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      )[0]
    })
  }, [timetables])

  const openPlan = (t) => {
    setSelected(t)
    setView("schedules")
  }

  const togglePublish = async (t) => {
    setBusyId(t._id)
    const next = t.status === "published" ? "draft" : "published"
    try {
      await api.put(`/timetables/${t._id}`, { ...t, status: next })
      toast.success(next === "published" ? `${t.name} published.` : `${t.name} moved back to draft.`)
      refresh("timetables")
    } catch (err) {
      toast.error(apiError(err, "Could not change the status."))
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/timetables/${pendingDelete._id}`)
      toast.success(`${pendingDelete.name} deleted.`)
      if (selected?._id === pendingDelete._id) setSelected(null)
      setPendingDelete(null)
      refresh("timetables")
    } catch (err) {
      toast.error(apiError(err, "Could not delete this timetable."))
    } finally {
      setDeleting(false)
    }
  }

  const conflictCount = timetables.reduce((n, t) => n + (t.conflicts?.length || 0), 0)
  const sessions = timetables.reduce((n, t) => n + (t.schedule?.length || 0), 0)
  const published = timetables.filter((t) => t.status === "published").length

  const tabs = views.map((v) => ({
    ...v,
    count:
      v.id === "schedules"
        ? timetables.length
        : v.id === "conflicts"
          ? conflictCount || undefined
          : undefined,
  }))

  return (
    <div className="space-y-7">
      <PageHeader
        navId="timetables"
        actions={
          <Button onClick={() => setView("generate")}>
            <Sparkles /> Generate
          </Button>
        }
        tabs={<ViewTabs views={tabs} value={view} onChange={setView} />}
      />

      {errors.timetables && <ErrorNote icon={CircleAlert}>{errors.timetables}</ErrorNote>}

      <StatRow>
        <StatCard
          icon={Layers}
          tone="cyan"
          label="Plans"
          value={timetables.length}
          caption={`${published} published`}
          loading={loading.timetables}
        />
        <StatCard
          icon={CalendarDays}
          tone="blue"
          label="Sessions placed"
          value={sessions}
          caption="Across every plan"
          loading={loading.timetables}
        />
        <StatCard
          icon={TriangleAlert}
          tone={conflictCount ? "red" : "green"}
          label="Clashes"
          value={conflictCount}
          caption={conflictCount ? "Blocking publication" : "Nothing blocking"}
          loading={loading.timetables}
        />
        <StatCard
          icon={Download}
          tone="violet"
          label="Courses to place"
          value={courses.reduce((n, c) => n + (c.hoursPerWeek || 0), 0)}
          caption="Weekly contact hours in the catalogue"
          loading={loading.courses}
        />
      </StatRow>

      {view === "schedules" && (
        <SchedulesView
          selected={selected}
          onSelect={setSelected}
          onPublish={togglePublish}
          onDelete={setPendingDelete}
          busyId={busyId}
        />
      )}

      {view === "generate" && (
        <GenerateView
          onGenerated={async (created) => {
            await refresh("timetables")
            await refresh("notifications")
            if (created?._id) setSelected(created)
            setView("schedules")
          }}
        />
      )}

      {view === "conflicts" && <ConflictsView onSelect={openPlan} />}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete ${pendingDelete?.name}?`}
        description={
          pendingDelete && `${pendingDelete.schedule?.length || 0} sessions will be removed`
        }
      />
    </div>
  )
}
