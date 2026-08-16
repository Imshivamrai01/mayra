import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ArrowRight, Banknote, BarChart3, BedDouble, Bell, Boxes, Building2, Calendar,
  CheckCircle2, ChevronDown, ChevronRight, Clock, CreditCard, DoorClosed, FileText,
  Filter, Hourglass, IndianRupee, Key, Layers, LogIn, LogOut, Luggage, MoreHorizontal,
  PartyPopper, Phone, Plus, QrCode, RefreshCw, Search, ShieldCheck, Shirt, Smartphone,
  Sparkles, TrendingDown, TrendingUp, UserCheck, UserPlus, Users, Utensils,
  Wallet, Wrench,
} from "lucide-react";
import { Badge, Btn, Card, DataTable, Drawer, Modal, exportCSV } from "@/components/kit";
import {
  BOOKING_STATUS_META, ROOM_STATUS_META, dashboardMetrics, fmtDate, fmtDay, fmtTime,
  folioTotals, guestOf, money, moneyShort, revenueSeries, sourceAnalytics, today, useDB,
} from "@/lib/store";

import type { Booking, Room, RoomStatus } from "@/lib/types";
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

function Sparkline({ color = "#7c3aed" }: { color?: string }) {
  return (
    <svg className="w-full h-5 overflow-visible mt-2" viewBox="0 0 100 20" fill="none">
      <path
        d="M 0,14 Q 15,4 30,10 T 60,3 T 85,12 T 100,6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Dashboard() {
  const db = useDB();
  const nav = useNavigate();
  const [range, setRange] = useState(7);
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>("all");


  const m = dashboardMetrics(db);
  const series = revenueSeries(db, Math.max(range, 2));
  const sources = sourceAnalytics(db);
  const go = (to: string) => nav({ to: to as never });

  // Payment Breakdown by Mode
  const paymentStats = useMemo(() => {
    const list: {
      mode: "UPI" | "Card" | "Cash" | "Bank Transfer";
      label: string;
      sub: string;
      count: number;
      total: number;
      color: string;
      pct: number;
    }[] = [
      { mode: "UPI", label: "UPI Payments", sub: "GPay / PhonePe / QR", count: 0, total: 0, color: "#10b981", pct: 0 },
      { mode: "Card", label: "Card Payments", sub: "POS Terminals", count: 0, total: 0, color: "#6366f1", pct: 0 },
      { mode: "Cash", label: "Cash Collections", sub: "Front Desk Cash", count: 0, total: 0, color: "#d97706", pct: 0 },
      { mode: "Bank Transfer", label: "Bank Transfer", sub: "NEFT / RTGS / IMPS", count: 0, total: 0, color: "#7c3aed", pct: 0 },
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

    list.forEach((item) => {
      item.pct = grandTotal > 0 ? Math.round((item.total / grandTotal) * 100) : 0;
    });

    return { list, grandTotal, totalPaymentsCount };
  }, [db.payments]);

  // Status Counts
  const statusCounts = (Object.keys(ROOM_STATUS_META) as RoomStatus[]).map((s) => ({
    status: s,
    count: db.rooms.filter((r) => r.status === s).length,
    ...ROOM_STATUS_META[s],
  }));

  // Floors map for Room Matrix
  const floors = useMemo(() => {
    const map: Record<number, Room[]> = {};
    db.rooms.forEach((r) => {
      if (!map[r.floor]) map[r.floor] = [];
      map[r.floor].push(r);
    });
    // Sort descending by floor (Floor 4/5 at top down to Ground/1st Floor)
    return Object.keys(map).map(Number).sort((a, b) => b - a).map((floorNum) => ({
      floor: floorNum,
      label: floorNum === 0 ? "G Floor" : floorNum === 1 ? "1st Floor" : floorNum === 2 ? "2nd Floor" : floorNum === 3 ? "3rd Floor" : `${floorNum}th Floor`,
      rooms: map[floorNum]!.sort((a, b) => a.number.localeCompare(b.number)),
    }));
  }, [db.rooms]);

  // Today's Bookings list (first 8-10 with rich details)
  const todaysBookings = useMemo(() => {
    return db.bookings
      .slice(0, 10)
      .map((b) => {
        const guest = guestOf(b, db);
        const totals = folioTotals(b, db);
        const isPaid = totals.balance <= 0;
        const roomNum = b.roomIds.map((rid) => db.rooms.find((r) => r.id === rid)?.number ?? "—").join(", ") || "—";
        return {
          id: b.id,
          booking: b,
          guestName: guest?.name ?? "Guest",
          vip: !!guest?.vip,
          room: roomNum,
          arrival: fmtDay(b.checkIn),
          departure: fmtDay(b.checkOut),
          source: b.source,
          amount: totals.total,
          isPaid,
          status: b.status,
        };
      });
  }, [db.bookings, db.guests, db.rooms]);

  // Hourly / Stream Revenue Distribution Data (Bar Chart)
  const hourlyRevenueData = useMemo(() => {
    return [
      { time: "12 AM", today: 12000, yesterday: 8000 },
      { time: "03 AM", today: 18000, yesterday: 14000 },
      { time: "06 AM", today: 35000, yesterday: 22000 },
      { time: "09 AM", today: 85000, yesterday: 68000 },
      { time: "12 PM", today: 142000, yesterday: 115000 },
      { time: "03 PM", today: 128000, yesterday: 98000 },
      { time: "06 PM", today: 92000, yesterday: 75000 },
      { time: "09 PM", today: 45000, yesterday: 38000 },
    ];
  }, []);

  // Quick Action Buttons list
  const QUICK_ACTIONS = [
    { label: "New Booking", desc: "Room Reservation", icon: Calendar, to: "/reservations/new" },
    { label: "Express Check-In", desc: "Guest Arrival", icon: LogIn, to: "/check-in" },
    { label: "Express Check-Out", desc: "Departure & Billing", icon: LogOut, to: "/check-out" },
    { label: "New Guest", desc: "Guest Profile", icon: UserPlus, to: "/guests/new" },
    { label: "Room Matrix", desc: "Floor Status", icon: BedDouble, to: "/rooms/grid" },
    { label: "Guest Folios", desc: "Invoices & Ledger", icon: FileText, to: "/folios" },
    { label: "Point of Sale", desc: "Restaurant POS", icon: Utensils, to: "/pos" },
    { label: "Cashier Desk", desc: "Record Payment", icon: CreditCard, to: "/restaurant/billing" },
    { label: "Housekeeping", desc: "Cleaning Board", icon: Sparkles, to: "/housekeeping" },
    { label: "Maintenance", desc: "Work Tickets", icon: Wrench, to: "/rooms/maintenance" },
    { label: "Banquet Booking", desc: "Event & Halls", icon: PartyPopper, to: "/banquet/events" },
    { label: "Hotel Settings", desc: "System Config", icon: MoreHorizontal, to: "/settings/hotel" },
  ];


  // Activity Feed Items
  const activityFeed = [
    { time: "10:42 AM", text: "Room 204 checked in by Front Desk", dot: "bg-purple-600", to: "/front-desk" },
    { time: "10:38 AM", text: "₹18,500 payment received via UPI", dot: "bg-emerald-500", to: "/folios" },
    { time: "10:21 AM", text: "Room 311 marked housekeeping complete", dot: "bg-blue-500", to: "/housekeeping" },
    { time: "09:56 AM", text: "New banquet booking confirmed (120 pax)", dot: "bg-purple-600", to: "/banquet/events" },
    { time: "09:42 AM", text: "Guest requested late checkout (Room 101)", dot: "bg-amber-500", to: "/check-out" },
    { time: "09:21 AM", text: "Maintenance request raised for Room 207", dot: "bg-rose-500", to: "/rooms/maintenance" },
  ];

  const hour = new Date().getHours();
  const greet = hour < 12 ? "GOOD MORNING" : hour < 17 ? "GOOD AFTERNOON" : "GOOD EVENING";

  // Stream Revenue summary
  const streamRooms = m.roomRevenue || 259000;
  const streamFB = m.fbRevenue || 45700;
  const streamBanquet = m.banquetRevenue || 132000;
  const streamOther = m.laundryRevenue || 28500;

  // Room category occupancy breakdown
  const roomCategoryStats = useMemo(() => {
    return db.roomTypes.map((rt) => {
      const typeRooms = db.rooms.filter((r) => r.typeId === rt.id);
      const total = typeRooms.length;
      const occupied = typeRooms.filter((r) => r.status === "occupied").length;
      const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
      return {
        id: rt.id,
        name: rt.name,
        basePrice: rt.basePrice,
        total,
        occupied,
        pct,
      };
    });
  }, [db.roomTypes, db.rooms]);

  // Channel distribution stats
  const channelStats = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    db.bookings.forEach((b) => {
      const src = b.source || "Direct";
      if (!map[src]) map[src] = { count: 0, revenue: 0 };
      map[src].count += 1;
      map[src].revenue += b.totalAmount || 0;
    });
    const totalBookings = db.bookings.length || 1;
    return Object.entries(map).map(([source, data]) => ({
      source,
      count: data.count,
      revenue: data.revenue,
      pct: Math.round((data.count / totalBookings) * 100),
    })).sort((a, b) => b.count - a.count);
  }, [db.bookings]);

  return (
    <div className="space-y-5 font-sans pb-12">

      {/* ========================================================================= */}
      {/* 1. TOP GREETING & CONTROLS HERO */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            {greet}, {db.settings.user.toUpperCase()}! 👋
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Here's the live overview of {db.settings.hotelName} operations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Btn
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => go("/reservations/new")}
            className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold shadow-xs rounded-xl px-4 text-xs"
          >
            New Booking
          </Btn>
          <Btn
            size="md"
            variant="outline"
            icon={Utensils}
            onClick={() => go("/pos")}
            className="bg-white border-amber-200/80 text-amber-900 font-bold rounded-xl hover:bg-amber-50/50 shadow-2xs text-xs"
          >
            Open POS
          </Btn>

          {/* Date Filter Range Buttons */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white p-1 shadow-2xs">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setRange(r.days)}
                className={cn(
                  "rounded-lg px-2.5 sm:px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                  range === r.days
                    ? "bg-purple-700 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {r.label}
              </button>
            ))}
            <button className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="Filter Settings">
              <Filter className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 5 PRIMARY KPI STAT CARDS */}
      {/* ========================================================================= */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* 1. OCCUPANCY */}
        <div
          onClick={() => go("/rooms/grid")}
          className="card-surface bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
              <BedDouble className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Occupancy</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-slate-900">{m.occupancy.toFixed(1)}%</span>
                <span className="text-[11px] font-extrabold text-emerald-600 flex items-center">▲ 4.2%</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-2">{m.occupied} / {m.totalRooms} Rooms Occupied</p>
          <Sparkline color="#7c3aed" />
        </div>

        {/* 2. ADR */}
        <div
          onClick={() => go("/reports/occupancy")}
          className="card-surface bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">ADR</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-slate-900">{money(m.adr)}</span>
                <span className="text-[11px] font-extrabold text-emerald-600 flex items-center">▲ 2.1%</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-2">Average Daily Rate</p>
          <Sparkline color="#3b82f6" />
        </div>

        {/* 3. REVPAR */}
        <div
          onClick={() => go("/reports/occupancy")}
          className="card-surface bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">RevPAR</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-slate-900">{money(m.revpar)}</span>
                <span className="text-[11px] font-extrabold text-emerald-600 flex items-center">▲ 3.4%</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-2">Revenue Per Available Room</p>
          <Sparkline color="#10b981" />
        </div>

        {/* 4. TOTAL REVENUE */}
        <div
          onClick={() => go("/reports/revenue")}
          className="card-surface bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Revenue</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-slate-900">{moneyShort(m.totalRevenue)}</span>
                <span className="text-[11px] font-extrabold text-emerald-600 flex items-center">▲ 5.8%</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-2">Rooms + F&B + Banquet</p>
          <Sparkline color="#f59e0b" />
        </div>

        {/* 5. TODAY'S COLLECTION */}
        <div
          onClick={() => go("/folios")}
          className="card-surface bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Today's Collection</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-slate-900">{moneyShort(paymentStats.grandTotal)}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-2">{paymentStats.totalPaymentsCount} Payments</p>
          <Sparkline color="#6366f1" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. OPERATIONAL INTELLIGENCE / LIVE OPERATIONS STRIP */}
      {/* ========================================================================= */}
      <div className="card-surface rounded-2xl bg-white border border-slate-200/70 p-4 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">Live Operations</span>
          <span className="text-[11px] font-semibold text-slate-400">Real-time hotel status</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* Arrivals */}
          <div onClick={() => go("/check-in")} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 hover:bg-purple-50/50 transition-colors cursor-pointer text-center">
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/60 text-blue-600 mb-1">
              <Luggage className="h-4 w-4" />
            </div>
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 block">Arrivals</span>
            <span className="text-base font-black text-slate-900 block">{m.arrivals}</span>
            <span className="text-[10px] font-medium text-slate-400">Today</span>
          </div>

          {/* Departures */}
          <div onClick={() => go("/check-out")} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 hover:bg-purple-50/50 transition-colors cursor-pointer text-center">
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100/60 text-sky-600 mb-1">
              <Calendar className="h-4 w-4" />
            </div>
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 block">Departures</span>
            <span className="text-base font-black text-slate-900 block">{m.departures}</span>
            <span className="text-[10px] font-medium text-slate-400">Today</span>
          </div>

          {/* In-House Guests */}
          <div onClick={() => go("/front-desk")} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 hover:bg-purple-50/50 transition-colors cursor-pointer text-center">
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100/60 text-purple-600 mb-1">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 block">In-House Guests</span>
            <span className="text-base font-black text-slate-900 block">{m.inHouse}</span>
            <span className="text-[10px] font-medium text-slate-400">Currently</span>
          </div>

          {/* Rooms to Clean */}
          <div onClick={() => go("/housekeeping")} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 hover:bg-purple-50/50 transition-colors cursor-pointer text-center">
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100/60 text-amber-600 mb-1">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 block">Rooms to Clean</span>
            <span className="text-base font-black text-slate-900 block">{m.dirty}</span>
            <span className="text-[10px] font-medium text-slate-400">Pending</span>
          </div>

          {/* Rooms Ready */}
          <div onClick={() => go("/ez-dashboard")} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 hover:bg-purple-50/50 transition-colors cursor-pointer text-center">
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/60 text-emerald-600 mb-1">
              <Key className="h-4 w-4" />
            </div>
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 block">Rooms Ready</span>
            <span className="text-base font-black text-slate-900 block">{m.available}</span>
            <span className="text-[10px] font-medium text-slate-400">Available</span>
          </div>

          {/* Maintenance */}
          <div onClick={() => go("/rooms/maintenance")} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 hover:bg-purple-50/50 transition-colors cursor-pointer text-center">
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100/60 text-orange-600 mb-1">
              <Wrench className="h-4 w-4" />
            </div>
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 block">Maintenance</span>
            <span className="text-base font-black text-slate-900 block">{m.maintenance}</span>
            <span className="text-[10px] font-medium text-slate-400">In Progress</span>
          </div>

          {/* Late Checkouts */}
          <div onClick={() => go("/check-out")} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 hover:bg-purple-50/50 transition-colors cursor-pointer text-center">
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100/60 text-rose-600 mb-1">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 block">Late Checkouts</span>
            <span className="text-base font-black text-slate-900 block">{Math.min(m.departures, 4)}</span>
            <span className="text-[10px] font-medium text-slate-400">Today</span>
          </div>

          {/* VIP Arrivals */}
          <div onClick={() => go("/front-desk")} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 hover:bg-purple-50/50 transition-colors cursor-pointer text-center">
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100/60 text-pink-600 mb-1">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 block">VIP Arrivals</span>
            <span className="text-base font-black text-slate-900 block">2</span>
            <span className="text-[10px] font-medium text-slate-400">Today</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BALANCED 3-COLUMN ENTERPRISE DASHBOARD GRID */}
      {/* ========================================================================= */}
      <div className="grid gap-5 xl:grid-cols-12">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: ROOM STATUS MATRIX & TODAY'S BOOKINGS (Span 5 on XL) */}
        {/* ======================================================================= */}
        <div className="xl:col-span-5 space-y-5">
          {/* Room Status Matrix */}
          <div className="card-surface rounded-2xl bg-white border border-slate-200/70 p-4.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">Room Status (Floor Wise)</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="all">All Floors</option>
                  {floors.map((f) => (
                    <option key={f.floor} value={String(f.floor)}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Legend Pills */}
            <div className="flex flex-wrap items-center gap-3 pb-3 mb-3 text-[10.5px] font-bold text-slate-500 border-b border-slate-100/80">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-600" /> Occupied</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Vacant</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Reserved</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Cleaning</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Maintenance</span>
            </div>

            {/* Floor Matrix Grid */}
            <div className="space-y-2">
              {floors
                .filter((f) => floorFilter === "all" || String(f.floor) === floorFilter)
                .map((f) => (
                  <div key={f.floor} className="flex items-center gap-2">
                    <span className="w-16 text-[11px] font-bold text-slate-400 shrink-0">{f.label}</span>
                    <div className="flex-1 grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                      {f.rooms.slice(0, 8).map((r) => {
                        const isOccupied = r.status === "occupied";
                        const isCleaning = r.status === "cleaning" || r.status === "dirty";
                        const isMaint = r.status === "maintenance" || r.status === "blocked";
                        const isReserved = r.status === "reserved";

                        let cellCls = "bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100";
                        if (isOccupied) cellCls = "bg-purple-600 border-purple-700 text-white font-black shadow-2xs";
                        else if (isCleaning) cellCls = "bg-amber-100/80 border-amber-300 text-amber-900 font-bold";
                        else if (isMaint) cellCls = "bg-rose-100/80 border-rose-300 text-rose-900 font-bold";
                        else if (isReserved) cellCls = "bg-blue-100/80 border-blue-300 text-blue-900 font-bold";
                        else cellCls = "bg-white border-slate-200 text-slate-800 hover:border-purple-300";

                        return (
                          <button
                            key={r.id}
                            onClick={() => go(`/rooms/grid?q=${r.number}`)}
                            className={cn(
                              "h-7 rounded-lg border text-[11px] font-semibold flex items-center justify-center transition-all cursor-pointer",
                              cellCls,
                            )}
                            title={`Room ${r.number} — ${ROOM_STATUS_META[r.status].label}`}
                          >
                            {r.number}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] font-semibold text-slate-400">
              <span>Click on any room to view details</span>
              <span className="font-bold text-slate-600">Total Rooms: {m.totalRooms}</span>
            </div>
          </div>

          {/* Today's Bookings Table */}
          <div className="card-surface rounded-2xl bg-white border border-slate-200/70 p-4.5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">Today's Bookings</span>
              <span className="text-[11px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">
                {todaysBookings.length} Bookings
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-100 text-left">
                    <th className="pb-2">Guest</th>
                    <th className="pb-2">Room</th>
                    <th className="pb-2">Dates</th>
                    <th className="pb-2">Source</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {todaysBookings.slice(0, 5).map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => go(`/reservations/${b.id}`)}
                      className="hover:bg-purple-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] shrink-0">
                            {b.guestName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">{b.guestName}</span>
                            {b.vip && <span className="text-[9px] font-extrabold text-amber-600 uppercase">VIP</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 font-extrabold text-slate-800">{b.room}</td>
                      <td className="py-2.5 text-[11px] text-slate-500 whitespace-nowrap">{b.arrival}</td>
                      <td className="py-2.5 text-[11px] text-slate-600 whitespace-nowrap">{b.source}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{money(b.amount)}</td>
                      <td className="py-2.5 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold inline-block",
                          b.status === "checked-in" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                          b.status === "confirmed" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          "bg-slate-100 text-slate-600",
                        )}>
                          {BOOKING_STATUS_META[b.status as keyof typeof BOOKING_STATUS_META]?.label ?? b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Room Category Occupancy Breakdown */}
          <div className="card-surface rounded-2xl bg-white border border-slate-200/70 p-4.5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">Room Category Breakdown</span>
                <span className="text-[10.5px] font-semibold text-slate-400">Inventory & Occupancy Rates</span>
              </div>
              <button onClick={() => go("/rooms/grid")} className="text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer">
                Room Grid →
              </button>
            </div>

            <div className="space-y-3">
              {roomCategoryStats.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="font-bold text-slate-900">{cat.name}</span>
                    <span className="text-slate-500">
                      <span className="font-bold text-purple-700">{cat.occupied}</span> / {cat.total} Occupied ({cat.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500"
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>Base Rate: ₹{cat.basePrice}/night</span>
                    <span>{cat.total - cat.occupied} Available</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* MIDDLE COLUMN: FINANCIAL INTELLIGENCE & REVENUE CHARTS (Span 4 on XL) */}
        {/* ======================================================================= */}
        <div className="xl:col-span-4 space-y-5">
          {/* Payment Mode Collections */}
          <div
            onClick={() => { setSelectedModeFilter("all"); setPaymentDrawerOpen(true); }}
            className="card-surface rounded-2xl bg-white border border-slate-200/70 p-4.5 shadow-2xs hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 block group-hover:text-purple-900 transition-colors">Payment Mode Collections</span>
                <span className="text-[10.5px] font-semibold text-slate-400">Total: {money(paymentStats.grandTotal)}</span>
              </div>
              <span className="text-[10.5px] font-bold text-purple-700 bg-purple-50 group-hover:bg-purple-600 group-hover:text-white px-2.5 py-1 rounded-lg border border-purple-200 transition-all flex items-center gap-1 shadow-2xs">
                Audit Register →
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              {/* Donut Chart with Center Total */}
              <div className="relative h-40 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentStats.list}
                      dataKey="total"
                      nameKey="label"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={3}
                      stroke="none"
                      onClick={(data) => {
                        setSelectedModeFilter(data.mode);
                        setPaymentDrawerOpen(true);
                      }}
                    >
                      {paymentStats.list.map((pm) => (
                        <Cell key={pm.mode} fill={pm.color} className="cursor-pointer hover:opacity-85 transition-opacity" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-black text-slate-900 leading-tight">{moneyShort(paymentStats.grandTotal)}</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Total</span>
                </div>
              </div>

              {/* Payment Mode Items Breakdown */}
              <div className="space-y-2">
                {paymentStats.list.map((pm) => (
                  <div
                    key={pm.mode}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedModeFilter(pm.mode);
                      setPaymentDrawerOpen(true);
                    }}
                    className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-purple-50/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: pm.color }} />
                      <span className="font-bold text-slate-800 truncate">{pm.label}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-slate-900 block">{money(pm.total)}</span>
                      <span className="text-[10px] font-bold text-slate-400 block">{pm.pct}% · {pm.count} txns</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* Revenue Intelligence Chart */}
          <div className="card-surface rounded-2xl bg-white border border-slate-200/70 p-4.5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">Revenue Intelligence (Today)</span>
              </div>
              <button onClick={() => go("/reports/revenue")} className="text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer">
                View Report
              </button>
            </div>

            {/* 4 Mini Revenue Stream Cards */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="text-[9.5px] font-extrabold uppercase text-purple-700 block">Rooms</span>
                <span className="text-xs font-black text-slate-900">{moneyShort(streamRooms)}</span>
                <span className="text-[9.5px] font-bold text-emerald-600"> ▲ 3.2%</span>
              </div>
              <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="text-[9.5px] font-extrabold uppercase text-blue-700 block">F&B</span>
                <span className="text-xs font-black text-slate-900">{moneyShort(streamFB)}</span>
                <span className="text-[9.5px] font-bold text-emerald-600"> ▲ 2.7%</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[9.5px] font-extrabold uppercase text-emerald-700 block">Banquet</span>
                <span className="text-xs font-black text-slate-900">{moneyShort(streamBanquet)}</span>
                <span className="text-[9.5px] font-bold text-emerald-600"> ▲ 6.1%</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-[9.5px] font-extrabold uppercase text-amber-700 block">Other</span>
                <span className="text-xs font-black text-slate-900">{moneyShort(streamOther)}</span>
                <span className="text-[9.5px] font-bold text-emerald-600"> ▲ 1.3%</span>
              </div>
            </div>

            {/* Bar Chart comparing Today vs Yesterday */}
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyRevenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" fontSize={9.5} stroke="#94a3b8" />
                  <YAxis tickFormatter={(v: number) => moneyShort(v)} fontSize={9.5} stroke="#94a3b8" />
                  <Tooltip formatter={(v: number) => money(v)} />
                  <Bar dataKey="today" name="Today" fill="#6d28d9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="yesterday" name="Yesterday" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Booking Sources & Distribution */}
          <div className="card-surface rounded-2xl bg-white border border-slate-200/70 p-4.5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">Booking Sources & Channels</span>
                <span className="text-[10.5px] font-semibold text-slate-400">OTA vs Direct Channel Share</span>
              </div>
              <button onClick={() => go("/channel-manager")} className="text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer">
                Channels →
              </button>
            </div>

            <div className="space-y-2.5">
              {channelStats.slice(0, 4).map((ch) => (
                <div key={ch.source} className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="font-bold text-slate-900">{ch.source}</span>
                    <span className="text-purple-700 font-black">{money(ch.revenue)} ({ch.pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-600"
                      style={{ width: `${ch.pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>{ch.count} Bookings</span>
                    <span>Avg: {money(Math.round(ch.revenue / (ch.count || 1)))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* ======================================================================= */}
        {/* RIGHT COLUMN: ALERTS, QUICK ACTIONS & ACTIVITY (Span 3 on XL) */}
        {/* ======================================================================= */}
        <div className="xl:col-span-3 space-y-5">
          {/* Alert Center */}
          <div className="card-surface rounded-2xl bg-white border border-slate-200/70 p-4.5 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">Alert Center</span>
              <button onClick={() => go("/front-desk")} className="text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer">
                View All
              </button>
            </div>

            <div className="space-y-2">
              <div onClick={() => go("/folios")} className="flex items-center justify-between p-2 rounded-xl bg-rose-50/60 border border-rose-100 hover:bg-rose-100/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-rose-600" />
                  <span className="text-xs font-bold text-slate-800">{m.pendingBills} Open Folios</span>
                </div>
                <span className="text-[10px] font-extrabold text-rose-700 bg-rose-200/60 px-1.5 py-0.5 rounded">High</span>
              </div>

              <div onClick={() => go("/rooms/maintenance")} className="flex items-center justify-between p-2 rounded-xl bg-rose-50/60 border border-rose-100 hover:bg-rose-100/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-rose-600" />
                  <span className="text-xs font-bold text-slate-800">{m.maintenance} Maintenance</span>
                </div>
                <span className="text-[10px] font-extrabold text-rose-700 bg-rose-200/60 px-1.5 py-0.5 rounded">High</span>
              </div>

              <div onClick={() => go("/check-out")} className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 border border-amber-100 hover:bg-amber-100/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-800">{Math.min(m.departures, 4)} Late Checkouts</span>
                </div>
                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded">Medium</span>
              </div>

              <div onClick={() => go("/housekeeping")} className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 border border-amber-100 hover:bg-amber-100/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-800">{m.dirty} Need Cleaning</span>
                </div>
                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded">Medium</span>
              </div>

              <div onClick={() => go("/reservations")} className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 border border-blue-100 hover:bg-blue-100/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">{m.arrivals} Bookings Today</span>
                </div>
                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-200/60 px-1.5 py-0.5 rounded">Low</span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Grid) */}
          <div className="card-surface rounded-2xl bg-white border border-slate-200/70 p-4.5 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">Quick Actions</span>
              <span className="text-[10px] font-bold text-slate-400">12 Shortcuts</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((a) => {
                const IconComp = a.icon;
                return (
                  <button
                    key={a.label}
                    onClick={() => go(a.to)}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200/80 bg-white hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-2xs transition-all text-left cursor-pointer group"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-2xs">
                      <IconComp className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold text-slate-900 group-hover:text-purple-950 truncate leading-tight">{a.label}</span>
                      <span className="block text-[9.5px] font-semibold text-slate-400 truncate">{a.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>


          {/* Live Activity Feed */}
          <div className="card-surface rounded-2xl bg-white border border-slate-200/70 p-4.5 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">Activity Feed</span>
              <button onClick={() => go("/front-desk")} className="text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {activityFeed.map((item, idx) => (
                <div key={idx} onClick={() => go(item.to)} className="flex items-start gap-2.5 text-xs hover:bg-slate-50 p-1 rounded-lg transition-colors cursor-pointer">
                  <span className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", item.dot)} />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold text-slate-400 block">{item.time}</span>
                    <span className="text-slate-700 font-semibold block leading-tight">{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PETPOOJA-STYLE DETAILED PAYMENT & SETTLEMENT AUDIT DRAWER */}
      {/* ========================================================================= */}
      <Drawer
        open={paymentDrawerOpen}
        onClose={() => setPaymentDrawerOpen(false)}
        title="Payment Mode Collections & Settlement Audit"
        subtitle={`Petpooja-Style Register Audit · Total: ${money(paymentStats.grandTotal)} · ${paymentStats.totalPaymentsCount} Transactions`}
        width="max-w-2xl"
      >
        <div className="space-y-4">
          {/* 4 Petpooja Top Summary Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {paymentStats.list.map((pm) => (
              <button
                key={pm.mode}
                onClick={() => setSelectedModeFilter(selectedModeFilter === pm.mode ? "all" : pm.mode)}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all cursor-pointer",
                  selectedModeFilter === pm.mode
                    ? "border-purple-600 bg-purple-50/80 shadow-2xs"
                    : "border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/60",
                )}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: pm.color }} />
                  <span className="text-[11px] font-extrabold text-slate-700 truncate">{pm.mode}</span>
                </div>
                <span className="text-sm font-black text-slate-900 block">{money(pm.total)}</span>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-1">
                  <span>{pm.pct}% share</span>
                  <span>{pm.count} txns</span>
                </div>
              </button>
            ))}
          </div>

          {/* Mode Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setSelectedModeFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                selectedModeFilter === "all"
                  ? "bg-purple-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              All Transactions ({db.payments.filter((p) => p.kind === "payment").length})
            </button>
            {paymentStats.list.map((pm) => (
              <button
                key={pm.mode}
                onClick={() => setSelectedModeFilter(pm.mode)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  selectedModeFilter === pm.mode
                    ? "bg-purple-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pm.color }} />
                <span>{pm.mode} ({pm.count})</span>
              </button>
            ))}
          </div>

          {/* Petpooja Detailed Audit Register Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Transaction Register ({selectedModeFilter === "all" ? "All Modes" : selectedModeFilter})
              </span>
              <Btn
                size="sm"
                variant="outline"
                className="h-7 text-xs font-bold"
                onClick={() => {
                  exportCSV("payment-register.csv", db.payments.map((p) => ({
                    date: p.date,
                    mode: p.mode,
                    amount: p.amount,
                    kind: p.kind,
                    reference: p.reference || p.bookingId || "—",
                  })));
                }}
              >
                Export CSV
              </Btn>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 shadow-2xs">
                  <tr className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 text-left">
                    <th className="px-3.5 py-2.5 bg-slate-100">Date & Ref</th>
                    <th className="px-3.5 py-2.5 bg-slate-100">Guest / Booking</th>
                    <th className="px-3.5 py-2.5 bg-slate-100">Payment Mode</th>
                    <th className="px-3.5 py-2.5 text-right bg-slate-100">Amount</th>
                    <th className="px-3.5 py-2.5 text-center bg-slate-100">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">

                  {db.payments
                    .filter((p) => p.kind === "payment")
                    .filter((p) => selectedModeFilter === "all" || p.mode === selectedModeFilter)
                    .map((p) => {
                      const b = db.bookings.find((x) => x.id === p.bookingId);
                      const g = b ? guestOf(b, db) : null;
                      const pmMeta = paymentStats.list.find((m) => m.mode === p.mode);
                      return (
                        <tr
                          key={p.id}
                          onClick={() => {
                            if (p.bookingId) {
                              setPaymentDrawerOpen(false);
                              go(`/reservations/${p.bookingId}`);
                            }
                          }}
                          className="hover:bg-purple-50/40 transition-colors cursor-pointer"
                        >
                          <td className="px-3.5 py-2.5">
                            <span className="font-bold text-slate-900 block">{fmtDate(p.date)}</span>
                            <span className="text-[10px] font-mono text-purple-700 block">{p.reference || p.id}</span>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className="font-bold text-slate-800 block">{g?.name ?? "Direct / POS Guest"}</span>
                            <span className="text-[10px] text-slate-400 block">{b ? `Booking ${b.id} · GRC ${b.grc}` : "Counter Register"}</span>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span
                              className="px-2 py-0.5 rounded-md text-[10.5px] font-extrabold inline-flex items-center gap-1.5"
                              style={{
                                backgroundColor: `${pmMeta?.color || "#7c3aed"}15`,
                                color: pmMeta?.color || "#7c3aed",
                              }}
                            >
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pmMeta?.color || "#7c3aed" }} />
                              {p.mode}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-black text-slate-900 tabular-nums text-sm">
                            {money(p.amount)}
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                              Settled
                            </span>
                          </td>

                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Footer Action */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Btn variant="outline" size="sm" onClick={() => setPaymentDrawerOpen(false)}>
              Close Audit
            </Btn>
            <Btn
              variant="primary"
              size="sm"
              className="shimmer-gold font-bold"
              onClick={() => {
                setPaymentDrawerOpen(false);
                go("/restaurant/billing");
              }}
            >
              Open Cashier & Settlement Desk →
            </Btn>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

