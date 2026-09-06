import * as React from "react"
import { Link } from "react-router-dom"
import {
  BookOpen,
  CalendarDays,
  CalendarPlus,
  CircleAlert,
  DoorOpen,
  Gauge,
  Layers,
  Plus,
  TriangleAlert,
  Users,
} from "lucide-react"

import { useCampus } from "@/components/app/CampusProvider"
import { PageHeader, ViewTabs, useView } from "@/components/app/PageHeader"
import { StatCard, StatRow } from "@/components/app/StatCard"
import { DataGrid } from "@/components/app/DataGrid"
import {
  DetailRow,
  EmptyState,
  IconChip,
  Meter,
  Panel,
  PanelHead,
  SectionLabel,
  SegmentBar,
  StatusTag,
} from "@/components/app/primitives"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  NOTIFICATION_TYPES,
  TIMETABLE_STATUS,
  accent,
  option,
  pct,
  relativeTime,
  titleCase,
} from "@/lib/domain"

/* ============================================================
   Dashboard — three views over the same cache:
   Today (what needs attention), Capacity (is the estate coping),
   Activity (what changed recently).
   ============================================================ */

/** Derive every headline figure once, from the shared collections. */
function useMetrics() {
  const { courses, faculty, rooms, timetables, notifications } = useCampus()

  return React.useMemo(() => {
    const entries = timetables.flatMap((t) => t.schedule || [])
    const conflicts = timetables.reduce((n, t) => n + (t.conflicts?.length || 0), 0)
    const published = timetables.filter((t) => t.status === "published")
    const seats = rooms.reduce((n, r) => n + (r.capacity || 0), 0)

    // teaching hours booked per lecturer, against their stated ceiling
    const load = faculty
      .map((f) => {
        const booked = entries.filter((e) => e.facultyId === f._id).length
        return {
          ...f,
          booked,
          ceiling: f.maxHoursPerWeek || 0,
          usage: pct(booked, f.maxHoursPerWeek || 0),
        }
      })
      .sort((a, b) => b.usage - a.usage)

    // how hard each room works across the timetabled week
    const usage = rooms
      .map((r) => {
        const booked = entries.filter((e) => e.roomId === r._id).length
        return { ...r, booked, usage: pct(booked, 40) }
      })
      .sort((a, b) => b.usage - a.usage)

    const departments = [...new Set(courses.map((c) => c.department).filter(Boolean))]

    return {
      entries,
      conflicts,
      published,
      seats,
      load,
      usage,
      departments,
      unread: notifications.filter((n) => !n.isRead).length,
      credits: courses.reduce((n, c) => n + (c.credits || 0), 0),
    }
  }, [courses, faculty, rooms, timetables, notifications])
}

/* ---------------- Today ---------------- */

function TodayView({ metrics }) {
  const { courses, faculty, rooms, timetables, notifications, loading } = useCampus()

  const recent = [...timetables]
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .slice(0, 5)

  const alerts = [...notifications]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5)

  return (
    <div className="space-y-7">
      {metrics.conflicts > 0 && (
        <Panel className="co-rise flex flex-wrap items-center gap-3 border-red/30 bg-red-soft">
          <IconChip icon={TriangleAlert} tone="red" size="sm" />
          <p className="flex-1 text-[13px] text-ink">
            <span className="font-semibold">
              {metrics.conflicts} unresolved clash{metrics.conflicts === 1 ? "" : "es"}
            </span>{" "}
            across your timetables. Publishing is blocked until they are cleared.
          </p>
          <Button asChild size="sm" variant="destructive">
            <Link to="/timetables?view=conflicts">Review clashes</Link>
          </Button>
        </Panel>
      )}

      <StatRow>
        <StatCard
          icon={BookOpen}
          tone="blue"
          label="Courses"
          value={courses.length}
          caption={`${metrics.credits} credits · ${metrics.departments.length} departments`}
          to="/courses"
          loading={loading.courses}
        />
        <StatCard
          icon={Users}
          tone="violet"
          label="Faculty"
          value={faculty.length}
          caption={`${metrics.load.filter((f) => f.usage >= 90).length} at or over capacity`}
          to="/faculty"
          loading={loading.faculty}
        />
        <StatCard
          icon={DoorOpen}
          tone="green"
          label="Rooms"
          value={rooms.length}
          caption={`${metrics.seats.toLocaleString()} seats across campus`}
          to="/rooms"
          loading={loading.rooms}
        />
        <StatCard
          icon={CalendarDays}
          tone="cyan"
          label="Timetables"
          value={timetables.length}
          caption={`${metrics.published.length} published · ${metrics.entries.length} sessions`}
          to="/timetables"
          loading={loading.timetables}
        />
      </StatRow>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* recent timetables */}
        <Panel flush className="lg:col-span-2">
          <PanelHead
            icon={CalendarDays}
            title="Recent timetables"
            caption="Most recently edited first"
            action={
              <Button asChild size="sm" variant="outline">
                <Link to="/timetables">Open all</Link>
              </Button>
            }
          />
          {recent.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="No timetables yet"
              description="Generate one from your courses, faculty and rooms — it takes a few seconds."
              action={
                <Button asChild size="sm">
                  <Link to="/timetables?view=generate">
                    <Plus /> Generate a timetable
                  </Link>
                </Button>
              }
            />
          ) : (
            <ul className="co-stagger divide-y divide-line-2">
              {recent.map((t) => {
                const status = option(TIMETABLE_STATUS, t.status)
                return (
                  <li key={t._id}>
                    <Link
                      to="/timetables"
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-bone"
                    >
                      <IconChip icon={Layers} tone={status.accent} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">{t.name}</p>
                        <p className="truncate text-[11px] text-mut">
                          {titleCase(t.department)} · Semester {t.semester} · {t.year}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="co-num text-[13px] text-ink">{t.schedule?.length || 0}</p>
                        <p className="co-eyebrow">sessions</p>
                      </div>
                      {t.conflicts?.length > 0 && (
                        <StatusTag tone="red" icon={CircleAlert}>
                          {t.conflicts.length}
                        </StatusTag>
                      )}
                      <StatusTag tone={status.accent}>{status.label}</StatusTag>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        {/* alerts */}
        <Panel flush>
          <PanelHead
            icon={CircleAlert}
            title="Latest alerts"
            caption={metrics.unread ? `${metrics.unread} unread` : "All caught up"}
            action={
              <Button asChild size="sm" variant="ghost">
                <Link to="/notifications">All</Link>
              </Button>
            }
          />
          {alerts.length === 0 ? (
            <EmptyState
              icon={CircleAlert}
              title="Nothing to report"
              description="Announcements and warnings will appear here."
            />
          ) : (
            <ul className="co-stagger divide-y divide-line-2">
              {alerts.map((n) => {
                const type = option(NOTIFICATION_TYPES, n.type)
                return (
                  <li key={n._id} className="flex gap-3 px-5 py-3.5">
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        n.isRead ? "bg-line" : accent(type.accent).dot
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[13px] ${
                          n.isRead ? "font-medium text-mut" : "font-semibold text-ink"
                        }`}
                      >
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-mut">
                        {n.message}
                      </p>
                      <p className="co-index mt-1">{relativeTime(n.createdAt)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

/* ---------------- Capacity ---------------- */

function CapacityView({ metrics }) {
  const { rooms, faculty } = useCampus()

  const busiest = metrics.usage.slice(0, 6)
  const heaviest = metrics.load.slice(0, 6)

  const roomMix = React.useMemo(() => {
    const groups = {}
    rooms.forEach((r) => {
      groups[r.type] = (groups[r.type] || 0) + 1
    })
    const tones = { lecture_hall: "blue", lab: "violet", seminar_room: "green", auditorium: "amber" }
    return Object.entries(groups).map(([type, value]) => ({
      label: titleCase(type),
      value,
      tone: tones[type] || "ink",
    }))
  }, [rooms])

  return (
    <div className="space-y-7">
      <StatRow className="xl:grid-cols-3">
        <StatCard
          icon={Gauge}
          tone="blue"
          label="Sessions timetabled"
          value={metrics.entries.length}
          caption="Across every draft and published plan"
        />
        <StatCard
          icon={DoorOpen}
          tone="green"
          label="Seats available"
          value={metrics.seats}
          caption={`Mean ${rooms.length ? Math.round(metrics.seats / rooms.length) : 0} per room`}
        />
        <StatCard
          icon={Users}
          tone="violet"
          label="Weekly teaching ceiling"
          value={faculty.reduce((n, f) => n + (f.maxHoursPerWeek || 0), 0)}
          caption="Total contracted hours"
        />
      </StatRow>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionLabel index={1} title="Room mix" />
          <div className="mt-5">
            {roomMix.length ? (
              <SegmentBar segments={roomMix} />
            ) : (
              <p className="py-6 text-center text-xs text-mut">No rooms recorded yet.</p>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionLabel index={2} title="Busiest rooms" />
          <div className="mt-5 space-y-4">
            {busiest.length ? (
              busiest.map((r) => (
                <Meter
                  key={r._id}
                  label={r.name}
                  value={r.usage}
                  tone={r.usage > 85 ? "red" : r.usage > 60 ? "amber" : "green"}
                  caption={`${r.booked} sessions · ${r.capacity} seats`}
                />
              ))
            ) : (
              <p className="py-6 text-center text-xs text-mut">Nothing timetabled yet.</p>
            )}
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <SectionLabel index={3} title="Teaching load" />
          <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {heaviest.length ? (
              heaviest.map((f) => (
                <Meter
                  key={f._id}
                  label={f.name}
                  value={f.usage}
                  tone={f.usage > 100 ? "red" : f.usage > 80 ? "amber" : "blue"}
                  caption={`${f.booked} of ${f.ceiling} contracted hours · ${titleCase(f.department)}`}
                />
              ))
            ) : (
              <p className="py-6 text-center text-xs text-mut sm:col-span-2">
                Add faculty to see how the load is spread.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}

/* ---------------- Activity ---------------- */

function ActivityView() {
  const { courses, faculty, rooms, timetables, loading } = useCampus()

  const feed = React.useMemo(() => {
    const stamp = (row, kind, tone, describe) => ({
      _id: `${kind}-${row._id}`,
      kind,
      tone,
      label: describe(row),
      at: row.updatedAt || row.createdAt,
    })

    return [
      ...courses.map((c) => stamp(c, "Course", "blue", (r) => `${r.code} — ${r.name}`)),
      ...faculty.map((f) => stamp(f, "Faculty", "violet", (r) => r.name)),
      ...rooms.map((r) => stamp(r, "Room", "green", (x) => `${x.name} · ${titleCase(x.building)}`)),
      ...timetables.map((t) => stamp(t, "Timetable", "cyan", (r) => r.name)),
    ]
      .filter((row) => row.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 25)
  }, [courses, faculty, rooms, timetables])

  return (
    <DataGrid
      data={feed}
      loading={loading.courses || loading.faculty || loading.rooms}
      noun="changes"
      columns={[
        {
          key: "kind",
          label: "Type",
          width: "140px",
          sortable: true,
          render: (row) => <StatusTag tone={row.tone}>{row.kind}</StatusTag>,
        },
        {
          key: "label",
          label: "Record",
          sortable: true,
          render: (row) => <span className="font-medium">{row.label}</span>,
        },
        {
          key: "at",
          label: "Updated",
          width: "160px",
          align: "right",
          sortable: true,
          sortValue: (row) => new Date(row.at).getTime(),
          render: (row) => <span className="co-index">{relativeTime(row.at)}</span>,
        },
      ]}
    />
  )
}

/* ---------------- page ---------------- */

export default function Dashboard() {
  const [view, setView, views] = useView("dashboard")
  const metrics = useMetrics()
  const { timetables } = useCampus()

  const draft = timetables.find((t) => t.status === "draft")

  return (
    <div className="space-y-7">
      <PageHeader
        navId="dashboard"
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/courses">
                <Plus /> New course
              </Link>
            </Button>
            <Button asChild>
              <Link to="/timetables?view=generate">
                <CalendarPlus /> Generate timetable
              </Link>
            </Button>
          </>
        }
        tabs={<ViewTabs views={views} value={view} onChange={setView} />}
      />

      {view === "today" && <TodayView metrics={metrics} />}
      {view === "capacity" && <CapacityView metrics={metrics} />}
      {view === "activity" && <ActivityView />}

      {view === "today" && draft && (
        <Panel className="co-rise flex flex-wrap items-center gap-4">
          <IconChip icon={Layers} tone="amber" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink">
              “{draft.name}” is still a draft
            </p>
            <p className="text-[11.5px] text-mut">
              Publish it when you are happy, and it becomes the timetable everyone sees.
            </p>
          </div>
          <div className="hidden sm:block">
            <DetailRow label="Sessions">{draft.schedule?.length || 0}</DetailRow>
            <DetailRow label="Clashes">{draft.conflicts?.length || 0}</DetailRow>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/timetables">Open draft</Link>
          </Button>
        </Panel>
      )}
    </div>
  )
}
