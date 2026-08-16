import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, LogIn, LogOut, Search, ArrowRightLeft } from "lucide-react";
import { Badge, Btn, Card, PageHeader, StatCard, Tabs } from "@/components/kit";
import { bookingService, dashboardMetrics, fmtDate, fmtTime, guestOf, money, today, useDB, folioTotals } from "@/lib/store";
import type { Booking } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/front-desk")({
  head: () => ({ meta: [{ title: "Front Desk — MAYRA Hotel ERP" }] }),
  component: FrontDesk,
});

const STATUS_TONE: Record<string, string> = {
  confirmed: "info", "checked-in": "success", "checked-out": "muted", cancelled: "danger",
};

function BookingRow({ b, actions }: { b: Booking; actions?: React.ReactNode }) {
  const db = useDB();
  const g = guestOf(b, db);
  const rooms = b.roomIds.map((id) => db.rooms.find((r) => r.id === id)?.number ?? "—").join(", ");
  const t = folioTotals(b, db);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 hover:border-purple-300 hover:shadow-xs transition-all">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-sm">{g?.name ?? "—"}</span>
          {g?.vip && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">★ VIP</span>}
          <Badge tone={STATUS_TONE[b.status] ?? "muted"}>{b.status}</Badge>
        </div>
        <div className="mt-1 text-xs font-semibold text-slate-500">
          <span className="font-mono text-purple-700 font-bold">{b.id}</span> · Room <span className="text-slate-900 font-bold">{rooms}</span> · {b.nights}N · {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
          {b.checkInTime && <span> · CI: {fmtTime(b.checkInTime)}</span>}
        </div>
        {t.balance > 0 && <div className="mt-1 text-xs text-rose-600 font-bold">Balance: {money(t.balance)}</div>}
      </div>
      {actions}
    </div>
  );
}


function FrontDesk() {
  const db = useDB();
  const nav = useNavigate();
  const [tab, setTab] = useState("arrivals");
  const m = dashboardMetrics(db);
  const d = today();

  const arrivals = db.bookings.filter((b) => b.checkIn === d && b.status === "confirmed");
  const departures = db.bookings.filter((b) => b.checkOut === d && b.status === "checked-in");
  const inHouse = db.bookings.filter((b) => b.status === "checked-in");
  const walkIns = db.bookings.filter((b) => b.source === "Walk-in" && b.checkIn === d);
  const pending = db.bookings.filter((b) => b.status === "confirmed" && b.checkIn <= d);

  const TABS = [
    { value: "arrivals", label: "Arrivals", count: arrivals.length },
    { value: "departures", label: "Departures", count: departures.length },
    { value: "inhouse", label: "In-House", count: inHouse.length },
    { value: "walkins", label: "Walk-ins", count: walkIns.length },
    { value: "pending", label: "Pending", count: pending.length },
  ];

  const listMap: Record<string, Booking[]> = {
    arrivals, departures, inhouse: inHouse, walkins: walkIns, pending,
  };
  const currentList = listMap[tab] ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Front Desk"
        subtitle="Today's operations overview"
        actions={
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" icon={UserPlus} variant="primary" onClick={() => nav({ to: "/reservations" as never })}>New Booking</Btn>
            <Btn size="sm" icon={LogIn} onClick={() => nav({ to: "/check-in" as never })}>Check-in</Btn>
            <Btn size="sm" icon={LogOut} onClick={() => nav({ to: "/check-out" as never })}>Check-out</Btn>
            <Btn size="sm" icon={Search} onClick={() => nav({ to: "/guests" as never })}>Search Guest</Btn>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Arrivals Today" value={m.arrivals} tone="info" sub="Confirmed" onClick={() => setTab("arrivals")} />
        <StatCard label="Departures Today" value={m.departures} tone="warning" sub="Due checkout" onClick={() => setTab("departures")} />
        <StatCard label="In-House" value={m.inHouse} tone="primary" sub="Currently staying" onClick={() => setTab("inhouse")} />
        <StatCard label="Available Rooms" value={m.available} tone="success" sub="Ready to sell" />
        <StatCard label="Pending Bills" value={m.pendingBills} tone="danger" sub={money(m.pendingAmount)} onClick={() => nav({ to: "/folios" as never })} />
      </div>

      <Card>
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
        <div className="mt-4 space-y-2">
          {currentList.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No bookings in this category</div>
          ) : (
            currentList.map((b) => (
              <BookingRow
                key={b.id}
                b={b}
                actions={
                  <div className="flex gap-1.5">
                    {tab === "arrivals" && (
                      <Btn size="sm" variant="primary" icon={LogIn} onClick={() => { bookingService.checkIn(b.id); toast.success(`Checked in ${guestOf(b, db)?.name}`); }}>
                        Check-in
                      </Btn>
                    )}
                    {tab === "departures" && (
                      <Btn size="sm" variant="success" icon={LogOut} onClick={() => nav({ to: "/check-out" as never })}>
                        Checkout
                      </Btn>
                    )}
                    {tab === "inhouse" && (
                      <>
                        <Btn size="sm" icon={ArrowRightLeft} onClick={() => toast.info("Room change — use Reservations > Edit")}>Room Change</Btn>
                        <Btn size="sm" variant="ghost" onClick={() => nav({ to: "/folios" as never })}>Folio</Btn>
                      </>
                    )}
                    {tab === "pending" && (
                      <Btn size="sm" variant="primary" icon={LogIn} onClick={() => { bookingService.checkIn(b.id); toast.success(`Checked in ${guestOf(b, db)?.name}`); }}>
                        Check-in
                      </Btn>
                    )}
                  </div>
                }
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
