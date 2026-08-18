import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge, Btn } from "@/components/kit";
import { bookingService, dashboardMetrics, fmtDate, fmtDay, fmtTime, folioTotals, guestOf, money, today, useDB } from "@/lib/store";
import type { Booking } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/front-desk")({
  head: () => ({ meta: [{ title: "Hotel Amara — Front Office Operations" }] }),
  component: FrontDesk,
});

export function FrontDesk() {
  const db = useDB();
  const nav = useNavigate();
  const [filterType, setFilterType] = useState<"all" | "arrivals" | "departures">("all");
  const [logNotes, setLogNotes] = useState<{ category: string; time: string; text: string; tone?: string }[]>([
    { category: "CONCIERGE", time: "08:45 AM", text: "Guest in 402 (Vance) requested airport transfer for tomorrow at 6:00 AM. Arranged with premium car service." },
    { category: "MAINTENANCE", time: "07:30 AM", text: "AC in room 215 reported noisy. Work order #1042 created. Do not check in new guest until resolved.", tone: "danger" },
    { category: "FRONT DESK", time: "Yesterday", text: "VIP Mr. Sorel arriving early today (11 AM). Housekeeping notified to prioritize room turnover." },
  ]);
  const [newNote, setNewNote] = useState("");

  const m = dashboardMetrics(db);
  const d = today();

  const arrivalsCount = db.bookings.filter((b) => b.checkIn === d).length || 42;
  const departuresCount = db.bookings.filter((b) => b.checkOut === d).length || 28;
  const stayoversCount = db.bookings.filter((b) => b.status === "checked-in").length || 112;
  const walkinsCount = db.bookings.filter((b) => b.source === "Walk-in").length || 3;

  // Bookings list for table
  const bookingsList = useMemo(() => {
    return db.bookings.map((b) => {
      const g = guestOf(b, db);
      const rooms = b.roomIds.map((id) => db.rooms.find((r) => r.id === id)?.number ?? "---").join(", ");
      const roomType = b.roomIds.map((id) => {
        const rm = db.rooms.find((r) => r.id === id);
        return rm ? db.roomTypes.find((rt) => rt.id === rm.typeId)?.name : "";
      }).filter(Boolean).join(", ") || "Grand Suite";

      const isArrival = b.checkIn === d;
      const isDeparture = b.checkOut === d;

      return {
        id: b.id,
        booking: b,
        room: rooms || "---",
        guestName: g?.name || "Guest",
        vip: !!g?.vip,
        bookingId: `#BK-${b.id.slice(-4).toUpperCase()}`,
        etaEtd: isArrival ? "14:00 (Arr)" : isDeparture ? "11:00 (Dep)" : "12:00 (Stay)",
        guestsCount: b.adults || 2,
        roomType: roomType || "Deluxe King",
        status: b.status,
        isArrival,
        isDeparture,
      };
    }).filter((item) => {
      if (filterType === "arrivals") return item.isArrival;
      if (filterType === "departures") return item.isDeparture;
      return true;
    });
  }, [db.bookings, db.guests, db.rooms, filterType, d]);

  function addNote() {
    if (!newNote.trim()) return;
    setLogNotes((prev) => [
      { category: "FRONT DESK", time: "Just now", text: newNote.trim() },
      ...prev,
    ]);
    setNewNote("");
    toast.success("Note added to Logbook");
  }

  function handleCheckIn(bId: string) {
    bookingService.checkIn(bId);
    toast.success("Guest checked in successfully");
  }

  function handleCheckOut(bId: string) {
    bookingService.checkOut(bId);
    toast.success("Guest checked out successfully");
  }

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Header */}
      <div>
        <span className="font-label-caps text-[10px] text-[#735c00] tracking-widest block">
          TODAY'S OPERATIONS
        </span>
        <div className="flex flex-wrap items-end justify-between gap-4 mt-1">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#170f0a] tracking-tight">
            Front Office
          </h1>
          <p className="text-xs sm:text-sm text-[#4e4540]">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* 5 Operations KPI Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Arrivals Today */}
        <div
          onClick={() => setFilterType(filterType === "arrivals" ? "all" : "arrivals")}
          className={cn(
            "p-5 border bg-[#fbf9f4] rounded-[0.25rem] flex flex-col justify-between h-36 cursor-pointer transition-colors",
            filterType === "arrivals" ? "border-[#170f0a] bg-[#f0dfd6]" : "border-[#d1c4bd] hover:border-[#170f0a]"
          )}
        >
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-[10px] text-[#4e4540]">ARRIVALS TODAY</span>
            <span className="material-symbols-outlined text-[#7f756f] text-[20px]">flight_land</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-[#170f0a]">{arrivalsCount}</span>
              <span className="text-xs text-[#7f756f] font-data-tabular">/ 55 Expected</span>
            </div>
          </div>
        </div>

        {/* Departures Today */}
        <div
          onClick={() => setFilterType(filterType === "departures" ? "all" : "departures")}
          className={cn(
            "p-5 border bg-[#fbf9f4] rounded-[0.25rem] flex flex-col justify-between h-36 cursor-pointer transition-colors",
            filterType === "departures" ? "border-[#170f0a] bg-[#f0dfd6]" : "border-[#d1c4bd] hover:border-[#170f0a]"
          )}
        >
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-[10px] text-[#4e4540]">DEPARTURES TODAY</span>
            <span className="material-symbols-outlined text-[#7f756f] text-[20px]">flight_takeoff</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-[#170f0a]">{departuresCount}</span>
              <span className="text-xs text-[#7f756f] font-data-tabular">/ 30 Expected</span>
            </div>
          </div>
        </div>

        {/* Stayovers */}
        <div className="p-5 border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem] flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-[10px] text-[#4e4540]">STAYOVERS</span>
            <span className="material-symbols-outlined text-[#7f756f] text-[20px]">bed</span>
          </div>
          <div>
            <span className="font-serif text-3xl font-bold text-[#170f0a]">{stayoversCount}</span>
          </div>
        </div>

        {/* Walk-Ins */}
        <div className="p-5 border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem] flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-[10px] text-[#4e4540]">WALK-INS</span>
            <span className="material-symbols-outlined text-[#7f756f] text-[20px]">directions_walk</span>
          </div>
          <div>
            <span className="font-serif text-3xl font-bold text-[#170f0a]">{walkinsCount}</span>
          </div>
        </div>

        {/* Occupancy (Espresso Block) */}
        <div className="p-5 bg-[#170f0a] text-[#ffffff] rounded-[0.25rem] flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-[10px] text-[#d3c3ba]">OCCUPANCY</span>
            <span className="material-symbols-outlined text-[#fed65b] text-[20px]">pie_chart</span>
          </div>
          <div>
            <span className="font-serif text-3xl font-bold text-[#ffffff]">{m.occupancyPct}%</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Arrivals/Departures Table (8 cols) & Logbook (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Table Column (8 Cols) */}
        <section className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#d1c4bd]">
            <h3 className="font-serif text-xl font-semibold text-[#170f0a]">
              Arrivals &amp; Departures
            </h3>
            <div className="flex gap-2">
              <Btn
                size="sm"
                variant={filterType === "all" ? "primary" : "outline"}
                onClick={() => setFilterType("all")}
              >
                All
              </Btn>
              <Btn
                size="sm"
                variant={filterType === "arrivals" ? "primary" : "outline"}
                onClick={() => setFilterType("arrivals")}
              >
                Arrivals
              </Btn>
              <Btn
                size="sm"
                variant={filterType === "departures" ? "primary" : "outline"}
                onClick={() => setFilterType("departures")}
              >
                Departures
              </Btn>
            </div>
          </div>

          <div className="bg-[#fbf9f4] border border-[#d1c4bd] rounded-[0.25rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d1c4bd] bg-[#f5f3ee]">
                    <th className="p-3.5 font-label-caps text-[10px] text-[#4e4540]">ROOM</th>
                    <th className="p-3.5 font-label-caps text-[10px] text-[#4e4540]">GUEST</th>
                    <th className="p-3.5 font-label-caps text-[10px] text-[#4e4540]">BOOKING ID</th>
                    <th className="p-3.5 font-label-caps text-[10px] text-[#4e4540]">ETA/ETD</th>
                    <th className="p-3.5 font-label-caps text-[10px] text-[#4e4540]">GUESTS</th>
                    <th className="p-3.5 font-label-caps text-[10px] text-[#4e4540]">TYPE</th>
                    <th className="p-3.5 font-label-caps text-[10px] text-[#4e4540]">STATUS</th>
                    <th className="p-3.5 font-label-caps text-[10px] text-[#4e4540] text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="font-data-tabular text-xs text-[#170f0a] divide-y divide-[#d1c4bd]/40">
                  {bookingsList.map((row) => (
                    <tr key={row.id} className="hover:bg-[#ffffff] transition-colors">
                      <td className="p-3.5 font-serif font-bold text-sm">{row.room}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{row.guestName}</span>
                          {row.vip && (
                            <span className="bg-[#fed65b] text-[#745c00] text-[9px] font-bold px-1 py-0.2 rounded-[0.125rem]">
                              VIP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-[#7f756f]">{row.bookingId}</td>
                      <td className="p-3.5">{row.etaEtd}</td>
                      <td className="p-3.5">{row.guestsCount}</td>
                      <td className="p-3.5 text-[#4e4540]">{row.roomType}</td>
                      <td className="p-3.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded-[0.125rem] border text-[9px] font-label-caps uppercase",
                          row.status === "confirmed" ? "bg-[#f5f3ee] text-[#170f0a] border-[#d1c4bd]" :
                          row.status === "checked-in" ? "bg-[#e5eedc] text-[#285430] border-[#c0d6b0]" :
                          row.status === "checked-out" ? "bg-[#e2e8ec] text-[#2c4251] border-[#c5d1d9]" :
                          "bg-[#ffdad6] text-[#93000a] border-[#ffb4ab]"
                        )}>
                          {row.status.replace("-", " ")}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {row.status === "confirmed" ? (
                          <Btn size="sm" variant="primary" onClick={() => handleCheckIn(row.id)}>
                            Check In
                          </Btn>
                        ) : row.status === "checked-in" ? (
                          <Btn size="sm" variant="outline" onClick={() => handleCheckOut(row.id)}>
                            Check Out
                          </Btn>
                        ) : (
                          <Btn size="sm" variant="ghost" onClick={() => nav({ to: `/reservations/${row.id}` as never })}>
                            View
                          </Btn>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Logbook Sidebar (4 Cols) */}
        <section className="lg:col-span-4 space-y-4">
          <div className="bg-[#fbf9f4] border border-[#d1c4bd] p-6 rounded-[0.25rem] flex flex-col h-full">
            <div className="flex justify-between items-center pb-4 border-b border-[#d1c4bd] mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#170f0a]">menu_book</span>
                <h3 className="font-serif text-lg font-semibold text-[#170f0a]">Logbook</h3>
              </div>
              <button
                onClick={() => {
                  const txt = prompt("Enter quick log note:");
                  if (txt) {
                    setLogNotes((prev) => [{ category: "FRONT DESK", time: "Just now", text: txt }, ...prev]);
                    toast.success("Note added");
                  }
                }}
                className="text-[#7f756f] hover:text-[#170f0a] transition-colors p-1"
                aria-label="Add note"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[440px] pr-1">
              {logNotes.map((note, idx) => (
                <div key={idx} className="space-y-1 pb-3 border-b border-[#d1c4bd]/40 last:border-0">
                  <div className="flex justify-between items-center">
                    <span className={cn(
                      "font-label-caps text-[10px]",
                      note.tone === "danger" ? "text-[#ba1a1a]" : "text-[#735c00]"
                    )}>
                      {note.category}
                    </span>
                    <span className="font-data-tabular text-[10px] text-[#7f756f]">{note.time}</span>
                  </div>
                  <p className="text-xs text-[#170f0a] leading-relaxed font-sans">{note.text}</p>
                </div>
              ))}
            </div>

            {/* Quick Note Input Box */}
            <div className="mt-4 pt-4 border-t border-[#d1c4bd]">
              <div className="relative">
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                  placeholder="Add a quick note…"
                  className="w-full text-xs bg-[#ffffff] border border-[#d1c4bd] rounded-[0.25rem] px-3 py-2 pr-9 outline-none focus:border-[#170f0a]"
                />
                <button
                  onClick={addNote}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7f756f] hover:text-[#170f0a] transition-colors p-1"
                  aria-label="Send note"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
