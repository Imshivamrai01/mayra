import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit } from "lucide-react";
import { Badge, Btn, DataTable, Field, Input, KV, PageHeader, Select } from "@/components/kit";
import { update, uid, useDB } from "@/lib/store";
import type { MaintTicket } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/rooms/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — MAYRA Hotel ERP" }] }),
  component: MaintenancePage,
});

const STATUS_TONE: Record<string, string> = {
  open: "danger", "in-progress": "warning", resolved: "success", closed: "muted",
};
const CATEGORIES = ["Electrical", "Plumbing", "AC", "Furniture", "TV", "Internet", "Painting", "Carpentry", "Other"];
const PRIORITIES = ["Low", "Medium", "High"];

function MaintenancePage() {
  const db = useDB();
  const [addOpen, setAddOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<MaintTicket | null>(null);
  const [form, setForm] = useState({ roomId: "", area: "", issue: "", category: "AC", priority: "Medium" as MaintTicket["priority"], assignedTo: "" });

  const maintStaff = db.employees.filter((e) => ["Maintenance", "Security"].includes(e.department) && e.status === "active");

  function save() {
    if (!form.issue.trim()) { toast.error("Issue description required"); return; }
    update((d) => {
      if (editTicket) {
        const t = d.tickets.find((x) => x.id === editTicket.id);
        if (t) { t.issue = form.issue; t.category = form.category as never; t.priority = form.priority; t.assignedTo = form.assignedTo; }
      } else {
        d.tickets.unshift({
          id: uid("mt"), roomId: form.roomId || undefined, area: form.area || undefined,
          issue: form.issue, priority: form.priority,
          assignedTo: form.assignedTo || maintStaff[0]?.name || "Maintenance",
          status: "open", createdAt: new Date().toISOString(),
        });
      }
    });
    toast.success(editTicket ? "Ticket updated" : "Ticket created");
    setAddOpen(false);
    setEditTicket(null);
    setForm({ roomId: "", area: "", issue: "", category: "AC", priority: "Medium", assignedTo: "" });
  }

  function changeStatus(id: string, status: MaintTicket["status"]) {
    update((d) => {
      const t = d.tickets.find((x) => x.id === id);
      if (!t) return;
      t.status = status;
      if (status === "resolved") t.resolvedAt = new Date().toISOString();
      if (t.roomId) {
        const r = d.rooms.find((x) => x.id === t.roomId);
        if (r && status === "resolved") r.status = "dirty";
        if (r && status === "in-progress") r.status = "maintenance";
      }
    });
    toast.success(`Ticket → ${status}`);
  }

  const open = db.tickets.filter((t) => t.status === "open");
  const inProgress = db.tickets.filter((t) => t.status === "in-progress");
  const resolved = db.tickets.filter((t) => ["resolved", "closed"].includes(t.status));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Maintenance"
        subtitle={`${open.length} open tickets`}
        actions={<Btn variant="primary" size="sm" icon={Plus} onClick={() => { setEditTicket(null); setAddOpen(true); }}>New Ticket</Btn>}
      />

      <DataTable
        rows={db.tickets}
        searchKeys={["issue", "assignedTo", (t) => db.rooms.find((r) => r.id === t.roomId)?.number ?? ""]}
        toolbar={<span className="text-xs text-muted-foreground">{db.tickets.length} total tickets</span>}
        columns={[
          { key: "room", label: "Location", render: (t) => {
            const r = db.rooms.find((x) => x.id === t.roomId);
            return <span className="font-medium">{r ? `Room ${r.number}` : t.area ?? "—"}</span>;
          }},
          { key: "issue", label: "Issue" },
          { key: "priority", label: "Priority", render: (t) => <Badge tone={t.priority === "High" ? "danger" : t.priority === "Medium" ? "warning" : "muted"}>{t.priority}</Badge> },
          { key: "assignedTo", label: "Assigned To" },
          { key: "status", label: "Status", render: (t) => <Badge tone={STATUS_TONE[t.status] ?? "muted"}>{t.status}</Badge> },
          { key: "createdAt", label: "Created", render: (t) => new Date(t.createdAt).toLocaleDateString("en-IN") },
          { key: "actions", label: "", sortable: false, render: (t) => (
            <div className="flex gap-1">
              {t.status === "open" && <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); changeStatus(t.id, "in-progress"); }}>Start</Btn>}
              {t.status === "in-progress" && <Btn size="sm" variant="success" onClick={(e) => { e.stopPropagation(); changeStatus(t.id, "resolved"); }}>Resolve</Btn>}
              {t.status === "resolved" && <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); changeStatus(t.id, "closed"); }}>Close</Btn>}
              <Btn size="sm" variant="ghost" icon={Edit} onClick={(e) => { e.stopPropagation(); setEditTicket(t); setForm({ roomId: t.roomId ?? "", area: t.area ?? "", issue: t.issue, category: "Other", priority: t.priority, assignedTo: t.assignedTo }); setAddOpen(true); }} />
            </div>
          )},
        ]}
        pageSize={15}
      />

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-pop)]">
            <h4 className="mb-4 font-semibold">{editTicket ? "Edit Ticket" : "New Maintenance Ticket"}</h4>
            <div className="space-y-3">
              <Field label="Room (optional)">
                <Select value={form.roomId} onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))} options={[{ value: "", label: "Not room specific" }, ...db.rooms.map((r) => ({ value: r.id, label: `Room ${r.number}` }))]} />
              </Field>
              {!form.roomId && <Field label="Area"><Input value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} placeholder="e.g. Lobby, Corridor" /></Field>}
              <Field label="Category">
                <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
              </Field>
              <Field label="Issue Description">
                <Input value={form.issue} onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value }))} placeholder="Describe the issue" />
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as "Low" | "Medium" | "High" }))} options={PRIORITIES.map((p) => ({ value: p, label: p }))} />
              </Field>
              <Field label="Assign To">
                <Select value={form.assignedTo} onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))} options={[{ value: "", label: "Unassigned" }, ...maintStaff.map((e) => ({ value: e.name, label: e.name }))]} />
              </Field>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Btn onClick={() => { setAddOpen(false); setEditTicket(null); }}>Cancel</Btn>
              <Btn variant="primary" onClick={save}>{editTicket ? "Update" : "Create Ticket"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
