import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { Badge, Btn, Card, PageHeader, Select, StatCard, Tabs, exportCSV } from "@/components/kit";
import { dashboardMetrics, money, revenueSeries, useDB } from "@/lib/store";

export const Route = createFileRoute("/reports/revenue")({
  head: () => ({ meta: [{ title: "Revenue Report — MAYRA Hotel ERP" }] }),
  component: RevenueReportPage,
});

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--info))", "hsl(var(--danger))"];

function RevenueReportPage() {
  const db = useDB();
  const [period, setPeriod] = useState("30");
  const m = dashboardMetrics(db);
  const series = revenueSeries(db, +period);

  const pieData = [
    { name: "Room Revenue", value: m.roomRevenue },
    { name: "Restaurant", value: m.fbRevenue },
    { name: "Laundry", value: db.laundry.filter((l) => l.postedToFolio).reduce((s, l) => s + l.items.reduce((ls, i) => ls + i.qty * i.rate, 0), 0) },
    { name: "Banquet", value: db.events.filter((e) => e.status !== "cancelled").reduce((s, e) => { const pkg = db.banquetPackages.find((p) => p.id === e.packageId); return s + (e.guests * (pkg?.perPerson ?? 0)); }, 0) },
  ].filter((d) => d.value > 0);

  const sourceBreakdown = [...new Set(db.bookings.map((b) => b.source))].map((src) => {
    const srcBookings = db.bookings.filter((b) => b.source === src && b.status !== "cancelled");
    return { source: src, count: srcBookings.length, revenue: srcBookings.reduce((s, b) => s + b.charges.reduce((cs, c) => cs + c.amount, 0), 0) };
  }).sort((a, b) => b.revenue - a.revenue);

  const topGuests = db.guests.map((g) => {
    const gBookings = db.bookings.filter((b) => b.guestId === g.id && b.status !== "cancelled");
    const revenue = gBookings.reduce((s, b) => s + b.charges.reduce((cs, c) => cs + c.amount, 0), 0);
    return { name: g.name, bookings: gBookings.length, revenue };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Revenue Report"
        subtitle="Financial performance analysis"
        actions={
          <>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              options={[{ value: "7", label: "Last 7 Days" }, { value: "30", label: "Last 30 Days" }, { value: "90", label: "Last 90 Days" }]}
              className="h-8 w-36 text-xs"
            />
            <Btn size="sm" icon={Download} onClick={() => exportCSV("revenue.csv", series)}>Export</Btn>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Total Revenue" value={money(m.totalRevenue)} tone="primary" icon={TrendingUp} />
        <StatCard label="Room Revenue" value={money(m.roomRevenue)} tone="success" />
        <StatCard label="F&B Revenue" value={money(m.fbRevenue)} tone="warning" />
        <StatCard label="Avg Daily Rate" value={money(m.adr)} tone="info" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Occupancy" value={`${m.occupancy}%`} tone="primary" />
        <StatCard label="RevPAR" value={money(m.revpar)} tone="success" />
        <StatCard label="Pending" value={money(m.pendingAmount)} tone="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Revenue Trend" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={series} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Bar dataKey="room" name="Room" fill={COLORS[0]} radius={[2, 2, 0, 0]} />
              <Bar dataKey="fb" name="F&B" fill={COLORS[1]} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Revenue Mix">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => money(v)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Booking Source Breakdown">
          <div className="space-y-2">
            {sourceBreakdown.slice(0, 8).map((s) => (
              <div key={s.source} className="flex items-center gap-3">
                <span className="w-32 truncate text-xs text-muted-foreground">{s.source}</span>
                <div className="flex-1 rounded-full bg-secondary h-2">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(s.revenue / (sourceBreakdown[0]?.revenue || 1)) * 100}%` }} />
                </div>
                <span className="w-20 text-right text-xs font-medium">{money(s.revenue)}</span>
                <span className="w-8 text-right text-xs text-muted-foreground">{s.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Top Guests by Revenue">
          <div className="space-y-2">
            {topGuests.map((g, i) => (
              <div key={g.name} className="flex items-center gap-3">
                <span className="w-5 text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                <span className="flex-1 truncate text-sm font-medium">{g.name}</span>
                <span className="text-xs text-muted-foreground">{g.bookings} stays</span>
                <span className="text-sm font-semibold">{money(g.revenue)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
