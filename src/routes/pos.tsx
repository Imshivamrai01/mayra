import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ShoppingCart, Plus, Minus, X, Send, Printer, CreditCard, ChefHat, Sparkles } from "lucide-react";
import { Badge, Btn, Field, Input, PageHeader, SearchInput, Select, Tabs, SuccessModal } from "@/components/kit";
import { inventoryService, money, orderTotals, posService, today, useDB } from "@/lib/store";
import type { MenuItem, OrderItem, OrderMode, POSOrder } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/pos")({
  head: () => ({ meta: [{ title: "POS — MAYRA Hotel ERP" }] }),
  component: POSPage,
});

const MODES: OrderMode[] = ["Dine In", "Takeaway", "Room Charge", "Banquet", "Complimentary"];
const VEG_COLOR = "border-success text-success";
const NVEG_COLOR = "border-danger text-danger";

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="flex w-full items-start gap-2 rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border text-[9px] font-bold ${item.veg ? VEG_COLOR : NVEG_COLOR}`}>
        {item.veg ? "V" : "N"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium leading-tight">{item.name}</div>
        <div className="text-xs text-muted-foreground mt-0.5">₹{item.price}</div>
      </div>
    </button>
  );
}

function CartItem({ item, onQty, onRemove }: { item: OrderItem; onQty: (delta: number) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border/60 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.name}</div>
        <div className="text-xs text-muted-foreground">₹{item.price} × {item.qty}</div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onQty(-1)} className="flex h-6 w-6 items-center justify-center rounded border border-border hover:bg-secondary"><Minus className="h-3 w-3" /></button>
        <span className="w-5 text-center text-sm font-semibold tabular-nums">{item.qty}</span>
        <button onClick={() => onQty(1)} className="flex h-6 w-6 items-center justify-center rounded border border-border hover:bg-secondary"><Plus className="h-3 w-3" /></button>
        <button onClick={onRemove} className="ml-1 flex h-6 w-6 items-center justify-center rounded text-danger hover:bg-danger/10"><X className="h-3 w-3" /></button>
      </div>
    </div>
  );
}

function POSPage() {
  const db = useDB();
  const nav = useNavigate();
  const [mode, setMode] = useState<OrderMode>("Dine In");
  const [category, setCategory] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tableId, setTableId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [waiter, setWaiter] = useState("Captain Rajesh");
  const [payOpen, setPayOpen] = useState(false);
  const [payMode, setPayMode] = useState("UPI");
  const [successOrder, setSuccessOrder] = useState<{ number: string; kot?: string; total: number; mode: string; location: string } | null>(null);

  const categories = ["All", ...new Set(db.menu.map((m) => m.category))];

  const filteredMenu = useMemo(() => {
    return db.menu.filter((m) => {
      if (!m.active) return false;
      if (category !== "All" && m.category !== category) return false;
      if (searchQ && !m.name.toLowerCase().includes(searchQ.toLowerCase())) return false;
      return true;
    });
  }, [db.menu, category, searchQ]);

  function addItem(m: MenuItem) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.menuItemId === m.id);
      if (idx >= 0) {
        return prev.map((it, i) => i === idx ? { ...it, qty: it.qty + 1 } : it);
      }
      return [...prev, { id: m.id, menuItemId: m.id, name: m.name, price: m.price, qty: 1, modifiers: [] }];
    });
  }

  function updateQty(id: string, delta: number) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter((i) => i.qty > 0));
  }

  function removeItem(id: string) { setItems((prev) => prev.filter((i) => i.id !== id)); }

  const mockOrder: Partial<POSOrder> = { items, discount, mode };
  const totals = orderTotals(mockOrder as POSOrder, db);

  function sendKOT() {
    if (!items.length) { toast.error("Add items first"); return; }
    const order = posService.createOrder({ mode, tableId: tableId || undefined, waiter, items, discount });
    posService.sendKOT(order.id);
    const table = db.tables.find((t) => t.id === tableId);
    toast.success(`KOT ${order.kot} sent to Kitchen`);
    setSuccessOrder({
      number: order.number,
      kot: order.kot,
      total: totals.total,
      mode: "KOT Sent",
      location: table ? table.name : "Direct Order",
    });
    setItems([]);
    setDiscount(0);
  }

  function settle() {
    if (!items.length) { toast.error("Cart is empty"); return; }
    const order = posService.createOrder({ mode, tableId: tableId || undefined, bookingId: bookingId || undefined, waiter, items, discount });
    posService.sendKOT(order.id);

    const table = db.tables.find((t) => t.id === tableId);
    const booking = db.bookings.find((b) => b.id === bookingId);
    const guest = db.guests.find((g) => g.id === booking?.guestId);

    if (mode === "Room Charge" && bookingId) {
      posService.postToRoom(order.id, bookingId);
      toast.success("Order posted to room folio");
      setSuccessOrder({
        number: order.number,
        kot: order.kot,
        total: totals.total,
        mode: "Room Folio Charge",
        location: `Room ${db.rooms.find((r) => r.id === booking?.roomIds[0])?.number ?? "—"} (${guest?.name ?? "Guest"})`,
      });
    } else {
      posService.settle(order.id, payMode);
      toast.success(`Order settled · ${payMode}`);
      setSuccessOrder({
        number: order.number,
        kot: order.kot,
        total: totals.total,
        mode: `Settled via ${payMode}`,
        location: table ? table.name : "Direct Order",
      });
    }
    setItems([]);
    setDiscount(0);
    setPayOpen(false);
    setBookingId("");
  }

  const inHouseBookings = db.bookings.filter((b) => b.status === "checked-in");

  return (
    <div className="flex h-[calc(100vh-120px)] gap-3 overflow-hidden">
      <SuccessModal
        open={!!successOrder}
        onClose={() => setSuccessOrder(null)}
        title="Order Processed Successfully!"
        subtitle={`Order #${successOrder?.number} · ${successOrder?.mode}`}
        details={[
          { label: "Order Number", value: successOrder?.number ?? "ORD" },
          ...(successOrder?.kot ? [{ label: "KOT Number", value: successOrder.kot }] : []),
          { label: "Location / Room", value: successOrder?.location ?? "Direct" },
          { label: "Order Status", value: successOrder?.mode ?? "Confirmed" },
          { label: "Total Amount", value: money(successOrder?.total ?? 0) },
        ]}
        primaryAction={{
          label: "Open Kitchen Display (KDS)",
          icon: ChefHat,
          onClick: () => {
            setSuccessOrder(null);
            nav({ to: "/restaurant/kds" });
          },
        }}
        secondaryAction={{
          label: "View All Restaurant Orders",
          onClick: () => {
            setSuccessOrder(null);
            nav({ to: "/restaurant/orders" });
          },
        }}
      />
      {/* Left: Categories + Menu */}
      <div className="flex flex-col flex-1 min-w-0 gap-3 overflow-hidden">
        {/* Mode & Table selection */}
        <div className="flex flex-wrap items-center gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground border-transparent" : "border-border hover:bg-secondary"}`}
            >
              {m}
            </button>
          ))}
          {mode === "Dine In" && (
            <Select value={tableId} onChange={(e) => setTableId(e.target.value)} options={[{ value: "", label: "No Table" }, ...db.tables.map((t) => ({ value: t.id, label: `${t.name} (${t.status})` }))]} className="h-8 w-40 text-xs" />
          )}
          {mode === "Room Charge" && (
            <Select value={bookingId} onChange={(e) => setBookingId(e.target.value)} options={[{ value: "", label: "Select Room" }, ...inHouseBookings.map((b) => { const g = db.guests.find((x) => x.id === b.guestId); const r = db.rooms.find((x) => x.id === b.roomIds[0]); return { value: b.id, label: `${r?.number} - ${g?.name}` }; })]} className="h-8 w-48 text-xs" />
          )}
        </div>

        {/* Search */}
        <SearchInput value={searchQ} onChange={setSearchQ} placeholder="Search menu…" />

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Menu items grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMenu.map((m) => (
              <MenuItemCard key={m.id} item={m} onAdd={() => addItem(m)} />
            ))}
            {filteredMenu.length === 0 && (
              <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No items found</div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="flex w-72 flex-shrink-0 flex-col rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <ShoppingCart className="h-4 w-4" />
            <span className="text-sm font-semibold">Cart</span>
            {items.length > 0 && <Badge tone="primary">{items.reduce((s, i) => s + i.qty, 0)}</Badge>}
          </div>
          {items.length > 0 && <button onClick={() => setItems([])} className="text-xs text-danger hover:underline">Clear</button>}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Add items to order</div>
          ) : (
            <div>
              {items.map((item) => (
                <CartItem key={item.id} item={item} onQty={(d) => updateQty(item.id, d)} onRemove={() => removeItem(item.id)} />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border p-3 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{money(totals.subtotal)}</span></div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">Discount</span>
            <input type="number" min="0" value={discount} onChange={(e) => setDiscount(+e.target.value)} className="h-7 w-20 rounded border border-border px-2 text-right text-xs focus:border-primary outline-none" />
          </div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax (5%)</span><span>{money(totals.tax)}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span className="text-base">{money(totals.total)}</span></div>
          <div className="space-y-2 pt-1">
            <Btn className="w-full" size="sm" icon={ChefHat} onClick={sendKOT} disabled={!items.length}>Send KOT</Btn>
            <Btn className="w-full" variant="primary" size="sm" icon={CreditCard} onClick={() => { if (!items.length) { toast.error("Cart empty"); return; } if (mode === "Room Charge") { settle(); } else setPayOpen(true); }} disabled={!items.length}>
              {mode === "Room Charge" ? "Post to Room" : "Settle Bill"}
            </Btn>
          </div>
        </div>
      </div>

      {/* Payment modal */}
      {payOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-pop)]">
            <h4 className="mb-4 font-semibold">Settle Bill · {money(totals.total)}</h4>
            <div className="space-y-3">
              <div className="text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(totals.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>- {money(totals.discount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{money(totals.tax)}</span></div>
                <div className="flex justify-between font-semibold border-t border-border pt-1"><span>Grand Total</span><span className="text-base">{money(totals.total)}</span></div>
              </div>
              <Field label="Payment Mode">
                <div className="grid grid-cols-2 gap-2">
                  {["Cash", "UPI", "Card", "Bank Transfer"].map((m) => (
                    <button key={m} onClick={() => setPayMode(m)} className={`rounded-md border py-2 text-sm font-medium transition-colors ${payMode === m ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"}`}>{m}</button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Btn onClick={() => setPayOpen(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={settle}>Confirm Payment</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
