import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, Command, HelpCircle,
  LogOut, Menu, Plus, Search, Trash2, User, X,
} from "lucide-react";
import { toast } from "sonner";
import {
  ROLE_ACCESS, dashboardMetrics, fmtDate, globalSearch, hydrate, setRole, today, useDB,
} from "@/lib/store";
import type { Role } from "@/lib/types";
import { Badge, Btn, Modal } from "@/components/kit";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", to: "/", icon: "dashboard" },
  { label: "Bookings", to: "/reservations/calendar", icon: "calendar_month", matchPrefix: ["/reservations", "/check-in", "/check-out", "/ez-dashboard", "/folios"] },
  { label: "Rooms", to: "/rooms/grid", icon: "bed", matchPrefix: ["/rooms"] },
  { label: "Guests", to: "/guests", icon: "group", matchPrefix: ["/guests", "/crm"] },
  { label: "Housekeeping", to: "/housekeeping", icon: "cleaning_services", matchPrefix: ["/housekeeping"] },
  { label: "Laundry", to: "/laundry/orders", icon: "local_laundry_service", matchPrefix: ["/laundry"] },
  { label: "Restaurant", to: "/restaurant/tables", icon: "restaurant", matchPrefix: ["/restaurant"] },
  { label: "POS", to: "/pos", icon: "point_of_sale", matchPrefix: ["/pos"] },
  { label: "Banquets", to: "/banquet/events", icon: "event_seat", matchPrefix: ["/banquet"] },
  { label: "Reports", to: "/reports/revenue", icon: "analytics", matchPrefix: ["/reports", "/finance"] },
  { label: "Staff", to: "/hr/staff", icon: "badge", matchPrefix: ["/hr"] },
  { label: "Settings", to: "/settings/hotel", icon: "settings", matchPrefix: ["/settings", "/channel-manager"] },
];

const ROLES: { role: Role; label: string; defaultRoute: string; icon: string; desc: string; badge: string }[] = [
  { role: "Admin", label: "Administrator", defaultRoute: "/", icon: "👑", desc: "Full PMS, POS & ERP Control", badge: "All Access" },
  { role: "Hotel Manager", label: "Hotel Manager", defaultRoute: "/", icon: "🏨", desc: "Executive KPI & Property Overview", badge: "Executive" },
  { role: "Receptionist", label: "Front Desk / Reception", defaultRoute: "/front-desk", icon: "🛎️", desc: "Front Desk, Check-ins & Bookings", badge: "Front Desk" },
  { role: "Restaurant Manager", label: "F&B / POS Manager", defaultRoute: "/restaurant/billing", icon: "🍽️", desc: "Cashier Desk, Orders & Menu", badge: "Billing Desk" },
  { role: "Waiter", label: "Captain / Waiter", defaultRoute: "/pos", icon: "📱", desc: "Point of Sale & Table Orders", badge: "POS Terminal" },
  { role: "Chef", label: "Kitchen Display (KDS)", defaultRoute: "/restaurant/kds", icon: "👨‍🍳", desc: "Kitchen Orders & Food Prep Screen", badge: "KDS Screen" },
  { role: "Housekeeping", label: "Housekeeping Board", defaultRoute: "/housekeeping", icon: "🧹", desc: "Room Cleaning & Task Matrix", badge: "HK Board" },
  { role: "Accountant", label: "Finance & Accounts", defaultRoute: "/finance/ledger", icon: "💰", desc: "Income & Expense Ledger, P&L", badge: "Finance" },
  { role: "HR", label: "HR / Staff Directory", defaultRoute: "/hr/staff", icon: "👥", desc: "Staff Directory & Attendance", badge: "HR Staff" },
];

const QUICK_ACTIONS = [
  { label: "New Reservation", to: "/reservations/new" },
  { label: "Front Desk Operations", to: "/front-desk" },
  { label: "Booking Calendar", to: "/reservations/calendar" },
  { label: "Express Check-In", to: "/check-in" },
  { label: "Express Check-Out", to: "/check-out" },
  { label: "Restaurant POS", to: "/pos" },
  { label: "Restaurant Billing Desk", to: "/restaurant/billing" },
  { label: "Housekeeping Board", to: "/housekeeping" },
  { label: "Room Matrix / Grid", to: "/rooms/grid" },
  { label: "Guest Directory", to: "/guests" },
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

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    const target = ROLES.find((r) => r.role === newRole);
    toast.success(`Switched to ${target?.label ?? newRole}`);
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
    { id: "kds", tone: "success", title: "Kitchen Display", text: `${db.orders.filter((o) => o.kds === "ready").length} order(s) ready in kitchen`, to: "/restaurant/kds", active: db.orders.filter((o) => o.kds === "ready").length > 0 },
  ];

  const activeNotifications = baseNotifications.filter(
    (n) => n.active && !dismissedNotifs.includes(n.id)
  );
  const unreadCount = allRead ? 0 : activeNotifications.length;

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAllRead(true);
    toast.success("Notifications marked read");
  };

  const isNavActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.to === "/") return pathname === "/";
    if (pathname === item.to) return true;
    return item.matchPrefix?.some((p) => pathname.startsWith(p)) ?? false;
  };

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-[#1b1c19] flex antialiased selection:bg-[#fed65b] selection:text-[#745c00]">
      {/* SideNavBar (Editorial Luxury Aesthetic) */}
      <nav
        className={cn(
          "flex flex-col h-screen fixed left-0 top-0 w-64 bg-[#f0eee9] border-r border-[#d1c4bd] py-8 px-4 z-40 transition-transform duration-200 no-print",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-[#170f0a] flex items-center justify-center text-[#ffffff] font-serif text-lg overflow-hidden border border-[#d1c4bd] shrink-0">
              <span className="font-serif font-bold text-[#fed65b]">M</span>
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold text-[#170f0a] tracking-tight leading-none">
                {db.settings.hotelName?.split(" ")[0] || "Aurelia"}
              </h1>
              <p className="font-label-caps text-[10px] text-[#4e4540] tracking-widest mt-1">LUXURY HMS</p>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-[#7f756f] hover:text-[#170f0a] p-1"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => nav({ to: "/reservations/new" as never })}
          className="mb-6 w-full bg-[#170f0a] text-[#ffffff] py-2.5 px-4 rounded-[0.25rem] flex items-center justify-center gap-2 font-label-caps text-[11px] hover:bg-[#2d241e] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Booking
        </button>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={cn(
                  "flex items-center gap-3.5 px-3.5 py-2.5 rounded-[0.25rem] transition-colors duration-150 font-sans text-xs",
                  active
                    ? "bg-[#e4e2dd] text-[#735c00] font-bold border-l-2 border-[#735c00]"
                    : "text-[#4e4540] hover:text-[#170f0a] hover:bg-[#e4e2dd]/50 font-medium"
                )}
              >
                <span className={cn("material-symbols-outlined text-[18px]", active && "icon-fill")}>
                  {item.icon}
                </span>
                <span className="flex-1 tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Active Role Indicator at bottom of Sidebar */}
        <div className="pt-3 mt-auto border-t border-[#d1c4bd]/70">
          <button
            onClick={() => setUserDropdownOpen(true)}
            className="w-full flex items-center justify-between p-2 rounded-[0.25rem] hover:bg-[#e4e2dd]/60 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">{currentRoleMeta.icon}</span>
              <div className="min-w-0">
                <span className="font-label-caps text-[9px] text-[#7f756f] block">WORKSPACE</span>
                <span className="text-xs font-semibold text-[#170f0a] block truncate">{currentRoleMeta.label}</span>
              </div>
            </div>
            <span className="font-label-caps text-[9px] text-[#735c00] bg-[#fed65b]/30 px-1.5 py-0.5 rounded-[0.125rem]">
              SWITCH
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {open ? <div className="fixed inset-0 z-30 bg-[#170f0a]/30 backdrop-blur-xs md:hidden" onClick={() => setOpen(false)} /> : null}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* TopNavBar (Editorial Clean Header) */}
        <header className="sticky top-0 z-30 h-16 px-6 sm:px-10 bg-[#fbf9f4]/95 border-b border-[#d1c4bd] backdrop-blur-xs flex items-center justify-between no-print">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setOpen(true)}
              className="md:hidden p-1.5 text-[#4e4540] hover:text-[#170f0a] rounded cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h2 className="hidden sm:block font-serif text-xl sm:text-2xl font-semibold text-[#170f0a] tracking-tight">
              {db.settings.hotelName || "Aurelia Grand Hotel"}
            </h2>

            {/* Ghost Search Box */}
            <div className="relative w-56 sm:w-72 sm:ml-6">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[#7f756f] text-[18px]">
                search
              </span>
              <button
                onClick={() => { setPalette(true); setTimeout(() => inputRef.current?.focus(), 30); }}
                className="w-full text-left bg-transparent border-b border-[#d1c4bd] hover:border-[#170f0a] pl-8 pr-8 py-1.5 font-sans text-xs text-[#7f756f] transition-colors cursor-pointer truncate"
              >
                Search guests, rooms, orders…
              </button>
              <kbd className="hidden sm:inline-block absolute right-1 top-1/2 -translate-y-1/2 font-label-caps text-[9px] text-[#7f756f] border border-[#d1c4bd] px-1 rounded bg-[#f5f3ee]">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="text-[#4e4540] hover:text-[#170f0a] transition-colors relative p-1 cursor-pointer"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-[#ba1a1a] rounded-full ring-1 ring-[#fbf9f4]" />
                )}
              </button>

              {notifOpen ? (
                <div className="absolute right-0 top-10 z-50 w-80 rounded-[0.25rem] border border-[#d1c4bd] bg-[#ffffff] p-4 shadow-xl animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#d1c4bd]">
                    <span className="font-label-caps text-xs text-[#170f0a]">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="font-label-caps text-[10px] text-[#735c00] hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-[#d1c4bd]/40 mt-1 max-h-72 overflow-y-auto">
                    {activeNotifications.length > 0 ? (
                      activeNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => { setNotifOpen(false); nav({ to: n.to as never }); }}
                          className="p-2.5 hover:bg-[#f5f3ee] transition-colors cursor-pointer text-xs"
                        >
                          <div className="font-label-caps text-[10px] text-[#735c00]">{n.title}</div>
                          <div className="text-[#170f0a] font-medium mt-0.5">{n.text}</div>
                        </div>
                      ))
                    ) : (
                      <p className="py-6 text-center text-xs text-[#7f756f]">No unread alerts</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Quick Help / Guide Button */}
            <button
              onClick={() => { toast.info("Aurelia HMS Hotel ERP", { description: "Use the top search or sidebar to navigate." }); }}
              className="text-[#4e4540] hover:text-[#170f0a] transition-colors p-1 cursor-pointer"
              aria-label="Help"
            >
              <span className="material-symbols-outlined text-[22px]">help</span>
            </button>

            <div className="h-6 w-px bg-[#d1c4bd]" />

            {/* Profile Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen((v) => !v)}
                className="flex items-center gap-2.5 hover:bg-[#f0eee9] px-2.5 py-1.5 rounded-[0.25rem] transition-colors cursor-pointer"
              >
                <div className="hidden sm:block text-right leading-tight">
                  <span className="font-label-caps text-[10px] text-[#7f756f] block">{currentRoleMeta.label}</span>
                  <span className="text-xs font-bold text-[#170f0a] block">{db.settings.user}</span>
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#d1c4bd] bg-[#2d241e] text-[#ffffff] flex items-center justify-center font-serif text-xs font-bold">
                  {db.settings.user.charAt(0)}
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-[0.25rem] border border-[#d1c4bd] bg-[#ffffff] p-4 shadow-xl animate-in fade-in duration-150">
                  <div className="pb-3 border-b border-[#d1c4bd] flex items-center justify-between">
                    <div>
                      <p className="font-serif text-sm font-bold text-[#170f0a]">{db.settings.user}</p>
                      <p className="font-label-caps text-[10px] text-[#735c00] mt-0.5">{currentRoleMeta.label}</p>
                    </div>
                    <button
                      onClick={() => setUserDropdownOpen(false)}
                      className="p-1 text-[#7f756f] hover:text-[#170f0a] rounded cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="pt-3">
                    <p className="font-label-caps text-[10px] text-[#7f756f] mb-2">Switch Workspace Role</p>
                    <div className="space-y-1 max-h-72 overflow-y-auto">
                      {ROLES.map((r) => {
                        const isActive = role === r.role;
                        return (
                          <button
                            key={r.role}
                            onClick={() => handleRoleChange(r.role)}
                            className={cn(
                              "w-full flex items-center justify-between p-2 rounded-[0.25rem] text-left transition-colors cursor-pointer text-xs",
                              isActive
                                ? "bg-[#f0dfd6] text-[#170f0a] font-bold"
                                : "hover:bg-[#f5f3ee] text-[#4e4540]"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span>{r.icon}</span>
                              <span className="truncate">{r.label}</span>
                            </div>
                            <span className="font-label-caps text-[9px] text-[#7f756f]">{r.badge}</span>
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

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-10 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <Modal open={palette} onClose={() => setPalette(false)} title="Search & Quick Navigation" wide>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          placeholder="Search guests, bookings, rooms, invoices, staff…"
          className="mb-4 h-10 w-full rounded-[0.25rem] border border-[#d1c4bd] bg-[#ffffff] px-3.5 text-xs sm:text-sm outline-none focus:border-[#170f0a] focus:ring-1 focus:ring-[#170f0a]"
        />
        {q.length < 2 ? (
          <div>
            <p className="font-label-caps text-[10px] text-[#7f756f] mb-3">Quick Navigation</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => { setPalette(false); nav({ to: a.to.split("?")[0]! as never }); }}
                  className="rounded-[0.25rem] border border-[#d1c4bd] bg-[#fbf9f4] p-3 text-left text-xs font-medium text-[#170f0a] hover:bg-[#f0eee9] transition-colors cursor-pointer"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#d1c4bd]/40">
            {results.length ? results.map((r, i) => (
              <button
                key={i}
                onClick={() => { setPalette(false); setQ(""); nav({ to: r.to.split("?")[0]! as never }); }}
                className="flex w-full items-center gap-3 p-2.5 text-left hover:bg-[#f5f3ee] transition-colors cursor-pointer"
              >
                <Badge tone="primary">{r.type}</Badge>
                <span className="flex-1">
                  <span className="block text-xs font-bold text-[#170f0a]">{r.title}</span>
                  <span className="block text-[11px] text-[#7f756f]">{r.sub}</span>
                </span>
              </button>
            )) : <p className="py-8 text-center text-xs text-[#7f756f]">No matches found.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
