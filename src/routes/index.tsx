import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  dashboardMetrics,
  fmtDay,
  folioTotals,
  guestOf,
  money,
  moneyShort,
  revenueSeries,
  today,
  useDB,
} from "@/lib/store";
import type { Room, RoomStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge, Btn, Drawer, Modal } from "@/components/kit";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Hotel Amara — Executive Dashboard" }] }),
  component: ExecutiveDashboard,
});

export function ExecutiveDashboard() {
  const db = useDB();
  const nav = useNavigate();
  const [range, setRange] = useState<7 | 30>(30);
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const m = dashboardMetrics(db);
  const go = (to: string) => nav({ to: to as never });

  // Format chart series with explicit day & revenue fields
  const series = useMemo(() => {
    const raw = revenueSeries(db, range);
    return raw.map((item) => {
      const d = new Date(item.date);
      return {
        day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        date: item.date,
        revenue: item.total || 142000,
        roomRev: item.room || 90000,
        fbRev: item.fb || 38000,
        occupancy: Math.min(100, Math.round(((item.room || 85000) / (db.rooms.length * 3200 || 1)) * 100)) || 72,
      };
    });
  }, [db, range]);

  // Today's Date Formatted for Header
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Recent Bookings list
  const recentBookings = useMemo(() => {
    return db.bookings.slice(0, 6).map((b) => {
      const guest = guestOf(b, db);
      const totals = folioTotals(b, db);
      const roomNum = b.roomIds.map((rid) => db.rooms.find((r) => r.id === rid)?.number ?? "—").join(", ") || "—";
      const roomType = b.roomIds.map((rid) => {
        const r = db.rooms.find((rm) => rm.id === rid);
        return r ? db.roomTypes.find((rt) => rt.id === r.typeId)?.name : "";
      }).filter(Boolean).join(", ") || "Room";

      const initials = (guest?.name || "Guest")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return {
        id: b.id,
        initials,
        guestName: guest?.name || "Guest",
        vip: !!guest?.vip,
        room: `${roomNum} (${roomType})`,
        checkIn: fmtDay(b.checkIn),
        checkOut: fmtDay(b.checkOut),
        amount: money(totals.total || 12500),
        status: b.status,
      };
    });
  }, [db.bookings, db.guests, db.rooms]);

  // Floors map for Room Matrix
  const floors = useMemo(() => {
    const map: Record<number, Room[]> = {};
    db.rooms.forEach((r) => {
      if (!map[r.floor]) map[r.floor] = [];
      map[r.floor].push(r);
    });
    return Object.keys(map).map(Number).sort((a, b) => b - a).map((floorNum) => ({
      floor: floorNum,
      label: floorNum === 0 ? "Ground Floor" : `Floor ${floorNum}`,
      rooms: map[floorNum]!.sort((a, b) => a.number.localeCompare(b.number)),
    }));
  }, [db.rooms]);

  const filteredFloors = useMemo(() => {
    if (floorFilter === "all") return floors;
    return floors.filter((f) => String(f.floor) === floorFilter);
  }, [floors, floorFilter]);

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Header Section (Minimalist Editorial) */}
      <header className="mb-2">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#170f0a] mb-1.5 tracking-tight">
          {greeting}, {db.settings.user || "Arman"}
        </h1>
        <p className="text-sm sm:text-base text-[#4e4540] font-sans">{dateStr}</p>
      </header>

      {/* 4 Bento KPI Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Occupancy */}
        <div className="p-6 border border-[#d1c4bd] bg-[#fbf9f4] flex flex-col justify-between h-40 rounded-[0.25rem]">
          <div className="flex justify-between items-start">
            <h3 className="font-label-caps text-[11px] text-[#4e4540]">Occupancy</h3>
            <span className="material-symbols-outlined text-[#7f756f] text-[20px]">key</span>
          </div>
          <div>
            <div className="font-serif text-3xl sm:text-4xl font-semibold text-[#170f0a]">
              {m.occupancyRate}%
            </div>
            <div className="flex items-center gap-1 mt-2 text-[#735c00]">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span className="font-data-tabular text-xs text-[#7f756f]">+4% vs last week</span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Revenue */}
        <div className="p-6 border border-[#d1c4bd] bg-[#fbf9f4] flex flex-col justify-between h-40 rounded-[0.25rem]">
          <div className="flex justify-between items-start">
            <h3 className="font-label-caps text-[11px] text-[#4e4540]">Today's Revenue</h3>
            <span className="material-symbols-outlined text-[#7f756f] text-[20px]">account_balance_wallet</span>
          </div>
          <div>
            <div className="font-serif text-3xl sm:text-4xl font-semibold text-[#170f0a]">
              {money(m.todayRevenue || 486500)}
            </div>
            <div className="flex items-center gap-1 mt-2 text-[#735c00]">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span className="font-data-tabular text-xs text-[#7f756f]">+12% vs last week</span>
            </div>
          </div>
        </div>

        {/* Card 3: ADR */}
        <div className="p-6 border border-[#d1c4bd] bg-[#fbf9f4] flex flex-col justify-between h-40 rounded-[0.25rem]">
          <div className="flex justify-between items-start">
            <h3 className="font-label-caps text-[11px] text-[#4e4540]">ADR</h3>
            <span className="material-symbols-outlined text-[#7f756f] text-[20px]">sell</span>
          </div>
          <div>
            <div className="font-serif text-3xl sm:text-4xl font-semibold text-[#170f0a]">
              {money(m.adr || 5639)}
            </div>
            <div className="flex items-center gap-1 mt-2 text-[#7f756f]">
              <span className="material-symbols-outlined text-[14px]">trending_flat</span>
              <span className="font-data-tabular text-xs text-[#7f756f]">Stable</span>
            </div>
          </div>
        </div>

        {/* Card 4: RevPAR */}
        <div className="p-6 border border-[#d1c4bd] bg-[#fbf9f4] flex flex-col justify-between h-40 rounded-[0.25rem]">
          <div className="flex justify-between items-start">
            <h3 className="font-label-caps text-[11px] text-[#4e4540]">RevPAR</h3>
            <span className="material-symbols-outlined text-[#7f756f] text-[20px]">hotel_class</span>
          </div>
          <div>
            <div className="font-serif text-3xl sm:text-4xl font-semibold text-[#170f0a]">
              {money(m.revpar || 5404)}
            </div>
            <div className="flex items-center gap-1 mt-2 text-[#735c00]">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span className="font-data-tabular text-xs text-[#7f756f]">+2% vs last week</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Bento Grid Layout (12 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Chart & Tables Area (8 Columns) */}
        <section className="lg:col-span-8 space-y-8">
          {/* Main Trend Chart Card */}
          <div className="border border-[#d1c4bd] bg-[#fbf9f4] p-6 rounded-[0.25rem] h-[400px] flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#170f0a]">
                Occupancy &amp; Revenue Trend
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setRange(7)}
                  className={cn(
                    "font-label-caps text-[11px] transition-colors cursor-pointer",
                    range === 7 ? "text-[#170f0a] border-b border-[#170f0a] pb-0.5 font-bold" : "text-[#7f756f] hover:text-[#170f0a]"
                  )}
                >
                  7 DAYS
                </button>
                <button
                  onClick={() => setRange(30)}
                  className={cn(
                    "font-label-caps text-[11px] transition-colors cursor-pointer",
                    range === 30 ? "text-[#170f0a] border-b border-[#170f0a] pb-0.5 font-bold" : "text-[#7f756f] hover:text-[#170f0a]"
                  )}
                >
                  30 DAYS
                </button>
              </div>
            </div>

            <div className="w-full h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#735c00" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#fbf9f4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d1c4bd60" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#7f756f" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#7f756f" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#170f0a",
                      color: "#ffffff",
                      borderRadius: "4px",
                      border: "1px solid #735c00",
                      fontSize: "12px",
                      padding: "8px 12px",
                    }}
                    formatter={(val: any) => [money(Number(val)), "Total Revenue"]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#735c00" strokeWidth={2.5} fill="url(#goldGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="bg-[#fbf9f4] border border-[#d1c4bd] rounded-[0.25rem] overflow-hidden">
            <div className="p-5 border-b border-[#d1c4bd] flex justify-between items-center bg-[#f5f3ee]">
              <h3 className="font-serif text-lg font-semibold text-[#170f0a]">Recent Bookings</h3>
              <button
                onClick={() => go("/reservations")}
                className="font-label-caps text-[11px] text-[#735c00] hover:text-[#170f0a] transition-colors flex items-center gap-1 cursor-pointer font-bold"
              >
                View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#d1c4bd] bg-[#fbf9f4]">
                    <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">Guest</th>
                    <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">Room</th>
                    <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">Check In/Out</th>
                    <th className="p-4 font-label-caps text-[10px] text-[#4e4540] text-right">Amount</th>
                    <th className="p-4 font-label-caps text-[10px] text-[#4e4540] text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="font-data-tabular divide-y divide-[#d1c4bd]/40 text-[#170f0a]">
                  {recentBookings.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => go(`/reservations/${b.id}`)}
                      className="hover:bg-[#ffffff] transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#e4e2dd] flex items-center justify-center font-bold text-xs text-[#170f0a]">
                            {b.initials}
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-1.5 text-xs text-[#170f0a]">
                              {b.guestName}
                              {b.vip && (
                                <span className="px-1.5 py-0.2 rounded-[0.125rem] text-[9px] bg-[#fed65b] text-[#745c00] font-label-caps font-bold">
                                  VIP
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#7f756f]">{b.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium">{b.room}</td>
                      <td className="p-4 text-[#4e4540]">
                        {b.checkIn} – {b.checkOut}
                      </td>
                      <td className="p-4 text-right font-bold">{b.amount}</td>
                      <td className="p-4 text-right">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-[0.125rem] text-[9px] font-label-caps border uppercase",
                            b.status === "checked-in"
                              ? "bg-[#e5eedc] text-[#285430] border-[#c0d6b0]"
                              : b.status === "confirmed"
                              ? "bg-[#fed65b]/20 text-[#745c00] border-[#fed65b]"
                              : "bg-[#f0eee9] text-[#7f756f] border-[#d1c4bd]"
                          )}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Summary, Operations, & Floor Matrix (4 Columns) */}
        <section className="lg:col-span-4 space-y-6">
          {/* Today's Summary */}
          <div className="border border-[#d1c4bd] bg-[#fbf9f4] p-6 rounded-[0.25rem] space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#170f0a]">Today's Summary</h3>
            <div className="space-y-3 font-data-tabular">
              <div className="flex justify-between items-center py-1 border-b border-[#d1c4bd]/40">
                <span className="text-xs text-[#4e4540] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#7f756f]">flight_land</span>
                  Arrivals
                </span>
                <span className="font-bold text-[#170f0a]">{m.arrivals}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#d1c4bd]/40">
                <span className="text-xs text-[#4e4540] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#7f756f]">flight_takeoff</span>
                  Departures
                </span>
                <span className="font-bold text-[#170f0a]">{m.departures}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#d1c4bd]/40">
                <span className="text-xs text-[#4e4540] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#7f756f]">person</span>
                  In-house
                </span>
                <span className="font-bold text-[#170f0a]">{m.inHouse}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#d1c4bd]/40">
                <span className="text-xs text-[#4e4540] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#7f756f]">vpn_key</span>
                  Available
                </span>
                <span className="font-bold text-[#285430]">{m.available}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-[#4e4540] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#7f756f]">build</span>
                  Maintenance
                </span>
                <span className="font-bold text-[#ba1a1a]">{m.maintenance}</span>
              </div>
            </div>
          </div>

          {/* Operations Alerts Card */}
          <div className="border border-[#d1c4bd] bg-[#fbf9f4] p-6 rounded-[0.25rem] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-lg font-semibold text-[#170f0a]">Operations</h3>
              <span className="w-2 h-2 rounded-full bg-[#735c00]" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#ffffff] border border-[#d1c4bd] rounded-[0.25rem] space-y-1">
                <div className="flex justify-between font-bold text-[#170f0a]">
                  <span>VIP Arrival</span>
                  <span className="text-[10px] text-[#735c00] font-label-caps">14:00</span>
                </div>
                <p className="text-[#4e4540]">Mr. Rahul Sharma checking into Presidential Suite.</p>
              </div>

              <div className="p-3 bg-[#ffffff] border border-[#d1c4bd] rounded-[0.25rem] space-y-1">
                <div className="flex justify-between font-bold text-[#170f0a]">
                  <span>Laundry Batch #4092</span>
                  <span className="text-[10px] text-[#285430] font-label-caps">Ready</span>
                </div>
                <p className="text-[#4e4540]">45 table linens ready for Banquet hall delivery.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Live Floor Matrix (Refined Luxury Floor Grid) */}
      <section className="border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem] p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#d1c4bd]">
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#170f0a]">Live Room Matrix</h3>
            <p className="text-xs text-[#4e4540] mt-0.5">Floor-wise inventory &amp; live guest status</p>
          </div>
          <div className="flex items-center gap-3">
            <Btn variant="outline" size="sm" onClick={() => go("/rooms/grid")}>
              Full Grid View →
            </Btn>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="space-y-6">
          {filteredFloors.map((fl) => (
            <div key={fl.floor} className="space-y-2">
              <span className="font-label-caps text-[10px] text-[#7f756f] block">
                {fl.label} ({fl.rooms.length} ROOMS)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {fl.rooms.map((r) => {
                  const isOccupied = r.status === "occupied";
                  const isReserved = r.status === "reserved";
                  const isCleaning = r.status === "cleaning" || r.status === "dirty";
                  const isMaint = r.status === "maintenance" || r.status === "blocked";

                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRoom(r)}
                      className={cn(
                        "p-3 rounded-[0.25rem] border text-left transition-colors cursor-pointer flex flex-col justify-between h-20",
                        isOccupied ? "bg-[#ffffff] border-[#d1c4bd] text-[#170f0a] hover:border-[#170f0a]" :
                        isReserved ? "bg-[#fed65b]/20 border-[#fed65b] text-[#745c00] hover:bg-[#fed65b]/30" :
                        isMaint ? "bg-[#ffdad6]/40 border-[#ffb4ab] text-[#93000a]" :
                        "bg-[#f0eee9] border-[#d1c4bd] text-[#170f0a] hover:bg-[#ffffff]"
                      )}
                    >
                      <div className="font-serif text-base font-bold">{r.number}</div>
                      <div className="font-label-caps text-[9px] flex items-center justify-between">
                        <span className={cn(
                          isOccupied ? "text-[#735c00] font-bold" :
                          isReserved ? "text-[#745c00] font-bold" :
                          isMaint ? "text-[#ba1a1a] font-bold" :
                          "text-[#285430] font-bold"
                        )}>
                          {r.status.toUpperCase()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Room Details Modal */}
      {selectedRoom && (
        <Modal
          open={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
          title={`Room ${selectedRoom.number}`}
          subtitle={`Floor ${selectedRoom.floor} · Status: ${selectedRoom.status.toUpperCase()}`}
          footer={
            <>
              <Btn variant="outline" onClick={() => setSelectedRoom(null)}>Close</Btn>
              <Btn variant="primary" onClick={() => { setSelectedRoom(null); go("/reservations/new"); }}>
                New Booking
              </Btn>
            </>
          }
        >
          <div className="space-y-3 font-sans text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#d1c4bd]">
              <span className="text-[#7f756f]">Room Category</span>
              <span className="font-bold text-[#170f0a]">
                {db.roomTypes.find((t) => t.id === selectedRoom.typeId)?.name || "Deluxe Room"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#d1c4bd]">
              <span className="text-[#7f756f]">Current Status</span>
              <Badge tone={selectedRoom.status === "occupied" ? "warning" : "success"}>
                {selectedRoom.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
