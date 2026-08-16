import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge, Btn, Card, DataTable, PageHeader, Select, StatCard } from "@/components/kit";
import { dashboardMetrics, fmtDate, money, today, useDB } from "@/lib/store";
import { Download } from "lucide-react";
import { exportCSV } from "@/components/kit";

export const Route = createFileRoute("/reports/occupancy")({
  head: () => ({ meta: [{ title: "Occupancy Report — MAYRA Hotel ERP" }] }),
  component: OccupancyReportPage,
});

function OccupancyReportPage() {
  const db = useDB();
  const m = dashboardMetrics(db);

  // Room type occupancy
  const rtOccupancy = db.roomTypes.map((rt) => {
    const total = db.rooms.filter((r) => r.typeId === rt.id).length;
    const occupied = db.bookings.filter((b) => b.roomTypeId === rt.id && b.status === "checked-in").length;
    const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { name: rt.name, total, occupied, pct };
  });

  // Fake 30-day occupancy trend
  const occ30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const iso = d.toISOString().slice(0, 10);
    const occ = db.bookings.filter((b) => b.checkIn <= iso && b.checkOut > iso && b.status !== "cancelled").length;
    return { date: `${d.getDate()}/${d.getMonth() + 1}`, occupancy: Math.min(100, Math.round((occ / Math.max(1, db.rooms.length)) * 100)) };
  });

  const roomStatus = ["available", "reserved", "occupied", "dirty", "cleaning", "maintenance", "blocked"].map((s) => ({
    status: s, count: db.rooms.filter((r) => r.status === s).length,
  }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Occupancy Report"
        subtitle="Room inventory and occupancy analytics"
        actions={<Btn size="sm" icon={Download} onClick={() => exportCSV("occupancy.csv", occ30)}>Export</Btn>}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Total Rooms" value={db.rooms.length} />
        <StatCard label="Occupied" value={m.inHouse} tone="primary" />
        <StatCard label="Available" value={m.available} tone="success" />
        <StatCard label="Occupancy %" value={`${m.occupancy}%`} tone="info" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="ADR" value={money(m.adr)} tone="primary" />
        <StatCard label="RevPAR" value={money(m.revpar)} tone="success" />
      </div>

      <Card title="30-Day Occupancy Trend">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={occ30} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Line type="monotone" dataKey="occupancy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Occupancy %" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Occupancy by Room Type">
          <div className="space-y-3">
            {rtOccupancy.map((rt) => (
              <div key={rt.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{rt.name}</span>
                  <span className="text-muted-foreground">{rt.occupied}/{rt.total} ({rt.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${rt.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Room Status Breakdown">
          <div className="space-y-2">
            {roomStatus.map((s) => (
              <div key={s.status} className="flex items-center justify-between py-1 border-b border-border/60 last:border-0">
                <span className="text-sm capitalize">{s.status}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${(s.count / db.rooms.length) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-6 text-right">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
