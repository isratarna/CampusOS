import * as React from "react"
import {
  CalendarClock,
  CircleAlert,
  Gauge,
  Plus,
  UserRound,
  Users,
} from "lucide-react"

import { api, apiError } from "@/lib/api"
import { initials, pct, titleCase } from "@/lib/domain"
import { useCampus } from "@/components/app/CampusProvider"
import { useToast } from "@/components/app/Toast"
import { PageHeader, ViewTabs, useView } from "@/components/app/PageHeader"
import { DataGrid } from "@/components/app/DataGrid"
import { ConfirmDialog, Modal } from "@/components/app/Modal"
import { FormGrid, TagField, TextField } from "@/components/app/Form"
import {
  AvailabilityEditor,
  AvailabilityStrip,
  EMPTY_AVAILABILITY,
  toAvailability,
  totalHours,
} from "@/components/app/Availability"
import {
  EmptyState,
  ErrorNote,
  Eyebrow,
  Meter,
  Panel,
  PanelHead,
  Skeleton,
  Spinner,
  StatusTag,
} from "@/components/app/primitives"
import { StatCard, StatRow } from "@/components/app/StatCard"
import { Button } from "@/components/ui/button"

/* ============================================================
   Faculty — Directory (who is on staff), Availability (when they
   can teach), Workload (whether the plan respects their ceiling).
   ============================================================ */

const EMPTY = {
  name: "",
  email: "",
  department: "",
  specialization: [],
  maxHoursPerWeek: 12,
  availability: EMPTY_AVAILABILITY,
  preferences: { preferredTimeSlots: [], avoidTimeSlots: [] },
}

function FacultyFormModal({ open, member, onClose, onSaved }) {
  const [form, setForm] = React.useState(EMPTY)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState(null)
  const toast = useToast()
  const editing = Boolean(member)

  React.useEffect(() => {
    if (!open) return
    setError(null)
    setForm(
      member
        ? {
            ...EMPTY,
            ...member,
            specialization: member.specialization || [],
            availability: toAvailability(member.availability),
            preferences: {
              preferredTimeSlots: member.preferences?.preferredTimeSlots || [],
              avoidTimeSlots: member.preferences?.avoidTimeSlots || [],
            },
          }
        : { ...EMPTY, availability: toAvailability() }
    )
  }, [open, member])

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = { ...form, maxHoursPerWeek: Number(form.maxHoursPerWeek) }

    try {
      if (editing) await api.put(`/faculty/${member._id}`, payload)
      else await api.post("/faculty", payload)
      toast.success(editing ? `${payload.name} updated.` : `${payload.name} added to the directory.`)
      onSaved()
      onClose()
    } catch (err) {
      setError(apiError(err, "Could not save this record."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={UserRound}
      size="lg"
      title={editing ? `Edit ${member.name}` : "Add a lecturer"}
      description="Availability and the weekly ceiling are what the generator schedules against."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="faculty-form" disabled={saving}>
            {saving && <Spinner className="size-3.5" />}
            {editing ? "Save changes" : "Add lecturer"}
          </Button>
        </>
      }
    >
      <form id="faculty-form" onSubmit={submit} className="space-y-6">
        {error && <ErrorNote icon={CircleAlert}>{error}</ErrorNote>}

        <FormGrid>
          <TextField
            label="Full name"
            required
            value={form.name}
            onChange={set("name")}
            placeholder="Dr Sarah Ahmed"
          />
          <TextField
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={set("email")}
            placeholder="s.ahmed@campus.edu"
          />
          <TextField
            label="Department"
            required
            value={form.department}
            onChange={set("department")}
            placeholder="Computer Science"
          />
          <TextField
            label="Max hours / week"
            type="number"
            min="1"
            max="40"
            required
            value={form.maxHoursPerWeek}
            onChange={set("maxHoursPerWeek")}
            hint="The generator will not exceed this."
          />
          <TagField
            className="sm:col-span-2"
            label="Specialisations"
            value={form.specialization}
            onChange={(next) => setForm((p) => ({ ...p, specialization: next }))}
            placeholder="Algorithms, Databases…"
            hint="Used to match lecturers to the right courses."
          />
        </FormGrid>

        <div>
          <Eyebrow className="mb-2 block text-ink">Weekly availability</Eyebrow>
          <AvailabilityEditor
            value={form.availability}
            onChange={(next) => setForm((p) => ({ ...p, availability: next }))}
          />
        </div>
      </form>
    </Modal>
  )
}

/* ---------------- workload maths ---------------- */

function useLoad() {
  const { faculty, timetables } = useCampus()

  return React.useMemo(() => {
    const entries = timetables.flatMap((t) => t.schedule || [])
    return faculty.map((f) => {
      const booked = entries.filter((e) => e.facultyId === f._id).length
      const ceiling = f.maxHoursPerWeek || 0
      return {
        ...f,
        booked,
        ceiling,
        usage: pct(booked, ceiling),
        over: ceiling > 0 && booked > ceiling,
        available: totalHours(f.availability),
      }
    })
  }, [faculty, timetables])
}

/* ---------------- views ---------------- */

function DirectoryView({ onEdit, onDelete }) {
  const { faculty, loading } = useCampus()

  return (
    <DataGrid
      data={faculty}
      loading={loading.faculty}
      noun="lecturers"
      searchKeys={["name", "email", "department"]}
      searchPlaceholder="Search name, email or department"
      onEdit={onEdit}
      onDelete={onDelete}
      columns={[
        {
          key: "name",
          label: "Lecturer",
          sortable: true,
          render: (row) => (
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-violet-soft text-[11px] font-bold text-violet">
                {initials(row.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{row.name}</p>
                <p className="co-index truncate">{row.email}</p>
              </div>
            </div>
          ),
        },
        {
          key: "department",
          label: "Department",
          width: "180px",
          sortable: true,
          render: (row) => titleCase(row.department),
        },
        {
          key: "specialization",
          label: "Specialisations",
          render: (row) =>
            row.specialization?.length ? (
              <div className="flex flex-wrap gap-1">
                {row.specialization.slice(0, 3).map((s) => (
                  <StatusTag key={s} tone="ink">
                    {s}
                  </StatusTag>
                ))}
                {row.specialization.length > 3 && (
                  <span className="co-index self-center">
                    +{row.specialization.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-mut-2">—</span>
            ),
        },
        {
          key: "maxHoursPerWeek",
          label: "Ceiling",
          width: "100px",
          align: "right",
          sortable: true,
          render: (row) => <span className="co-num">{row.maxHoursPerWeek}h</span>,
        },
      ]}
    />
  )
}

function AvailabilityView() {
  const { faculty, loading } = useCampus()

  if (loading.faculty) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Panel key={i} className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-full" />
          </Panel>
        ))}
      </div>
    )
  }

  if (faculty.length === 0) {
    return (
      <Panel flush>
        <EmptyState
          icon={CalendarClock}
          title="No lecturers yet"
          description="Add staff and their teaching windows will map out here."
        />
      </Panel>
    )
  }

  return (
    <div className="co-stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {faculty.map((f) => {
        const hours = totalHours(f.availability)
        return (
          <Panel key={f._id} className="co-lift space-y-4">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-violet-soft text-[11px] font-bold text-violet">
                {initials(f.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink">{f.name}</p>
                <p className="co-index truncate">{titleCase(f.department)}</p>
              </div>
              <StatusTag tone={hours >= f.maxHoursPerWeek ? "green" : "amber"}>
                {hours.toFixed(0)}h free
              </StatusTag>
            </div>

            <AvailabilityStrip value={f.availability} />

            <p className="text-[11px] leading-relaxed text-mut">
              {hours === 0
                ? "No teaching windows recorded — the generator will skip this lecturer."
                : hours < f.maxHoursPerWeek
                  ? `Only ${hours.toFixed(1)}h available against a ${f.maxHoursPerWeek}h ceiling.`
                  : `${hours.toFixed(1)}h available, ceiling ${f.maxHoursPerWeek}h.`}
            </p>
          </Panel>
        )
      })}
    </div>
  )
}

function WorkloadView() {
  const load = useLoad()
  const { loading } = useCampus()

  if (loading.faculty) return <Skeleton className="h-64 w-full rounded-md" />

  const sorted = [...load].sort((a, b) => b.usage - a.usage)
  const over = sorted.filter((f) => f.over)

  return (
    <div className="space-y-5">
      {over.length > 0 && (
        <ErrorNote icon={CircleAlert}>
          {over.length} lecturer{over.length === 1 ? " is" : "s are"} booked past their contracted
          ceiling: {over.map((f) => f.name).join(", ")}.
        </ErrorNote>
      )}

      <Panel flush>
        <PanelHead
          icon={Gauge}
          title="Load against ceiling"
          caption="Timetabled sessions compared with contracted weekly hours"
        />
        {sorted.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nothing to weigh up"
            description="Add faculty and generate a timetable to see the distribution."
          />
        ) : (
          <div className="co-stagger grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
            {sorted.map((f) => (
              <Meter
                key={f._id}
                label={f.name}
                value={f.usage}
                tone={f.over ? "red" : f.usage > 80 ? "amber" : "green"}
                caption={`${f.booked} of ${f.ceiling}h · ${titleCase(f.department)}`}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

/* ---------------- page ---------------- */

export default function FacultyPage() {
  const [view, setView, views] = useView("faculty")
  const { faculty, loading, errors, refresh } = useCampus()
  const load = useLoad()
  const toast = useToast()

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(null)
  const [pendingDelete, setPendingDelete] = React.useState(null)
  const [deleting, setDeleting] = React.useState(false)

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/faculty/${pendingDelete._id}`)
      toast.success(`${pendingDelete.name} removed.`)
      setPendingDelete(null)
      refresh("faculty")
    } catch (err) {
      toast.error(apiError(err, "Could not delete this record."))
    } finally {
      setDeleting(false)
    }
  }

  const departments = new Set(faculty.map((f) => f.department).filter(Boolean))

  const tabs = views.map((v) => ({
    ...v,
    count: v.id === "directory" ? faculty.length : undefined,
  }))

  return (
    <div className="space-y-7">
      <PageHeader
        navId="faculty"
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Add lecturer
          </Button>
        }
        tabs={<ViewTabs views={tabs} value={view} onChange={setView} />}
      />

      {errors.faculty && <ErrorNote icon={CircleAlert}>{errors.faculty}</ErrorNote>}

      <StatRow className="xl:grid-cols-4">
        <StatCard
          icon={Users}
          tone="violet"
          label="Lecturers"
          value={faculty.length}
          caption={`Across ${departments.size} department${departments.size === 1 ? "" : "s"}`}
          loading={loading.faculty}
        />
        <StatCard
          icon={Gauge}
          tone="blue"
          label="Contracted hours"
          value={faculty.reduce((n, f) => n + (f.maxHoursPerWeek || 0), 0)}
          caption="Combined weekly ceiling"
          loading={loading.faculty}
        />
        <StatCard
          icon={CalendarClock}
          tone="green"
          label="Available hours"
          value={Math.round(load.reduce((n, f) => n + f.available, 0))}
          caption="Declared teaching windows"
          loading={loading.faculty}
        />
        <StatCard
          icon={CircleAlert}
          tone={load.some((f) => f.over) ? "red" : "green"}
          label="Over ceiling"
          value={load.filter((f) => f.over).length}
          caption="Booked beyond contract"
          loading={loading.faculty}
        />
      </StatRow>

      {view === "directory" && (
        <DirectoryView
          onEdit={(m) => {
            setEditing(m)
            setFormOpen(true)
          }}
          onDelete={setPendingDelete}
        />
      )}
      {view === "availability" && <AvailabilityView />}
      {view === "workload" && <WorkloadView />}

      <FacultyFormModal
        open={formOpen}
        member={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => refresh("faculty")}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={`Remove ${pendingDelete?.name}?`}
        description={pendingDelete?.email}
      />
    </div>
  )
}
