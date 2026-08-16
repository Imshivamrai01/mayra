import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Btn, Card, Field, Input, KV, PageHeader, Select } from "@/components/kit";
import { hkService, update, uid, useDB, today } from "@/lib/store";
import type { HKTask } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/housekeeping")({
  head: () => ({ meta: [{ title: "Housekeeping — MAYRA Hotel ERP" }] }),
  component: HousekeepingPage,
});

const STATUS_ORDER: HKTask["status"][] = ["dirty", "cleaning", "inspection", "ready"];
const STATUS_META: Record<HKTask["status"], { label: string; tone: string }> = {
  dirty: { label: "Dirty", tone: "danger" },
  cleaning: { label: "Cleaning", tone: "warning" },
  inspection: { label: "Inspection", tone: "info" },
  ready: { label: "Ready", tone: "success" },
};
const NEXT_ACTION: Record<HKTask["status"], string> = {
  dirty: "Start Cleaning",
  cleaning: "Mark for Inspection",
  inspection: "Approve & Mark Ready",
  ready: "",
};

function TaskCard({ task }: { task: HKTask }) {
  const db = useDB();
  const room = db.rooms.find((r) => r.id === task.roomId);
  const rt = room ? db.roomTypes.find((t) => t.id === room.typeId) : null;
  const booking = db.bookings.find((b) => b.roomIds.includes(task.roomId) && ["confirmed", "checked-in"].includes(b.status));
  const guest = booking ? db.guests.find((g) => g.id === booking.guestId) : null;
  const nextStatus = STATUS_ORDER[STATUS_ORDER.indexOf(task.status) + 1];
  const meta = STATUS_META[task.status];
  const action = NEXT_ACTION[task.status];

  function advance() {
    if (!nextStatus) return;
    hkService.move(task.id, nextStatus);
    toast.success(`Room ${room?.number} → ${STATUS_META[nextStatus].label}`);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">Room {room?.number ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{rt?.name} · {task.type}</div>
          {guest && <div className="text-xs text-muted-foreground mt-0.5">Guest: {guest.name}</div>}
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs text-muted-foreground">Assigned: <span className="font-medium text-foreground">{task.assignedTo}</span></div>
          <Badge tone={task.priority === "High" ? "danger" : task.priority === "Medium" ? "warning" : "muted"}>{task.priority}</Badge>
        </div>
        {action && (
          <Btn size="sm" variant="primary" onClick={advance}>{action}</Btn>
        )}
      </div>
    </div>
  );
}

function HousekeepingPage() {
  const db = useDB();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ roomId: "", type: "Standard Cleaning", assignedTo: "", priority: "Medium" as HKTask["priority"] });

  const tasks = db.hkTasks;
  const byStatus = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {} as Record<HKTask["status"], HKTask[]>);

  const hkStaff = db.employees.filter((e) => e.department === "Housekeeping" && e.status === "active");
  const rooms = db.rooms;

  function createTask() {
    if (!form.roomId || !form.assignedTo) { toast.error("Select room and staff"); return; }
    hkService.create(form.roomId, form.type, form.assignedTo, form.priority);
    toast.success("Housekeeping task created");
    setCreateOpen(false);
    setForm({ roomId: "", type: "Standard Cleaning", assignedTo: "", priority: "Medium" });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Housekeeping"
        subtitle={`${tasks.length} active tasks`}
        actions={<Btn variant="primary" size="sm" onClick={() => setCreateOpen(true)}>Create Task</Btn>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATUS_ORDER.map((s) => (
          <div key={s}>
            <div className="mb-2 flex items-center justify-between">
              <Badge tone={STATUS_META[s].tone}>{STATUS_META[s].label}</Badge>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">{byStatus[s].length}</span>
            </div>
            <div className="space-y-2">
              {byStatus[s].map((t) => <TaskCard key={t.id} task={t} />)}
              {byStatus[s].length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-pop)]">
            <h4 className="mb-4 font-semibold">Create Housekeeping Task</h4>
            <div className="space-y-3">
              <Field label="Room">
                <Select value={form.roomId} onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))} options={[{ value: "", label: "Select room" }, ...rooms.map((r) => ({ value: r.id, label: `Room ${r.number} (${r.status})` }))]} />
              </Field>
              <Field label="Task Type">
                <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} options={["Standard Cleaning", "Deep Cleaning", "Checkout Cleaning", "Turndown", "Inspection"].map((s) => ({ value: s, label: s }))} />
              </Field>
              <Field label="Assigned To">
                <Select value={form.assignedTo} onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))} options={[{ value: "", label: "Select staff" }, ...hkStaff.map((e) => ({ value: e.name, label: e.name }))]} />
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as HKTask["priority"] }))} options={["Low", "Medium", "High"].map((s) => ({ value: s, label: s }))} />
              </Field>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Btn onClick={() => setCreateOpen(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={createTask}>Create Task</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
