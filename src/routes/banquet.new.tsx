import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, PartyPopper, Calendar, Users, DollarSign, Sparkles } from "lucide-react";
import { Badge, Btn, Card, Field, Input, KV, PageHeader, Select, SuccessModal } from "@/components/kit";
import { money, today, uid, update, useDB } from "@/lib/store";
import type { BanquetEvent } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/banquet/new")({
  head: () => ({ meta: [{ title: "New Banquet Event — MAYRA Hotel ERP" }] }),
  component: NewBanquetPage,
});

const EVENT_TYPES = ["Wedding", "Reception", "Birthday Party", "Corporate Conference", "Engagement", "Anniversary", "Product Launch"];

function NewBanquetPage() {
  const db = useDB();
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    customer: "",
    phone: "",
    date: today(),
    time: "18:30",
    guests: "100",
    hallId: db.halls[0]?.id ?? "",
    packageId: db.banquetPackages[0]?.id ?? "",
    eventType: "Wedding",
    decoration: "15000",
    otherCharges: "5000",
    discount: "0",
    advance: "25000",
    notes: "",
  });

  const [createdEvent, setCreatedEvent] = useState<BanquetEvent | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const selectedHall = db.halls.find((h) => h.id === form.hallId);
  const selectedPackage = db.banquetPackages.find((p) => p.id === form.packageId);

  const paxTotal = +form.guests * (selectedPackage?.perPerson ?? 1200);
  const totalAmount = paxTotal + +form.decoration + +form.otherCharges - +form.discount;
  const balanceDue = totalAmount - +form.advance;

  function handleSave() {
    if (!form.name.trim() || !form.customer.trim() || !form.phone.trim()) {
      toast.error("Please fill in event name, customer name and phone number");
      return;
    }

    let ev!: BanquetEvent;
    update((d) => {
      const code = `EVT-${String((d.counters.event ?? 5200) + 1).padStart(4, "0")}`;
      d.counters.event = (d.counters.event ?? 5200) + 1;
      ev = {
        id: uid("ev"),
        code,
        name: form.name,
        customer: form.customer,
        phone: form.phone,
        date: form.date,
        time: form.time,
        guests: +form.guests,
        hallId: form.hallId,
        packageId: form.packageId,
        decoration: +form.decoration,
        otherCharges: +form.otherCharges,
        discount: +form.discount,
        advance: +form.advance,
        status: +form.advance > 0 ? "confirmed" : "enquiry",
        notes: form.notes,
      };
      d.events.unshift(ev);
    });

    setCreatedEvent(ev);
    toast.success(`Banquet event booked: ${ev.name}!`);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Btn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => nav({ to: "/banquet/events" })}>
          Back to Banquet Events
        </Btn>
        <span className="text-muted-foreground">|</span>
        <Badge tone="primary" className="shimmer-purple-badge px-3 py-1">Banquet Booking Wizard</Badge>
      </div>

      <PageHeader
        title="Book New Banquet & Event"
        subtitle="Hall reservation, food catering package, and advance deposit"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card title="1. Event & Customer Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event Title / Occasion" required className="sm:col-span-2">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Mehta Wedding Reception" />
              </Field>
              <Field label="Event Type">
                <Select value={form.eventType} onChange={(e) => set("eventType", e.target.value)} options={EVENT_TYPES.map((t) => ({ value: t, label: t }))} />
              </Field>
              <Field label="Expected Guests (Pax)" required>
                <Input type="number" min="10" value={form.guests} onChange={(e) => set("guests", e.target.value)} />
              </Field>
              <Field label="Customer / Host Name" required>
                <Input value={form.customer} onChange={(e) => set("customer", e.target.value)} placeholder="e.g. Ramesh Mehta" />
              </Field>
              <Field label="Contact Phone" required>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="10-digit phone" />
              </Field>
              <Field label="Event Date">
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </Field>
              <Field label="Start Time">
                <Input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card title="2. Hall Selection & Catering Package">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Select Banquet Hall</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {db.halls.map((h) => {
                    const isSelected = form.hallId === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => set("hallId", h.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm"
                            : "border-border hover:bg-secondary/60"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-sm">{h.name}</span>
                          <Badge tone={h.status === "available" ? "success" : "muted"}>{h.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Capacity: Up to {h.capacity} guests</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Select Catering & Food Package</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {db.banquetPackages.map((p) => {
                    const isSelected = form.packageId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => set("packageId", p.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm"
                            : "border-border hover:bg-secondary/60"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-sm">{p.name}</span>
                          <span className="text-sm font-bold text-primary">{money(p.perPerson)}/pax</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.inclusions}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          <Card title="3. Decor, Sound & Add-ons">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Decoration Charges (₹)">
                <Input type="number" min="0" value={form.decoration} onChange={(e) => set("decoration", e.target.value)} />
              </Field>
              <Field label="AV & Stage Setup (₹)">
                <Input type="number" min="0" value={form.otherCharges} onChange={(e) => set("otherCharges", e.target.value)} />
              </Field>
              <Field label="Special Discount (₹)">
                <Input type="number" min="0" value={form.discount} onChange={(e) => set("discount", e.target.value)} />
              </Field>
            </div>
            <Field label="Special Setup Instructions & Notes" className="mt-3">
              <Input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. Stage floral arrangement, 2 wireless mics, DJ setup" />
            </Field>
          </Card>
        </div>

        {/* Right Col: Commercials Summary */}
        <div>
          <Card title="Commercials & Deposit" className="sticky top-6 border-primary/30 shadow-lg">
            <div className="space-y-2.5 text-sm">
              <KV label="Hall Reserved" value={selectedHall?.name} />
              <KV label="Expected Guests" value={`${form.guests} Pax`} />
              <KV label="Catering Total" value={money(paxTotal)} />
              <KV label="Decor Charges" value={money(+form.decoration)} />
              <KV label="AV & Setup" value={money(+form.otherCharges)} />
              {+form.discount > 0 && <KV label="Discount" value={<span className="text-danger">- {money(+form.discount)}</span>} />}

              <div className="border-t-2 border-border/80 pt-3 flex items-center justify-between">
                <span className="text-base font-bold">Total Event Value:</span>
                <span className="text-xl font-bold text-primary">{money(totalAmount)}</span>
              </div>

              <div className="pt-3 border-t border-border space-y-3">
                <Field label="Advance Deposit Collected (₹)">
                  <Input type="number" min="0" value={form.advance} onChange={(e) => set("advance", e.target.value)} />
                </Field>
                <div className="flex justify-between items-center bg-secondary/60 p-2.5 rounded-lg text-xs font-semibold">
                  <span>Balance Payable:</span>
                  <span className={balanceDue > 0 ? "text-danger text-sm" : "text-success"}>{money(balanceDue)}</span>
                </div>
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
                Confirm Banquet Booking
              </Btn>
              <Btn
                variant="outline"
                size="md"
                className="w-full text-xs"
                onClick={() => nav({ to: "/banquet/events" })}
              >
                Cancel
              </Btn>
            </div>
          </Card>
        </div>
      </div>

      {createdEvent && (
        <SuccessModal
          open={!!createdEvent}
          onClose={() => nav({ to: "/banquet/events" })}
          title="Banquet Event Confirmed!"
          subtitle="Event code has been generated and hall slot is locked."
          details={[
            { label: "Event Code", value: createdEvent.code },
            { label: "Occasion", value: createdEvent.name },
            { label: "Date & Time", value: `${createdEvent.date} @ ${createdEvent.time}` },
            { label: "Hall", value: selectedHall?.name ?? "Hall" },
            { label: "Advance Received", value: money(createdEvent.advance) },
            { label: "Balance Due", value: money(totalAmount - createdEvent.advance) },
          ]}
          primaryAction={{
            label: "Open Banquet Event Details",
            icon: PartyPopper,
            onClick: () => nav({ to: `/banquet/${createdEvent.id}` as never }),
          }}
          secondaryAction={{
            label: "View All Banquet Events",
            onClick: () => nav({ to: "/banquet/events" }),
          }}
        />
      )}
    </div>
  );
}
