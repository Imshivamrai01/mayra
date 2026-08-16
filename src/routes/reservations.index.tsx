import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Printer, Eye, CheckCircle, XCircle, Edit, Download } from "lucide-react";
import {
  Badge, Btn, Card, ConfirmDialog, DataTable, Drawer, EmptyState,
  Field, Input, KV, PageHeader, Select, Tabs, exportCSV, PrintButton,
} from "@/components/kit";
import {
  bookingService, fmtDate, guestOf, guestService, money, nightsBetween,
  paymentService, roomLabel, today, uid, update, useDB, calcBooking, folioTotals, addDays, iso,
} from "@/lib/store";
import type { Booking, BookingSource, BookingStatus, Guest } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/reservations/")({
  head: () => ({ meta: [{ title: "Reservations — MAYRA Hotel ERP" }] }),
  component: ReservationsPage,
});

const STATUSES: BookingStatus[] = ["confirmed", "checked-in", "checked-out", "cancelled", "no-show"];
const SOURCES: BookingSource[] = [
  "Direct Website", "MakeMyTrip", "Goibibo", "BookMyShow",
  "Walk-in", "Phone", "WhatsApp", "Corporate", "Travel Agent",
];
const STATUS_TONE: Record<string, string> = {
  confirmed: "info", "checked-in": "success", "checked-out": "muted",
  cancelled: "danger", "no-show": "warning",
};
const RATE_PLANS = [
  { id: "rp-ep", code: "EP", name: "Room Only" },
  { id: "rp-cp", code: "CP", name: "Room + Breakfast" },
  { id: "rp-map", code: "MAP", name: "Room + B + L/D" },
  { id: "rp-ap", code: "AP", name: "All Meals" },
  { id: "rp-ai", code: "AI", name: "All Inclusive" },
];

function BookingForm({ onClose, editId }: { onClose: () => void; editId?: string }) {
  const db = useDB();
  const existing = editId ? db.bookings.find((b) => b.id === editId) : undefined;
  const existingGuest = existing ? guestOf(existing, db) : undefined;

  const [tab, setTab] = useState("guest");
  const [guestQ, setGuestQ] = useState(existingGuest?.name ?? "");
  const [guestMatches, setGuestMatches] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(existingGuest ?? null);

  const [form, setForm] = useState({
    salutation: existingGuest?.salutation ?? "Mr.",
    name: existingGuest?.name ?? "",
    gender: existingGuest?.gender ?? "Male",
    mobile: existingGuest?.mobile ?? "",
    email: existingGuest?.email ?? "",
    city: existingGuest?.city ?? "",
    state: existingGuest?.state ?? "",
    nationality: existingGuest?.nationality ?? "Indian",
    idType: existingGuest?.idType ?? "Aadhaar",
    idNumber: existingGuest?.idNumber ?? "",
    company: existingGuest?.company ?? "",
    vip: existingGuest?.vip ? "yes" : "no",
    checkIn: existing?.checkIn ?? today(),
    checkOut: existing?.checkOut ?? iso(addDays(new Date(), 2)),
    rooms: "1",
    roomTypeId: existing?.roomTypeId ?? db.roomTypes[0]?.id ?? "",
    roomId: existing?.roomIds[0] ?? "",
    ratePlanId: existing?.ratePlanId ?? "rp-cp",
    adults: String(existing?.adults ?? 2),
    children: String(existing?.children ?? 0),
    extraBed: String(existing?.extraBed ?? 0),
    rateNight: String(existing?.rateNight ?? db.roomTypes.find((r) => r.id === (existing?.roomTypeId ?? db.roomTypes[0]?.id))?.baseRate ?? 4500),
    discount: String(existing?.discount ?? 0),
    source: existing?.source ?? "Direct Website",
    arrivalFrom: existing?.arrivalFrom ?? "",
    purpose: existing?.purpose ?? "Leisure",
    remarks: existing?.remarks ?? "",
    advance: "0",
    payMode: "UPI",
  });

  const set = (k: string, v: string) => {
    const next = { ...form, [k]: v };
    if (k === "roomTypeId") {
      const rt = db.roomTypes.find((r) => r.id === v);
      next.rateNight = String(rt?.baseRate ?? 4500);
      next.roomId = "";
    }
    if (k === "checkIn" || k === "checkOut") next.roomId = "";
    setForm(next);
  };

  const nights = nightsBetween(form.checkIn, form.checkOut);
  const calc = calcBooking({
    roomTypeId: form.roomTypeId, ratePlanId: form.ratePlanId,
    rateNight: +form.rateNight, nights, rooms: +form.rooms,
    adults: +form.adults, children: +form.children,
    extraBed: +form.extraBed, discount: +form.discount,
  }, db);

  const availableRooms = db.rooms.filter(
    (r) => r.typeId === form.roomTypeId && (
      existing ? r.id === existing.roomIds[0] ||
        !db.bookings.some((b) => b.id !== existing.id && b.roomIds.includes(r.id) && ["confirmed", "checked-in"].includes(b.status) && !(b.checkOut <= form.checkIn || b.checkIn >= form.checkOut))
        : !db.bookings.some((b) => b.roomIds.includes(r.id) && ["confirmed", "checked-in"].includes(b.status) && !(b.checkOut <= form.checkIn || b.checkIn >= form.checkOut))
    )
  );

  function searchGuest(q: string) {
    setGuestQ(q);
    if (q.length < 2) { setGuestMatches([]); return; }
    const t = q.toLowerCase();
    setGuestMatches(db.guests.filter((g) => g.name.toLowerCase().includes(t) || g.mobile.includes(t) || g.email.toLowerCase().includes(t)).slice(0, 6));
  }

  function selectGuest(g: Guest) {
    setSelectedGuest(g);
    setGuestQ(g.name);
    setGuestMatches([]);
    setForm((f) => ({ ...f, salutation: g.salutation, name: g.name, gender: g.gender, mobile: g.mobile, email: g.email, city: g.city, state: g.state, nationality: g.nationality, idType: g.idType, idNumber: g.idNumber, company: g.company ?? "", vip: g.vip ? "yes" : "no" }));
  }

  function save(status: "confirmed" | "draft") {
    if (!form.name.trim() || !form.mobile.trim()) { toast.error("Guest name and mobile are required"); return; }
    if (!form.checkIn || !form.checkOut || form.checkIn >= form.checkOut) { toast.error("Invalid dates"); return; }

    let guest = selectedGuest;
    if (!guest) {
      guest = guestService.create({ salutation: form.salutation, name: form.name, gender: form.gender, mobile: form.mobile, email: form.email, city: form.city, state: form.state, nationality: form.nationality, idType: form.idType, idNumber: form.idNumber, company: form.company || undefined, vip: form.vip === "yes" });
    } else {
      guestService.save(guest.id, { salutation: form.salutation, name: form.name, gender: form.gender, mobile: form.mobile, email: form.email, city: form.city, state: form.state });
    }

    const roomId = form.roomId || availableRooms[0]?.id;

    if (existing) {
      bookingService.patch(existing.id, {
        source: form.source as BookingSource,
        roomTypeId: form.roomTypeId,
        roomIds: roomId ? [roomId] : [],
        ratePlanId: form.ratePlanId,
        checkIn: form.checkIn, checkOut: form.checkOut, nights,
        adults: +form.adults, children: +form.children,
        extraBed: +form.extraBed, rateNight: +form.rateNight,
        discount: +form.discount,
        arrivalFrom: form.arrivalFrom, purpose: form.purpose, remarks: form.remarks,
      });
      toast.success("Booking updated");
    } else {
      const b = bookingService.create({
        guestId: guest.id, source: form.source as BookingSource,
        roomTypeId: form.roomTypeId, roomIds: roomId ? [roomId] : [],
        ratePlanId: form.ratePlanId,
        checkIn: form.checkIn, checkOut: form.checkOut,
        adults: +form.adults, children: +form.children,
        extraBed: +form.extraBed, rateNight: +form.rateNight,
        discount: +form.discount,
        arrivalFrom: form.arrivalFrom, purpose: form.purpose, remarks: form.remarks,
      });
      if (+form.advance > 0) {
        paymentService.add({ bookingId: b.id, date: today(), mode: form.payMode as never, amount: +form.advance, kind: "payment", reference: `ADV-${b.grc}` });
      }
      toast.success(`Booking ${b.id} created`);
    }
    onClose();
  }

  const TABS = [{ value: "guest", label: "Guest Info" }, { value: "room", label: "Room & Package" }, { value: "payment", label: "Payment" }];

  return (
    <div className="space-y-4">
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "guest" && (
        <div className="space-y-4">
          <div className="relative">
            <Field label="Search Returning Guest">
              <Input value={guestQ} onChange={(e) => searchGuest(e.target.value)} placeholder="Name, mobile or email…" />
            </Field>
            {guestMatches.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card shadow-[var(--shadow-pop)]">
                {guestMatches.map((g) => (
                  <button key={g.id} onClick={() => selectGuest(g)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-secondary">
                    <span className="font-medium">{g.name}</span>
                    <span className="text-muted-foreground">{g.mobile}</span>
                    {g.vip && <Badge tone="primary">VIP</Badge>}
                  </button>
                ))}
              </div>
            )}
            {selectedGuest && <p className="mt-1 text-xs text-success">✓ Returning guest selected — {selectedGuest.segment}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Salutation"><Select value={form.salutation} onChange={(e) => set("salutation", e.target.value)} options={["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."].map((s) => ({ value: s, label: s }))} /></Field>
            <Field label="Full Name" className="sm:col-span-2" required><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" /></Field>
            <Field label="Gender"><Select value={form.gender} onChange={(e) => set("gender", e.target.value)} options={["Male", "Female", "Other"].map((s) => ({ value: s, label: s }))} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mobile" required><Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="10-digit mobile" /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com" /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="City"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="State"><Input value={form.state} onChange={(e) => set("state", e.target.value)} /></Field>
            <Field label="Nationality"><Input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ID Proof Type"><Select value={form.idType} onChange={(e) => set("idType", e.target.value)} options={["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID"].map((s) => ({ value: s, label: s }))} /></Field>
            <Field label="ID Number"><Input value={form.idNumber} onChange={(e) => set("idNumber", e.target.value)} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Company"><Input value={form.company} onChange={(e) => set("company", e.target.value)} /></Field>
            <Field label="VIP Guest"><Select value={form.vip} onChange={(e) => set("vip", e.target.value)} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes — VIP" }]} /></Field>
          </div>
        </div>
      )}

      {tab === "room" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Check-in Date" required><Input type="date" value={form.checkIn} onChange={(e) => set("checkIn", e.target.value)} /></Field>
            <Field label="Check-out Date" required><Input type="date" value={form.checkOut} onChange={(e) => set("checkOut", e.target.value)} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Room Type"><Select value={form.roomTypeId} onChange={(e) => set("roomTypeId", e.target.value)} options={db.roomTypes.map((r) => ({ value: r.id, label: r.name }))} /></Field>
            <Field label="Room Number"><Select value={form.roomId} onChange={(e) => set("roomId", e.target.value)} options={[{ value: "", label: "Auto-assign" }, ...availableRooms.map((r) => ({ value: r.id, label: `Room ${r.number}` }))]} /></Field>
            <Field label="No. of Rooms"><Input type="number" min="1" value={form.rooms} onChange={(e) => set("rooms", e.target.value)} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Package Plan"><Select value={form.ratePlanId} onChange={(e) => set("ratePlanId", e.target.value)} options={RATE_PLANS.map((r) => ({ value: r.id, label: `${r.code} — ${r.name}` }))} /></Field>
            <Field label="Booking Source"><Select value={form.source} onChange={(e) => set("source", e.target.value)} options={SOURCES.map((s) => ({ value: s, label: s }))} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Adults"><Input type="number" min="1" value={form.adults} onChange={(e) => set("adults", e.target.value)} /></Field>
            <Field label="Children"><Input type="number" min="0" value={form.children} onChange={(e) => set("children", e.target.value)} /></Field>
            <Field label="Extra Bed"><Input type="number" min="0" value={form.extraBed} onChange={(e) => set("extraBed", e.target.value)} /></Field>
            <Field label="Discount (₹)"><Input type="number" min="0" value={form.discount} onChange={(e) => set("discount", e.target.value)} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Rate per Night (₹)"><Input type="number" min="0" value={form.rateNight} onChange={(e) => set("rateNight", e.target.value)} /></Field>
            <Field label="Nights">{nights} night(s)</Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Arrival From"><Input value={form.arrivalFrom} onChange={(e) => set("arrivalFrom", e.target.value)} placeholder="e.g. Mumbai Airport" /></Field>
            <Field label="Purpose of Visit"><Select value={form.purpose} onChange={(e) => set("purpose", e.target.value)} options={["Leisure", "Business", "Medical", "Wedding", "Transit", "Other"].map((s) => ({ value: s, label: s }))} /></Field>
          </div>
          <Field label="Remarks"><Input value={form.remarks} onChange={(e) => set("remarks", e.target.value)} /></Field>
          <Card title="Fare Estimate" className="bg-secondary/30">
            <div className="space-y-1 text-sm">
              <KV label="Room Cost" value={money(calc.roomCost)} />
              <KV label="Meal Supplement" value={money(calc.mealCost)} />
              <KV label="Extra Bed" value={money(calc.extraBedCost)} />
              <KV label="Discount" value={`- ${money(calc.discount)}`} />
              <KV label={`GST (${calc.taxRate}%)`} value={money(calc.tax)} />
              <div className="border-t border-border pt-1">
                <KV label="Grand Total" value={<span className="text-base font-semibold">{money(calc.total)}</span>} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "payment" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Advance Amount (₹)"><Input type="number" min="0" value={form.advance} onChange={(e) => set("advance", e.target.value)} /></Field>
            <Field label="Payment Mode"><Select value={form.payMode} onChange={(e) => set("payMode", e.target.value)} options={["Cash", "UPI", "Card", "Bank Transfer"].map((s) => ({ value: s, label: s }))} /></Field>
          </div>
          <Card className="bg-secondary/30">
            <div className="space-y-1 text-sm">
              <KV label="Grand Total" value={money(calc.total)} />
              <KV label="Advance" value={money(+form.advance)} />
              <KV label="Balance Due" value={<span className={calc.total - +form.advance > 0 ? "text-danger font-semibold" : "text-success font-semibold"}>{money(calc.total - +form.advance)}</span>} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  function Footer() {
    return (
      <>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="default" onClick={() => save("draft")}>Save Draft</Btn>
        <Btn variant="primary" onClick={() => save("confirmed")}>{existing ? "Update Booking" : "Confirm Booking"}</Btn>
      </>
    );
  }

  // This doesn't render but is used as footer ref - footer prop is set in parent
  void Footer;
}

function BookingDetail({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const db = useDB();
  const nav = useNavigate();
  const guest = guestOf(booking, db);
  const totals = folioTotals(booking, db);
  const rooms = roomLabel(booking.roomIds, db);
  const rt = db.roomTypes.find((r) => r.id === booking.roomTypeId);
  const rp = db.ratePlans.find((r) => r.id === booking.ratePlanId);
  const [cancelOpen, setCancelOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge tone={STATUS_TONE[booking.status] ?? "muted"}>{booking.status}</Badge>
        {booking.simulated && <Badge tone="warning">OTA Simulation</Badge>}
        {guest?.vip && <Badge tone="primary">VIP</Badge>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Guest</p>
          <p className="font-semibold">{guest?.name ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{guest?.mobile} · {guest?.email}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Booking</p>
          <p className="font-semibold">{booking.id}</p>
          <p className="text-sm text-muted-foreground">GRC: {booking.grc} · INV: {booking.invoiceNo}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <KV label="Check-in" value={fmtDate(booking.checkIn)} />
        <KV label="Check-out" value={fmtDate(booking.checkOut)} />
        <KV label="Nights" value={booking.nights} />
        <KV label="Room(s)" value={rooms || "—"} />
        <KV label="Type" value={rt?.name ?? "—"} />
        <KV label="Meal Plan" value={rp ? `${rp.code} (${rp.name}) — ${rp.description}` : "—"} />
        <KV label="Adults" value={booking.adults} />

        <KV label="Children" value={booking.children} />
        <KV label="Source" value={booking.source} />
      </div>
      <div className="rounded-md border border-border p-3">
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Folio Summary</p>
        <div className="space-y-1 text-sm">
          <KV label="Subtotal" value={money(totals.subtotal)} />
          <KV label="Discount" value={`- ${money(totals.discount)}`} />
          <KV label="Tax" value={money(totals.tax)} />
          <KV label="Total" value={money(totals.total)} />
          <KV label="Paid" value={<span className="text-success">{money(totals.paid)}</span>} />
          <KV label="Balance" value={<span className={totals.balance > 0 ? "text-danger font-semibold" : "text-success"}>{money(totals.balance)}</span>} />
        </div>
      </div>
      {booking.remarks && <div className="text-sm text-muted-foreground">Remarks: {booking.remarks}</div>}
      <ConfirmDialog open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={() => { bookingService.cancel(booking.id); toast.success("Booking cancelled"); onClose(); }} title="Cancel Booking" message={`Cancel ${booking.id}? This will release the assigned room.`} confirmLabel="Cancel Booking" />
    </div>
  );

  function Actions() {
    return (
      <>
        {booking.status === "confirmed" && <Btn variant="primary" size="sm" onClick={() => { nav({ to: "/check-in" as never }); onClose(); }}>Check-in</Btn>}
        {booking.status === "checked-in" && <Btn variant="success" size="sm" onClick={() => { nav({ to: "/check-out" as never }); onClose(); }}>Check-out</Btn>}
        {["confirmed", "checked-in"].includes(booking.status) && <Btn variant="danger" size="sm" onClick={() => setCancelOpen(true)}>Cancel</Btn>}
        <Btn size="sm" icon={Printer} onClick={() => window.print()}>Print</Btn>
      </>
    );
  }

  void Actions;
}

function ReservationsPage() {
  const db = useDB();
  const nav = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [billingFilter, setBillingFilter] = useState("all");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const filtered = db.bookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (sourceFilter !== "all" && b.source !== sourceFilter) return false;
    if (billingFilter !== "all" && (b.billingType || "GST") !== billingFilter) return false;
    return true;
  });

  const tabs = [
    { value: "all", label: "All", count: db.bookings.length },
    { value: "confirmed", label: "Confirmed", count: db.bookings.filter((b) => b.status === "confirmed").length },
    { value: "checked-in", label: "In-House", count: db.bookings.filter((b) => b.status === "checked-in").length },
    { value: "checked-out", label: "Checked-out", count: db.bookings.filter((b) => b.status === "checked-out").length },
    { value: "cancelled", label: "Cancelled", count: db.bookings.filter((b) => b.status === "cancelled").length },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reservations"
        subtitle={`${db.bookings.length} total bookings`}
        actions={
          <>
            <Btn size="sm" icon={Download} onClick={() => exportCSV("reservations.csv", filtered.map((b) => ({ id: b.id, grc: b.grc, guest: guestOf(b, db)?.name ?? "", checkIn: b.checkIn, checkOut: b.checkOut, nights: b.nights, status: b.status, billingType: b.billingType || "GST", source: b.source, amount: folioTotals(b, db).total })))}>Export</Btn>
            <Btn variant="primary" size="sm" icon={Plus} className="shimmer-gold font-semibold shadow-sm" onClick={() => nav({ to: "/reservations/new" as never })}>New Booking</Btn>
          </>
        }
      />

      <Tabs tabs={tabs} value={statusFilter} onChange={setStatusFilter} />

      <DataTable
        rows={filtered}
        searchKeys={[
          (b) => guestOf(b, db)?.name ?? "",
          (b) => b.id,
          (b) => b.grc,
          (b) => b.invoiceNo,
          (b) => roomLabel(b.roomIds, db),
          (b) => guestOf(b, db)?.phone ?? "",
        ]}
        toolbar={
          <div className="flex items-center gap-2">
            <Select
              aria-label="Filter by billing mode"
              className="h-8 w-36 text-xs"
              value={billingFilter}
              onChange={(e) => setBillingFilter(e.target.value)}
              options={[
                { value: "all", label: "All Billing" },
                { value: "GST", label: "GST Invoices" },
                { value: "NON-GST", label: "Non-GST (BOS)" },
              ]}
            />
            <Select
              aria-label="Filter by source"
              className="h-8 w-36 text-xs"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              options={[{ value: "all", label: "All Sources" }, ...SOURCES.map((s) => ({ value: s, label: s }))]}
            />
          </div>
        }
        columns={[
          { key: "id", label: "Booking ID", render: (b) => <span className="font-mono text-xs font-semibold text-primary">{b.id}</span> },
          { key: "grc", label: "GRC", render: (b) => <span className="text-xs text-muted-foreground">{b.grc}</span> },
          { key: "billing", label: "Type", render: (b) => (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${b.billingType === "NON-GST" ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-blue-100 text-blue-900 border-blue-300"}`}>
              {b.billingType === "NON-GST" ? "NON-GST" : "GST"}
            </span>
          )},
          { key: "guest", label: "Guest", render: (b) => {
            const g = guestOf(b, db);
            return <span className="flex items-center gap-1.5">{g?.vip && <Badge tone="primary">VIP</Badge>}<span className="font-medium">{g?.name ?? "—"}</span></span>;
          }},
          { key: "room", label: "Room", render: (b) => roomLabel(b.roomIds, db) || "—" },
          { key: "checkIn", label: "Check-in", render: (b) => fmtDate(b.checkIn) },
          { key: "checkOut", label: "Check-out", render: (b) => fmtDate(b.checkOut) },
          { key: "nights", label: "Nights", align: "right" },
          { key: "status", label: "Status", render: (b) => <Badge tone={STATUS_TONE[b.status] ?? "muted"}>{b.status}</Badge> },
          { key: "total", label: "Total", align: "right", render: (b) => money(folioTotals(b, db).total) },
          { key: "balance", label: "Balance", align: "right", render: (b) => {
            const t = folioTotals(b, db);
            return <span className={t.balance > 0 ? "text-danger font-semibold" : "text-success"}>{money(t.balance)}</span>;
          }},
          { key: "actions", label: "", render: (b) => (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Btn
                size="sm"
                variant="ghost"
                onClick={() => nav({ to: `/reservations/${b.id}` as never })}
              >
                Open Details →
              </Btn>
            </div>
          ), sortable: false },
        ]}
        pageSize={15}
        onRowClick={(b) => nav({ to: `/reservations/${b.id}` as never })}
      />

      <ConfirmDialog
        open={!!cancelTarget} onClose={() => setCancelTarget(null)}
        onConfirm={() => { if (cancelTarget) { bookingService.cancel(cancelTarget.id); toast.success("Booking cancelled"); } setCancelTarget(null); }}
        title="Cancel Booking" message={`Cancel ${cancelTarget?.id}? This will release the assigned room.`} confirmLabel="Yes, Cancel"
      />
    </div>
  );
}
