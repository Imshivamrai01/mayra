import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Badge, Btn, Card, ConfirmDialog, DataTable, Field, Input, KV, Modal, PageHeader, Select, Tabs } from "@/components/kit";
import { update, uid, useDB } from "@/lib/store";
import type { Room, RoomStatus, RoomType } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/rooms/list")({
  head: () => ({ meta: [{ title: "Room List — MAYRA Hotel ERP" }] }),
  component: RoomList,
});

const STATUS_TONE: Record<RoomStatus, string> = {
  available: "success", reserved: "info", occupied: "primary",
  dirty: "danger", cleaning: "warning", inspection: "info",
  maintenance: "muted", blocked: "muted",
};

function RoomList() {
  const db = useDB();
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ number: "", floor: "1", typeId: db.roomTypes[0]?.id ?? "" });

  function saveRoom() {
    if (!form.number.trim()) { toast.error("Room number required"); return; }
    if (db.rooms.some((r) => r.number === form.number && r.id !== editRoom?.id)) { toast.error("Room number exists"); return; }
    update((d) => {
      if (editRoom) {
        const r = d.rooms.find((x) => x.id === editRoom.id);
        if (r) { r.number = form.number; r.floor = +form.floor; r.typeId = form.typeId; }
      } else {
        d.rooms.push({ id: uid("rm"), number: form.number, floor: +form.floor, typeId: form.typeId, status: "available" });
      }
    });
    toast.success(editRoom ? "Room updated" : "Room added");
    setEditRoom(null);
    setAddOpen(false);
    setForm({ number: "", floor: "1", typeId: db.roomTypes[0]?.id ?? "" });
  }

  const floors = [...new Set(db.rooms.map((r) => r.floor))].sort();

  return (
    <div className="space-y-5 pb-12">
      <PageHeader
        title="Room Inventory Directory"
        subtitle={`${db.rooms.length} rooms configured across ${floors.length} floors`}
        actions={<Btn variant="primary" size="sm" icon={Plus} onClick={() => setAddOpen(true)}>Add Room</Btn>}
      />
      <DataTable
        rows={db.rooms}
        searchKeys={["number", (r) => db.roomTypes.find((t) => t.id === r.typeId)?.name ?? ""]}
        columns={[
          { key: "number", label: "Room", render: (r) => <span className="font-bold text-slate-900">Room {r.number}</span> },
          { key: "floor", label: "Floor", render: (r) => <span className="font-semibold text-slate-600">Floor {r.floor}</span> },
          { key: "typeId", label: "Type", render: (r) => <span className="font-semibold text-slate-800">{db.roomTypes.find((t) => t.id === r.typeId)?.name ?? "—"}</span> },
          { key: "status", label: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
          { key: "actions", label: "", sortable: false, render: (r) => (
            <div className="flex gap-1">
              <Btn size="sm" variant="ghost" icon={Edit} onClick={(e) => { e.stopPropagation(); setEditRoom(r); setForm({ number: r.number, floor: String(r.floor), typeId: r.typeId }); setAddOpen(true); }} />
              <Btn size="sm" variant="ghost" icon={Trash2} onClick={(e) => { e.stopPropagation(); setDeleteRoom(r); }} className="text-rose-600 hover:bg-rose-50" />
            </div>
          )},
        ]}
        pageSize={20}
      />

      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditRoom(null); }}
        title={editRoom ? "Edit Room Details" : "Add New Room"}
        footer={
          <>
            <Btn onClick={() => { setAddOpen(false); setEditRoom(null); }}>Cancel</Btn>
            <Btn variant="primary" onClick={saveRoom}>{editRoom ? "Update Room" : "Add Room"}</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Room Number"><Input value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} placeholder="e.g. 204" /></Field>
          <Field label="Floor"><Input type="number" min="0" max="10" value={form.floor} onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))} /></Field>
          <Field label="Room Type"><Select value={form.typeId} onChange={(e) => setForm((f) => ({ ...f, typeId: e.target.value }))} options={db.roomTypes.map((t) => ({ value: t.id, label: t.name }))} /></Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteRoom} onClose={() => setDeleteRoom(null)}
        onConfirm={() => { if (deleteRoom) { update((d) => { d.rooms = d.rooms.filter((r) => r.id !== deleteRoom.id); }); toast.success("Room removed"); } setDeleteRoom(null); }}
        title="Remove Room" message={`Remove Room ${deleteRoom?.number}? This cannot be undone.`}
      />
    </div>
  );
}

