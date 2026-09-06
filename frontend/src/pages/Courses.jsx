import * as React from "react"
import {
  BookOpen,
  Building2,
  CircleAlert,
  GitBranch,
  Layers,
  Plus,
  Timer,
} from "lucide-react"

import { api, apiError } from "@/lib/api"
import { COURSE_TYPES, option, titleCase } from "@/lib/domain"
import { useCampus } from "@/components/app/CampusProvider"
import { useToast } from "@/components/app/Toast"
import { PageHeader, ViewTabs, useView } from "@/components/app/PageHeader"
import { DataGrid } from "@/components/app/DataGrid"
import { ConfirmDialog, Modal } from "@/components/app/Modal"
import {
  FormGrid,
  SelectField,
  TagField,
  TextAreaField,
  TextField,
  control,
} from "@/components/app/Form"
import {
  EmptyState,
  ErrorNote,
  IconChip,
  Panel,
  PanelHead,
  Skeleton,
  SegmentBar,
  StatusTag,
} from "@/components/app/primitives"
import { StatCard, StatRow } from "@/components/app/StatCard"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/app/primitives"

/* ============================================================
   Courses — the catalogue every timetable is built from.
   Catalogue (the list), Departments (how it splits), Prerequisites
   (what depends on what, and what is dangling).
   ============================================================ */

const EMPTY = {
  name: "",
  code: "",
  department: "",
  credits: 3,
  semester: 1,
  year: new Date().getFullYear(),
  description: "",
  duration: 13,
  hoursPerWeek: 3,
  type: "lecture",
  prerequisites: [],
}

function CourseFormModal({ open, course, onClose, onSaved }) {
  const [form, setForm] = React.useState(EMPTY)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState(null)
  const toast = useToast()
  const editing = Boolean(course)

  React.useEffect(() => {
    if (!open) return
    setError(null)
    setForm(course ? { ...EMPTY, ...course, prerequisites: course.prerequisites || [] } : EMPTY)
  }, [open, course])

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target ? e.target.value : e }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      ...form,
      credits: Number(form.credits),
      semester: Number(form.semester),
      year: Number(form.year),
      duration: Number(form.duration),
      hoursPerWeek: Number(form.hoursPerWeek),
    }

    try {
      if (editing) await api.put(`/courses/${course._id}`, payload)
      else await api.post("/courses", payload)
      toast.success(editing ? `${payload.code} updated.` : `${payload.code} added to the catalogue.`)
      onSaved()
      onClose()
    } catch (err) {
      setError(apiError(err, "Could not save this course."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={BookOpen}
      title={editing ? `Edit ${course.code}` : "New course"}
      description={
        editing
          ? "Changes apply to future timetable runs, not to already-published plans."
          : "Codes must be unique — the scheduler uses them to resolve prerequisites."
      }
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="course-form" disabled={saving}>
            {saving && <Spinner className="size-3.5" />}
            {editing ? "Save changes" : "Add course"}
          </Button>
        </>
      }
    >
      <form id="course-form" onSubmit={submit} className="space-y-5">
        {error && <ErrorNote icon={CircleAlert}>{error}</ErrorNote>}

        <FormGrid>
          <TextField
            label="Course code"
            required
            value={form.code}
            onChange={set("code")}
            placeholder="CSE 321"
          />
          <TextField
            label="Department"
            required
            value={form.department}
            onChange={set("department")}
            placeholder="Computer Science"
          />
          <TextField
            className="sm:col-span-2"
            label="Course name"
            required
            value={form.name}
            onChange={set("name")}
            placeholder="Algorithms and Data Structures"
          />

          <SelectField
            label="Delivery"
            value={form.type}
            onChange={set("type")}
            options={COURSE_TYPES}
          />
          <TextField
            label="Credits"
            type="number"
            min="0"
            max="12"
            required
            value={form.credits}
            onChange={set("credits")}
          />
          <TextField
            label="Semester"
            type="number"
            min="1"
            max="12"
            required
            value={form.semester}
            onChange={set("semester")}
          />
          <TextField
            label="Year"
            type="number"
            required
            value={form.year}
            onChange={set("year")}
          />
          <TextField
            label="Contact hours / week"
            type="number"
            min="1"
            max="20"
            value={form.hoursPerWeek}
            onChange={set("hoursPerWeek")}
            hint="Drives how many slots the generator reserves."
          />
          <TextField
            label="Weeks"
            type="number"
            min="1"
            max="52"
            value={form.duration}
            onChange={set("duration")}
          />

          <TagField
            className="sm:col-span-2"
            label="Prerequisites"
            value={form.prerequisites}
            onChange={(next) => setForm((p) => ({ ...p, prerequisites: next }))}
            placeholder="Enter a course code, then press Enter"
            hint="Use the exact codes of other courses in the catalogue."
          />

          <TextAreaField
            className="sm:col-span-2"
            label="Description"
            value={form.description}
            onChange={set("description")}
            rows={3}
            placeholder="What the course covers, for the catalogue listing."
          />
        </FormGrid>
      </form>
    </Modal>
  )
}

/* ---------------- views ---------------- */

function CatalogueView({ onEdit, onDelete }) {
  const { courses, loading } = useCampus()
  const [type, setType] = React.useState("all")

  const rows = type === "all" ? courses : courses.filter((c) => c.type === type)

  return (
    <DataGrid
      data={rows}
      loading={loading.courses}
      noun="courses"
      searchKeys={["code", "name", "department"]}
      searchPlaceholder="Search code, name or department"
      onEdit={onEdit}
      onDelete={onDelete}
      filters={
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filter by delivery"
          className={`${control} h-8 w-auto cursor-pointer py-0 pr-8 text-[12px]`}
        >
          <option value="all">All delivery</option>
          {COURSE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      }
      columns={[
        {
          key: "code",
          label: "Code",
          width: "120px",
          sortable: true,
          render: (row) => <span className="font-mono text-[12px] font-semibold">{row.code}</span>,
        },
        {
          key: "name",
          label: "Course",
          sortable: true,
          render: (row) => (
            <div className="min-w-0">
              <p className="truncate font-medium">{row.name}</p>
              {row.prerequisites?.length > 0 && (
                <p className="co-index mt-0.5 truncate">
                  Needs {row.prerequisites.join(", ")}
                </p>
              )}
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
          key: "type",
          label: "Delivery",
          width: "120px",
          sortable: true,
          render: (row) => {
            const t = option(COURSE_TYPES, row.type)
            return <StatusTag tone={t.accent}>{t.label}</StatusTag>
          },
        },
        {
          key: "credits",
          label: "Credits",
          width: "90px",
          align: "right",
          sortable: true,
          render: (row) => <span className="co-num">{row.credits}</span>,
        },
        {
          key: "semester",
          label: "Sem",
          width: "80px",
          align: "right",
          sortable: true,
          render: (row) => <span className="co-num">{row.semester}</span>,
        },
      ]}
    />
  )
}

function DepartmentsView() {
  const { courses, loading } = useCampus()

  const departments = React.useMemo(() => {
    const groups = new Map()
    courses.forEach((c) => {
      const key = c.department || "Unassigned"
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(c)
    })

    return [...groups.entries()]
      .map(([name, list]) => ({
        name,
        list,
        credits: list.reduce((n, c) => n + (c.credits || 0), 0),
        hours: list.reduce((n, c) => n + (c.hoursPerWeek || 0), 0),
        mix: COURSE_TYPES.map((t) => ({
          label: t.label,
          tone: t.accent,
          value: list.filter((c) => c.type === t.value).length,
        })).filter((s) => s.value > 0),
      }))
      .sort((a, b) => b.list.length - a.list.length)
  }, [courses])

  if (loading.courses) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Panel key={i} className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-3 w-24" />
          </Panel>
        ))}
      </div>
    )
  }

  if (departments.length === 0) {
    return (
      <Panel flush>
        <EmptyState
          icon={Building2}
          title="No departments yet"
          description="Departments appear here as soon as courses carry one."
        />
      </Panel>
    )
  }

  return (
    <div className="co-stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {departments.map((d) => (
        <Panel key={d.name} className="co-lift space-y-5">
          <div className="flex items-start gap-3">
            <IconChip icon={Building2} tone="blue" size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-ink">{titleCase(d.name)}</p>
              <p className="co-index mt-0.5">
                {d.list.length} course{d.list.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <SegmentBar segments={d.mix} />

          <div className="grid grid-cols-2 gap-3 border-t border-line-2 pt-4">
            <div>
              <p className="co-eyebrow">Credits</p>
              <p className="co-num mt-1 text-[20px] text-ink">{d.credits}</p>
            </div>
            <div>
              <p className="co-eyebrow">Hours / week</p>
              <p className="co-num mt-1 text-[20px] text-ink">{d.hours}</p>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  )
}

function PrerequisitesView() {
  const { courses, loading } = useCampus()

  const { chains, dangling } = React.useMemo(() => {
    const codes = new Set(courses.map((c) => c.code))
    const withPrereqs = courses.filter((c) => c.prerequisites?.length > 0)
    const missing = []

    withPrereqs.forEach((c) => {
      c.prerequisites.forEach((p) => {
        if (!codes.has(p)) missing.push({ course: c, prerequisite: p })
      })
    })

    return { chains: withPrereqs, dangling: missing }
  }, [courses])

  if (loading.courses) return <Skeleton className="h-64 w-full rounded-md" />

  return (
    <div className="space-y-5">
      {dangling.length > 0 && (
        <Panel className="border-amber/40 bg-amber/8">
          <div className="flex items-start gap-3">
            <IconChip icon={CircleAlert} tone="amber" size="sm" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink">
                {dangling.length} prerequisite{dangling.length === 1 ? "" : "s"} point at codes
                that are not in the catalogue
              </p>
              <ul className="mt-2 space-y-1">
                {dangling.slice(0, 6).map((d, i) => (
                  <li key={i} className="text-[12px] text-mut">
                    <span className="font-mono font-semibold text-ink">{d.course.code}</span>
                    {" requires "}
                    <span className="font-mono font-semibold text-amber-deep">
                      {d.prerequisite}
                    </span>
                    {" — no such course"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      )}

      <Panel flush>
        <PanelHead
          icon={GitBranch}
          title="Dependency chains"
          caption={`${chains.length} of ${courses.length} courses have prerequisites`}
        />
        {chains.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No prerequisites recorded"
            description="Add prerequisite codes to a course and the chain shows up here."
          />
        ) : (
          <ul className="co-stagger divide-y divide-line-2">
            {chains.map((c) => (
              <li key={c._id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="font-mono text-[12px] font-semibold text-ink">{c.code}</span>
                  <span className="truncate text-[12.5px] text-mut">{c.name}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="co-eyebrow">after</span>
                  {c.prerequisites.map((p) => (
                    <StatusTag
                      key={p}
                      tone={courses.some((x) => x.code === p) ? "blue" : "amber"}
                    >
                      {p}
                    </StatusTag>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

/* ---------------- page ---------------- */

export default function CoursesPage() {
  const [view, setView, views] = useView("courses")
  const { courses, loading, errors, refresh } = useCampus()
  const toast = useToast()

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(null)
  const [pendingDelete, setPendingDelete] = React.useState(null)
  const [deleting, setDeleting] = React.useState(false)

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (course) => {
    setEditing(course)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/courses/${pendingDelete._id}`)
      toast.success(`${pendingDelete.code} removed.`)
      setPendingDelete(null)
      refresh("courses")
    } catch (err) {
      toast.error(apiError(err, "Could not delete this course."))
    } finally {
      setDeleting(false)
    }
  }

  const tabs = views.map((v) => ({
    ...v,
    count: v.id === "catalogue" ? courses.length : undefined,
  }))

  return (
    <div className="space-y-7">
      <PageHeader
        navId="courses"
        actions={
          <Button onClick={openNew}>
            <Plus /> New course
          </Button>
        }
        tabs={<ViewTabs views={tabs} value={view} onChange={setView} />}
      />

      {errors.courses && <ErrorNote icon={CircleAlert}>{errors.courses}</ErrorNote>}

      <StatRow className="xl:grid-cols-3">
        <StatCard
          icon={BookOpen}
          tone="blue"
          label="Courses"
          value={courses.length}
          caption="In the active catalogue"
          loading={loading.courses}
        />
        <StatCard
          icon={Layers}
          tone="violet"
          label="Total credits"
          value={courses.reduce((n, c) => n + (c.credits || 0), 0)}
          caption="Summed across every course"
          loading={loading.courses}
        />
        <StatCard
          icon={Timer}
          tone="green"
          label="Contact hours / week"
          value={courses.reduce((n, c) => n + (c.hoursPerWeek || 0), 0)}
          caption="What the generator has to place"
          loading={loading.courses}
        />
      </StatRow>

      {view === "catalogue" && <CatalogueView onEdit={openEdit} onDelete={setPendingDelete} />}
      {view === "departments" && <DepartmentsView />}
      {view === "prerequisites" && <PrerequisitesView />}

      <CourseFormModal
        open={formOpen}
        course={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => refresh("courses")}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete ${pendingDelete?.code}?`}
        description={pendingDelete?.name}
      />
    </div>
  )
}
