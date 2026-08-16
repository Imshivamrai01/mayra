import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  BedDouble, CheckCircle2, Clock, DollarSign, Filter, LogIn, LogOut,
  Plus, Sparkles, User, RefreshCw, AlertTriangle, ShieldCheck,
  ChevronRight, ArrowRight, Phone, Calendar, Moon, Sun, Layers,
  CheckCircle, Brush, Wrench, Eye
} from "lucide-react";
import {
  Badge, Btn, Card, Modal, PageHeader, StatCard, Table, Select, Input,
  SuccessModal, Shimmer
} from "@/components/kit";

import {
  fmtDate, guestOf, money, roomLabel, roomTypeOf, today, update, useDB,
  folioTotals, bookingService, roomService, ROOM_STATUS_META, BOOKING_STATUS_META, uid
} from "@/lib/store";
import type { Booking, Room, RoomStatus } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/ez-dashboard")({
  head: () => ({ meta: [{ title: "EZ Room Dashboard — MAYRA Hotel ERP" }] }),
  component: EZDashboardPage,
});

const STATUS_FILTERS: { key: string; label: string; tone: string; bg: string }[] = [
  { key: "all", label: "All Rooms", tone: "default", bg: "" },
  { key: "available", label: "Available", tone: "success", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { key: "occupied", label: "Occupied (In-House)", tone: "primary", bg: "bg-purple-50 text-purple-900 border-purple-200" },
  { key: "reserved", label: "Reserved (Expected)", tone: "info", bg: "bg-sky-50 text-sky-800 border-sky-200" },
  { key: "dirty", label: "Dirty (Needs HK)", tone: "danger", bg: "bg-rose-50 text-rose-800 border-rose-200" },
  { key: "cleaning", label: "Cleaning", tone: "warning", bg: "bg-amber-50 text-amber-800 border-amber-200" },
  { key: "maintenance", label: "Maintenance", tone: "muted", bg: "bg-slate-100 text-slate-700 border-slate-200" },
];


function EZDashboardPage() {
  const db = useDB();
  const nav = useNavigate();

  const [statusFilter, setStatusFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Group rooms by floor
  const floors = useMemo(() => {
    const map: Record<number, Room[]> = {};
    db.rooms.forEach((r) => {
      if (!map[r.floor]) map[r.floor] = [];
      map[r.floor].push(r);
    });
    return Object.keys(map).map(Number).sort((a, b) => a - b);
  }, [db.rooms]);

  // Active bookings mapping by roomId
  const roomBookings = useMemo(() => {
    const map: Record<string, Booking> = {};
    db.bookings.forEach((b) => {
      if (["checked-in", "confirmed"].includes(b.status)) {
        b.roomIds.forEach((rid) => {
          map[rid] = b;
        });
      }
    });
    return map;
  }, [db.bookings]);

  // Counts
  const counts = useMemo(() => {
    return {
      total: db.rooms.length,
      available: db.rooms.filter((r) => r.status === "available").length,
      occupied: db.rooms.filter((r) => r.status === "occupied").length,
      reserved: db.rooms.filter((r) => r.status === "reserved").length,
      dirty: db.rooms.filter((r) => r.status === "dirty").length,
      cleaning: db.rooms.filter((r) => r.status === "cleaning").length,
      maintenance: db.rooms.filter((r) => ["maintenance", "blocked"].includes(r.status)).length,
    };
  }, [db.rooms]);

  // Today's Arrivals & Departures
  const todayArrivals = useMemo(() => {
    return db.bookings.filter((b) => b.checkIn === today() && b.status === "confirmed");
  }, [db.bookings]);

  const todayDepartures = useMemo(() => {
    return db.bookings.filter((b) => b.checkOut === today() && b.status === "checked-in");
  }, [db.bookings]);

  // Filtered rooms
  const filteredRooms = (floor: number) => {
    return db.rooms.filter((r) => {
      if (r.floor !== floor) return false;
      if (statusFilter !== "all") {
        if (statusFilter === "maintenance") {
          if (!["maintenance", "blocked"].includes(r.status)) return false;
        } else if (r.status !== statusFilter) return false;
      }
      if (typeFilter !== "all" && r.typeId !== typeFilter) return false;
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase();
        const b = roomBookings[r.id];
        const g = b ? guestOf(b, db) : null;
        const matchesRoom = r.number.toLowerCase().includes(q);
        const matchesGuest = g?.name.toLowerCase().includes(q) || g?.phone?.includes(q) || g?.mobile?.includes(q);
        if (!matchesRoom && !matchesGuest) return false;
      }
      return true;
    });
  };

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case "available":
        return {
          border: "border-emerald-500/40 hover:border-emerald-500",
          bg: "bg-emerald-50/40 dark:bg-emerald-950/20",
          badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300",
          dot: "bg-emerald-500",
          accent: "text-emerald-600 dark:text-emerald-400",
        };
      case "occupied":
        return {
          border: "border-blue-500/40 hover:border-blue-500",
          bg: "bg-blue-50/40 dark:bg-blue-950/20",
          badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border-blue-300",
          dot: "bg-blue-500",
          accent: "text-blue-600 dark:text-blue-400",
        };
      case "reserved":
        return {
          border: "border-purple-500/40 hover:border-purple-500",
          bg: "bg-purple-50/40 dark:bg-purple-950/20",
          badgeBg: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-300",
          dot: "bg-purple-500",
          accent: "text-purple-600 dark:text-purple-400",
        };
      case "dirty":
        return {
          border: "border-rose-500/40 hover:border-rose-500",
          bg: "bg-rose-50/40 dark:bg-rose-950/20",
          badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border-rose-300",
          dot: "bg-rose-500",
          accent: "text-rose-600 dark:text-rose-400",
        };
      case "cleaning":
        return {
          border: "border-amber-500/40 hover:border-amber-500",
          bg: "bg-amber-50/40 dark:bg-amber-950/20",
          badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300",
          dot: "bg-amber-500",
          accent: "text-amber-600 dark:text-amber-400",
        };
      default:
        return {
          border: "border-slate-400/40 hover:border-slate-500",
          bg: "bg-slate-50/40 dark:bg-slate-900/20",
          badgeBg: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300",
          dot: "bg-slate-500",
          accent: "text-slate-600 dark:text-slate-400",
        };
    }
  };

  const selectedBooking = selectedRoom
    ? selectedRoom.status === "occupied"
      ? db.bookings.find((b) => b.roomIds.includes(selectedRoom.id) && b.status === "checked-in")
      : selectedRoom.status === "reserved"
      ? db.bookings.find((b) => b.roomIds.includes(selectedRoom.id) && b.status === "confirmed")
      : null
    : null;
  const selectedGuest = selectedBooking ? guestOf(selectedBooking, db) : null;
  const selectedTotals = selectedBooking ? folioTotals(selectedBooking, db) : null;


  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 beacon-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              EZ Room Dashboard <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
            </h1>
            <span className="shimmer-purple-badge text-xs px-2.5 py-0.5 rounded-full font-bold ml-2">Live Room Matrix</span>
          </div>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Real-time visual room status board, daily arrivals & departures, and one-click quick actions.
          </p>
        </div>

        {/* Hotel Timing Policy Banner */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-purple-200 bg-purple-50/60 px-3.5 py-2 text-xs flex items-center gap-3 shadow-xs">
            <Clock className="h-4 w-4 text-purple-600" />
            <div>
              <span className="font-bold text-slate-900">Standard Timings:</span>{" "}
              <span className="text-slate-500">Check-in: <strong className="text-slate-900">{db.settings.checkInTime || "12:00 PM"}</strong></span> ·{" "}
              <span className="text-slate-500">Check-out: <strong className="text-slate-900">{db.settings.checkOutTime || "11:00 AM"}</strong></span>
            </div>
          </div>

          <Btn
            variant="primary"
            size="md"
            icon={Plus}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-sm rounded-xl px-4"
            onClick={() => nav({ to: "/reservations/new" as never })}
          >
            New Booking
          </Btn>
        </div>
      </div>

      {/* Metric Counters with Shimmer */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div
          onClick={() => setStatusFilter("all")}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all shimmer-card ${statusFilter === "all" ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20" : "bg-card hover:bg-secondary/40"}`}
        >
          <div className="text-xs text-muted-foreground font-medium">Total Rooms</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">{counts.total}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Across {floors.length} Floors</div>
        </div>

        <div
          onClick={() => setStatusFilter("available")}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all shimmer-card ${statusFilter === "available" ? "border-emerald-500 bg-emerald-500/15 shadow-md ring-2 ring-emerald-500/20" : "bg-card hover:bg-secondary/40"}`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Available</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 beacon-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">{counts.available}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{((counts.available / counts.total) * 100).toFixed(0)}% Inventory Free</div>
        </div>

        <div
          onClick={() => setStatusFilter("occupied")}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all shimmer-card ${statusFilter === "occupied" ? "border-blue-500 bg-blue-500/15 shadow-md ring-2 ring-blue-500/20" : "bg-card hover:bg-secondary/40"}`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
            <span>Occupied</span>
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">{counts.occupied}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{((counts.occupied / counts.total) * 100).toFixed(0)}% Occupancy</div>
        </div>

        <div
          onClick={() => setStatusFilter("reserved")}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all shimmer-card ${statusFilter === "reserved" ? "border-purple-500 bg-purple-500/15 shadow-md ring-2 ring-purple-500/20" : "bg-card hover:bg-secondary/40"}`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
            <span>Reserved</span>
            <span className="h-2 w-2 rounded-full bg-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">{counts.reserved}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Expected Arrivals</div>
        </div>

        <div
          onClick={() => setStatusFilter("dirty")}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all shimmer-card ${statusFilter === "dirty" ? "border-rose-500 bg-rose-500/15 shadow-md ring-2 ring-rose-500/20" : "bg-card hover:bg-secondary/40"}`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
            <span>Dirty (HK)</span>
            <span className="h-2 w-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 mt-1">{counts.dirty}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Needs Cleaning</div>
        </div>

        <div
          onClick={() => setStatusFilter("maintenance")}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all shimmer-card ${statusFilter === "maintenance" ? "border-slate-500 bg-slate-500/15 shadow-md ring-2 ring-slate-500/20" : "bg-card hover:bg-secondary/40"}`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Maintenance</span>
            <span className="h-2 w-2 rounded-full bg-slate-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-700 dark:text-slate-300 mt-1">{counts.maintenance}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Out of Service</div>
        </div>
      </div>

      {/* Today's Movement Bar: Check-Ins & Check-Outs Hub */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Today's Expected Check-Ins */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm shimmer-card">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <LogIn className="h-4 w-4 text-emerald-600" />
              <span>Today's Expected Check-Ins ({todayArrivals.length})</span>
            </div>
            <span className="text-xs text-muted-foreground">Standard 12:00 PM Slot</span>
          </div>

          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
            {todayArrivals.map((b) => {
              const g = guestOf(b, db);
              return (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 p-2.5 text-xs hover:bg-secondary/60 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      {roomLabel(b.roomIds, db) || "—"}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        {g?.name ?? "Guest"}
                        {g?.vip && <span className="text-[10px] text-amber-600 font-bold">★ VIP</span>}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {b.id} · {b.checkInTime || "12:00 PM"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Btn
                      size="sm"
                      variant="primary"
                      className="h-7 text-xs shimmer-gold font-bold px-2.5"
                      onClick={() => {
                        bookingService.checkIn(b.id);
                        toast.success(`Checked in ${g?.name} to Room ${roomLabel(b.roomIds, db)}`);
                      }}
                    >
                      Express Check-In
                    </Btn>
                    <Btn
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => nav({ to: `/reservations/${b.id}` as never })}
                    >
                      Folio →
                    </Btn>
                  </div>
                </div>
              );
            })}
            {todayArrivals.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No more pending check-ins for today.
              </div>
            )}
          </div>
        </div>

        {/* Today's Expected Check-Outs */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm shimmer-card">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <LogOut className="h-4 w-4 text-rose-600" />
              <span>Today's Expected Check-Outs ({todayDepartures.length})</span>
            </div>
            <span className="text-xs text-muted-foreground">Standard 11:00 AM Slot</span>
          </div>

          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
            {todayDepartures.map((b) => {
              const g = guestOf(b, db);
              const t = folioTotals(b, db);
              return (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 p-2.5 text-xs hover:bg-secondary/60 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {roomLabel(b.roomIds, db) || "—"}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        {g?.name ?? "Guest"}
                        {g?.vip && <span className="text-[10px] text-amber-600 font-bold">★ VIP</span>}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Bal: <span className={t.balance > 0 ? "font-bold text-danger" : "text-success font-semibold"}>{money(t.balance)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Btn
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 dark:text-rose-300 px-2.5 font-bold"
                      onClick={() => {
                        bookingService.checkOut(b.id);
                        toast.success(`Checked out ${g?.name}. Room marked Dirty for HK.`);
                      }}
                    >
                      Express Check-Out
                    </Btn>
                    <Btn
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => nav({ to: `/reservations/${b.id}` as never })}
                    >
                      Folio →
                    </Btn>
                  </div>
                </div>
              );
            })}
            {todayDepartures.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No pending check-outs for today.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Filter By:</span>
          <Select
            className="h-8 w-40 text-xs"
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            options={[
              { value: "all", label: "All Floors" },
              ...floors.map((f) => ({ value: String(f), label: f === 0 ? "Ground Floor" : `Floor ${f}` })),
            ]}
          />
          <Select
            className="h-8 w-44 text-xs"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: "all", label: "All Room Types" },
              ...db.roomTypes.map((rt) => ({ value: rt.id, label: rt.name })),
            ]}
          />
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search room # or guest..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Floor by Floor Live Matrix */}
      <div className="space-y-6">
        {floors
          .filter((f) => floorFilter === "all" || String(f) === floorFilter)
          .map((floor) => {
            const roomsOnFloor = filteredRooms(floor);
            if (roomsOnFloor.length === 0) return null;

            return (
              <div key={floor} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border/80 pb-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold tracking-tight text-foreground">
                    {floor === 0 ? "Ground Floor (Level 0)" : `Floor ${floor} (Level ${floor})`}
                  </h3>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {roomsOnFloor.length} rooms
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {roomsOnFloor.map((room) => {
                    const st = getStatusColor(room.status);
                    const isOccupied = room.status === "occupied";
                    const isReserved = room.status === "reserved";
                    const booking = isOccupied
                      ? db.bookings.find((b) => b.roomIds.includes(room.id) && b.status === "checked-in")
                      : isReserved
                      ? db.bookings.find((b) => b.roomIds.includes(room.id) && b.status === "confirmed")
                      : null;
                    const guest = booking ? guestOf(booking, db) : null;
                    const rType = roomTypeOf(room.typeId, db);
                    const totals = booking ? folioTotals(booking, db) : null;

                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`group relative flex flex-col justify-between rounded-xl border p-3 cursor-pointer transition-all duration-200 shadow-sm shimmer-card ${st.border} ${st.bg}`}
                      >
                        {/* Header: Room Number & Status Dot */}
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">
                              {room.number}
                            </span>
                            <span className={`h-2.5 w-2.5 rounded-full ${st.dot} ${room.status === "available" || room.status === "occupied" ? "beacon-pulse" : ""}`} />
                          </div>

                          <div className="text-[11px] text-muted-foreground truncate font-medium mt-0.5">
                            {rType?.name ?? "Room"}
                          </div>
                        </div>

                        {/* Middle Content: Guest / Status details */}
                        <div className="my-2.5 space-y-1 text-xs">
                          {isOccupied && booking && guest ? (
                            <>
                              <div className="font-semibold text-slate-900 truncate flex items-center gap-1">
                                <User className="h-3 w-3 text-purple-700 shrink-0" />
                                <span className="truncate">{guest.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>Out: {fmtDate(booking.checkOut)}, {booking.checkOutTime || "11:00 AM"}</span>
                              </div>
                              {totals && (
                                <div className="text-[11px] font-extrabold">
                                  {totals.balance > 0 ? (
                                    <span className="text-rose-600">Due: {money(totals.balance)}</span>
                                  ) : (
                                    <span className="text-emerald-700">✓ Paid</span>
                                  )}
                                </div>
                              )}
                            </>
                          ) : isReserved && booking && guest ? (
                            <>
                              <div className="font-semibold text-slate-900 truncate flex items-center gap-1">
                                <User className="h-3 w-3 text-blue-600 shrink-0" />
                                <span className="truncate">{guest.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>In: {fmtDate(booking.checkIn)}, {booking.checkInTime || "12:00 PM"}</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-[11px] py-1 space-y-0.5">
                              {room.status === "available" && (
                                <>
                                  <span className="text-emerald-700 font-bold block">✓ Vacant · Ready</span>
                                  <span className="text-[10px] text-slate-400 font-medium block">₹{rType?.baseRate?.toLocaleString("en-IN") ?? "3,500"}/night</span>
                                </>
                              )}
                              {room.status === "dirty" && <span className="text-rose-700 font-bold block">🧹 Needs Cleaning</span>}
                              {room.status === "cleaning" && <span className="text-amber-700 font-bold block">✨ Cleaning in Progress</span>}
                              {["maintenance", "blocked"].includes(room.status) && <span className="text-slate-600 font-bold block">🔧 Under Repair</span>}
                            </div>
                          )}
                        </div>

                        {/* Footer Status Pill */}
                        <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${st.badgeBg}`}>
                            {ROOM_STATUS_META[room.status]?.label ?? room.status}
                          </span>
                          <span className="text-muted-foreground group-hover:text-foreground font-semibold flex items-center">
                            Details <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            );
          })}
      </div>

      {/* Room Quick Inspection Modal */}
      <Modal
        open={Boolean(selectedRoom)}
        onClose={() => setSelectedRoom(null)}
        title={`Room ${selectedRoom?.number}`}
        subtitle={selectedRoom ? `${roomTypeOf(selectedRoom.typeId, db)?.name} · Floor ${selectedRoom.floor} · ${selectedRoom.bedType} Bed · ₹${roomTypeOf(selectedRoom.typeId, db)?.basePrice}/night` : ""}
        footer={
          <div className="flex w-full justify-between items-center">
            <Btn variant="outline" size="sm" onClick={() => setSelectedRoom(null)}>
              Close
            </Btn>

            {selectedBooking ? (
              <Btn
                variant="primary"
                size="sm"
                className="shimmer-gold font-bold"
                onClick={() => nav({ to: `/reservations/${selectedBooking.id}` as never })}
              >
                Open Guest Folio & Invoices →
              </Btn>
            ) : selectedRoom?.status === "available" ? (
              <Btn
                variant="primary"
                size="sm"
                className="shimmer-gold font-bold"
                onClick={() => nav({ to: "/reservations/new" as never })}
              >
                Book This Room →
              </Btn>
            ) : null}
          </div>
        }
      >
        {selectedRoom && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase border ${getStatusColor(selectedRoom.status).badgeBg}`}>
                Status: {ROOM_STATUS_META[selectedRoom.status]?.label ?? selectedRoom.status}
              </span>
            </div>

            {/* If In-House Guest / Active Booking */}
            {selectedBooking && selectedGuest ? (
              <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-purple-700" />
                    <span>{selectedGuest.name}</span>
                    {selectedGuest.vip && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">★ VIP</span>}
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-700">{selectedBooking.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold">Mobile:</span> <span className="font-bold text-slate-800">{selectedGuest.mobile || selectedGuest.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Source:</span> <span className="font-bold text-slate-800">{selectedBooking.source}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Check-In:</span>{" "}
                    <span className="font-bold text-slate-900">{fmtDate(selectedBooking.checkIn)} ({selectedBooking.checkInTime || "12:00 PM"})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Check-Out:</span>{" "}
                    <span className="font-bold text-slate-900">{fmtDate(selectedBooking.checkOut)} ({selectedBooking.checkOutTime || "11:00 AM"})</span>
                  </div>
                </div>

                {selectedTotals && (
                  <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-xs font-semibold">
                    <div>
                      <span className="text-slate-500">Total Bill:</span>{" "}
                      <span className="font-bold text-slate-900">{money(selectedTotals.total)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Balance:</span>{" "}
                      <span className={selectedTotals.balance > 0 ? "font-black text-rose-600" : "font-black text-emerald-700"}>
                        {money(selectedTotals.balance)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-xs font-semibold text-slate-400">
                No active in-house guest assigned to this room right now.
              </div>
            )}

            {/* Quick Status Control Buttons */}
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">Change Room Status:</div>
              <div className="grid grid-cols-3 gap-2">
                <Btn
                  size="sm"
                  variant={selectedRoom.status === "available" ? "primary" : "outline"}
                  onClick={() => {
                    roomService.setStatus(selectedRoom.id, "available");
                    toast.success(`Room ${selectedRoom.number} marked Available`);
                    setSelectedRoom(null);
                  }}
                >
                  🟢 Available
                </Btn>
                <Btn
                  size="sm"
                  variant={selectedRoom.status === "dirty" ? "danger" : "outline"}
                  onClick={() => {
                    roomService.setStatus(selectedRoom.id, "dirty");
                    toast.success(`Room ${selectedRoom.number} marked Dirty (HK Alert)`);
                    setSelectedRoom(null);
                  }}
                >
                  🔴 Dirty (HK)
                </Btn>
                <Btn
                  size="sm"
                  variant={selectedRoom.status === "cleaning" ? "primary" : "outline"}
                  onClick={() => {
                    roomService.setStatus(selectedRoom.id, "cleaning");
                    toast.success(`Room ${selectedRoom.number} marked Cleaning`);
                    setSelectedRoom(null);
                  }}
                >
                  🟡 Cleaning
                </Btn>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
