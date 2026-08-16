import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge, Btn, DataTable, Field, Input, KV, PageHeader, Select, Tabs } from "@/components/kit";
import { laundryService, money, today, uid, update, useDB } from "@/lib/store";
import type { LaundryOrder } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/laundry/orders")({
  head: () => ({ meta: [{ title: "Laundry — MAYRA Hotel ERP" }] }),
  component: LaundryPage,
});

const STATUS_TONE: Record<string, string> = {
  received: "info", washing: "warning", ironing: "primary",
  ready: "success", delivered: "muted",
};
const STATUS_LIST: LaundryOrder["status"][] = ["received", "washing", "ironing", "ready", "delivered"];
const LAUNDRY_ITEMS = ["Shirt", "Trousers", "Suit", "Bedsheet", "Towel", "Curtain", "T-shirt", "Saree", "Salwar Kameez", "Jacket"];
const RATES: Record<string, number> = { Shirt: 50, Trousers: 60, Suit: 150, Bedsheet: 80, Towel: 40, Curtain: 100, "T-shirt": 40, Saree: 80, "Salwar Kameez": 70, Jacket: 120 };

function LaundryPage() {
  const db = useDB();
  const nav = useNavigate();
  const [tab, setTab] = useState("active");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ bookingId: "", guestName: "", roomNo: "", express: "no" });
  const [orderItems, setOrderItems] = useState([{ name: "Shirt", qty: "1" }]);

  const active = db.laundry.filter((l) => !["delivered"].includes(l.status));
  const delivered = db.laundry.filter((l) => l.status === "delivered");

  const TABS = [
    { value: "active", label: "Active", count: active.length },
    { value: "delivered", label: "Delivered", count: delivered.length },
    { value: "all", label: "All", count: db.laundry.length },
  ];
  const list = { active, delivered, all: db.laundry }[tab] ?? [];

  function createOrder() {
    const g = form.bookingId ? db.guests.find((g) => g.id === db.bookings.find((b) => b.id === form.bookingId)?.guestId) : null;
    const gName = g?.name ?? form.guestName;
    if (!gName) { toast.error("Guest name required"); return; }
    const validItems = orderItems.filter((i) => +i.qty > 0).map((i) => ({ name: i.name, qty: +i.qty, rate: RATES[i.name] ?? 50 }));
    if (!validItems.length) { toast.error("Add at least one item"); return; }
    update((d) => {
      const n = `LND-${String((d.counters.laundry ?? 1000) + 1).padStart(4, "0")}`;
      d.counters.laundry = (d.counters.laundry ?? 1000) + 1;
      const booking = d.bookings.find((b) => b.id === form.bookingId);
      d.laundry.unshift({
        id: uid("ln"), number: n,
        bookingId: form.bookingId || undefined,
        guestName: gName,
        roomNo: booking ? d.rooms.find((r) => r.id === booking.roomIds[0])?.number : form.roomNo || undefined,
        items: validItems,
        status: "received",
        createdAt: new Date().toISOString(),
        postedToFolio: false,
        express: form.express === "yes",
      });
    });
    toast.success("Laundry order created");
    setCreateOpen(false);
    setForm({ bookingId: "", guestName: "", roomNo: "", express: "no" });
    setOrderItems([{ name: "Shirt", qty: "1" }]);
  }

  function advance(id: string) {
    const l = db.laundry.find((x) => x.id === id);
    if (!l) return;
    const idx = STATUS_LIST.indexOf(l.status);
    if (idx < STATUS_LIST.length - 1) {
      laundryService.move(id, STATUS_LIST[idx + 1]!);
      toast.success("Status updated");
    }
  }

  function postToFolio(id: string) {
    laundryService.postToFolio(id);
    toast.success("Posted to guest folio");
  }

  const total = (l: LaundryOrder) => l.items.reduce((s, i) => s + i.qty * i.rate, 0) * (l.express ? 1.5 : 1);

  const inHouseBookings = db.bookings.filter((b) => b.status === "checked-in");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Laundry"
        subtitle={`${active.length} active orders`}
        actions={<Btn variant="primary" size="sm" icon={Plus} className="shimmer-gold font-semibold shadow-sm" onClick={() => nav({ to: "/laundry/new" as never })}>New Laundry Order</Btn>}
      />

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <DataTable
        rows={list}
        searchKeys={["number", "guestName", "roomNo"]}
        columns={[
          { key: "number", label: "Order No", render: (l) => <span className="font-mono text-xs">{l.number}</span> },
          { key: "guestName", label: "Guest", render: (l) => (
            <span className="flex items-center gap-1.5">
              {l.guestName}
              {l.express && <Badge tone="warning">Express</Badge>}
            </span>
          )},
          { key: "roomNo", label: "Room", render: (l) => l.roomNo ? `Room ${l.roomNo}` : "—" },
          { key: "items", label: "Items", render: (l) => l.items.map((i) => `${i.qty}× ${i.name}`).join(", ") },
          { key: "total", label: "Total", align: "right", render: (l) => money(total(l)) },
          { key: "folio", label: "Folio", render: (l) => l.postedToFolio ? <Badge tone="success">Posted</Badge> : <Badge tone="muted">Pending</Badge> },
          { key: "status", label: "Status", render: (l) => <Badge tone={STATUS_TONE[l.status] ?? "muted"}>{l.status}</Badge> },
          { key: "actions", label: "", sortable: false, render: (l) => (
            <div className="flex gap-1">
              {l.status !== "delivered" && <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); advance(l.id); }}>Next</Btn>}
              {l.bookingId && !l.postedToFolio && <Btn size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); postToFolio(l.id); }}>Post to Folio</Btn>}
            </div>
          )},
        ]}
        pageSize={15}
      />

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 p-4">
          <div className="mt-10 w-full max-w-lg rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-pop)]">
            <h4 className="mb-4 font-semibold">New Laundry Order</h4>
            <div className="space-y-4">
              <Field label="Link to In-house Booking (optional)">
                <Select value={form.bookingId} onChange={(e) => setForm((f) => ({ ...f, bookingId: e.target.value }))} options={[{ value: "", label: "Walk-in / No booking" }, ...inHouseBookings.map((b) => { const g = db.guests.find((x) => x.id === b.guestId); const r = db.rooms.find((x) => x.id === b.roomIds[0]); return { value: b.id, label: `${r?.number} - ${g?.name}` }; })]} />
              </Field>
              {!form.bookingId && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Guest Name"><Input value={form.guestName} onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))} /></Field>
                  <Field label="Room No"><Input value={form.roomNo} onChange={(e) => setForm((f) => ({ ...f, roomNo: e.target.value }))} /></Field>
                </div>
              )}
              <Field label="Express Service (1.5× rate)">
                <Select value={form.express} onChange={(e) => setForm((f) => ({ ...f, express: e.target.value }))} options={[{ value: "no", label: "Standard" }, { value: "yes", label: "Express" }]} />
              </Field>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Items</span>
                  <Btn size="sm" onClick={() => setOrderItems((prev) => [...prev, { name: "Shirt", qty: "1" }])}>+ Add</Btn>
                </div>
                {orderItems.map((item, i) => (
                  <div key={i} className="mb-2 grid grid-cols-3 gap-2">
                    <Select className="col-span-2" value={item.name} onChange={(e) => setOrderItems((prev) => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} options={LAUNDRY_ITEMS.map((n) => ({ value: n, label: `${n} (₹${RATES[n]})` }))} />
                    <div className="flex gap-1">
                      <Input type="number" min="1" value={item.qty} onChange={(e) => setOrderItems((prev) => prev.map((x, idx) => idx === i ? { ...x, qty: e.target.value } : x))} />
                      <Btn size="sm" variant="ghost" onClick={() => setOrderItems((p) => p.filter((_, idx) => idx !== i))} className="text-danger px-1.5">✕</Btn>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Btn onClick={() => setCreateOpen(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={createOrder}>Create Order</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
