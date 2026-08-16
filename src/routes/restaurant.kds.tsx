import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Receipt, Sparkles, ChefHat } from "lucide-react";
import { Badge, Btn, PageHeader, Tabs } from "@/components/kit";
import { money, orderTotals, posService, useDB } from "@/lib/store";
import type { KdsStatus, POSOrder } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/restaurant/kds")({
  head: () => ({ meta: [{ title: "Kitchen Display — MAYRA Hotel ERP" }] }),
  component: KDSPage,
});

const KDS_STATUSES: KdsStatus[] = ["new", "preparing", "ready", "served"];
const KDS_META: Record<KdsStatus, { label: string; color: string; bg: string; action?: string; next?: KdsStatus }> = {
  new: { label: "NEW KOT", color: "text-danger", bg: "bg-danger/10 border-danger/30", action: "Start Preparing", next: "preparing" },
  preparing: { label: "IN PREPARATION", color: "text-warning", bg: "bg-warning/10 border-warning/30", action: "Mark Ready for Billing", next: "ready" },
  ready: { label: "READY FOR BILLING", color: "text-success", bg: "bg-success/10 border-success/30", action: "Mark Served / Complete", next: "served" },
  served: { label: "SERVED & SETTLED", color: "text-muted-foreground", bg: "bg-secondary border-border", action: undefined },
};

function KDSOrderCard({ order }: { order: POSOrder }) {
  const db = useDB();
  const nav = useNavigate();
  const meta = KDS_META[order.kds];
  const table = order.tableId ? db.tables.find((t) => t.id === order.tableId) : null;
  const booking = order.bookingId ? db.bookings.find((b) => b.id === order.bookingId) : null;
  const guest = booking ? db.guests.find((g) => g.id === booking.guestId) : null;
  const elapsed = Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000);

  function advance() {
    if (!meta.next) return;
    posService.setKds(order.id, meta.next);
    if (meta.next === "ready") {
      toast.success(`Order ${order.kot ?? order.number} is READY! Sent to Billing Desk.`);
    } else {
      toast.success(`Order ${order.kot ?? order.number} → ${KDS_META[meta.next].label}`);
    }
  }

  return (
    <div className={`rounded-lg border-2 p-3 ${meta.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold flex items-center gap-1.5">
            {order.kot ?? order.number}
            {order.kds === "ready" && <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-bold">At Cashier</span>}
          </div>
          <div className="text-xs text-muted-foreground">
            {table ? `Table ${table.name}` : order.mode}
            {guest ? ` · ${guest.name}` : ""}
          </div>
        </div>
        <div className="text-right">
          <Badge tone={elapsed > 20 ? "danger" : elapsed > 10 ? "warning" : "success"}>{elapsed}m</Badge>
        </div>
      </div>
      <div className="mt-2 space-y-1">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="font-medium">{item.qty}× {item.name}</span>
            {item.note && <span className="text-xs text-muted-foreground">({item.note})</span>}
          </div>
        ))}
      </div>
      {order.kds === "ready" ? (
        <div className="mt-3 space-y-1.5">
          <Btn size="sm" variant="success" className="w-full text-xs font-bold" onClick={() => nav({ to: "/restaurant/billing" })}>
            View at Billing Counter →
          </Btn>
          <Btn size="sm" variant="ghost" className="w-full text-xs" onClick={advance}>
            Mark Served
          </Btn>
        </div>
      ) : meta.action ? (
        <Btn size="sm" variant="primary" className="mt-3 w-full" onClick={advance}>{meta.action}</Btn>
      ) : null}
    </div>
  );
}

function KDSPage() {
  const db = useDB();
  const nav = useNavigate();
  const activeOrders = db.orders.filter((o) => ["kot", "open"].includes(o.status));
  const byStatus = KDS_STATUSES.reduce((acc, s) => {
    acc[s] = activeOrders.filter((o) => o.kds === s);
    return acc;
  }, {} as Record<KdsStatus, POSOrder[]>);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kitchen Display System (KDS)"
        subtitle="Real-time live queue: orders marked 'Ready' flow automatically to Restaurant Billing Counter"
        actions={
          <div className="flex items-center gap-2">
            <Btn variant="primary" size="sm" icon={Receipt} className="shimmer-gold" onClick={() => nav({ to: "/restaurant/billing" })}>
              Open Billing Counter ({byStatus.ready.length} Ready)
            </Btn>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KDS_STATUSES.map((s) => {
          const meta = KDS_META[s];
          return (
            <div key={s}>
              <div className={`mb-3 rounded-md px-3 py-2 text-center text-sm font-bold ${meta.color} ${meta.bg} border`}>
                {meta.label} ({byStatus[s].length})
              </div>
              <div className="space-y-3">
                {byStatus[s].map((o) => <KDSOrderCard key={o.id} order={o} />)}
                {byStatus[s].length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
