import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Badge, Btn, Card, DataTable, PageHeader, StatCard } from "@/components/kit";
import {
  ROOM_STATUS_META, dashboardMetrics, fmtDay, money, moneyShort, revenueSeries,
  sourceAnalytics, useDB,
} from "@/lib/store";
import type { RoomStatus } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAYRA Hotel ERP — Operations Dashboard" },
      { name: "description", content: "Live occupancy, ADR, RevPAR, revenue and operations overview for MAYRA Hotel." },
      { property: "og:title", content: "MAYRA Hotel ERP — Operations Dashboard" },
      { property: "og:description", content: "Hotel PMS, restaurant POS and ERP demo for MAYRA Hotel." },
    ],
  }),
  component: Dashboard,
});

const RANGES = [
  { label: "Today", days: 1 },
  { label: "Yesterday", days: 2 },
  { label: "7 Days", days: 7 },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
];

function Dashboard() {
  const db = useDB();
  const nav = useNavigate();
  const [range, setRange] = useState(7);
  const m = dashboardMetrics(db);
  const series = revenueSeries(db, Math.max(range, 2));
  const sources = sourceAnalytics(db);
  const go = (to: string) => nav({ to: to as never });

  const statusCounts = (Object.keys(ROOM_STATUS_META) as RoomStatus[]).map((s) => ({
    status: s,
    count: db.rooms.filter((r) => r.status === s).length,
    ...ROOM_STATUS_META[s],
  }));

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${greet}, ${db.settings.user}`}
        subtitle={`${db.settings.hotelName} · ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
        actions={
          <div className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1">
            {RANGES.map((r) => (
              <button
                key={r.label} onClick={() => setRange(r.days)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${range === r.days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Occupancy" value={`${m.occupancy.toFixed(1)}%`} sub={`${m.occupied} of ${m.totalRooms} rooms occupied`} trend={4.2} tone="primary" onClick={() => go("/rooms/status")} />
        <StatCard label="ADR" value={money(m.adr)} sub="Average daily rate" trend={2.1} tone="info" />
        <StatCard label="RevPAR" value={money(m.revpar)} sub="Revenue per available room" trend={3.4} tone="success" />
        <StatCard label="Total Revenue" value={moneyShort(m.totalRevenue)} sub="Rooms + F&B + Banquet" trend={5.8} tone="primary" />
        <StatCard label="Room Revenue" value={moneyShort(m.roomRevenue)} sub="Today" onClick={() => go("/reports/revenue")} />
        <StatCard label="F&B Revenue" value={moneyShort(m.fbRevenue)} sub="Restaurant + room service" onClick={() => go("/reports/pos")} />
        <StatCard label="Pending Payments" value={moneyShort(m.pendingAmount)} sub={`${m.pendingBills} open folio(s)`} tone="warning" onClick={() => go("/folios")} />
        <StatCard label="Available Rooms" value={m.available} sub="Ready to sell" tone="success" onClick={() => go("/rooms/grid")} />
      </div>

      <Card title="Live Operations" action={<Btn size="sm" onClick={() => go("/front-desk")}>Open Front Desk</Btn>}>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {[
            { label: "Today's Arrivals", value: m.arrivals, to: "/check-in", tone: "info" },
            { label: "Today's Departures", value: m.departures, to: "/check-out", tone: "warning" },
            { label: "In-House Guests", value: m.inHouse, to: "/front-desk", tone: "primary" },
            { label: "Available Rooms", value: m.available, to: "/rooms/grid", tone: "success" },
            { label: "Dirty Rooms", value: m.dirty, to: "/housekeeping", tone: "danger" },
            { label: "Cleaning Rooms", value: m.cleaning, to: "/housekeeping", tone: "warning" },
            { label: "Maintenance", value: m.maintenance, to: "/rooms/maintenance", tone: "muted" },
            { label: "Pending Bills", value: m.pendingBills, to: "/folios", tone: "danger" },
            { label: "Pending Payments", value: moneyShort(m.pendingAmount), to: "/finance/receivables", tone: "warning" },
            { label: "Reserved Rooms", value: m.reserved, to: "/reservations", tone: "info" },
          ].map((c) => (
            <button
              key={c.label} onClick={() => go(c.to)}
              className="rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary/60"
            >
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.label}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-semibold tabular-nums">{c.value}</span>
                <Badge tone={c.tone}>live</Badge>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Revenue Overview">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series.slice(-range || -7)}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDay} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis tickFormatter={(v: number) => moneyShort(v)} fontSize={11} stroke="var(--muted-foreground)" width={60} />
                <Tooltip formatter={(v: number) => money(v)} labelFormatter={fmtDay} />
                <Legend />
                <Area type="monotone" dataKey="room" name="Room" stroke="var(--primary)" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="fb" name="Restaurant" stroke="var(--info)" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="banquet" name="Banquet" stroke="var(--success)" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="laundry" name="Laundry" stroke="var(--warning)" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Room Status">
          <div className="grid grid-cols-2 gap-2">
            {statusCounts.map((s) => (
              <button
                key={s.status} onClick={() => go("/rooms/grid")}
                className="rounded-md border border-border p-2.5 text-left hover:bg-secondary"
              >
                <Badge tone={s.tone}>{s.label}</Badge>
                <div className="mt-1.5 text-lg font-semibold tabular-nums">{s.count}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusCounts.filter((s) => s.count)} dataKey="count" nameKey="label" innerRadius={38} outerRadius={62} paddingAngle={2}>
                  {statusCounts.filter((s) => s.count).map((s, i) => (
                    <Cell key={s.status} fill={["var(--success)", "var(--info)", "var(--primary)", "var(--danger)", "var(--warning)", "var(--info)", "var(--muted-foreground)", "var(--border)"][i % 8]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Booking Source Analytics" dense>
          <DataTable
            rows={sources}
            pageSize={9}
            rowKey={(r) => r.source}
            columns={[
              { key: "source", label: "Source" },
              { key: "bookings", label: "Bookings", align: "right" },
              { key: "nights", label: "Room Nights", align: "right" },
              { key: "revenue", label: "Revenue", align: "right", render: (r) => moneyShort(r.revenue) },
              { key: "cancelled", label: "Cancel", align: "right" },
              { key: "abv", label: "ABV", align: "right", render: (r) => money(r.abv) },
            ]}
          />
        </Card>
        <Card title="Revenue by Segment">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sources.slice(0, 7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="source" fontSize={10} stroke="var(--muted-foreground)" interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v: number) => moneyShort(v)} fontSize={11} stroke="var(--muted-foreground)" width={60} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="revenue" name="Revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
