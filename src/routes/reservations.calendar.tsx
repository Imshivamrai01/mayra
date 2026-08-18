import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Badge, Btn, Drawer, KV } from "@/components/kit";
import { fmtDate, fmtDay, guestOf, money, useDB, folioTotals, iso, addDays, bookingService, getRoomCurrentStatus } from "@/lib/store";
import type { Booking, Room } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reservations/calendar")({
  head: () => ({ meta: [{ title: "Hotel Amara — Booking Calendar" }] }),
  component: ReservationCalendar,
});

export function ReservationCalendar() {
  const db = useDB();
  const nav = useNavigate();
  const [baseDate, setBaseDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const DAYS = viewMode === "day" ? 1 : viewMode === "week" ? 7 : 14;
  const dates: string[] = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < DAYS; i++) {
      list.push(iso(addDays(baseDate, i)));
    }
    return list;
  }, [baseDate, DAYS]);

  const filteredRooms = useMemo(() => {
    return db.rooms.filter((r) => typeFilter === "all" || r.typeId === typeFilter);
  }, [db.rooms, typeFilter]);

  function prev() { setBaseDate((d) => addDays(d, -DAYS)); }
  function next() { setBaseDate((d) => addDays(d, DAYS)); }
  function goToday() { setBaseDate(new Date()); }

  const todayStr = iso(new Date());
  const selGuest = selected ? guestOf(selected, db) : null;
  const selFolio = selected ? folioTotals(selected, db) : null;

  // Calculate actual dynamic occupancy % for current calendar window
  const totalSlots = filteredRooms.length * DAYS;
  const occupiedSlots = filteredRooms.reduce((acc, r) => {
    const bookedDays = dates.filter((d) =>
      db.bookings.some(
        (b) =>
          b.roomIds.includes(r.id) &&
          ["confirmed", "checked-in"].includes(b.status) &&
          b.checkIn <= d &&
          b.checkOut > d
      )
    ).length;
    return acc + bookedDays;
  }, 0);
  const occupancyRate = totalSlots > 0 ? Math.min(100, Math.round((occupiedSlots / totalSlots) * 100)) : 0;

  const dateRangeDisplay = `${new Date(dates[0]!).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(dates[dates.length - 1]!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  function handleCheckIn(bId: string) {
    bookingService.checkIn(bId);
    toast.success("Guest checked in successfully!");
  }

  function handleCheckOut(bId: string) {
    bookingService.checkOut(bId);
    toast.success("Guest checked out successfully!");
  }

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-[#d1c4bd]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#170f0a] tracking-tight">
            Booking Calendar
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#4e4540] mt-1">
            Real-time live room schedule · <span className="font-bold text-[#170f0a]">{occupancyRate}% Occupancy</span> across {filteredRooms.length} rooms
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Navigator */}
          <div className="flex items-center border border-[#d1c4bd] bg-[#ffffff] rounded-[0.25rem] overflow-hidden text-xs">
            <button onClick={prev} className="px-2.5 py-1.5 hover:bg-[#f0eee9] transition-colors border-r border-[#d1c4bd] cursor-pointer" aria-label="Previous">
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button onClick={goToday} className="px-3 py-1.5 font-bold hover:bg-[#f0eee9] transition-colors border-r border-[#d1c4bd] flex items-center gap-1 cursor-pointer">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              Today
            </button>
            <span className="px-3 py-1.5 font-bold text-[#170f0a] font-data-tabular">
              {dateRangeDisplay}
            </span>
            <button onClick={next} className="px-2.5 py-1.5 hover:bg-[#f0eee9] transition-colors border-l border-[#d1c4bd] cursor-pointer" aria-label="Next">
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-[#d1c4bd] rounded-[0.25rem] overflow-hidden text-xs font-label-caps bg-[#ffffff]">
            <button
              onClick={() => setViewMode("day")}
              className={cn("px-3 py-1.5 transition-colors cursor-pointer", viewMode === "day" ? "bg-[#170f0a] !text-[#ffffff] font-bold" : "text-[#4e4540] hover:bg-[#f0eee9]")}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn("px-3 py-1.5 transition-colors border-x border-[#d1c4bd] cursor-pointer", viewMode === "week" ? "bg-[#170f0a] !text-[#ffffff] font-bold" : "text-[#4e4540] hover:bg-[#f0eee9]")}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={cn("px-3 py-1.5 transition-colors cursor-pointer", viewMode === "month" ? "bg-[#170f0a] !text-[#ffffff] font-bold" : "text-[#4e4540] hover:bg-[#f0eee9]")}
            >
              Month
            </button>
          </div>

          {/* Filters */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-[0.25rem] border border-[#d1c4bd] bg-[#ffffff] px-2.5 text-xs outline-none focus:border-[#170f0a] cursor-pointer"
          >
            <option value="all">All Room Types</option>
            {db.roomTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-[0.25rem] border border-[#d1c4bd] bg-[#ffffff] px-2.5 text-xs outline-none focus:border-[#170f0a] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked-in">In-House</option>
            <option value="checked-out">Checked-out</option>
          </select>

          <Btn variant="primary" size="sm" onClick={() => nav({ to: "/reservations/new" as never })}>
            <span className="material-symbols-outlined text-[14px] mr-1">add</span>
            New Booking
          </Btn>
        </div>
      </div>

      {/* Calendar Matrix Table */}
      <div className="border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem] overflow-x-auto shadow-xs">
        <table className="w-full border-collapse text-left text-xs" style={{ minWidth: `${DAYS * 140 + 190}px` }}>
          <thead>
            <tr className="border-b border-[#d1c4bd] bg-[#f5f3ee]">
              <th className="sticky left-0 z-20 bg-[#f5f3ee] p-3.5 border-r border-[#d1c4bd] font-label-caps text-[10px] text-[#4e4540]" style={{ width: 190 }}>
                ROOM
              </th>
              {dates.map((d) => {
                const dt = new Date(d);
                const isToday = d === todayStr;
                return (
                  <th
                    key={d}
                    className={cn(
                      "p-3 text-center border-r border-[#d1c4bd]/60 font-sans",
                      isToday ? "bg-[#f0dfd6] text-[#170f0a]" : "text-[#4e4540]"
                    )}
                  >
                    <div className="font-label-caps text-[10px]">{dt.toLocaleDateString("en-US", { weekday: "short" })}</div>
                    <div className={cn("font-serif text-base font-bold mt-0.5", isToday && "underline decoration-[#735c00] underline-offset-4 text-[#170f0a]")}>
                      {dt.getDate()}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d1c4bd]/40">
            {filteredRooms.map((room) => {
              const rt = db.roomTypes.find((t) => t.id === room.typeId);
              const liveStatus = getRoomCurrentStatus(room, db, todayStr);
              const roomBookings = db.bookings.filter(
                (b) =>
                  b.roomIds.includes(room.id) &&
                  (statusFilter === "all" || b.status === statusFilter) &&
                  b.checkIn <= dates[dates.length - 1]! &&
                  b.checkOut >= dates[0]! &&
                  b.status !== "cancelled"
              );

              return (
                <tr key={room.id} className="hover:bg-[#ffffff]/60 transition-colors">
                  {/* Left Column Room Info */}
                  <td className="sticky left-0 z-10 bg-[#fbf9f4] p-3.5 border-r border-[#d1c4bd]">
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-base font-bold text-[#170f0a]">{room.number}</span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.2 rounded font-label-caps font-bold uppercase",
                        liveStatus === "occupied" ? "bg-[#f5f3ee] text-[#170f0a] border border-[#d1c4bd]" :
                        liveStatus === "available" ? "bg-[#e5eedc] text-[#285430] border border-[#c0d6b0]" :
                        liveStatus === "dirty" ? "bg-[#ffdad6] text-[#93000a]" :
                        liveStatus === "cleaning" ? "bg-[#fed65b]/30 text-[#745c00]" :
                        "bg-[#ffdad6] text-[#93000a]"
                      )}>
                        {liveStatus}
                      </span>
                    </div>
                    <div className="font-sans text-[10px] text-[#7f756f] mt-0.5">{rt?.name} • FL {room.floor}</div>
                  </td>

                  {/* Date Cells */}
                  {dates.map((date) => {
                    const b = roomBookings.find((bk) => bk.checkIn <= date && bk.checkOut > date);
                    const isStart = b ? (b.checkIn === date || date === dates[0]) : false;
                    const isEnd = b ? b.checkOut === addDays(new Date(date), 1).toISOString().slice(0, 10) : false;
                    const guest = b ? guestOf(b, db) : null;
                    const isVip = guest?.vip || b?.source === "Corporate";

                    return (
                      <td
                        key={date}
                        onClick={() => {
                          if (!b) {
                            nav({ to: "/reservations/new" as never });
                          }
                        }}
                        className={cn(
                          "relative h-14 border-r border-[#d1c4bd]/40 p-1 transition-colors",
                          !b && "hover:bg-[#e5eedc]/20 cursor-pointer"
                        )}
                        title={!b ? `Click to create booking for Room ${room.number} on ${date}` : undefined}
                      >
                        {b ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(b);
                            }}
                            className={cn(
                              "w-full h-full rounded-[0.25rem] p-1.5 text-left transition-transform hover:scale-[0.98] cursor-pointer flex flex-col justify-center border shadow-2xs",
                              b.status === "checked-in"
                                ? "bg-[#170f0a] !text-[#ffffff] border-[#170f0a]"
                                : isVip
                                ? "bg-[#fed65b] text-[#745c00] border-[#e9c349]"
                                : "bg-[#e4e2dd] border-[#d1c4bd] text-[#170f0a]"
                            )}
                          >
                            <span className={cn(
                              "font-bold text-xs truncate block leading-tight",
                              b.status === "checked-in" ? "!text-[#ffffff]" : isVip ? "text-[#745c00]" : "text-[#170f0a]"
                            )}>
                              {isVip && "⭐ "}{guest?.name || "Guest"}
                            </span>
                            <span className={cn(
                              "text-[10px] block truncate font-data-tabular opacity-90 mt-0.5",
                              b.status === "checked-in" ? "!text-[#fed65b]" : "text-[#4e4540]"
                            )}>
                              {b.status === "checked-in" ? "In-House" : "Confirmed"} · {fmtDay(b.checkIn)} → {fmtDay(b.checkOut)}
                            </span>
                          </button>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 text-[10px] text-[#285430] font-label-caps font-bold">
                            + Book
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Booking & Folio Details Drawer */}
      {selected && (
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={`Booking ${selected.id}`}
          subtitle={`${selGuest?.name} · GRC: ${selected.grc}`}
        >
          <div className="space-y-6 font-sans">
            {/* Status & Guest Card */}
            <div className="border border-[#d1c4bd] bg-[#fbf9f4] p-4 rounded-[0.25rem] space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#d1c4bd]">
                <span className="font-label-caps text-[10px] text-[#7f756f]">GUEST INFORMATION</span>
                <Badge tone={selected.status === "confirmed" ? "info" : selected.status === "checked-in" ? "success" : "muted"}>
                  {selected.status.toUpperCase()}
                </Badge>
              </div>
              <div className="font-serif text-lg font-bold text-[#170f0a]">
                {selGuest?.salutation || "Mr."} {selGuest?.name} {selGuest?.vip && "⭐ VIP"}
              </div>
              <div className="space-y-1 text-xs text-[#4e4540]">
                <div className="flex justify-between"><span>Phone:</span><span className="font-bold text-[#170f0a]">{selGuest?.mobile || "—"}</span></div>
                <div className="flex justify-between"><span>Email:</span><span>{selGuest?.email || "—"}</span></div>
                <div className="flex justify-between"><span>City / Location:</span><span>{selGuest?.city || "Jaipur"}, {selGuest?.nationality || "Indian"}</span></div>
              </div>
            </div>

            {/* Stay Details */}
            <div className="border border-[#d1c4bd] bg-[#ffffff] p-4 rounded-[0.25rem] space-y-2 text-xs">
              <span className="font-label-caps text-[10px] text-[#7f756f] block pb-1 border-b border-[#d1c4bd]">
                RESERVATION SCHEDULE
              </span>
              <div className="flex justify-between">
                <span>Assigned Room(s):</span>
                <span className="font-bold text-[#170f0a]">
                  {selected.roomIds.map((rid) => db.rooms.find((r) => r.id === rid)?.number).join(", ")}
                </span>
              </div>
              <div className="flex justify-between"><span>Check-in Date:</span><span className="font-bold text-[#170f0a]">{fmtDate(selected.checkIn)}</span></div>
              <div className="flex justify-between"><span>Check-out Date:</span><span className="font-bold text-[#170f0a]">{fmtDate(selected.checkOut)}</span></div>
              <div className="flex justify-between"><span>Stay Duration:</span><span>{selected.nights} Nights</span></div>
              <div className="flex justify-between"><span>Guests:</span><span>{selected.adults} Adults, {selected.children} Children</span></div>
              <div className="flex justify-between"><span>Booking Source:</span><span className="font-medium text-[#170f0a]">{selected.source}</span></div>
            </div>

            {/* Live Folio Breakdown */}
            {selFolio && (
              <div className="border border-[#d1c4bd] bg-[#fbf9f4] p-4 rounded-[0.25rem] space-y-2 text-xs font-data-tabular">
                <span className="font-label-caps text-[10px] text-[#7f756f] block pb-1 border-b border-[#d1c4bd]">
                  FOLIO &amp; BILLING SUMMARY
                </span>
                <div className="flex justify-between text-[#4e4540]"><span>Room Rent Charges</span><span>{money(selFolio.room)}</span></div>
                <div className="flex justify-between text-[#4e4540]"><span>Restaurant &amp; Dining (POS)</span><span>{money(selFolio.pos)}</span></div>
                <div className="flex justify-between text-[#4e4540]"><span>Laundry &amp; Other Services</span><span>{money(selFolio.laundry)}</span></div>
                <div className="flex justify-between text-[#4e4540]"><span>GST &amp; Taxes</span><span>{money(selFolio.tax)}</span></div>
                <div className="flex justify-between pt-2 border-t border-[#d1c4bd] font-bold text-sm text-[#170f0a]">
                  <span>Total Billable</span>
                  <span>{money(selFolio.total)}</span>
                </div>
                <div className="flex justify-between text-[#285430] font-medium"><span>Advance / Total Paid</span><span>{money(selFolio.paid)}</span></div>
                <div className="flex justify-between pt-1 border-t border-[#d1c4bd] font-bold text-[#ba1a1a]">
                  <span>Balance Payable</span>
                  <span>{money(selFolio.balance)}</span>
                </div>
              </div>
            )}

            {/* Connected Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setSelected(null);
                  nav({ to: `/reservations/${selected.id}` as never });
                }}
                className="w-full bg-[#170f0a] !text-[#ffffff] py-3 rounded-[0.25rem] font-label-caps text-xs font-bold hover:bg-[#2d241e] transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                Open Guest Folio &amp; Settlement Page →
              </button>

              <div className="grid grid-cols-2 gap-2">
                {selected.status === "confirmed" && (
                  <Btn
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      handleCheckIn(selected.id);
                      setSelected(null);
                    }}
                  >
                    Check In Guest
                  </Btn>
                )}
                {selected.status === "checked-in" && (
                  <Btn
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleCheckOut(selected.id);
                      setSelected(null);
                    }}
                  >
                    Check Out Guest
                  </Btn>
                )}
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
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
