import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, Command, LogOut, Menu, Plus, Search, Sparkles, Trash2, User, X,
} from "lucide-react";
import { toast } from "sonner";
import { NAV } from "@/lib/nav";
import {
  ROLE_ACCESS, dashboardMetrics, fmtDate, globalSearch, hydrate, setRole, today, useDB,
} from "@/lib/store";
import type { Role } from "@/lib/types";
import { Badge, Btn, Modal, PageSkeleton, Select } from "@/components/kit";
import { cn } from "@/lib/utils";

const ROLES: { role: Role; label: string; defaultRoute: string; icon: string; desc: string; badge: string }[] = [
  { role: "Admin", label: "Administrator", defaultRoute: "/", icon: "👑", desc: "Full PMS, POS & ERP Control", badge: "Operations Overview" },
  { role: "Hotel Manager", label: "Hotel Manager", defaultRoute: "/", icon: "🏨", desc: "Executive KPI & Property Overview", badge: "Executive Board" },
  { role: "Receptionist", label: "Front Desk / Reception", defaultRoute: "/ez-dashboard", icon: "🛎️", desc: "EZ Room Matrix, Check-ins & Bookings", badge: "EZ Room Board" },
  { role: "Restaurant Manager", label: "F&B / POS Manager", defaultRoute: "/restaurant/billing", icon: "🍽️", desc: "Cashier Desk, Orders & Menu", badge: "Billing Desk" },
  { role: "Waiter", label: "Captain / Waiter", defaultRoute: "/pos", icon: "📱", desc: "Point of Sale & Table Orders", badge: "POS Terminal" },
  { role: "Chef", label: "Kitchen Display (KDS)", defaultRoute: "/restaurant/kds", icon: "👨‍🍳", desc: "Kitchen Orders & Food Prep Screen", badge: "KDS Screen" },
  { role: "Housekeeping", label: "Housekeeping Board", defaultRoute: "/housekeeping", icon: "🧹", desc: "Room Cleaning, Dirty Matrix & Tasks", badge: "HK Board" },
  { role: "Accountant", label: "Finance & Accounts", defaultRoute: "/finance/ledger", icon: "💰", desc: "Income & Expense Ledger, P&L", badge: "Finance Ledger" },
  { role: "HR", label: "HR / Staff Directory", defaultRoute: "/hr/staff", icon: "👥", desc: "Staff Directory, Payroll & Attendance", badge: "Staff Directory" },
];

const QUICK_ACTIONS = [
  { label: "New Reservation", to: "/reservations/new" },
  { label: "⚡ EZ Room Dashboard", to: "/ez-dashboard" },
  { label: "Express Check-In", to: "/check-in" },
  { label: "Express Check-Out", to: "/check-out" },
  { label: "Open Point of Sale (POS)", to: "/pos" },
  { label: "Cashier & Billing Desk", to: "/restaurant/billing" },
  { label: "Guest Directory", to: "/guests" },
  { label: "Room Matrix / Grid", to: "/rooms/grid" },
  { label: "Housekeeping Tasks", to: "/housekeeping" },
  { label: "Finance & Accounts Ledger", to: "/finance/ledger" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    hydrate();
    setMounted(true);
  }, []);
  const db = useDB();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [palette, setPalette] = useState(false);
  const [q, setQ] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>([]);
  const [allRead, setAllRead] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const role = db.settings.role;
  const currentRoleMeta = ROLES.find((r) => r.role === role) || ROLES[0]!;
  const groups = useMemo(() => {
    const access = ROLE_ACCESS[role];
    return NAV.filter((g) => access === "*" || access.includes(g.key));
  }, [role]);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    const target = ROLES.find((r) => r.role === newRole);
    toast.success(`Switched workspace to ${target?.label ?? newRole}`);
    setUserDropdownOpen(false);
    if (target?.defaultRoute) {
      nav({ to: target.defaultRoute as never });
    }
  };

  const results = useMemo(() => (palette ? globalSearch(db, q) : []), [db, q, palette]);
  const m = dashboardMetrics(db);

  const baseNotifications = [
    { id: "hk", tone: "warning", title: "Housekeeping", text: `${m.dirty} room(s) awaiting housekeeping`, to: "/housekeeping", active: m.dirty > 0 },
    { id: "front", tone: "info", title: "Front Desk", text: `${m.arrivals} arrivals and ${m.departures} departures today`, to: "/front-desk", active: m.arrivals > 0 || m.departures > 0 },
    { id: "folios", tone: "danger", title: "Folios & Billing", text: `${m.pendingBills} in-house folio(s) with pending balance`, to: "/folios", active: m.pendingBills > 0 },
    { id: "kds", tone: "success", title: "Kitchen Display", text: `${db.orders.filter((o) => o.kds === "ready").length} order(s) ready for pickup in kitchen`, to: "/restaurant/kds", active: db.orders.filter((o) => o.kds === "ready").length > 0 },
  ];

  const activeNotifications = baseNotifications.filter(
    (n) => n.active && !dismissedNotifs.includes(n.id)
  );
  const unreadCount = allRead ? 0 : activeNotifications.length;

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAllRead(true);
    toast.success("All notifications marked as read");
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedNotifs(baseNotifications.map((n) => n.id));
    setAllRead(true);
    toast.success("All notifications cleared");
  };

  const handleDismissOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedNotifs((prev) => [...prev, id]);
  };

  const handleNotificationClick = (to: string) => {
    setNotifOpen(false);
    nav({ to: to as never });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0b1120] text-slate-200 transition-all duration-300 ease-in-out lg:translate-x-0 no-print border-r border-slate-800/80 shadow-xl",
          collapsed ? "w-20" : "w-64",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            {/* Gold Crown Crest */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-amber-400/40 shadow-inner">
              <span className="font-serif font-black text-amber-400 text-lg leading-none">M</span>
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <span className="block text-base font-black tracking-wider text-white">MAYRA</span>
                <span className="block text-[9.5px] font-bold uppercase tracking-[0.2em] text-amber-400/80">HOTEL ERP</span>
              </div>
            )}
          </Link>
          
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            aria-label="Collapse sidebar"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          
          <button className="lg:hidden text-slate-400 hover:text-white" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Active Role Pill in Sidebar */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            <button
              onClick={() => setUserDropdownOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 hover:border-purple-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base">{currentRoleMeta.icon}</span>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block truncate">Active Role</span>
                  <span className="text-xs font-bold text-white block truncate">{currentRoleMeta.label}</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 group-hover:text-white bg-slate-700/50 px-1.5 py-0.5 rounded">Switch</span>
            </button>
          </div>
        )}

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {groups.map((g) => (
            <NavGroupBlock key={g.key} group={g} pathname={pathname} collapsed={collapsed} />
          ))}
        </nav>

        {/* Sidebar Footer Branding */}
        {!collapsed && (
          <div className="p-3 border-t border-slate-800/80">
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-2.5 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 text-base">
                🏨
              </div>
              <div className="leading-tight">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Designed by</span>
                <span className="text-xs font-bold text-amber-400 block">Shine Infosolutions</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {open ? <div className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-xs lg:hidden" onClick={() => setOpen(false)} /> : null}

      {/* Main Workspace Area */}
      <div className={cn("transition-all duration-300 ease-in-out", collapsed ? "lg:pl-20" : "lg:pl-64")}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md no-print sm:px-6 shadow-2xs">
          <div className="flex items-center gap-3 flex-1 sm:max-w-md">
            <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => { setPalette(true); setTimeout(() => inputRef.current?.focus(), 30); }}
              className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-left text-sm text-slate-500 hover:border-purple-300 hover:bg-white transition-all shadow-2xs"
            >
              <Search className="h-4 w-4 text-slate-400" />
              <span className="flex-1 truncate text-xs sm:text-sm">Search guests, bookings, rooms, orders…</span>
              <kbd className="hidden items-center gap-0.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 sm:inline-flex">
                <Command className="h-3 w-3" />K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Hotel Name & Today's Date */}
            <span className="hidden text-xs font-semibold text-slate-500 xl:block">
              {db.settings.hotelName} • {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                className="relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                aria-label="Notifications"
                onClick={() => setNotifOpen((v) => !v)}
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
              </button>
              {notifOpen ? (
                <div className="absolute right-0 top-12 z-30 w-88 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 px-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Notifications</p>
                      <Badge tone={unreadCount > 0 ? "primary" : "neutral"}>
                        {unreadCount > 0 ? `${unreadCount} New` : "0 New"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 hover:bg-purple-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                          title="Mark all as read"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                      <button
                        onClick={() => setNotifOpen(false)}
                        className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                        aria-label="Close notifications"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-50 mt-1 max-h-80 overflow-y-auto pr-0.5">
                    {activeNotifications.length > 0 ? (
                      activeNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n.to)}
                          className="group relative flex items-start justify-between gap-2.5 p-2.5 rounded-xl text-xs hover:bg-purple-50/50 transition-all cursor-pointer"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="mt-0.5 shrink-0">
                              <Badge tone={n.tone}>•</Badge>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10.5px] font-bold uppercase tracking-wider text-purple-700 block truncate">
                                {n.title}
                              </span>
                              <span className="text-slate-700 font-medium block leading-snug">
                                {n.text}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleDismissOne(n.id, e)}
                            className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all shrink-0 cursor-pointer"
                            title="Dismiss notification"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center space-y-2">
                        <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-purple-50 text-purple-600 text-lg">
                          ✨
                        </div>
                        <p className="text-xs font-bold text-slate-800">All caught up!</p>
                        <p className="text-[11px] text-slate-400">No unread notifications at the moment.</p>
                      </div>
                    )}
                  </div>

                  {activeNotifications.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-1 mt-1">
                      <button
                        onClick={handleClearAll}
                        className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Clear all
                      </button>
                      <span className="text-[10px] text-slate-400">Click an alert to view</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* + New Booking Primary CTA */}
            <Btn
              size="md"
              variant="primary"
              icon={Plus}
              onClick={() => nav({ to: "/reservations/new" as never })}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-sm rounded-xl px-4"
            >
              <span className="hidden sm:inline">New Booking</span>
            </Btn>

            {/* User Profile & Role Switcher */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen((v) => !v)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left cursor-pointer"
              >
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-xs">
                    {currentRoleMeta.icon}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    {db.settings.user}
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div className="text-[11px] font-semibold text-purple-700">{currentRoleMeta.label}</div>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-12 z-30 w-84 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="pb-3 border-b border-slate-100 px-1 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{db.settings.user}</p>
                      <p className="text-[11px] font-semibold text-purple-700">{currentRoleMeta.label} View</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                        Active
                      </span>
                      <button
                        onClick={() => setUserDropdownOpen(false)}
                        className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2.5">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Switch Workspace Role</p>
                      <span className="text-[10px] text-slate-400">Opens separate dashboard</span>
                    </div>

                    <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                      {ROLES.map((r) => {
                        const isActive = role === r.role;
                        return (
                          <button
                            key={r.role}
                            onClick={() => handleRoleChange(r.role)}
                            className={cn(
                              "w-full flex items-center justify-between p-2 rounded-xl text-left transition-all group cursor-pointer",
                              isActive
                                ? "bg-purple-50/80 border border-purple-200 text-purple-900 shadow-2xs font-bold"
                                : "hover:bg-slate-50 border border-transparent text-slate-700",
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-lg">{r.icon}</span>
                              <div className="min-w-0">
                                <span className={cn("text-xs block font-bold truncate", isActive ? "text-purple-900" : "text-slate-900")}>
                                  {r.label}
                                </span>
                                <span className="text-[10.5px] text-slate-400 block truncate">{r.desc}</span>
                              </div>
                            </div>

                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ml-2",
                              isActive ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-700",
                            )}>
                              {r.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-7 max-w-[1600px] mx-auto w-full min-h-[calc(100vh-4rem)]">
          {!mounted ? (
            <PageSkeleton pathname={pathname} />
          ) : (
            <div key={pathname} className="animate-in fade-in duration-150">
              {children}
            </div>
          )}
        </main>
      </div>

      {/* Command palette */}
      <Modal open={palette} onClose={() => setPalette(false)} title="Search & Quick Navigation" wide>
        <input
          ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} autoFocus
          placeholder="Search guests, bookings, GRC, rooms, invoices, orders, employees, products…"
          className="mb-3 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
        />
        {q.length < 2 ? (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => { setPalette(false); nav({ to: a.to.split("?")[0]! as never }); }}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-left text-xs font-semibold text-slate-700 hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-700 transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {results.length ? results.map((r, i) => (
              <button
                key={i}
                onClick={() => { setPalette(false); setQ(""); nav({ to: r.to.split("?")[0]! as never }); }}
                className="flex w-full items-center gap-3 p-2.5 text-left hover:bg-purple-50/50 rounded-xl transition-colors"
              >
                <Badge tone="primary">{r.type}</Badge>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-slate-900">{r.title}</span>
                  <span className="block text-xs text-slate-500">{r.sub}</span>
                </span>
              </button>
            )) : <p className="py-8 text-center text-sm text-slate-400">No matches for “{q}”.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}

function NavGroupBlock({
  group, pathname, collapsed,
}: {
  group: (typeof NAV)[number]; pathname: string; collapsed?: boolean;
}) {
  const active = group.items.some((i) => (i.to === "/" ? pathname === "/" : pathname.startsWith(i.to)));
  const [open, setOpen] = useState(active);
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);
  const Icon = group.icon;

  if (group.items.length === 1) {
    const isSingleActive = pathname === group.items[0]!.to;
    return (
      <Link
        to={group.items[0]!.to as never}
        className={cn(
          "mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150",
          isSingleActive
            ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white shadow-sm shadow-purple-900/30"
            : "text-slate-400 hover:bg-slate-800/60 hover:text-white",
          collapsed && "justify-center px-2",
        )}
      >
        <Icon className={cn("h-4.5 w-4.5 shrink-0", isSingleActive ? "text-white" : "text-slate-400")} />
        {!collapsed && <span className="flex-1">{group.label}</span>}
      </Link>
    );
  }

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150",
          active ? "text-white font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white",
          collapsed && "justify-center px-2",
        )}
      >
        <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-purple-400" : "text-slate-400")} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{group.label}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform duration-200", open && "rotate-180")} />
          </>
        )}
      </button>

      {!collapsed && open && (
        <div className="ml-5 border-l border-slate-800 pl-2.5 my-1 space-y-0.5">
          {group.items.map((i) => {
            const isActive = pathname === i.to || (i.to !== "/" && pathname.startsWith(i.to + "/"));
            const isEZ = i.to === "/ez-dashboard";
            return (
              <Link
                key={i.to} to={i.to as never}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-purple-600/20 text-purple-300 font-bold"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-white",
                )}
              >
                <span>{i.label}</span>
                {isEZ && (
                  <span className="rounded-full bg-purple-600 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider">
                    New
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
