import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Settings, WrenchIcon, ShowerHead } from "lucide-react";
import { Badge, Btn, Card, DataTable, Field, Input, KV, PageHeader, Select, Tabs } from "@/components/kit";
import { hkService, roomLabel, update, uid, useDB, today } from "@/lib/store";
import type { Room, RoomStatus } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/rooms/grid")({
  head: () => ({ meta: [{ title: "Room Grid — MAYRA Hotel ERP" }] }),
  component: RoomGrid,
});

const STATUS_META: Record<RoomStatus, { label: string; color: string; bg: string }> = {
  available: { label: "Available", color: "text-success", bg: "bg-success/10 border-success/30" },
  reserved: { label: "Reserved", color: "text-info", bg: "bg-info/10 border-info/30" },
  occupied: { label: "Occupied", color: "text-primary", bg: "bg-primary/10 border-primary/30" },
  dirty: { label: "Dirty", color: "text-danger", bg: "bg-danger/10 border-danger/30" },
  cleaning: { label: "Cleaning", color: "text-warning", bg: "bg-warning/10 border-warning/30" },
  inspection: { label: "Inspection", color: "text-info", bg: "bg-info/15 border-info/40" },
  maintenance: { label: "Maintenance", color: "text-muted-foreground", bg: "bg-secondary border-border" },
  blocked: { label: "Blocked", color: "text-muted-foreground", bg: "bg-secondary border-border" },
};

function RoomCard({ room, onClick }: { room: Room; onClick: () => void }) {
  const db = useDB();
  const meta = STATUS_META[room.status];
  const rt = db.roomTypes.find((t) => t.id === room.typeId);
  const booking = db.bookings.find((b) => b.roomIds.includes(room.id) && ["confirmed", "checked-in"].includes(b.status));
  const guest = booking ? db.guests.find((g) => g.id === booking.guestId) : null;

  return (
    <button onClick={onClick} className={`w-full rounded-lg border-2 p-3 text-left transition-all hover:shadow-md ${meta.bg}`}>
      <div className="flex items-start justify-between gap-1">
        <div>
          <div className="text-lg font-bold">{room.number}</div>
          <div className="text-[11px] text-muted-foreground">{rt?.code}</div>
        </div>
        <span className={`text-[10px] font-semibold uppercase ${meta.color}`}>{meta.label}</span>
      </div>
      {guest && <div className="mt-2 truncate text-xs font-medium">{guest.name}</div>}
      {rt && <div className="mt-1 text-[11px] text-muted-foreground">₹{rt.baseRate.toLocaleString("en-IN")}/night</div>}
    </button>
  );
}

function RoomDetail({ room, onClose }: { room: Room; onClose: () => void }) {
  const db = useDB();
  const rt = db.roomTypes.find((t) => t.id === room.typeId);
  const booking = db.bookings.find((b) => b.roomIds.includes(room.id) && ["confirmed", "checked-in"].includes(b.status));
  const guest = booking ? db.guests.find((g) => g.id === booking.guestId) : null;
  const hkStaff = db.employees.filter((e) => e.department === "Housekeeping" && e.status === "active");

  function setStatus(status: RoomStatus) {
    update((d) => { const r = d.rooms.find((x) => x.id === room.id); if (r) r.status = status; });
    toast.success(`Room ${room.number} → ${STATUS_META[status].label}`);
    onClose();
  }

  function sendHK() {
    hkService.create(room.id, "Standard Cleaning", hkStaff[0]?.name ?? "Unassigned", "Medium");
    toast.success("Housekeeping task created");
    onClose();
  }

  function sendMaintenance() {
    update((d) => {
      d.tickets.unshift({ id: uid("mt"), roomId: room.id, issue: "General maintenance request", priority: "Medium", assignedTo: d.employees.find((e) => e.department === "Maintenance")?.name ?? "Maintenance Team", status: "open", createdAt: new Date().toISOString() });
    });
    setStatus("maintenance");
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-lg border-2 p-4 ${STATUS_META[room.status].bg}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">Room {room.number}</div>
            <div className="text-sm text-muted-foreground">Floor {room.floor} · {rt?.name}</div>
          </div>
          <span className={`text-sm font-semibold uppercase ${STATUS_META[room.status].color}`}>{STATUS_META[room.status].label}</span>
        </div>
      </div>

      {guest && (
        <div className="rounded-lg bg-success/10 p-3 text-sm">
          <p className="font-semibold">{guest.name}</p>
          <p className="text-muted-foreground">{guest.mobile} · {booking?.nights}N</p>
        </div>
      )}

      <div className="grid gap-2 text-sm">
        <KV label="Room Type" value={rt?.name ?? "—"} />
        <KV label="Floor" value={room.floor} />
        <KV label="Base Rate" value={`₹${rt?.baseRate?.toLocaleString("en-IN")}`} />
        <KV label="Max Occupancy" value={rt?.maxOccupancy} />
        {rt?.amenities && <KV label="Amenities" value={rt.amenities.join(", ")} />}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          {room.status !== "available" && <Btn size="sm" onClick={() => setStatus("available")}>Mark Available</Btn>}
          {room.status !== "dirty" && <Btn size="sm" onClick={() => setStatus("dirty")} className="text-danger">Mark Dirty</Btn>}
          {(room.status === "dirty" || room.status === "cleaning") && <Btn size="sm" icon={ShowerHead} onClick={sendHK}>Send Housekeeping</Btn>}
          {room.status !== "maintenance" && <Btn size="sm" icon={WrenchIcon} onClick={sendMaintenance}>Maintenance</Btn>}
          {room.status !== "blocked" && <Btn size="sm" onClick={() => setStatus("blocked")}>Block Room</Btn>}
        </div>
      </div>
    </div>
  );
}

function RoomGrid() {
  const db = useDB();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [selected, setSelected] = useState<Room | null>(null);

  const floors = [...new Set(db.rooms.map((r) => r.floor))].sort();
  const filtered = db.rooms.filter((r) => {
    if (typeFilter !== "all" && r.typeId !== typeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (floorFilter !== "all" && String(r.floor) !== floorFilter) return false;
    return true;
  });

  const counts = Object.keys(STATUS_META).reduce((acc, s) => {
    acc[s] = db.rooms.filter((r) => r.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <PageHeader title="Room Grid" subtitle={`${db.rooms.length} rooms total`} />

      {/* Status summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_META).map(([s, m]) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? m.bg + " " + m.color : "border-border text-muted-foreground hover:bg-secondary"}`}
          >
            <span className={`h-2 w-2 rounded-full ${m.color.replace("text-", "bg-")}`} />
            {m.label} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select className="h-8 rounded-md border border-border px-2 text-xs" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {db.roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="h-8 rounded-md border border-border px-2 text-xs" value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}>
          <option value="all">All Floors</option>
          {floors.map((f) => <option key={f} value={String(f)}>Floor {f}</option>)}
        </select>
      </div>

      {/* Room grid by floor */}
      {floors.map((floor) => {
        const floorRooms = filtered.filter((r) => r.floor === floor);
        if (floorRooms.length === 0) return null;
        return (
          <Card key={floor} title={`Floor ${floor}`}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
              {floorRooms.map((room) => (
                <RoomCard key={room.id} room={room} onClick={() => setSelected(room)} />
              ))}
            </div>
          </Card>
        );
      })}

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-[2px]">
          <div className="flex-1" onClick={() => setSelected(null)} />
          <aside className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-[var(--shadow-pop)]">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Room {selected.number}</h3>
              <button onClick={() => setSelected(null)} className="rounded-md p-1 hover:bg-secondary">✕</button>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              <RoomDetail room={selected} onClose={() => setSelected(null)} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
