import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  CreditCard, ChefHat, CheckCircle, Clock, Printer, Receipt, Sparkles,
  UtensilsCrossed, AlertCircle, ShoppingBag, ArrowRight, UserCheck, Search
} from "lucide-react";
import {
  Badge, Btn, Card, DataTable, Field, Input, Modal, PageHeader, Select, StatCard, SuccessModal, Tabs
} from "@/components/kit";

import {
  fmtDate, money, orderTotals, posService, today, useDB
} from "@/lib/store";
import type { POSOrder } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/restaurant/billing")({
  head: () => ({ meta: [{ title: "Cashier & Billing Desk — MAYRA Hotel ERP" }] }),
  component: RestaurantBillingPage,
});

function RestaurantBillingPage() {
  const db = useDB();
  const nav = useNavigate();
  const [tab, setTab] = useState("ready");
  const [settleOrder, setSettleOrder] = useState<POSOrder | null>(null);
  const [payMode, setPayMode] = useState("UPI");
  const [roomBookingId, setRoomBookingId] = useState("");
  const [postRoomOpen, setPostRoomOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<POSOrder | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<{ number: string; kot: string; mode: string; location: string; total: number } | null>(null);

  // Orders Filtered
  const readyOrders = db.orders.filter((o) => (o.status === "kot" || o.status === "open") && o.kds === "ready");
  const activeOrders = db.orders.filter((o) => (o.status === "kot" || o.status === "open"));
  const preparingOrders = db.orders.filter((o) => (o.status === "kot" || o.status === "open") && o.kds === "preparing");
  const settledOrders = db.orders.filter((o) => o.status === "settled" || o.status === "posted");

  const inHouseBookings = db.bookings.filter((b) => b.status === "checked-in");

  const todaySettledTotal = settledOrders.reduce((sum, o) => sum + orderTotals(o, db).total, 0);

  const TABS = [
    { value: "ready", label: "Ready for Billing (Kitchen Done)", count: readyOrders.length },
    { value: "active", label: "All Active Orders", count: activeOrders.length },
    { value: "preparing", label: "Kitchen Preparing", count: preparingOrders.length },
    { value: "settled", label: "Settled Today", count: settledOrders.length },
  ];

  const listMap: Record<string, POSOrder[]> = {
    ready: readyOrders,
    active: activeOrders,
    preparing: preparingOrders,
    settled: settledOrders,
  };
  const currentList = listMap[tab] ?? readyOrders;

  function handleDirectSettle() {
    if (!settleOrder) return;
    const totals = orderTotals(settleOrder, db);
    const table = db.tables.find((t) => t.id === settleOrder.tableId);
    posService.settle(settleOrder.id, payMode);
    toast.success(`Order #${settleOrder.number} settled via ${payMode}`);
    setSuccessReceipt({
      number: settleOrder.number,
      kot: settleOrder.kot || "—",
      mode: `Settled via ${payMode}`,
      location: table ? table.name : settleOrder.mode,
      total: totals.total,
    });
    setSettleOrder(null);
  }

  function handlePostToRoom() {
    if (!settleOrder || !roomBookingId) {
      toast.error("Please select a room to post charge");
      return;
    }
    const totals = orderTotals(settleOrder, db);
    const booking = db.bookings.find((b) => b.id === roomBookingId);
    const guest = db.guests.find((g) => g.id === booking?.guestId);
    const room = db.rooms.find((r) => r.id === booking?.roomIds[0]);

    posService.postToRoom(settleOrder.id, roomBookingId);
    toast.success(`Order #${settleOrder.number} posted to Room ${room?.number}`);
    setSuccessReceipt({
      number: settleOrder.number,
      kot: settleOrder.kot || "—",
      mode: `Posted to Room Folio (${room?.number})`,
      location: `Room ${room?.number} (${guest?.name})`,
      total: totals.total,
    });
    setPostRoomOpen(false);
    setSettleOrder(null);
    setRoomBookingId("");
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Restaurant Billing & Cashier Desk"
        subtitle="Automatic queue of orders prepared by kitchen ready for settlement & room posting"
        actions={
          <div className="flex items-center gap-2">
            <Btn size="sm" icon={ChefHat} onClick={() => nav({ to: "/restaurant/kds" })}>
              Open Kitchen Display (KDS)
            </Btn>
            <Btn variant="primary" size="sm" icon={UtensilsCrossed} className="shimmer-gold" onClick={() => nav({ to: "/pos" })}>
              + New POS Order
            </Btn>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ready for Billing"
          value={readyOrders.length}
          sub="Kitchen marked prepared"
          tone={readyOrders.length > 0 ? "success" : "muted"}
        />
        <StatCard
          label="In Preparation"
          value={preparingOrders.length}
          sub="Live in kitchen"
          tone="info"
        />
        <StatCard
          label="Today's Settled Orders"
          value={settledOrders.length}
          sub="Completed transactions"
          tone="primary"
        />
        <StatCard
          label="Total F&B Collection"
          value={money(todaySettledTotal)}
          sub="Cash, UPI, Card & Room Folio"
          tone="success"
        />
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {/* Orders Grid / Table */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {currentList.map((order) => {
          const totals = orderTotals(order, db);
          const table = db.tables.find((t) => t.id === order.tableId);
          const isReady = order.kds === "ready";
          const isSettled = order.status === "settled" || order.status === "posted";

          return (
            <div
              key={order.id}
              className={`rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                isReady && !isSettled ? "border-emerald-500/80 ring-2 ring-emerald-500/20 bg-emerald-50/10" : "border-border"
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-primary">#{order.number}</span>
                      {order.kot && <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-mono">{order.kot}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <span>{table ? `Table ${table.name}` : order.mode}</span>
                      <span>·</span>
                      <span>{order.waiter || "Captain"}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    {isReady && !isSettled && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold animate-pulse">
                        <Sparkles className="h-3 w-3" /> Ready for Bill
                      </span>
                    )}
                    {order.kds === "preparing" && !isSettled && (
                      <Badge tone="info">Preparing</Badge>
                    )}
                    {order.kds === "new" && !isSettled && (
                      <Badge tone="warning">New KOT</Badge>
                    )}
                    {isSettled && (
                      <Badge tone="success">{order.paymentMode ? `Settled (${order.paymentMode})` : "Posted to Room"}</Badge>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="py-3 space-y-1.5">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="font-medium text-foreground">
                        {it.qty} × {it.name}
                      </span>
                      <span className="text-muted-foreground">{money(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer: Commercials & Action Buttons */}
              <div className="border-t border-border/60 pt-3 mt-2 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Total Bill (incl. 5% GST):</span>
                  <span className="text-lg font-bold text-foreground">{money(totals.total)}</span>
                </div>

                {!isSettled ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Btn
                      variant="primary"
                      size="sm"
                      icon={CreditCard}
                      className={isReady ? "shimmer-gold font-bold shadow-md" : ""}
                      onClick={() => setSettleOrder(order)}
                    >
                      Settle Bill
                    </Btn>
                    <Btn
                      size="sm"
                      icon={UserCheck}
                      onClick={() => {
                        setSettleOrder(order);
                        setPostRoomOpen(true);
                      }}
                    >
                      Post to Room
                    </Btn>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Btn size="sm" icon={Printer} onClick={() => setPrintOrder(order)}>
                      Print Receipt
                    </Btn>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {currentList.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-xl border border-dashed border-border p-8 bg-secondary/30">
            <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h3 className="font-semibold text-base">No orders in this queue</h3>
            <p className="text-xs text-muted-foreground mt-1">
              When kitchen marks an order as "Ready", it will automatically appear here for instant settlement.
            </p>
          </div>
        )}
      </div>

      {/* Settle Bill Modal */}
      <Modal
        open={Boolean(settleOrder && !postRoomOpen)}
        onClose={() => setSettleOrder(null)}
        title={`Settle Restaurant Bill · #${settleOrder?.number}`}
        footer={
          <>
            <Btn onClick={() => setSettleOrder(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleDirectSettle}>Confirm Settlement</Btn>
          </>
        }
      >
        {settleOrder && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-1.5 text-xs font-semibold text-slate-700">
              <div className="flex justify-between">
                <span>Total Bill Amount</span>
                <span className="font-bold text-slate-900">{money(orderTotals(settleOrder, db).subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (5%)</span>
                <span>{money(orderTotals(settleOrder, db).tax)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-1 text-sm">
                <span>Net Payable</span>
                <span className="text-purple-700">{money(orderTotals(settleOrder, db).total)}</span>
              </div>
            </div>

            <Field label="Payment Mode">
              <div className="grid grid-cols-2 gap-2">
                {["Cash", "UPI", "Card", "Bank Transfer"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPayMode(m)}
                    className={`rounded-xl border py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      payMode === m ? "border-purple-600 bg-purple-50 text-purple-900 shadow-2xs" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}
      </Modal>

      {/* Post to Room Modal */}
      <Modal
        open={Boolean(settleOrder && postRoomOpen)}
        onClose={() => { setPostRoomOpen(false); setSettleOrder(null); }}
        title="Post to In-House Guest Room"
        footer={
          <>
            <Btn onClick={() => { setPostRoomOpen(false); setSettleOrder(null); }}>Cancel</Btn>
            <Btn variant="primary" onClick={handlePostToRoom} disabled={!roomBookingId}>
              Transfer to Room Folio
            </Btn>
          </>
        }
      >
        {settleOrder && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 font-semibold">
              Bill amount <span className="font-bold text-slate-900">{money(orderTotals(settleOrder, db).total)}</span> will be posted to the guest's room folio.
            </div>

            <Field label="Select In-House Room / Guest">
              <Select
                value={roomBookingId}
                onChange={(e) => setRoomBookingId(e.target.value)}
                options={[
                  { value: "", label: "— Choose In-House Room —" },
                  ...inHouseBookings.map((b) => {
                    const g = db.guests.find((x) => x.id === b.guestId);
                    const r = db.rooms.find((x) => x.id === b.roomIds[0]);
                    return { value: b.id, label: `Room ${r?.number || "—"} · ${g?.name || "Guest"}` };
                  }),
                ]}
              />
            </Field>
          </div>
        )}
      </Modal>

      {/* Print Bill Receipt Modal */}
      <Modal
        open={Boolean(printOrder)}
        onClose={() => setPrintOrder(null)}
        title="Restaurant Cash Receipt"
        footer={
          <>
            <Btn size="sm" onClick={() => setPrintOrder(null)}>Close</Btn>
            <Btn variant="primary" size="sm" icon={Printer} onClick={() => window.print()}>Print Receipt</Btn>
          </>
        }
      >
        {printOrder && (
          <div className="rounded-xl border border-slate-200 p-4 bg-white text-slate-900 font-mono text-xs space-y-3">
            <div className="text-center border-b border-slate-100 pb-2">
              <h2 className="text-base font-bold">MAYRA HOTEL & RESTAURANT</h2>
              <p className="text-[10px] text-slate-500">Civil Lines, Jaipur · GSTIN: 08AAACH1234F1Z8</p>
              <p className="text-[10px] text-slate-500">Ph: +91 98765 43210</p>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-2 text-[11px]">
              <div>
                <p>Order: #{printOrder.number}</p>
                <p>Date: {fmtDate(today())}</p>
              </div>
              <div className="text-right">
                <p>KOT: {printOrder.kot || "—"}</p>
                <p>Mode: {printOrder.paymentMode || printOrder.mode}</p>
              </div>
            </div>

            <div className="space-y-1 border-b border-slate-100 pb-2">
              {printOrder.items.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span>{it.name} × {it.qty}</span>
                  <span>₹{(it.price * it.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-right text-[11px]">
              <div className="flex justify-between"><span>Subtotal:</span><span>₹{orderTotals(printOrder, db).subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>CGST (2.5%):</span><span>₹{(orderTotals(printOrder, db).tax / 2).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>SGST (2.5%):</span><span>₹{(orderTotals(printOrder, db).tax / 2).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-sm border-t border-slate-200 pt-1">
                <span>Grand Total:</span>
                <span className="text-purple-700">₹{orderTotals(printOrder, db).total.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-slate-100 text-[10px] text-slate-400">
              <p>Thank you for dining with us!</p>
              <p>Please visit again.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Success Modal */}
      {successReceipt && (
        <SuccessModal
          open={!!successReceipt}
          onClose={() => setSuccessReceipt(null)}
          title="Bill Settled Successfully!"
          subtitle={`Order #${successReceipt.number} · ${successReceipt.mode}`}
          details={[
            { label: "Order Number", value: successReceipt.number },
            { label: "KOT Reference", value: successReceipt.kot },
            { label: "Table / Destination", value: successReceipt.location },
            { label: "Settlement Mode", value: successReceipt.mode },
            { label: "Total Amount", value: money(successReceipt.total) },
          ]}
          primaryAction={{
            label: "Open Kitchen Display",
            icon: ChefHat,
            onClick: () => {
              setSuccessReceipt(null);
              nav({ to: "/restaurant/kds" });
            },
          }}
          secondaryAction={{
            label: "Back to POS",
            onClick: () => {
              setSuccessReceipt(null);
              nav({ to: "/pos" });
            },
          }}
        />
      )}
    </div>
  );
}
