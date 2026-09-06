import * as React from "react"
import {
  Armchair,
  CalendarClock,
  CircleAlert,
  DoorOpen,
  Gauge,
  Plus,
  Projector,
} from "lucide-react"

import { api, apiError } from "@/lib/api"
import { ROOM_TYPES, option, pct, titleCase } from "@/lib/domain"
import { useCampus } from "@/components/app/CampusProvider"
import { useToast } from "@/components/app/Toast"
import { PageHeader, ViewTabs, useView } from "@/components/app/PageHeader"
import { DataGrid } from "@/components/app/DataGrid"
import { ConfirmDialog, Modal } from "@/components/app/Modal"
import { FormGrid, SelectField, TagField, TextField, control } from "@/components/app/Form"
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
  IconChip,
  Meter,
  Panel,
  PanelHead,
  SegmentBar,
  Skeleton,
  Spinner,
  StatusTag,
} from "@/components/app/primitives"
import { StatCard, StatRow } from "@/components/app/StatCard"
import { Button } from "@/components/ui/button"

/* ============================================================
   Rooms — Inventory (what exists), Availability (when it opens),
   Utilisation (how hard each space actually works).
   ============================================================ */

const EMPTY = {
  name: "",
  building: "",
  floor: 1,
  capacity: 30,
  type: "lecture_hall",
  equipment: [],
  availability: EMPTY_AVAILABILITY,
}

function RoomFormModal({ open, room, onClose, onSaved }) {
  const [form, setForm] = React.useState(EMPTY)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState(null)
  const toast = useToast()
  const editing = Boolean(room)

  React.useEffect(() => {
    if (!open) return
    setError(null)
    setForm(
      room
        ? {
            ...EMPTY,
            ...room,
            equipment: room.equipment || [],
            availability: toAvailability(room.availability),
          }
        : { ...EMPTY, availability: toAvailability() }
    )
  }, [open, room])

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      ...form,
      floor: Number(form.floor),
      capacity: Number(form.capacity),
    }

    try {
      if (editing) await api.put(`/rooms/${room._id}`, payload)
      else await api.post("/rooms", payload)
      toast.success(editing ? `${payload.name} updated.` : `${payload.name} added.`)
      onSaved()
      onClose()
    } catch (err) {
      setError(apiError(err, "Could not save this room."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={DoorOpen}
      size="lg"
      title={editing ? `Edit ${room.name}` : "Add a room"}
      description="Capacity and equipment decide which courses the generator can place here."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="room-form" disabled={saving}>
            {saving && <Spinner className="size-3.5" />}
            {editing ? "Save changes" : "Add room"}
          </Button>
        </>
      }
    >
      <form id="room-form" onSubmit={submit} className="space-y-6">
        {error && <ErrorNote icon={CircleAlert}>{error}</ErrorNote>}

        <FormGrid>
          <TextField
            label="Room name"
            required
            value={form.name}
            onChange={set("name")}
            placeholder="A101"
          />
          <TextField
            label="Building"
            required
            value={form.building}
            onChange={set("building")}
            placeholder="Main Building"
          />
          <TextField
            label="Floor"
            type="number"
            required
            value={form.floor}
            onChange={set("floor")}
          />
          <TextField
            label="Capacity"
            type="number"
            min="1"
            required
            value={form.capacity}
            onChange={set("capacity")}
            hint="Seats available for teaching."
          />
          <SelectField
            className="sm:col-span-2"
            label="Room type"
            required
            value={form.type}
            onChange={set("type")}
            options={ROOM_TYPES}
          />
          <TagField
            className="sm:col-span-2"
            label="Equipment"
            value={form.equipment}
            onChange={(next) => setForm((p) => ({ ...p, equipment: next }))}
            placeholder="Projector, Whiteboard…"
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

/* ---------------- utilisation maths ---------------- */

function useUtilisation() {
  const { rooms, timetables } = useCampus()

  return React.useMemo(() => {
    const entries = timetables.flatMap((t) => t.schedule || [])
    return rooms.map((r) => {
      const booked = entries.filter((e) => e.roomId === r._id).length
      const open = totalHours(r.availability)
      return {
        ...r,
        booked,
        open,
        // against a nominal 40-hour teaching week
        usage: pct(booked, 40),
        openUsage: open ? pct(booked, open) : 0,
      }
    })
  }, [rooms, timetables])
}

/* ---------------- views ---------------- */

function InventoryView({ onEdit, onDelete }) {
  const { rooms, loading } = useCampus()
  const [type, setType] = React.useState("all")

  const data = type === "all" ? rooms : rooms.filter((r) => r.type === type)

  return (
    <DataGrid
      data={data}
      loading={loading.rooms}
      noun="rooms"
      searchKeys={["name", "building", "type"]}
      searchPlaceholder="Search room or building"
      onEdit={onEdit}
      onDelete={onDelete}
      filters={
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filter by room type"
          className={`${control} h-8 w-auto cursor-pointer py-0 pr-8 text-[12px]`}
        >
          <option value="all">All types</option>
          {ROOM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      }
      columns={[
        {
          key: "name",
          label: "Room",
          sortable: true,
          render: (row) => (
            <div className="flex items-center gap-3">
              <IconChip icon={DoorOpen} tone={option(ROOM_TYPES, row.type).accent} size="sm" />
              <div className="min-w-0">
                <p className="truncate font-medium">{row.name}</p>
                <p className="co-index truncate">
                  {titleCase(row.building)} · Floor {row.floor}
                </p>
              </div>
            </div>
          ),
        },
        {
          key: "type",
          label: "Type",
          width: "150px",
          sortable: true,
          render: (row) => {
            const t = option(ROOM_TYPES, row.type)
            return <StatusTag tone={t.accent}>{t.label}</StatusTag>
          },
        },
        {
          key: "equipment",
          label: "Equipment",
          render: (row) =>
            row.equipment?.length ? (
              <div className="flex flex-wrap gap-1">
                {row.equipment.slice(0, 3).map((e) => (
                  <StatusTag key={e} tone="ink">
                    {e}
                  </StatusTag>
                ))}
                {row.equipment.length > 3 && (
                  <span className="co-index self-center">+{row.equipment.length - 3}</span>
                )}
              </div>
            ) : (
              <span className="text-mut-2">—</span>
            ),
        },
        {
          key: "capacity",
          label: "Seats",
          width: "100px",
          align: "right",
          sortable: true,
          render: (row) => <span className="co-num">{row.capacity}</span>,
        },
      ]}
    />
  )
}

function AvailabilityView() {
  const { rooms, loading } = useCampus()

  if (loading.rooms) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Panel key={i} className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-full" />
          </Panel>
        ))}
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <Panel flush>
        <EmptyState
          icon={CalendarClock}
          title="No rooms yet"
          description="Add a space and its opening hours will map out here."
        />
      </Panel>
    )
  }

  return (
    <div className="co-stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rooms.map((r) => {
        const hours = totalHours(r.availability)
        const t = option(ROOM_TYPES, r.type)
        return (
          <Panel key={r._id} className="co-lift space-y-4">
            <div className="flex items-start gap-3">
              <IconChip icon={DoorOpen} tone={t.accent} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink">{r.name}</p>
                <p className="co-index truncate">
                  {titleCase(r.building)} · {r.capacity} seats
                </p>
              </div>
              <StatusTag tone={hours > 0 ? "green" : "amber"}>{hours.toFixed(0)}h open</StatusTag>
            </div>

            <AvailabilityStrip value={r.availability} />

            <p className="text-[11px] leading-relaxed text-mut">
              {hours === 0
                ? "No opening hours set — the generator cannot place anything here."
                : `Open ${hours.toFixed(1)} hours across the week.`}
            </p>
          </Panel>
        )
      })}
    </div>
  )
}

function UtilisationView() {
  const utilisation = useUtilisation()
  const { rooms, loading } = useCampus()

  const mix = React.useMemo(
    () =>
      ROOM_TYPES.map((t) => ({
        label: t.label,
        tone: t.accent,
        value: rooms.filter((r) => r.type === t.value).length,
      })).filter((s) => s.value > 0),
    [rooms]
  )

  if (loading.rooms) return <Skeleton className="h-64 w-full rounded-md" />

  const sorted = [...utilisation].sort((a, b) => b.usage - a.usage)
  const idle = sorted.filter((r) => r.booked === 0)

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-1">
          <Eyebrow className="block text-ink">Estate mix</Eyebrow>
          <div className="mt-4">
            {mix.length ? (
              <SegmentBar segments={mix} />
            ) : (
              <p className="py-6 text-center text-xs text-mut">No rooms recorded.</p>
            )}
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <Eyebrow className="block text-ink">Load per room</Eyebrow>
          <p className="mt-1 text-[11px] text-mut">
            Timetabled sessions against a nominal 40-hour teaching week.
          </p>
          <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {sorted.length ? (
              sorted.slice(0, 8).map((r) => (
                <Meter
                  key={r._id}
                  label={r.name}
                  value={r.usage}
                  tone={r.usage > 85 ? "red" : r.usage > 60 ? "amber" : "green"}
                  caption={`${r.booked} sessions · ${r.capacity} seats`}
                />
              ))
            ) : (
              <p className="py-6 text-center text-xs text-mut sm:col-span-2">
                Nothing timetabled yet.
              </p>
            )}
          </div>
        </Panel>
      </div>

      {idle.length > 0 && (
        <Panel flush>
          <PanelHead
            icon={CircleAlert}
            title="Standing idle"
            caption={`${idle.length} room${idle.length === 1 ? "" : "s"} carry no timetabled sessions`}
          />
          <ul className="co-stagger divide-y divide-line-2">
            {idle.map((r) => (
              <li key={r._id} className="flex items-center gap-3 px-5 py-3">
                <IconChip icon={DoorOpen} tone="amber" size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{r.name}</p>
                  <p className="co-index truncate">
                    {titleCase(r.building)} · {r.capacity} seats
                  </p>
                </div>
                <StatusTag tone={r.open > 0 ? "amber" : "red"}>
                  {r.open > 0 ? `${r.open.toFixed(0)}h open, unused` : "No opening hours"}
                </StatusTag>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}

/* ---------------- page ---------------- */

export default function RoomPage() {
  const [view, setView, views] = useView("rooms")
  const { rooms, loading, errors, refresh } = useCampus()
  const utilisation = useUtilisation()
  const toast = useToast()

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(null)
  const [pendingDelete, setPendingDelete] = React.useState(null)
  const [deleting, setDeleting] = React.useState(false)

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/rooms/${pendingDelete._id}`)
      toast.success(`${pendingDelete.name} removed.`)
      setPendingDelete(null)
      refresh("rooms")
    } catch (err) {
      toast.error(apiError(err, "Could not delete this room."))
    } finally {
      setDeleting(false)
    }
  }

  const seats = rooms.reduce((n, r) => n + (r.capacity || 0), 0)
  const buildings = new Set(rooms.map((r) => r.building).filter(Boolean))
  const equipped = rooms.filter((r) => r.equipment?.length > 0).length

  const tabs = views.map((v) => ({
    ...v,
    count: v.id === "inventory" ? rooms.length : undefined,
  }))

  return (
    <div className="space-y-7">
      <PageHeader
        navId="rooms"
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Add room
          </Button>
        }
        tabs={<ViewTabs views={tabs} value={view} onChange={setView} />}
      />

      {errors.rooms && <ErrorNote icon={CircleAlert}>{errors.rooms}</ErrorNote>}

      <StatRow className="xl:grid-cols-4">
        <StatCard
          icon={DoorOpen}
          tone="green"
          label="Rooms"
          value={rooms.length}
          caption={`Across ${buildings.size} building${buildings.size === 1 ? "" : "s"}`}
          loading={loading.rooms}
        />
        <StatCard
          icon={Armchair}
          tone="blue"
          label="Total seats"
          value={seats}
          caption={`Mean ${rooms.length ? Math.round(seats / rooms.length) : 0} per room`}
          loading={loading.rooms}
        />
        <StatCard
          icon={Projector}
          tone="violet"
          label="Equipped"
          value={equipped}
          caption="Rooms with recorded equipment"
          loading={loading.rooms}
        />
        <StatCard
          icon={Gauge}
          tone="amber"
          label="Mean utilisation"
          value={
            utilisation.length
              ? Math.round(utilisation.reduce((n, r) => n + r.usage, 0) / utilisation.length)
              : 0
          }
          caption="Of a 40-hour teaching week"
          loading={loading.rooms}
        />
      </StatRow>

      {view === "inventory" && (
        <InventoryView
          onEdit={(r) => {
            setEditing(r)
            setFormOpen(true)
          }}
          onDelete={setPendingDelete}
        />
      )}
      {view === "availability" && <AvailabilityView />}
      {view === "utilisation" && <UtilisationView />}

      <RoomFormModal
        open={formOpen}
        room={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => refresh("rooms")}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete ${pendingDelete?.name}?`}
        description={pendingDelete && `${titleCase(pendingDelete.building)} · Floor ${pendingDelete.floor}`}
      />
    </div>
  )
}
