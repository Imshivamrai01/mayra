import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ArrowRight, Banknote, BarChart3, BedDouble, Building2, Calendar, CreditCard,
  DoorClosed, Hourglass, IndianRupee, Key, Luggage, Plus, QrCode, Smartphone,
  Sparkles, TrendingDown, TrendingUp, UserCheck, Users, Utensils, Wallet, Wrench,
} from "lucide-react";
import { Badge, Btn, Card, DataTable, PageHeader } from "@/components/kit";
import {
  ROOM_STATUS_META, dashboardMetrics, fmtDay, money, moneyShort, revenueSeries,
  sourceAnalytics, useDB,
} from "@/lib/store";
import type { RoomStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

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

function Sparkline({ color = "#8b5cf6" }: { color?: string }) {
  return (
    <svg className="w-full h-6 overflow-visible mt-2" viewBox="0 0 100 24" fill="none">
      <path
        d="M 0,16 Q 12,6 25,12 T 50,4 T 75,14 T 100,8"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function ProgressRing({ percent, color }: { percent: number; color: string }) {
  const radius = 22;
  const stroke = 3.5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="#f1f5f9"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-slate-800">{percent}%</span>
    </div>
  );
}

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
    <div className="space-y-6">
      {/* Top Greeting & Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            {greet}, <span className="text-purple-700">{db.settings.user}!</span> 👋
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            {db.settings.hotelName} • {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Btn
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => go("/reservations/new")}
            className="bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold shadow-sm rounded-xl px-4"
          >
            New Booking
          </Btn>
          <Btn
            size="md"
            variant="outline"
            icon={Utensils}
            onClick={() => go("/pos")}
            className="bg-white border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 shadow-2xs"
          >
            Open POS
          </Btn>

          {/* Date Filter Range Buttons */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setRange(r.days)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  range === r.days
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8 Primary KPI Stat Cards (2 Rows of 4 Columns matching reference screenshot) */}
      {/* ========================================================================= */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. OCCUPANCY */}
        <div
          onClick={() => go("/rooms/grid")}
          className="card-surface bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md hover:border-purple-200 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500 text-white shadow-xs">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Occupancy</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900">{m.occupancy.toFixed(1)}%</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center">▲ 4.2%</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-2">{m.occupied} of {m.totalRooms} rooms occupied</p>
          <Sparkline color="#8b5cf6" />
        </div>

        {/* 2. ADR */}
        <div
          onClick={() => go("/reports/occupancy")}
          className="card-surface bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500 text-white shadow-xs">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">ADR</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900">{money(m.adr)}</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center">▲ 2.1%</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-2">Average daily rate</p>
          <Sparkline color="#3b82f6" />
        </div>

        {/* 3. REVPAR */}
        <div
          onClick={() => go("/reports/occupancy")}
          className="card-surface bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-xs">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">RevPAR</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900">{money(m.revpar)}</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center">▲ 3.4%</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-2">Revenue per available room</p>
          <Sparkline color="#10b981" />
        </div>

        {/* 4. TOTAL REVENUE */}
        <div
          onClick={() => go("/reports/revenue")}
          className="card-surface bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md hover:border-amber-200 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Revenue</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900">{moneyShort(m.totalRevenue)}</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center">▲ 5.8%</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-2">Rooms + F&B + Banquet</p>
          <Sparkline color="#f59e0b" />
        </div>

        {/* 5. ROOM REVENUE */}
        <div
          onClick={() => go("/reports/revenue")}
          className="card-surface bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md hover:border-sky-200 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500 text-white shadow-xs">
                <BedDouble className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Room Revenue</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900">{moneyShort(m.roomRevenue)}</span>
                </div>
              </div>
            </div>
            <div className="text-3xl text-sky-200/50">🛏️</div>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-3">Today</p>
        </div>

        {/* 6. F&B REVENUE */}
        <div
          onClick={() => go("/restaurant/orders")}
          className="card-surface bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md hover:border-pink-200 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-pink-500 text-white shadow-xs">
                <Utensils className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">F&B Revenue</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900">{moneyShort(m.fbRevenue)}</span>
                </div>
              </div>
            </div>
            <div className="text-3xl text-pink-200/50">🍽️</div>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-3">Restaurant + room service</p>
        </div>

        {/* 7. PENDING PAYMENTS */}
        <div
          onClick={() => go("/folios")}
          className="card-surface bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md hover:border-orange-200 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-xs">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Pending Payments</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900">{moneyShort(m.pendingAmount)}</span>
                </div>
              </div>
            </div>
            <div className="text-3xl text-orange-200/50">⏳</div>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-3">{m.pendingBills} open folio(s)</p>
        </div>

        {/* 8. AVAILABLE ROOMS */}
        <div
          onClick={() => go("/ez-dashboard")}
          className="card-surface bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-xs">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Available Rooms</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900">{m.available}</span>
                </div>
              </div>
            </div>
            <div className="text-3xl text-emerald-200/50">🔑</div>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-3">Ready to sell</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Payment Mode Collections & Receipts (Exact Reference Replication) */}
      {/* ========================================================================= */}
      <div className="card-surface rounded-2xl bg-white border border-slate-100 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Payment Mode Collections & Receipts</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              Total Receipts: <span className="text-slate-900 font-extrabold">{money(paymentStats.grandTotal)}</span> ({paymentStats.totalPaymentsCount} payments)
            </span>
            <Btn
              size="sm"
              variant="outline"
              onClick={() => go("/restaurant/billing")}
              className="rounded-xl border-slate-200 text-purple-700 font-bold hover:bg-purple-50"
            >
              Billing Desk <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Btn>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {paymentStats.list.map((pm) => {
            const percentage = paymentStats.grandTotal > 0 ? Math.round((pm.total / paymentStats.grandTotal) * 100) : 0;
            return (
              <div
                key={pm.mode}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4.5 hover:bg-white hover:border-purple-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <ProgressRing percent={percentage} color={pm.color} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{pm.label}</h4>
                    <p className="text-[10.5px] font-medium text-slate-400 truncate">{pm.sub}</p>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">{money(pm.total)}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-2 border-t border-slate-200/60">
                  <span>{pm.count} Payments Recorded</span>
                  <span className="text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200/60">
                    Avg: {pm.count > 0 ? money(Math.round(pm.total / pm.count)) : "₹0"}
                  </span>
                </div>
                <Sparkline color={pm.color} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Live Operations Hub (Exact Reference Replication) */}
      {/* ========================================================================= */}
      <div className="card-surface rounded-2xl bg-white border border-slate-100 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Live Operations Hub</h3>
              <p className="text-[11.5px] font-medium text-slate-400">Real-time overview of today's hotel operations</p>
            </div>
          </div>
          
          <Btn
            size="md"
            variant="primary"
            onClick={() => go("/front-desk")}
            className="rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs"
          >
            Open Front Desk <ArrowRight className="h-4 w-4 ml-1" />
          </Btn>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Arrivals Today */}
          <div
            onClick={() => go("/check-in")}
            className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Arrivals Today</span>
              <span className="text-2xl font-extrabold text-slate-900 block mt-0.5">{m.arrivals}</span>
              <span className="text-[11px] font-bold text-emerald-600 mt-1 block">▲ +3 from yesterday</span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
              <Luggage className="h-6 w-6" />
            </div>
          </div>

          {/* Departures Today */}
          <div
            onClick={() => go("/check-out")}
            className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-amber-200 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Departures Today</span>
              <span className="text-2xl font-extrabold text-slate-900 block mt-0.5">{m.departures}</span>
              <span className="text-[11px] font-bold text-amber-600 mt-1 block">▼ -2 from yesterday</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>

          {/* In-House Guests */}
          <div
            onClick={() => go("/front-desk")}
            className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">In-House Guests</span>
              <span className="text-2xl font-extrabold text-slate-900 block mt-0.5">{m.inHouse}</span>
              <span className="text-[11px] font-semibold text-slate-400 mt-1 block">Currently staying</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <Users className="h-6 w-6" />
            </div>
          </div>

          {/* Housekeeping Status */}
          <div
            onClick={() => go("/housekeeping")}
            className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-purple-200 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Housekeeping Status</span>
              <span className="text-2xl font-extrabold text-slate-900 block mt-0.5">{m.totalRooms - m.dirty}/{m.totalRooms}</span>
              <span className="text-[11px] font-semibold text-slate-400 mt-1 block">Rooms cleaned</span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>

          {/* Out of Order */}
          <div
            onClick={() => go("/rooms/maintenance")}
            className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-rose-200 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Out of Order</span>
              <span className="text-2xl font-extrabold text-slate-900 block mt-0.5">{m.maintenance}</span>
              <span className="text-[11px] font-semibold text-slate-400 mt-1 block">Maintenance</span>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
              <Wrench className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Charts & Analytics Row */}
      {/* ========================================================================= */}
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2 card-surface rounded-2xl bg-white border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Revenue Streams Overview</h3>
              <Badge tone="primary">Live Streams</Badge>
            </div>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series.slice(-range || -7)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={fmtDay} fontSize={11} stroke="#94a3b8" />
                  <YAxis tickFormatter={(v: number) => moneyShort(v)} fontSize={11} stroke="#94a3b8" width={55} />
                  <Tooltip formatter={(v: number) => money(v)} labelFormatter={fmtDay} />
                  <Legend />
                  <Area type="monotone" dataKey="room" name="Room" stroke="#7c3aed" fill="url(#g1)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="fb" name="Restaurant" stroke="#3b82f6" fill="transparent" strokeWidth={2} />
                  <Area type="monotone" dataKey="banquet" name="Banquet" stroke="#10b981" fill="transparent" strokeWidth={2} />
                  <Area type="monotone" dataKey="laundry" name="Laundry" stroke="#f59e0b" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Stream Badges Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-3 border-t border-slate-100">
              <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-center">
                <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Room Revenue</span>
                <span className="text-sm font-extrabold text-purple-700">{moneyShort(streamTotals.room)}</span>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-center">
                <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Restaurant & F&B</span>
                <span className="text-sm font-extrabold text-blue-600">{moneyShort(streamTotals.fb)}</span>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-center">
                <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Banquet & Events</span>
                <span className="text-sm font-extrabold text-emerald-600">{moneyShort(streamTotals.banquet)}</span>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-center">
                <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Laundry Services</span>
                <span className="text-sm font-extrabold text-amber-600">{moneyShort(streamTotals.laundry)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-surface rounded-2xl bg-white border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Room Status Matrix</h3>
              <Badge tone="info">Live Floor</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {statusCounts.map((s) => (
                <button
                  key={s.status} onClick={() => go("/ez-dashboard")}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-left hover:bg-purple-50/40 hover:border-purple-200 transition-colors"
                >
                  <Badge tone={s.tone}>{s.label}</Badge>
                  <div className="mt-1.5 text-lg font-extrabold text-slate-900 tabular-nums">{s.count}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusCounts.filter((s) => s.count)} dataKey="count" nameKey="label" innerRadius={38} outerRadius={62} paddingAngle={2}>
                  {statusCounts.filter((s) => s.count).map((s, i) => (
                    <Cell key={s.status} fill={["#10b981", "#3b82f6", "#7c3aed", "#ef4444", "#f59e0b", "#06b6d4", "#94a3b8", "#cbd5e1"][i % 8]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analytics & Segments: Perfectly Fitted Table & Bar Chart */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Booking Source Analytics" dense>
          <DataTable
            dense
            rows={sources}
            pageSize={9}
            rowKey={(r) => r.source}
            columns={[
              { key: "source", label: "Source", render: (r) => <span className="font-bold text-slate-900">{r.source}</span> },
              { key: "bookings", label: "Bookings", align: "right" },
              { key: "nights", label: "Nights", align: "right" },
              { key: "revenue", label: "Revenue", align: "right", render: (r) => <span className="font-extrabold text-slate-900">{moneyShort(r.revenue)}</span> },
              { key: "cancelled", label: "Cancel", align: "right", render: (r) => <span className={r.cancelled > 0 ? "text-rose-600 font-bold" : "text-slate-400"}>{r.cancelled}</span> },
              { key: "abv", label: "Avg Rate", align: "right", render: (r) => <span className="font-semibold text-slate-700">{moneyShort(r.abv)}</span> },
            ]}
          />
        </Card>

        <Card title="Revenue by Channel Segment">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sources.slice(0, 7)} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="source" fontSize={10} stroke="#94a3b8" interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tickFormatter={(v: number) => moneyShort(v)} fontSize={11} stroke="#94a3b8" width={55} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="revenue" name="Revenue" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
