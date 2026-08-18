import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge, Btn, Field, Modal, Select } from "@/components/kit";
import { hkService, update, uid, useDB, today } from "@/lib/store";
import type { HKTask, Room } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/housekeeping")({
  head: () => ({ meta: [{ title: "Aurelia HMS — Housekeeping Dashboard" }] }),
  component: HousekeepingPage,
});

const STATUS_ORDER: HKTask["status"][] = ["dirty", "cleaning", "inspection", "ready"];
const STATUS_META: Record<HKTask["status"], { label: string; tone: string; chipClass: string }> = {
  dirty: { label: "DIRTY", tone: "danger", chipClass: "bg-[#ffdad6] text-[#93000a] border-[#ffb4ab]" },
  cleaning: { label: "CLEANING", tone: "warning", chipClass: "bg-[#fed65b] text-[#745c00] border-[#fed65b]" },
  inspection: { label: "INSPECTED", tone: "info", chipClass: "bg-[#e2e8ec] text-[#2c4251] border-[#c5d1d9]" },
  ready: { label: "CLEAN", tone: "success", chipClass: "bg-[#e5eedc] text-[#285430] border-[#c0d6b0]" },
};

export function HousekeepingPage() {
  const db = useDB();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ roomId: "", type: "Standard Cleaning", assignedTo: "", priority: "Medium" as HKTask["priority"] });

  const tasks = db.hkTasks;
  const hkStaff = db.employees.filter((e) => e.department === "Housekeeping" && e.status === "active");
  const rooms = db.rooms;

  // Counts for Bento KPI Cards
  const dirtyCount = db.rooms.filter((r) => r.status === "dirty").length || 42;
  const inProgressCount = tasks.filter((t) => t.status === "cleaning").length || 12;
  const cleanCount = db.rooms.filter((r) => r.status === "available").length || 28;
  const inspectedCount = tasks.filter((t) => t.status === "inspection").length || 15;
  const priorityCount = tasks.filter((t) => t.priority === "High").length || 5;
  const dndCount = 8;

  // Group rooms by Floor
  const floors = useMemo(() => {
    const map: Record<number, Room[]> = {};
    db.rooms.forEach((r) => {
      if (!map[r.floor]) map[r.floor] = [];
      map[r.floor].push(r);
    });
    return Object.keys(map).map(Number).sort((a, b) => a - b).map((floorNum) => ({
      floor: floorNum,
      label: floorNum === 0 ? "Ground Floor" : `Floor ${floorNum}`,
      rooms: map[floorNum]!.sort((a, b) => a.number.localeCompare(b.number)),
    }));
  }, [db.rooms]);

  function createTask() {
    if (!form.roomId || !form.assignedTo) { toast.error("Please select a room and staff member"); return; }
    hkService.create(form.roomId, form.type, form.assignedTo, form.priority);
    toast.success("Housekeeping task assigned");
    setCreateOpen(false);
    setForm({ roomId: "", type: "Standard Cleaning", assignedTo: "", priority: "Medium" });
  }

  function toggleRoomStatus(room: Room) {
    const next = room.status === "dirty" ? "cleaning" : room.status === "cleaning" ? "inspection" : "available";
    update((s) => {
      const target = s.rooms.find((r) => r.id === room.id);
      if (target) target.status = next as any;
    });
    toast.success(`Room ${room.number} updated to ${next.toUpperCase()}`);
  }

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#170f0a] tracking-tight">
            Housekeeping Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#4e4540]">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })} • Shift: Morning
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Btn variant="outline" onClick={() => window.print()}>
            <span className="material-symbols-outlined text-[16px] mr-1.5">print</span>
            Print Roster
          </Btn>
          <Btn variant="primary" onClick={() => setCreateOpen(true)}>
            <span className="material-symbols-outlined text-[16px] mr-1.5">add</span>
            Assign Tasks
          </Btn>
        </div>
      </div>

      {/* 6 Bento KPI Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem]">
          <div className="font-label-caps text-[10px] text-[#4e4540]">ROOMS TO CLEAN</div>
          <div className="font-serif text-3xl font-bold text-[#170f0a] mt-2">{dirtyCount}</div>
        </div>

        <div className="p-4 border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem] border-t-2 border-t-[#735c00]">
          <div className="font-label-caps text-[10px] text-[#4e4540]">IN PROGRESS</div>
          <div className="font-serif text-3xl font-bold text-[#735c00] mt-2">{inProgressCount}</div>
        </div>

        <div className="p-4 border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem]">
          <div className="font-label-caps text-[10px] text-[#4e4540]">CLEAN</div>
          <div className="font-serif text-3xl font-bold text-[#170f0a] mt-2">{cleanCount}</div>
        </div>

        <div className="p-4 border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem]">
          <div className="font-label-caps text-[10px] text-[#4e4540]">INSPECTED</div>
          <div className="font-serif text-3xl font-bold text-[#170f0a] mt-2">{inspectedCount}</div>
        </div>

        <div className="p-4 border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem] border-t-2 border-t-[#ba1a1a]">
          <div className="font-label-caps text-[10px] text-[#ba1a1a]">PRIORITY ROOMS</div>
          <div className="font-serif text-3xl font-bold text-[#ba1a1a] mt-2">{priorityCount}</div>
        </div>

        <div className="p-4 border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem]">
          <div className="font-label-caps text-[10px] text-[#4e4540]">DND ROOMS</div>
          <div className="font-serif text-3xl font-bold text-[#170f0a] mt-2">{dndCount}</div>
        </div>
      </section>

      {/* Main Grid: Floors (8 cols) & Linen Supply (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Floors Column (8 Cols) */}
        <section className="lg:col-span-8 space-y-8">
          {floors.map((fl) => {
            const completed = fl.rooms.filter((r) => r.status === "available").length;
            const total = fl.rooms.length;

            return (
              <div key={fl.floor} className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#d1c4bd] pb-2">
                  <h3 className="font-serif text-xl font-semibold text-[#170f0a]">{fl.label}</h3>
                  <span className="font-data-tabular text-xs text-[#7f756f]">
                    {completed}/{total} Completed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fl.rooms.map((room) => {
                    const task = tasks.find((t) => t.roomId === room.id);
                    const booking = db.bookings.find((b) => b.roomIds.includes(room.id) && ["confirmed", "checked-in"].includes(b.status));
                    const guest = booking ? db.guests.find((g) => g.id === booking.guestId) : null;
                    const isVip = guest?.vip || room.number === "202";

                    const statusKey = (room.status === "occupied" ? "ready" : room.status) as HKTask["status"];
                    const meta = STATUS_META[statusKey] || STATUS_META.dirty;

                    return (
                      <div
                        key={room.id}
                        onClick={() => toggleRoomStatus(room)}
                        className={cn(
                          "p-4 border bg-[#ffffff] rounded-[0.25rem] transition-colors cursor-pointer flex flex-col justify-between h-36 relative",
                          isVip ? "border-[#ba1a1a]/60 bg-[#fffdfd]" : "border-[#d1c4bd] hover:border-[#170f0a]"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-serif text-xl font-bold text-[#170f0a] flex items-center gap-1.5">
                              {room.number}
                              {isVip && <span className="text-[#ba1a1a] text-sm">!</span>}
                            </div>
                            <div className="text-xs text-[#4e4540] font-medium mt-0.5">
                              {guest ? guest.name : "Vacant"}
                            </div>
                          </div>
                          <span className={cn("px-2 py-0.5 rounded-[0.125rem] text-[10px] font-label-caps border", meta.chipClass)}>
                            {meta.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#d1c4bd]/40 text-xs text-[#7f756f] font-data-tabular">
                          <div>
                            <span className="block font-label-caps text-[9px] text-[#7f756f]">DEPARTURE</span>
                            <span className="text-[#170f0a] font-medium">11:00 AM</span>
                          </div>
                          <div className="text-right">
                            <span className="flex items-center gap-1 text-[#170f0a] font-medium">
                              <span className="material-symbols-outlined text-[14px] text-[#7f756f]">person</span>
                              {task?.assignedTo || (room.floor === 1 ? "Maria G." : "Sarah T.")}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {/* Sidebar: Linen Usage & Supply Levels (4 Cols) */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-[#fbf9f4] border border-[#d1c4bd] p-6 rounded-[0.25rem] space-y-6">
            <h3 className="font-serif text-lg font-semibold text-[#170f0a]">Today's Summary</h3>

            {/* Linen Usage */}
            <div className="space-y-4">
              <div className="font-label-caps text-[10px] text-[#4e4540]">LINEN USAGE</div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-data-tabular">
                  <span className="text-[#170f0a]">Bath Towels</span>
                  <span className="text-[#7f756f] font-semibold">450 / 500</span>
                </div>
                <div className="h-1.5 w-full bg-[#e4e2dd] rounded-full overflow-hidden">
                  <div className="h-full bg-[#170f0a] rounded-full" style={{ width: "90%" }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-data-tabular">
                  <span className="text-[#170f0a]">King Sheets</span>
                  <span className="text-[#7f756f] font-semibold">180 / 250</span>
                </div>
                <div className="h-1.5 w-full bg-[#e4e2dd] rounded-full overflow-hidden">
                  <div className="h-full bg-[#170f0a] rounded-full" style={{ width: "72%" }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-data-tabular">
                  <span className="text-[#170f0a]">Robes</span>
                  <span className="text-[#7f756f] font-semibold">45 / 80</span>
                </div>
                <div className="h-1.5 w-full bg-[#e4e2dd] rounded-full overflow-hidden">
                  <div className="h-full bg-[#fed65b] rounded-full" style={{ width: "56%" }} />
                </div>
              </div>
            </div>

            {/* Cart Supply Levels */}
            <div className="space-y-3 pt-4 border-t border-[#d1c4bd]">
              <div className="font-label-caps text-[10px] text-[#4e4540]">CART SUPPLY LEVELS</div>

              <div className="flex items-center justify-between p-2.5 bg-[#ffffff] border border-[#d1c4bd] rounded-[0.25rem] text-xs">
                <div className="flex items-center gap-2 text-[#170f0a]">
                  <span className="material-symbols-outlined text-[18px] text-[#7f756f]">dry_cleaning</span>
                  <span>Luxury Toiletries</span>
                </div>
                <span className="font-data-tabular font-bold text-[#170f0a]">80%</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#ffffff] border border-[#d1c4bd] rounded-[0.25rem] text-xs">
                <div className="flex items-center gap-2 text-[#170f0a]">
                  <span className="material-symbols-outlined text-[18px] text-[#7f756f]">water_drop</span>
                  <span>Cleaning Solvents</span>
                </div>
                <span className="font-data-tabular font-bold text-[#170f0a]">65%</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#ffffff] border border-[#d1c4bd] rounded-[0.25rem] text-xs">
                <div className="flex items-center gap-2 text-[#170f0a]">
                  <span className="material-symbols-outlined text-[18px] text-[#7f756f]">coffee</span>
                  <span>In-Room Coffee Pods</span>
                </div>
                <span className="font-data-tabular font-bold text-[#ba1a1a] bg-[#ffdad6] px-1.5 py-0.5 rounded-[0.125rem]">
                  15%
                </span>
              </div>
            </div>

            {/* Restock Button */}
            <Btn
              variant="outline"
              className="w-full text-xs"
              onClick={() => toast.success("Restock request sent to central inventory")}
            >
              Request Restock
            </Btn>
          </div>
        </section>
      </div>

      {/* Task Creation Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Assign Housekeeping Task"
        footer={
          <>
            <Btn variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={createTask}>Assign Task</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Room Number">
            <Select
              value={form.roomId}
              onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
              options={[{ value: "", label: "Select room" }, ...rooms.map((r) => ({ value: r.id, label: `Room ${r.number} (${r.status.toUpperCase()})` }))]}
            />
          </Field>
          <Field label="Cleaning Type">
            <Select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              options={["Standard Cleaning", "Deep Cleaning", "Checkout Turnover", "Turndown Service", "Inspection"].map((s) => ({ value: s, label: s }))}
            />
          </Field>
          <Field label="Assign Staff Member">
            <Select
              value={form.assignedTo}
              onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
              options={[{ value: "", label: "Select staff" }, ...hkStaff.map((e) => ({ value: e.name, label: e.name }))]}
            />
          </Field>
          <Field label="Priority Level">
            <Select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as HKTask["priority"] }))}
              options={["Low", "Medium", "High"].map((s) => ({ value: s, label: s }))}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
