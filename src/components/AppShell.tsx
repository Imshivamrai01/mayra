import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell, ChevronDown, Command, LogOut, Menu, Plus, Search, X,
} from "lucide-react";
import { toast } from "sonner";
import { NAV } from "@/lib/nav";
import {
  ROLE_ACCESS, dashboardMetrics, fmtDate, globalSearch, hydrate, setRole, today, useDB,
} from "@/lib/store";
import type { Role } from "@/lib/types";
import { Badge, Btn, Modal, Select } from "@/components/kit";
import { cn } from "@/lib/utils";

const ROLES: Role[] = [
  "Admin", "Hotel Manager", "Receptionist", "Restaurant Manager", "Waiter", "Chef",
  "Housekeeping", "Accountant", "HR",
];

const QUICK_ACTIONS = [
  { label: "New Booking", to: "/reservations?new=1" },
  { label: "Walk-in Booking", to: "/reservations?new=1&walkin=1" },
  { label: "Check-in", to: "/check-in" },
  { label: "Check-out", to: "/check-out" },
  { label: "New POS Order", to: "/pos" },
  { label: "New Purchase", to: "/inventory/purchase-orders" },
  { label: "New Expense", to: "/finance/expenses" },
  { label: "Search Guest", to: "/guests" },
  { label: "Search Room", to: "/rooms/grid" },
  { label: "Run Night Audit", to: "/finance/night-audit" },
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
  const inputRef = useRef<HTMLInputElement>(null);

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
  useEffect(() => setOpen(false), [pathname]);

  const role = db.settings.role;
  const groups = useMemo(() => {
    const access = ROLE_ACCESS[role];
    return NAV.filter((g) => access === "*" || access.includes(g.key));
  }, [role]);

  const results = useMemo(() => (palette ? globalSearch(db, q) : []), [db, q, palette]);
  const m = dashboardMetrics(db);
  const notifications = [
    { tone: "warning", text: `${m.dirty} room(s) awaiting housekeeping` },
    { tone: "info", text: `${m.arrivals} arrivals and ${m.departures} departures today` },
    { tone: "danger", text: `${m.pendingBills} in-house folio(s) with pending balance` },
    { tone: "success", text: `${db.orders.filter((o) => o.kds === "ready").length} order(s) ready for pickup in kitchen` },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 no-print",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3.5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-base font-semibold text-primary-foreground">M</span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-[0.16em]">MAYRA</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-sidebar-muted">Hotel ERP</span>
            </span>
          </Link>
          <button className="lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {groups.map((g) => (
            <NavGroupBlock key={g.key} group={g} pathname={pathname} />
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3 text-[11px] text-sidebar-muted">
          Demo build · Frontend only
        </div>
      </aside>
      {open ? <div className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)} /> : null}

      {/* Header */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-border bg-card/95 px-3 py-2.5 backdrop-blur no-print sm:px-4">
          <button className="rounded-md p-2 hover:bg-secondary lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setPalette(true); setTimeout(() => inputRef.current?.focus(), 30); }}
            className="flex h-9 flex-1 items-center gap-2 rounded-md border border-border bg-background px-2.5 text-left text-sm text-muted-foreground hover:border-primary/40 sm:max-w-md"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 truncate">Search guests, bookings, rooms, orders…</span>
            <kbd className="hidden items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] sm:inline-flex">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground xl:block">{db.settings.hotelName} · {fmtDate(today())}</span>
            <div className="relative">
              <button className="relative rounded-md p-2 hover:bg-secondary" aria-label="Notifications" onClick={() => setNotifOpen((v) => !v)}>
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
              </button>
              {notifOpen ? (
                <div className="absolute right-0 top-11 z-30 w-72 rounded-lg border border-border bg-card p-2 shadow-[var(--shadow-pop)]">
                  <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">Notifications</p>
                  {notifications.map((n, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md px-2 py-2 text-xs hover:bg-secondary">
                      <Badge tone={n.tone}>•</Badge>
                      <span>{n.text}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <Btn size="sm" variant="primary" icon={Plus} onClick={() => nav({ to: "/reservations" as never })}>
              <span className="hidden sm:inline">New Booking</span>
            </Btn>
            <div className="hidden items-center gap-2 border-l border-border pl-2 md:flex">
              <div className="text-right leading-tight">
                <div className="text-xs font-semibold">{db.settings.user}</div>
                <div className="text-[10px] text-muted-foreground">{role}</div>
              </div>
              <Select
                aria-label="Switch demo role"
                className="h-8 w-36 text-xs"
                value={role}
                onChange={(e) => { setRole(e.target.value as Role); toast.success(`Switched to ${e.target.value} view`); nav({ to: "/" as never }); }}
                options={ROLES.map((r) => ({ value: r, label: r }))}
              />
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-4 lg:p-6">
          {mounted ? children : <div className="h-64 animate-pulse rounded-lg bg-secondary" />}
        </main>
      </div>

      {/* Command palette */}
      <Modal open={palette} onClose={() => setPalette(false)} title="Search & Quick Actions" wide>
        <input
          ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} autoFocus
          placeholder="Search guests, bookings, GRC, rooms, invoices, orders, employees, products…"
          className="mb-3 h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary"
        />
        {q.length < 2 ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Quick actions</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => { setPalette(false); nav({ to: a.to.split("?")[0]! as never }); }}
                  className="rounded-md border border-border px-3 py-2 text-left text-sm hover:border-primary/50 hover:bg-secondary"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {results.length ? results.map((r, i) => (
              <button
                key={i}
                onClick={() => { setPalette(false); setQ(""); nav({ to: r.to.split("?")[0]! as never }); }}
                className="flex w-full items-center gap-3 px-1 py-2 text-left hover:bg-secondary"
              >
                <Badge tone="primary">{r.type}</Badge>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{r.title}</span>
                  <span className="block text-xs text-muted-foreground">{r.sub}</span>
                </span>
              </button>
            )) : <p className="py-6 text-center text-sm text-muted-foreground">No matches for “{q}”.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}

function NavGroupBlock({ group, pathname }: { group: (typeof NAV)[number]; pathname: string }) {
  const active = group.items.some((i) => (i.to === "/" ? pathname === "/" : pathname.startsWith(i.to)));
  const [open, setOpen] = useState(active);
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);
  const Icon = group.icon;
  if (group.items.length === 1) {
    return (
      <Link
        to={group.items[0]!.to as never}
        className={cn(
          "mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
          active ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        )}
      >
        <Icon className="h-4 w-4" /> {group.label}
      </Link>
    );
  }
  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
          active ? "text-sidebar-foreground" : "text-sidebar-muted hover:text-sidebar-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="ml-4 border-l border-sidebar-border pl-2">
          {group.items.map((i) => {
            const isActive = pathname === i.to || (i.to !== "/" && pathname.startsWith(i.to + "/"));
            return (
              <Link
                key={i.to} to={i.to as never}
                className={cn(
                  "block rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors",
                  isActive ? "bg-sidebar-accent font-medium text-sidebar-foreground" : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                {i.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
