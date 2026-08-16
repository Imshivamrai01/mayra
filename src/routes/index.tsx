import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ArrowRight, Banknote, Building2, CreditCard, QrCode, Smartphone, TrendingUp, Wallet,
} from "lucide-react";
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
      { name: "description", content: "Live occupancy, ADR, RevPAR, revenue, payment modes and operations overview for MAYRA Hotel." },
      { property: "og:title", content: "MAYRA Hotel ERP — Operations Dashboard" },
      { property: "og:description", content: "Hotel PMS, restaurant POS and ERP system for MAYRA Hotel." },
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

  // Payment Breakdown by Mode (Cash, Card, UPI, Bank Transfer)
  const paymentStats = useMemo(() => {
    const list: {
      mode: "UPI" | "Card" | "Cash" | "Bank Transfer";
      label: string;
      sub: string;
      count: number;
      total: number;
      color: string;
      tone: "success" | "primary" | "warning" | "info";
      icon: typeof Smartphone;
    }[] = [
      { mode: "UPI", label: "UPI Payments", sub: "GPay / PhonePe / Paytm / QR", count: 0, total: 0, color: "#10b981", tone: "success", icon: Smartphone },
      { mode: "Card", label: "Card Payments", sub: "Credit / Debit POS Machines", count: 0, total: 0, color: "#3b82f6", tone: "primary", icon: CreditCard },
      { mode: "Cash", label: "Cash Collections", sub: "Front Desk & Restaurant Register", count: 0, total: 0, color: "#f59e0b", tone: "warning", icon: Banknote },
      { mode: "Bank Transfer", label: "Bank Transfer", sub: "NEFT / RTGS / Corporate Direct", count: 0, total: 0, color: "#8b5cf6", tone: "info", icon: Building2 },
    ];

    let grandTotal = 0;
    let totalPaymentsCount = 0;

    db.payments.forEach((p) => {
      if (p.kind === "payment") {
        grandTotal += p.amount;
        totalPaymentsCount += 1;
        const target = list.find((m) => m.mode === p.mode) || list[0]!;
        target.count += 1;
        target.total += p.amount;
      }
    });

    return { list, grandTotal, totalPaymentsCount };
  }, [db.payments]);

  const statusCounts = (Object.keys(ROOM_STATUS_META) as RoomStatus[]).map((s) => ({
    status: s,
    count: db.rooms.filter((r) => r.status === s).length,
    ...ROOM_STATUS_META[s],
  }));

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // Stream totals for active range
  const streamTotals = useMemo(() => {
    let room = 0;
    let fb = 0;
    let banquet = 0;
    let laundry = 0;
    series.slice(-range || -7).forEach((s) => {
      room += s.room;
      fb += s.fb;
      banquet += s.banquet;
      laundry += s.laundry;
    });
    return { room, fb, banquet, laundry, total: room + fb + banquet + laundry };
  }, [series, range]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${greet}, ${db.settings.user}`}
        subtitle={`${db.settings.hotelName} · ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Btn variant="primary" size="sm" className="shimmer-gold font-bold shadow-md" onClick={() => go("/reservations/new")}>+ New Booking</Btn>
            <Btn size="sm" onClick={() => go("/pos")}>Open POS</Btn>
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
          </div>
        }
      />

      {/* Main KPI Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Occupancy" value={`${m.occupancy.toFixed(1)}%`} sub={`${m.occupied} of ${m.totalRooms} rooms occupied`} trend={4.2} tone="primary" onClick={() => go("/rooms/grid")} />
        <StatCard label="ADR" value={money(m.adr)} sub="Average daily rate" trend={2.1} tone="info" onClick={() => go("/reports/occupancy")} />
        <StatCard label="RevPAR" value={money(m.revpar)} sub="Revenue per available room" trend={3.4} tone="success" onClick={() => go("/reports/occupancy")} />
        <StatCard label="Total Revenue" value={moneyShort(m.totalRevenue)} sub="Rooms + F&B + Banquet" trend={5.8} tone="primary" onClick={() => go("/reports/revenue")} />
        <StatCard label="Room Revenue" value={moneyShort(m.roomRevenue)} sub="Today" onClick={() => go("/reports/revenue")} />
        <StatCard label="F&B Revenue" value={moneyShort(m.fbRevenue)} sub="Restaurant + room service" onClick={() => go("/restaurant/orders")} />
        <StatCard label="Pending Payments" value={moneyShort(m.pendingAmount)} sub={`${m.pendingBills} open folio(s)`} tone="danger" onClick={() => go("/folios")} />
        <StatCard label="Available Rooms" value={m.available} sub="Ready to sell" tone="success" onClick={() => go("/ez-dashboard")} />
      </div>

      {/* Dedicated Section: Payment Modes & Collections Breakdown */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span>Payment Mode Collections & Receipts</span>
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
              Total Receipts: <span className="text-foreground font-bold">{money(paymentStats.grandTotal)}</span> ({paymentStats.totalPaymentsCount} payments)
            </span>
            <Btn size="sm" variant="outline" onClick={() => go("/restaurant/billing")}>
              Billing Desk <ArrowRight className="h-3 w-3 ml-1" />
            </Btn>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {paymentStats.list.map((pm) => {
            const Icon = pm.icon;
            const percentage = paymentStats.grandTotal > 0 ? (pm.total / paymentStats.grandTotal) * 100 : 0;
            return (
              <div
                key={pm.mode}
                className="card-surface p-4 rounded-xl border border-border/80 relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-secondary/80 border border-border/60">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{pm.label}</h4>
                      <p className="text-[10.5px] text-muted-foreground leading-tight">{pm.sub}</p>
                    </div>
                  </div>
                  <Badge tone={pm.tone}>{percentage.toFixed(0)}%</Badge>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold tracking-tight text-foreground">{money(pm.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{pm.count} Payments Recorded</span>
                    <span>Avg: {pm.count > 0 ? money(Math.round(pm.total / pm.count)) : "₹0"}</span>
                  </div>

                  {/* Visual Progress / Share Bar */}
                  <div className="w-full h-2 rounded-full bg-secondary overflow-hidden mt-2 border border-border/40">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(5, percentage)}%`,
                        backgroundColor: pm.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Live Operations Matrix */}
      <Card title="Live Operations Hub" action={<Btn size="sm" onClick={() => go("/front-desk")}>Open Front Desk</Btn>}>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {[
            { label: "Today's Arrivals", value: m.arrivals, to: "/check-in", tone: "info" },
            { label: "Today's Departures", value: m.departures, to: "/check-out", tone: "warning" },
            { label: "In-House Guests", value: m.inHouse, to: "/front-desk", tone: "primary" },
            { label: "Available Rooms", value: m.available, to: "/ez-dashboard", tone: "success" },
            { label: "Dirty Rooms", value: m.dirty, to: "/housekeeping", tone: "danger" },
            { label: "Cleaning Rooms", value: m.cleaning, to: "/housekeeping", tone: "warning" },
            { label: "Maintenance", value: m.maintenance, to: "/rooms/maintenance", tone: "muted" },
            { label: "Pending Bills", value: m.pendingBills, to: "/folios", tone: "danger" },
            { label: "Pending Payments", value: moneyShort(m.pendingAmount), to: "/folios", tone: "warning" },
            { label: "Reserved Rooms", value: m.reserved, to: "/reservations", tone: "info" },
          ].map((c) => (
            <button
              key={c.label} onClick={() => go(c.to)}
              className="rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary/60"
            >
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.label}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-bold tabular-nums">{c.value}</span>
                <Badge tone={c.tone}>live</Badge>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Charts Row: Fitted Height with Revenue Stream Breakdown Pills */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 flex flex-col justify-between" title="Revenue Streams Overview">
          <div>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series.slice(-range || -7)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={fmtDay} fontSize={11} stroke="var(--muted-foreground)" />
                  <YAxis tickFormatter={(v: number) => moneyShort(v)} fontSize={11} stroke="var(--muted-foreground)" width={55} />
                  <Tooltip formatter={(v: number) => money(v)} labelFormatter={fmtDay} />
                  <Legend />
                  <Area type="monotone" dataKey="room" name="Room" stroke="var(--primary)" fill="url(#g1)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="fb" name="Restaurant" stroke="var(--info)" fill="transparent" strokeWidth={2} />
                  <Area type="monotone" dataKey="banquet" name="Banquet" stroke="var(--success)" fill="transparent" strokeWidth={2} />
                  <Area type="monotone" dataKey="laundry" name="Laundry" stroke="var(--warning)" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Stream Badges Strip to eliminate all empty space */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-3 border-t border-border/60">
              <div className="bg-secondary/40 rounded-lg p-2 border border-border/50 text-center">
                <span className="text-[10.5px] uppercase font-semibold text-muted-foreground block">Room Revenue</span>
                <span className="text-sm font-bold text-primary">{moneyShort(streamTotals.room)}</span>
              </div>
              <div className="bg-secondary/40 rounded-lg p-2 border border-border/50 text-center">
                <span className="text-[10.5px] uppercase font-semibold text-muted-foreground block">Restaurant & F&B</span>
                <span className="text-sm font-bold text-info">{moneyShort(streamTotals.fb)}</span>
              </div>
              <div className="bg-secondary/40 rounded-lg p-2 border border-border/50 text-center">
                <span className="text-[10.5px] uppercase font-semibold text-muted-foreground block">Banquet & Events</span>
                <span className="text-sm font-bold text-success">{moneyShort(streamTotals.banquet)}</span>
              </div>
              <div className="bg-secondary/40 rounded-lg p-2 border border-border/50 text-center">
                <span className="text-[10.5px] uppercase font-semibold text-muted-foreground block">Laundry Services</span>
                <span className="text-sm font-bold text-warning">{moneyShort(streamTotals.laundry)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Room Status Matrix" className="flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-2">
            {statusCounts.map((s) => (
              <button
                key={s.status} onClick={() => go("/ez-dashboard")}
                className="rounded-md border border-border p-2.5 text-left hover:bg-secondary transition-colors"
              >
                <Badge tone={s.tone}>{s.label}</Badge>
                <div className="mt-1.5 text-lg font-bold tabular-nums">{s.count}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 h-44">
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

      {/* Analytics & Segments: Perfectly Fitted Table & Bar Chart */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Booking Source Analytics" dense>
          <DataTable
            dense
            rows={sources}
            pageSize={9}
            rowKey={(r) => r.source}
            columns={[
              { key: "source", label: "Source", render: (r) => <span className="font-semibold text-foreground">{r.source}</span> },
              { key: "bookings", label: "Bookings", align: "right" },
              { key: "nights", label: "Nights", align: "right" },
              { key: "revenue", label: "Revenue", align: "right", render: (r) => <span className="font-bold text-foreground">{moneyShort(r.revenue)}</span> },
              { key: "cancelled", label: "Cancel", align: "right", render: (r) => <span className={r.cancelled > 0 ? "text-danger font-semibold" : "text-muted-foreground"}>{r.cancelled}</span> },
              { key: "abv", label: "Avg Rate", align: "right", render: (r) => <span className="font-medium">{moneyShort(r.abv)}</span> },
            ]}
          />
        </Card>

        <Card title="Revenue by Channel Segment">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sources.slice(0, 7)} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="source" fontSize={10} stroke="var(--muted-foreground)" interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tickFormatter={(v: number) => moneyShort(v)} fontSize={11} stroke="var(--muted-foreground)" width={55} />
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
