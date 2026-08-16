import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Settings, WrenchIcon, ShowerHead } from "lucide-react";
import { Badge, Btn, Card, DataTable, Drawer, Field, Input, KV, PageHeader, Select, Tabs } from "@/components/kit";
import { hkService, roomLabel, update, uid, useDB, today } from "@/lib/store";
import type { Room, RoomStatus } from "@/lib/types";
import { toast } from "sonner";


export const Route = createFileRoute("/rooms/grid")({
  head: () => ({ meta: [{ title: "Room Grid — MAYRA Hotel ERP" }] }),
  component: RoomGrid,
});

const STATUS_META: Record<RoomStatus, { label: string; color: string; bg: string; badgeBg: string }> = {
  available: { label: "Available", color: "text-emerald-700", bg: "bg-emerald-50/70 border-emerald-200 hover:border-emerald-400", badgeBg: "bg-emerald-100 text-emerald-800" },
  reserved: { label: "Reserved", color: "text-purple-700", bg: "bg-purple-50/70 border-purple-200 hover:border-purple-400", badgeBg: "bg-purple-100 text-purple-800" },
  occupied: { label: "Occupied", color: "text-blue-700", bg: "bg-blue-50/70 border-blue-200 hover:border-blue-400", badgeBg: "bg-blue-100 text-blue-800" },
  dirty: { label: "Dirty", color: "text-rose-700", bg: "bg-rose-50/70 border-rose-200 hover:border-rose-400", badgeBg: "bg-rose-100 text-rose-800" },
  cleaning: { label: "Cleaning", color: "text-amber-700", bg: "bg-amber-50/70 border-amber-200 hover:border-amber-400", badgeBg: "bg-amber-100 text-amber-800" },
  inspection: { label: "Inspection", color: "text-indigo-700", bg: "bg-indigo-50/70 border-indigo-200 hover:border-indigo-400", badgeBg: "bg-indigo-100 text-indigo-800" },
  maintenance: { label: "Maintenance", color: "text-slate-600", bg: "bg-slate-100 border-slate-200 hover:border-slate-400", badgeBg: "bg-slate-200 text-slate-700" },
  blocked: { label: "Blocked", color: "text-slate-600", bg: "bg-slate-100 border-slate-200 hover:border-slate-400", badgeBg: "bg-slate-200 text-slate-700" },
};

function RoomCard({ room, onClick }: { room: Room; onClick: () => void }) {
  const db = useDB();
  const meta = STATUS_META[room.status];
  const rt = db.roomTypes.find((t) => t.id === room.typeId);
  const isOccupied = room.status === "occupied";
  const isReserved = room.status === "reserved";
  const booking = isOccupied
    ? db.bookings.find((b) => b.roomIds.includes(room.id) && b.status === "checked-in")
    : isReserved
    ? db.bookings.find((b) => b.roomIds.includes(room.id) && b.status === "confirmed")
    : null;
  const guest = booking ? db.guests.find((g) => g.id === booking.guestId) : null;

  return (
    <button onClick={onClick} className={`w-full rounded-2xl border p-3.5 text-left transition-all hover:shadow-md cursor-pointer ${meta.bg}`}>
      <div className="flex items-start justify-between gap-1">
        <div>
          <div className="text-lg font-black text-slate-900 leading-tight">{room.number}</div>
          <div className="text-[11px] font-bold text-slate-400 mt-0.5">{rt?.code}</div>
        </div>
        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${meta.badgeBg}`}>{meta.label}</span>
      </div>
      {guest ? (
        <div className="mt-2 truncate text-xs font-bold text-slate-800 flex items-center gap-1">
          <span>👤 {guest.name}</span>
          {isOccupied && <span className="text-[10px] font-semibold text-purple-700">· In-House</span>}
        </div>
      ) : (
        <div className="mt-2 text-xs font-semibold text-emerald-700">
          {room.status === "available" ? "✓ Vacant · Ready" : meta.label}
        </div>
      )}
      {rt && <div className="mt-1 text-[11px] font-semibold text-slate-500">₹{rt.baseRate.toLocaleString("en-IN")}/night</div>}
    </button>
  );
}

function RoomDetail({ room, onClose }: { room: Room; onClose: () => void }) {
  const db = useDB();
  const rt = db.roomTypes.find((t) => t.id === room.typeId);
  const isOccupied = room.status === "occupied";
  const isReserved = room.status === "reserved";
  const booking = isOccupied
    ? db.bookings.find((b) => b.roomIds.includes(room.id) && b.status === "checked-in")
    : isReserved
    ? db.bookings.find((b) => b.roomIds.includes(room.id) && b.status === "confirmed")
    : null;
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

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Room ${selected?.number}`}
        subtitle={`Floor ${selected?.floor} Operations & Status`}
      >
        {selected && <RoomDetail room={selected} onClose={() => setSelected(null)} />}
      </Drawer>
    </div>
  );
}

