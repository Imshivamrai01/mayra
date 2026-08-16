import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Shirt, Plus, Trash2, Zap } from "lucide-react";
import { Badge, Btn, Card, Field, Input, KV, PageHeader, Select, SuccessModal } from "@/components/kit";
import { money, today, uid, update, useDB } from "@/lib/store";
import type { LaundryOrder } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/laundry/new")({
  head: () => ({ meta: [{ title: "New Laundry Order — MAYRA Hotel ERP" }] }),
  component: NewLaundryPage,
});

const LAUNDRY_CATALOG: { name: string; category: string; rate: number }[] = [
  { name: "Executive Shirt", category: "Apparel", rate: 50 },
  { name: "Trousers / Pants", category: "Apparel", rate: 60 },
  { name: "Complete Suit (2-piece)", category: "Apparel", rate: 150 },
  { name: "T-Shirt / Polo", category: "Apparel", rate: 40 },
  { name: "Saree / Ethnic Wear", category: "Apparel", rate: 90 },
  { name: "Salwar Kameez Set", category: "Apparel", rate: 70 },
  { name: "Winter Jacket / Coat", category: "Apparel", rate: 140 },
  { name: "Bed Linen / Sheet", category: "Linen", rate: 80 },
  { name: "Bath Towel (Large)", category: "Linen", rate: 40 },
  { name: "Duvet / Blanket", category: "Linen", rate: 120 },
];

function NewLaundryPage() {
  const db = useDB();
  const nav = useNavigate();

  const [bookingId, setBookingId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [express, setExpress] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const [items, setItems] = useState<{ name: string; qty: string; rate: number }[]>([
    { name: "Executive Shirt", qty: "2", rate: 50 },
    { name: "Trousers / Pants", qty: "1", rate: 60 },
  ]);

  const [createdOrder, setCreatedOrder] = useState<LaundryOrder | null>(null);

  const inHouseBookings = db.bookings.filter((b) => b.status === "checked-in");

  function handleBookingChange(id: string) {
    setBookingId(id);
    if (id) {
      const b = db.bookings.find((x) => x.id === id);
      const g = db.guests.find((x) => x.id === b?.guestId);
      const r = db.rooms.find((x) => x.id === b?.roomIds[0]);
      if (g) setGuestName(g.name);
      if (r) setRoomNo(r.number);
    }
  }

  function addItem() {
    setItems((prev) => [...prev, { name: "Executive Shirt", qty: "1", rate: 50 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, name: string, qty: string) {
    const catalogItem = LAUNDRY_CATALOG.find((c) => c.name === name);
    const rate = catalogItem?.rate ?? 50;
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { name, qty, rate } : it))
    );
  }

  const subtotal = items.reduce((s, it) => s + (+it.qty * it.rate), 0);
  const multiplier = express ? 1.5 : 1;
  const totalAmount = subtotal * multiplier;

  function handleSave() {
    const validItems = items.filter((i) => +i.qty > 0);
    const finalGuestName = guestName.trim();

    if (!finalGuestName || validItems.length === 0) {
      toast.error("Please specify guest name and add laundry items");
      return;
    }

    let order!: LaundryOrder;
    update((d) => {
      const num = `LND-${String((d.counters.laundry ?? 3200) + 1).padStart(4, "0")}`;
      d.counters.laundry = (d.counters.laundry ?? 3200) + 1;
      order = {
        id: uid("ln"),
        number: num,
        bookingId: bookingId || undefined,
        guestName: finalGuestName,
        roomNo: roomNo || undefined,
        items: validItems.map((i) => ({ name: i.name, qty: +i.qty, rate: i.rate })),
        status: "received",
        createdAt: new Date().toISOString(),
        postedToFolio: false,
        express,
      };
      d.laundry.unshift(order);
    });

    setCreatedOrder(order);
    toast.success(`Laundry order created: ${order.number}!`);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Btn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => nav({ to: "/laundry/orders" })}>
          Back to Laundry Orders
        </Btn>
        <span className="text-muted-foreground">|</span>
        <Badge tone="primary" className="shimmer-gold-badge px-3 py-1">Laundry Service Intake</Badge>
      </div>

      <PageHeader
        title="Create New Laundry Order"
        subtitle="Intake guest laundry, allocate express turnaround, and charge to room folio"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card title="1. Guest & Room Linkage">
            <div className="space-y-3">
              <Field label="Link to In-House Guest Booking">
                <Select
                  value={bookingId}
                  onChange={(e) => handleBookingChange(e.target.value)}
                  options={[
                    { value: "", label: "Walk-in Guest / Outside Customer" },
                    ...inHouseBookings.map((b) => {
                      const g = db.guests.find((x) => x.id === b.guestId);
                      const r = db.rooms.find((x) => x.id === b.roomIds[0]);
                      return { value: b.id, label: `Room ${r?.number ?? "—"} · ${g?.name} (${b.id})` };
                    }),
                  ]}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Guest Name" required>
                  <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="e.g. Priyanshu Roy" />
                </Field>
                <Field label="Room Number">
                  <Input value={roomNo} onChange={(e) => setRoomNo(e.target.value)} placeholder="e.g. 204" />
                </Field>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-warning/40 bg-warning/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={express}
                    onChange={(e) => setExpress(e.target.checked)}
                    className="h-4 w-4 rounded text-warning focus:ring-warning"
                  />
                  <div>
                    <span className="font-bold text-sm text-warning-foreground flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-warning" /> Express 4-Hour Turnaround (1.5× Tariff)
                    </span>
                    <span className="text-xs text-muted-foreground block">Guaranteed express wash, iron & garment delivery within 4 hours</span>
                  </div>
                </label>
              </div>
            </div>
          </Card>

          <Card
            title="2. Laundry Garment Items"
            action={
              <Btn size="sm" variant="primary" icon={Plus} onClick={addItem}>
                Add Garment
              </Btn>
            }
          >
            <div className="space-y-3">
              {items.map((it, idx) => {
                const lineTotal = +it.qty * it.rate * multiplier;
                return (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border border-border bg-secondary/40">
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">Garment Type</label>
                      <Select
                        value={it.name}
                        onChange={(e) => updateItem(idx, e.target.value, it.qty)}
                        options={LAUNDRY_CATALOG.map((c) => ({
                          value: c.name,
                          label: `${c.name} (₹${c.rate})`,
                        }))}
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">Quantity</label>
                      <Input type="number" min="1" value={it.qty} onChange={(e) => updateItem(idx, it.name, e.target.value)} />
                    </div>
                    <div className="w-28 text-right sm:pt-4">
                      <div className="text-xs text-muted-foreground">Charge</div>
                      <div className="text-sm font-bold text-foreground">{money(lineTotal)}</div>
                    </div>
                    {items.length > 1 && (
                      <div className="sm:pt-4">
                        <Btn size="sm" variant="ghost" icon={Trash2} className="text-danger px-2" onClick={() => removeItem(idx)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div>
          <Card title="Order Summary" className="sticky top-6 border-primary/30 shadow-lg">
            <div className="space-y-3 text-sm">
              <KV label="Guest" value={guestName || "—"} />
              <KV label="Room" value={roomNo ? `Room ${roomNo}` : "Direct"} />
              <KV label="Items Count" value={`${items.reduce((s, it) => s + (+it.qty || 0), 0)} Pieces`} />
              <KV label="Service Tier" value={express ? <Badge tone="warning">⚡ Express 1.5×</Badge> : <Badge tone="muted">Standard</Badge>} />

              <div className="border-t-2 border-border/80 pt-3 flex items-center justify-between">
                <span className="text-base font-bold">Total Laundry Bill:</span>
                <span className="text-xl font-bold text-primary">{money(totalAmount)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Btn
                variant="primary"
                size="lg"
                className="w-full shadow-md font-bold shimmer-gold"
                icon={Check}
                onClick={handleSave}
              >
                Create Laundry Order
              </Btn>
              <Btn
                variant="outline"
                size="md"
                className="w-full text-xs"
                onClick={() => nav({ to: "/laundry/orders" })}
              >
                Cancel
              </Btn>
            </div>
          </Card>
        </div>
      </div>

      {createdOrder && (
        <SuccessModal
          open={!!createdOrder}
          onClose={() => nav({ to: "/laundry/orders" })}
          title="Laundry Order Created!"
          subtitle="Garment tracking tag has been generated and queued in laundry workflow."
          details={[
            { label: "Order Number", value: createdOrder.number },
            { label: "Guest", value: createdOrder.guestName },
            { label: "Total Garments", value: `${createdOrder.items.length} item types` },
            { label: "Total Amount", value: money(totalAmount) },
          ]}
          primaryAction={{
            label: "View All Laundry Orders",
            icon: Shirt,
            onClick: () => nav({ to: "/laundry/orders" }),
          }}
          secondaryAction={{
            label: "Return to Front Desk",
            onClick: () => nav({ to: "/front-desk" }),
          }}
        />
      )}
    </div>
  );
}
