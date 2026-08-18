import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Badge, Btn, Drawer, Modal } from "@/components/kit";
import { folioTotals, guestOf, money, update, useDB, getRoomCurrentStatus } from "@/lib/store";
import type { Room, RoomStatus, Booking, Guest } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rooms/grid")({
  head: () => ({ meta: [{ title: "Aurelia HMS — Rooms Overview" }] }),
  component: RoomsGridPage,
});

export function RoomsGridPage() {
  const db = useDB();
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Room | null>(null);

  const totalRooms = db.rooms.length;
  const occupiedCount = db.rooms.filter((r) => getRoomCurrentStatus(r, db) === "occupied").length;
  const availableCount = db.rooms.filter((r) => getRoomCurrentStatus(r, db) === "available").length;
  const dirtyCount = db.rooms.filter((r) => getRoomCurrentStatus(r, db) === "dirty").length;
  const cleaningCount = db.rooms.filter((r) => getRoomCurrentStatus(r, db) === "cleaning").length;
  const inspectedCount = db.rooms.filter((r) => getRoomCurrentStatus(r, db) === "inspection").length;
  const outOfOrderCount = db.rooms.filter((r) => getRoomCurrentStatus(r, db) === "blocked").length;
  const maintenanceCount = db.rooms.filter((r) => getRoomCurrentStatus(r, db) === "maintenance").length;

  const floors = [...new Set(db.rooms.map((r) => r.floor))].sort();

  const filtered = useMemo(() => {
    return db.rooms.filter((r) => {
      const liveStatus = getRoomCurrentStatus(r, db);
      if (floorFilter !== "all" && String(r.floor) !== floorFilter) return false;
      if (typeFilter !== "all" && r.typeId !== typeFilter) return false;
      if (statusFilter !== "all" && liveStatus !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const rt = db.roomTypes.find((t) => t.id === r.typeId);
        const booking = liveStatus === "occupied" ? db.bookings.find((b) => b.roomIds.includes(r.id) && b.status === "checked-in") : null;
        const guest = booking ? db.guests.find((g) => g.id === booking.guestId) : null;
        return (
          r.number.toLowerCase().includes(q) ||
          (rt?.name.toLowerCase().includes(q) ?? false) ||
          (guest?.name.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [db.rooms, db.roomTypes, db.bookings, db.guests, floorFilter, typeFilter, statusFilter, search]);

  function clearFilters() {
    setSearch("");
    setFloorFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
  }

  function setStatus(roomId: string, status: RoomStatus) {
    update((d) => {
      const r = d.rooms.find((x) => x.id === roomId);
      if (r) r.status = status;
    });
    toast.success(`Room status updated to ${status.toUpperCase()}`);
    setSelected(null);
  }

  // Active in-house booking for selected room
  const activeBooking = selected
    ? db.bookings.find((b) => b.roomIds.includes(selected.id) && b.status === "checked-in")
    : null;
  const activeGuest = activeBooking ? db.guests.find((g) => g.id === activeBooking.guestId) : null;
  const activeFolio = activeBooking ? folioTotals(activeBooking, db) : null;

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#170f0a] tracking-tight">
            Rooms Overview
          </h1>
        </div>
        <Btn variant="primary" onClick={() => nav({ to: "/reservations/new" as never })}>
          <span className="material-symbols-outlined text-[16px] mr-1.5">add</span>
          New Reservation
        </Btn>
      </div>

      {/* 8 Status Counters Row */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pb-4 border-b border-[#d1c4bd]">
        <div>
          <span className="font-label-caps text-[9px] text-[#7f756f] block">TOTAL ROOMS</span>
          <span className="font-serif text-2xl font-bold text-[#170f0a] block mt-0.5">{totalRooms}</span>
        </div>

        <div>
          <span className="font-label-caps text-[9px] text-[#7f756f] block">OCCUPIED</span>
          <span className="font-serif text-2xl font-bold text-[#170f0a] block mt-0.5">{occupiedCount}</span>
        </div>

        <div>
          <span className="font-label-caps text-[9px] text-[#7f756f] block">AVAILABLE</span>
          <span className="font-serif text-2xl font-bold text-[#285430] block mt-0.5">{availableCount}</span>
        </div>

        <div>
          <span className="font-label-caps text-[9px] text-[#7f756f] block">DIRTY</span>
          <span className="font-serif text-2xl font-bold text-[#ba1a1a] block mt-0.5">{dirtyCount}</span>
        </div>

        <div>
          <span className="font-label-caps text-[9px] text-[#7f756f] block">CLEANING</span>
          <span className="font-serif text-2xl font-bold text-[#735c00] block mt-0.5">{cleaningCount}</span>
        </div>

        <div>
          <span className="font-label-caps text-[9px] text-[#7f756f] block">INSPECTED</span>
          <span className="font-serif text-2xl font-bold text-[#170f0a] block mt-0.5">{inspectedCount}</span>
        </div>

        <div>
          <span className="font-label-caps text-[9px] text-[#ba1a1a] block">OUT OF ORDER</span>
          <span className="font-serif text-2xl font-bold text-[#ba1a1a] block mt-0.5">{outOfOrderCount}</span>
        </div>

        <div>
          <span className="font-label-caps text-[9px] text-[#7f756f] block">MAINTENANCE</span>
          <span className="font-serif text-2xl font-bold text-[#170f0a] block mt-0.5">{maintenanceCount}</span>
        </div>
      </section>

      {/* Filter Strip */}
      <div className="border border-[#d1c4bd] bg-[#fbf9f4] p-4 rounded-[0.25rem] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div>
          <label className="font-label-caps text-[10px] text-[#4e4540] block mb-1">SEARCH ROOM</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7f756f] text-[16px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. 204 or Mehta"
              className="w-full text-xs bg-transparent border-b border-[#d1c4bd] pl-8 py-1.5 outline-none focus:border-[#170f0a]"
            />
          </div>
        </div>

        <div>
          <label className="font-label-caps text-[10px] text-[#4e4540] block mb-1">FLOOR</label>
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="w-full text-xs bg-transparent border-b border-[#d1c4bd] py-1.5 outline-none focus:border-[#170f0a] cursor-pointer"
          >
            <option value="all">All Floors</option>
            {floors.map((f) => (
              <option key={f} value={String(f)}>Floor {f}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-label-caps text-[10px] text-[#4e4540] block mb-1">ROOM TYPE</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full text-xs bg-transparent border-b border-[#d1c4bd] py-1.5 outline-none focus:border-[#170f0a] cursor-pointer"
          >
            <option value="all">All Types</option>
            {db.roomTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-label-caps text-[10px] text-[#4e4540] block mb-1">STATUS</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs bg-transparent border-b border-[#d1c4bd] py-1.5 outline-none focus:border-[#170f0a] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="dirty">Dirty</option>
            <option value="cleaning">Cleaning</option>
            <option value="inspection">Inspected</option>
            <option value="maintenance">Maintenance</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div className="text-right">
          <button
            onClick={clearFilters}
            className="font-label-caps text-[10px] text-[#735c00] hover:text-[#170f0a] transition-colors cursor-pointer"
          >
            CLEAR FILTERS
          </button>
        </div>
      </div>

      {/* 3-Column Luxury Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((room) => {
          const rt = db.roomTypes.find((t) => t.id === room.typeId);
          const liveStatus = getRoomCurrentStatus(room, db);
          const isOccupied = liveStatus === "occupied";
          const inHouseBooking = isOccupied ? db.bookings.find((b) => b.roomIds.includes(room.id) && b.status === "checked-in") : null;
          const guest = inHouseBooking ? db.guests.find((g) => g.id === inHouseBooking.guestId) : null;
          const isAvailable = liveStatus === "available";

          return (
            <div
              key={room.id}
              onClick={() => setSelected(room)}
              className="border border-[#d1c4bd] bg-[#ffffff] rounded-[0.25rem] p-5 hover:border-[#170f0a] transition-colors cursor-pointer flex flex-col justify-between h-44"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-serif text-3xl font-bold text-[#170f0a] block">{room.number}</span>
                    <span className="font-label-caps text-[10px] text-[#7f756f] block mt-0.5">
                      {rt?.name?.toUpperCase()} • FL {room.floor}
                    </span>
                  </div>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-[0.125rem] text-[10px] font-label-caps border uppercase",
                    isOccupied ? "bg-[#f5f3ee] text-[#170f0a] border-[#d1c4bd]" :
                    isAvailable ? "bg-[#e5eedc] text-[#285430] border-[#c0d6b0]" :
                    liveStatus === "dirty" ? "bg-[#ffdad6] text-[#93000a] border-[#ffb4ab]" :
                    liveStatus === "cleaning" ? "bg-[#fed65b]/30 text-[#745c00] border-[#fed65b]" :
                    "bg-[#e2e8ec] text-[#2c4251] border-[#c5d1d9]"
                  )}>
                    {liveStatus}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#d1c4bd]/40 space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#7f756f]">Guest</span>
                  <span className={cn(
                    "font-medium",
                    isOccupied && guest ? "text-[#170f0a] font-bold" : "text-[#7f756f]"
                  )}>
                    {isOccupied && guest ? guest.name : "— Vacant"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#7f756f]">Housekeeping</span>
                  <span className={cn(
                    "flex items-center gap-1 font-medium",
                    liveStatus === "dirty" ? "text-[#ba1a1a]" : "text-[#285430]"
                  )}>
                    <span className="material-symbols-outlined text-[14px]">
                      {liveStatus === "dirty" ? "error" : "check"}
                    </span>
                    {liveStatus === "dirty" ? "Dirty" : "Clean / Inspected"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connected Room & Guest Details Drawer */}
      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Room ${selected?.number}`}
        subtitle={`Floor ${selected?.floor} • ${db.roomTypes.find((t) => t.id === selected?.typeId)?.name || "Room"}`}
      >
        {selected && (
          <div className="space-y-6">
            {/* Header Box */}
            <div className="p-4 bg-[#f5f3ee] border border-[#d1c4bd] rounded-[0.25rem] flex justify-between items-center">
              <div>
                <span className="font-serif text-2xl font-bold text-[#170f0a]">Room {selected.number}</span>
                <p className="text-xs text-[#7f756f]">
                  Base Rate: {money(db.roomTypes.find((t) => t.id === selected.typeId)?.baseRate ?? 4000)} / night
                </p>
              </div>
              <Badge tone={selected.status === "occupied" ? "warning" : selected.status === "available" ? "success" : "danger"}>
                {selected.status.toUpperCase()}
              </Badge>
            </div>

            {/* If Room is Occupied: Show Full Customer Details and Direct Payment / Folio Connection */}
            {selected.status === "occupied" && activeBooking && activeGuest ? (
              <div className="space-y-5">
                {/* Customer Details Card */}
                <div className="border border-[#d1c4bd] bg-[#fbf9f4] p-4 rounded-[0.25rem] space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#d1c4bd]">
                    <span className="font-label-caps text-[10px] text-[#7f756f]">IN-HOUSE GUEST</span>
                    {activeGuest.vip && (
                      <span className="text-[9px] font-label-caps bg-[#fed65b] text-[#745c00] px-1.5 py-0.2 rounded font-bold">
                        VIP GUEST
                      </span>
                    )}
                  </div>
                  <div className="font-serif text-lg font-bold text-[#170f0a]">
                    {activeGuest.salutation || "Mr."} {activeGuest.name}
                  </div>
                  <div className="space-y-1 text-xs text-[#4e4540]">
                    <div className="flex justify-between"><span>Phone:</span><span className="font-bold text-[#170f0a]">{activeGuest.mobile}</span></div>
                    <div className="flex justify-between"><span>Email:</span><span>{activeGuest.email || "—"}</span></div>
                    <div className="flex justify-between"><span>Location:</span><span>{activeGuest.city || "Jaipur"}, {activeGuest.nationality || "Indian"}</span></div>
                  </div>
                </div>

                {/* Booking Stay Details */}
                <div className="border border-[#d1c4bd] bg-[#ffffff] p-4 rounded-[0.25rem] space-y-2 text-xs">
                  <span className="font-label-caps text-[10px] text-[#7f756f] block pb-1 border-b border-[#d1c4bd]">
                    RESERVATION DETAILS
                  </span>
                  <div className="flex justify-between"><span>Booking ID:</span><span className="font-mono font-bold text-[#170f0a]">{activeBooking.id}</span></div>
                  <div className="flex justify-between"><span>GRC Number:</span><span className="font-mono text-[#4e4540]">{activeBooking.grc}</span></div>
                  <div className="flex justify-between"><span>Stay Dates:</span><span className="font-bold text-[#170f0a]">{activeBooking.checkIn} → {activeBooking.checkOut} ({activeBooking.nights} N)</span></div>
                  <div className="flex justify-between"><span>Guests:</span><span>{activeBooking.adults} Adults, {activeBooking.children} Children</span></div>
                </div>

                {/* Live Folio & Balance Due */}
                {activeFolio && (
                  <div className="border border-[#d1c4bd] bg-[#fbf9f4] p-4 rounded-[0.25rem] space-y-2 text-xs font-data-tabular">
                    <span className="font-label-caps text-[10px] text-[#7f756f] block pb-1 border-b border-[#d1c4bd]">
                      LIVE FOLIO CHARGES
                    </span>
                    <div className="flex justify-between text-[#4e4540]"><span>Room Rent</span><span>{money(activeFolio.room)}</span></div>
                    <div className="flex justify-between text-[#4e4540]"><span>Restaurant &amp; POS</span><span>{money(activeFolio.pos)}</span></div>
                    <div className="flex justify-between text-[#4e4540]"><span>Laundry &amp; Services</span><span>{money(activeFolio.laundry)}</span></div>
                    <div className="flex justify-between text-[#4e4540]"><span>GST &amp; Taxes</span><span>{money(activeFolio.tax)}</span></div>
                    <div className="flex justify-between pt-2 border-t border-[#d1c4bd] font-bold text-sm text-[#170f0a]">
                      <span>Total Folio</span>
                      <span>{money(activeFolio.total)}</span>
                    </div>
                    <div className="flex justify-between text-[#285430] font-medium"><span>Total Paid / Advance</span><span>{money(activeFolio.paid)}</span></div>
                    <div className="flex justify-between pt-1 border-t border-[#d1c4bd] font-bold text-[#ba1a1a]">
                      <span>Balance Payable</span>
                      <span>{money(activeFolio.balance)}</span>
                    </div>
                  </div>
                )}

                {/* Connected Action Buttons for Occupied Room */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      setSelected(null);
                      nav({ to: `/reservations/${activeBooking.id}` as never });
                    }}
                    className="w-full bg-[#170f0a] !text-[#ffffff] py-3 rounded-[0.25rem] font-label-caps text-xs font-bold hover:bg-[#2d241e] transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                    Open Guest Folio &amp; Settlement Page →
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <Btn
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelected(null);
                        nav({ to: "/pos" as never });
                      }}
                    >
                      Charge POS Order
                    </Btn>
                    <Btn
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelected(null);
                        nav({ to: "/check-out" as never });
                      }}
                    >
                      Check-Out Guest
                    </Btn>
                  </div>
                </div>
              </div>
            ) : (
              /* If Room is Available / Vacant */
              <div className="space-y-4">
                <div className="p-4 bg-[#e5eedc]/40 border border-[#c0d6b0] rounded-[0.25rem] text-xs text-[#285430] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>Room is clean, vacant, and available for check-in.</span>
                </div>

                <button
                  onClick={() => {
                    setSelected(null);
                    nav({ to: "/reservations/new" as never });
                  }}
                  className="w-full bg-[#170f0a] !text-[#ffffff] py-3 rounded-[0.25rem] font-label-caps text-xs font-bold hover:bg-[#2d241e] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Book &amp; Check-In Room {selected.number} Now
                </button>
              </div>
            )}

            {/* Quick Status Override Buttons */}
            <div className="space-y-2 pt-4 border-t border-[#d1c4bd]">
              <span className="font-label-caps text-[10px] text-[#4e4540]">OVERRIDE ROOM STATUS</span>
              <div className="grid grid-cols-2 gap-2">
                <Btn size="sm" variant="outline" onClick={() => setStatus(selected.id, "available")}>Mark Available</Btn>
                <Btn size="sm" variant="outline" onClick={() => setStatus(selected.id, "occupied")}>Mark Occupied</Btn>
                <Btn size="sm" variant="outline" onClick={() => setStatus(selected.id, "dirty")}>Mark Dirty</Btn>
                <Btn size="sm" variant="outline" onClick={() => setStatus(selected.id, "cleaning")}>Mark Cleaning</Btn>
                <Btn size="sm" variant="outline" onClick={() => setStatus(selected.id, "inspection")}>Mark Inspected</Btn>
                <Btn size="sm" variant="outline" onClick={() => setStatus(selected.id, "maintenance")}>Maintenance</Btn>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
