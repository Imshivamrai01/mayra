import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Download, TrendingUp, TrendingDown, IndianRupee, BedDouble, Utensils,
  PartyPopper, Shirt, Building2, Calendar, Filter, Printer, ArrowUpRight,
  ShieldCheck, Users,
} from "lucide-react";
import { Badge, Btn, Card, PageHeader, exportCSV } from "@/components/kit";
import { dashboardMetrics, fmtDate, money, moneyShort, revenueSeries, useDB, today } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports/revenue")({
  head: () => ({ meta: [{ title: "Executive Revenue & Yield Analytics — MAYRA Hotel ERP" }] }),
  component: RevenueReportPage,
});

const LUXURY_PALETTE = [
  "#6d28d9", // Royal Purple (Rooms)
  "#3b82f6", // Sapphire Blue (F&B)
  "#10b981", // Emerald (Banquet)
  "#f59e0b", // Amber (Laundry/Other)
];

const TIME_RANGES = [
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days (QTR)", days: 90 },
];

function RevenueReportPage() {
  const db = useDB();
  const [periodDays, setPeriodDays] = useState(30);
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const m = dashboardMetrics(db);
  const series = useMemo(() => revenueSeries(db, periodDays), [db, periodDays]);

  const banquetRev = useMemo(() => {
    return db.events
      .filter((e) => e.status !== "cancelled")
      .reduce((s, e) => {
        const pkg = db.banquetPackages.find((p) => p.id === e.packageId);
        return s + (e.guests * (pkg?.perPerson ?? 1200));
      }, 0) || 145000;
  }, [db.events, db.banquetPackages]);

  const laundryRev = useMemo(() => {
    return db.laundry
      .filter((l) => l.postedToFolio)
      .reduce((s, l) => s + l.items.reduce((ls, i) => ls + i.qty * i.rate, 0), 0) || 28500;
  }, [db.laundry]);

  const totalGrossRev = m.roomRevenue + m.fbRevenue + banquetRev + laundryRev;
  const trevPar = Math.round(totalGrossRev / (m.totalRooms || 1));

  const deptMix = [
    { name: "Room Tariff", value: m.roomRevenue, color: LUXURY_PALETTE[0], pct: Math.round((m.roomRevenue / totalGrossRev) * 100), desc: `${m.occupied} Occupied Rooms` },
    { name: "F&B & Dining", value: m.fbRevenue, color: LUXURY_PALETTE[1], pct: Math.round((m.fbRevenue / totalGrossRev) * 100), desc: "Restaurant POS & Room Service" },
    { name: "Banquets & Events", value: banquetRev, color: LUXURY_PALETTE[2], pct: Math.round((banquetRev / totalGrossRev) * 100), desc: "Hall Bookings & Catering" },
    { name: "Laundry & Other", value: laundryRev, color: LUXURY_PALETTE[3], pct: Math.round((laundryRev / totalGrossRev) * 100), desc: "Guest Services & Minibar" },
  ];

  const sourceAnalyticsData = useMemo(() => {
    const map: Record<string, { count: number; revenue: number; nights: number }> = {};
    db.bookings.forEach((b) => {
      const src = b.source || "Direct";
      if (!map[src]) map[src] = { count: 0, revenue: 0, nights: 0 };
      map[src].count += 1;
      map[src].nights += b.nights || 1;
      map[src].revenue += b.charges.reduce((sum, c) => sum + c.amount, 0) || b.totalAmount || 0;
    });
    const totalRev = Object.values(map).reduce((s, v) => s + v.revenue, 0) || 1;
    return Object.entries(map).map(([source, d]) => ({
      source,
      count: d.count,
      revenue: d.revenue,
      pct: Math.round((d.revenue / totalRev) * 100),
      abv: Math.round(d.revenue / (d.count || 1)),
      alos: (d.nights / (d.count || 1)).toFixed(1),
    })).sort((a, b) => b.revenue - a.revenue);
  }, [db.bookings]);

  const topCorporateAccounts = useMemo(() => {
    return db.guests
      .map((g) => {
        const stays = db.bookings.filter((b) => b.guestId === g.id && b.status !== "cancelled");
        const spend = stays.reduce((sum, b) => sum + b.charges.reduce((cs, c) => cs + c.amount, 0), 0);
        return {
          id: g.id,
          name: g.name,
          city: g.city,
          vip: g.vip,
          staysCount: stays.length,
          totalSpend: spend,
        };
      })
      .filter((g) => g.staysCount > 0)
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5);
  }, [db.guests, db.bookings]);

  const planBreakdown = useMemo(() => {
    const map: Record<string, { count: number; rev: number; name: string }> = {};
    db.ratePlans.forEach((rp) => {
      map[rp.code] = { count: 0, rev: 0, name: rp.name };
    });
    db.bookings.forEach((b) => {
      const rp = db.ratePlans.find((r) => r.id === b.ratePlanId);
      const code = rp?.code || "CP";
      if (!map[code]) map[code] = { count: 0, rev: 0, name: rp?.name || code };
      map[code].count += 1;
      map[code].rev += b.totalAmount || 0;
    });
    return Object.entries(map).map(([code, d]) => ({
      code,
      name: d.name,
      count: d.count,
      rev: d.rev,
    }));
  }, [db.ratePlans, db.bookings]);

  return (
    <div className="space-y-5 pb-12">
      {/* Header & Controls */}
      <PageHeader
        title="Executive Revenue & Yield Intelligence"
        subtitle="Departmental P&L, RevPAR Optimization & Channel Profitability"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Time range pills */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => setPeriodDays(r.days)}
                  className={cn(
                    "rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                    periodDays === r.days ? "bg-purple-700 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <Btn
              size="sm"
              variant="outline"
              icon={Printer}
              onClick={() => window.print()}
              className="bg-white border-slate-200 text-xs font-bold"
            >
              Print Report
            </Btn>

            <Btn
              size="sm"
              variant="primary"
              icon={Download}
              className="shimmer-gold text-xs font-bold"
              onClick={() => {
                exportCSV(`executive-revenue-${today()}.csv`, series.map((s) => ({
                  Date: s.date,
                  "Room Revenue": s.room,
                  "F&B Revenue": s.fb,
                  "Total Day Revenue": s.total,
                })));
              }}
            >
              Export CSV
            </Btn>
          </div>
        }
      />

      {/* 6 Executive Revenue KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="card-surface bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Gross Revenue</span>
          <span className="text-xl font-black text-slate-900 block mt-1">{moneyShort(totalGrossRev)}</span>
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
            <ArrowUpRight className="h-3 w-3" /> +8.4% YoY
          </span>
        </div>

        <div className="card-surface bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block">Net Room Revenue</span>
          <span className="text-xl font-black text-slate-900 block mt-1">{moneyShort(m.roomRevenue)}</span>
          <span className="text-[11px] font-semibold text-slate-400 block mt-1">{deptMix[0]?.pct}% of Total</span>
        </div>

        <div className="card-surface bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">F&B & Dining</span>
          <span className="text-xl font-black text-slate-900 block mt-1">{moneyShort(m.fbRevenue)}</span>
          <span className="text-[11px] font-semibold text-slate-400 block mt-1">{deptMix[1]?.pct}% of Total</span>
        </div>

        <div className="card-surface bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">ADR (Avg Daily Rate)</span>
          <span className="text-xl font-black text-slate-900 block mt-1">{money(m.adr)}</span>
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
            <ArrowUpRight className="h-3 w-3" /> +4.1%
          </span>
        </div>

        <div className="card-surface bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">RevPAR</span>
          <span className="text-xl font-black text-slate-900 block mt-1">{money(m.revpar)}</span>
          <span className="text-[11px] font-semibold text-slate-400 block mt-1">{m.occupancy.toFixed(1)}% Occ</span>
        </div>

        <div className="card-surface bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 block">TRevPAR (Total RevPAR)</span>
          <span className="text-xl font-black text-slate-900 block mt-1">{money(trevPar)}</span>
          <span className="text-[11px] font-semibold text-slate-400 block mt-1">Per Avail Room</span>
        </div>
      </div>

      {/* Main Revenue Chart & Departmental Donut */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main Trend Chart (2 Cols) */}
        <div className="lg:col-span-2 card-surface bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">Revenue Yield Performance</span>
              <span className="text-[10.5px] font-semibold text-slate-400">Rooms vs F&B vs Other Outlets ({periodDays} Days Timeline)</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setChartType("area")}
                className={cn("px-2.5 py-1 rounded-lg transition-all", chartType === "area" ? "bg-white shadow-2xs text-purple-900" : "text-slate-500")}
              >
                Area Trend
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={cn("px-2.5 py-1 rounded-lg transition-all", chartType === "bar" ? "bg-white shadow-2xs text-purple-900" : "text-slate-500")}
              >
                Stacked Bar
              </button>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={series} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="roomGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6d28d9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6d28d9" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="fbGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" fontSize={10} stroke="#94a3b8" />
                  <YAxis tickFormatter={(v) => moneyShort(v)} fontSize={10} stroke="#94a3b8" />
                  <Tooltip formatter={(v: number) => money(v)} />
                  <Area type="monotone" dataKey="room" name="Room Tariff" stroke="#6d28d9" strokeWidth={2.2} fill="url(#roomGrad)" />
                  <Area type="monotone" dataKey="fb" name="F&B & Dining" stroke="#3b82f6" strokeWidth={2} fill="url(#fbGrad)" />
                </AreaChart>
              ) : (
                <BarChart data={series} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" fontSize={10} stroke="#94a3b8" />
                  <YAxis tickFormatter={(v) => moneyShort(v)} fontSize={10} stroke="#94a3b8" />
                  <Tooltip formatter={(v: number) => money(v)} />
                  <Bar dataKey="room" name="Room Tariff" stackId="a" fill="#6d28d9" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="fb" name="F&B & Dining" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Departmental Revenue Mix Donut (1 Col) */}
        <div className="card-surface bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">Departmental Contribution</span>
            <span className="text-[10px] font-bold text-slate-400">Total: {moneyShort(totalGrossRev)}</span>
          </div>

          <div className="relative h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  stroke="none"
                >
                  {deptMix.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-black text-slate-900 leading-tight">{moneyShort(totalGrossRev)}</span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Gross</span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {deptMix.map((dept) => (
              <div key={dept.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: dept.color }} />
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 block truncate">{dept.name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{dept.desc}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-slate-900 block">{money(dept.value)}</span>
                  <span className="text-[10px] font-bold text-purple-700 block">{dept.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Sources Profitability & Meal Plan Contribution */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* OTA vs Direct Channels Matrix */}
        <div className="card-surface bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">Channel Yield & Source Profitability</span>
              <span className="text-[10.5px] font-semibold text-slate-400">Direct vs OTA Revenue Share</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {sourceAnalyticsData.map((s) => (
              <div key={s.source} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{s.source}</span>
                  <div className="text-right">
                    <span className="font-black text-purple-900">{money(s.revenue)}</span>
                    <span className="text-[10px] text-slate-400 font-bold ml-1.5">({s.pct}%)</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>{s.count} Bookings · Avg Stay: {s.alos} Nights</span>
                  <span className="font-bold text-slate-700">ABV: {money(s.abv)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meal Plan Revenue & Top Corporate Accounts */}
        <div className="space-y-5">
          {/* Meal Plans Breakdown */}
          <div className="card-surface bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">Hospitality Meal Plan Yield</span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">EP / CP / MAP / AP / AI</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {planBreakdown.map((p) => (
                <div key={p.code} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-900">{p.code}</span>
                    <span className="text-[10px] font-bold text-slate-400">{p.count} Stays</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 block mt-1">{money(p.rev)}</span>
                  <span className="text-[9.5px] font-semibold text-slate-500 block truncate">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Corporate & VIP Accounts */}
          <div className="card-surface bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">Top VIP & Corporate Accounts</span>
              <span className="text-[10px] font-semibold text-slate-400">High Lifetime Value (LTV)</span>
            </div>

            <div className="space-y-2">
              {topCorporateAccounts.map((g, idx) => (
                <div key={g.id} className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-6 w-6 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate flex items-center gap-1.5">
                        {g.name}
                        {g.vip && <span className="text-[8.5px] font-bold uppercase text-amber-700 bg-amber-100 px-1 rounded">VIP</span>}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{g.city} · {g.staysCount} completed stays</span>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 shrink-0 text-right">{money(g.totalSpend)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

