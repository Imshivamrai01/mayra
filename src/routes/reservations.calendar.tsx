import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, Btn, Drawer, PageHeader, KV } from "@/components/kit";
import { fmtDate, guestOf, money, useDB, folioTotals, iso, addDays } from "@/lib/store";
import type { Booking } from "@/lib/types";

export const Route = createFileRoute("/reservations/calendar")({
  head: () => ({ meta: [{ title: "Reservation Calendar — MAYRA Hotel ERP" }] }),
  component: ReservationCalendar,
});

const STATUS_COLOR: Record<string, string> = {
  confirmed: "bg-info/20 border-info/60 text-info",
  "checked-in": "bg-success/20 border-success/60 text-success",
  "checked-out": "bg-muted/20 border-border text-muted-foreground",
  cancelled: "bg-danger/10 border-danger/40 text-danger",
  "no-show": "bg-warning/20 border-warning/60 text-warning",
};

function ReservationCalendar() {
  const db = useDB();
  const [baseDate, setBaseDate] = useState(() => new Date());
  const [selected, setSelected] = useState<Booking | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const DAYS = 14;
  const dates: string[] = [];
  for (let i = 0; i < DAYS; i++) dates.push(iso(addDays(baseDate, i)));

  const filteredRooms = db.rooms.filter((r) => typeFilter === "all" || r.typeId === typeFilter);

  function bookingsOnRoom(roomId: string) {
    return db.bookings.filter(
      (b) =>
        b.roomIds.includes(roomId) &&
        (statusFilter === "all" || b.status === statusFilter) &&
        b.checkIn < dates[dates.length - 1]! &&
        b.checkOut > dates[0]!,
    );
  }

  function cellClass(b: Booking, date: string) {
    if (date < b.checkIn || date >= b.checkOut) return "";
    return STATUS_COLOR[b.status] ?? "bg-primary/20 border-primary/60 text-primary";
  }

  function prevWeek() { setBaseDate((d) => addDays(d, -7)); }
  function nextWeek() { setBaseDate((d) => addDays(d, 7)); }

  const selGuest = selected ? guestOf(selected, db) : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reservation Calendar"
        subtitle="Visual room × date grid"
        actions={
          <div className="flex items-center gap-2">
            <select className="h-8 rounded-md border border-border px-2 text-xs" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              {db.roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select className="h-8 rounded-md border border-border px-2 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked-in">In-House</option>
              <option value="checked-out">Checked-out</option>
            </select>
            <Btn size="sm" icon={ChevronLeft} onClick={prevWeek} aria-label="Previous" />
            <span className="text-xs font-medium">{fmtDate(dates[0])} – {fmtDate(dates[dates.length - 1])}</span>
            <Btn size="sm" icon={ChevronRight} onClick={nextWeek} aria-label="Next" />
          </div>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full border-collapse text-xs" style={{ minWidth: `${DAYS * 72 + 100}px` }}>
          <thead>
            <tr className="border-b border-border bg-secondary/60">
              <th className="sticky left-0 z-10 bg-secondary/80 px-3 py-2.5 text-left font-semibold text-muted-foreground" style={{ minWidth: 100 }}>Room</th>
              {dates.map((d) => {
                const dt = new Date(d);
                const isToday = d === iso(new Date());
                return (
                  <th key={d} className={`px-1 py-2 text-center font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`} style={{ minWidth: 72 }}>
                    <div className="text-[11px]">{dt.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                    <div className={`text-base font-semibold tabular-nums ${isToday ? "text-primary" : ""}`}>{dt.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map((room) => {
              const rt = db.roomTypes.find((t) => t.id === room.typeId);
              const roomBookings = bookingsOnRoom(room.id);
              return (
                <tr key={room.id} className="border-b border-border/60 hover:bg-secondary/30">
                  <td className="sticky left-0 z-10 border-r border-border/60 bg-card px-3 py-2" style={{ minWidth: 100 }}>
                    <div className="font-semibold">{room.number}</div>
                    <div className="text-[10px] text-muted-foreground">{rt?.code}</div>
                  </td>
                  {dates.map((date) => {
                    const b = roomBookings.find((bk) => bk.checkIn <= date && bk.checkOut > date);
                    const isStart = b ? b.checkIn === date : false;
                    return (
                      <td key={date} className="relative h-10 border-r border-border/40 p-0">
                        {b ? (
                          <button
                            onClick={() => setSelected(b)}
                            className={`absolute inset-0.5 flex items-center overflow-hidden rounded px-1.5 border text-[10px] font-medium transition-opacity hover:opacity-80 ${cellClass(b, date)}`}
                          >
                            {isStart ? (
                              <span className="truncate">{guestOf(b, db)?.name?.split(" ")[0] ?? "Guest"}</span>
                            ) : null}
                          </button>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(STATUS_COLOR).map(([s, cls]) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-6 rounded border ${cls}`} />
            <span className="text-xs capitalize text-muted-foreground">{s}</span>
          </div>
        ))}
      </div>

      {selected && (
        <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected.id} subtitle={`${selGuest?.name} · ${fmtDate(selected.checkIn)} → ${fmtDate(selected.checkOut)}`}>
          <div className="space-y-3">
            <Badge tone={selected.status === "confirmed" ? "info" : selected.status === "checked-in" ? "success" : "muted"}>{selected.status}</Badge>
            <KV label="Guest" value={selGuest?.name ?? "—"} />
            <KV label="Mobile" value={selGuest?.mobile ?? "—"} />
            <KV label="Room(s)" value={selected.roomIds.map((rid) => db.rooms.find((r) => r.id === rid)?.number).join(", ")} />
            <KV label="Check-in" value={fmtDate(selected.checkIn)} />
            <KV label="Check-out" value={fmtDate(selected.checkOut)} />
            <KV label="Nights" value={selected.nights} />
            <KV label="Rate/Night" value={money(selected.rateNight)} />
            <KV label="Total" value={money(folioTotals(selected, db).total)} />
            <KV label="Balance" value={money(folioTotals(selected, db).balance)} />
            <KV label="Source" value={selected.source} />
          </div>
        </Drawer>
      )}
    </div>
  );
}
