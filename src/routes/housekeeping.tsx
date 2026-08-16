import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Btn, Card, Field, Input, KV, Modal, PageHeader, Select } from "@/components/kit";
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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-extrabold text-slate-900 text-sm">Room {room?.number ?? "—"}</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">{rt?.name} · {task.type}</div>
          {guest && <div className="text-xs font-medium text-slate-600 mt-1">Guest: <span className="font-bold text-slate-900">{guest.name}</span></div>}
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div>
          <div className="text-[11px] font-semibold text-slate-400">Assigned: <span className="font-bold text-slate-800">{task.assignedTo}</span></div>
          <Badge tone={task.priority === "High" ? "danger" : task.priority === "Medium" ? "warning" : "muted"} className="mt-1">{task.priority}</Badge>
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
    <div className="space-y-5 pb-12">
      <PageHeader
        title="Housekeeping Board"
        subtitle={`${tasks.length} active cleaning and inspection tasks`}
        actions={<Btn variant="primary" size="sm" onClick={() => setCreateOpen(true)}>Create Task</Btn>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATUS_ORDER.map((s) => (
          <div key={s} className="card-surface rounded-2xl bg-slate-50/70 border border-slate-200/80 p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <Badge tone={STATUS_META[s].tone}>{STATUS_META[s].label}</Badge>
              <span className="text-xs font-bold tabular-nums text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">{byStatus[s].length}</span>
            </div>
            <div className="space-y-2.5">
              {byStatus[s].map((t) => <TaskCard key={t.id} task={t} />)}
              {byStatus[s].length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs font-semibold text-slate-400">No tasks in this lane</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Housekeeping Task"
        footer={
          <>
            <Btn onClick={() => setCreateOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={createTask}>Create Task</Btn>
          </>
        }
      >
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
      </Modal>
    </div>
  );
}

