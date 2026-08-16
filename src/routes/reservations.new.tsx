import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Sparkles, User, Calendar, BedDouble, ShieldCheck, Printer, FileText } from "lucide-react";
import { Badge, Btn, Card, Field, Input, KV, PageHeader, Select, SuccessModal } from "@/components/kit";
import { bookingService, calcBooking, guestService, money, nightsBetween, today, addDays, iso, useDB } from "@/lib/store";
import type { BookingSource, ID } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/reservations/new")({
  head: () => ({ meta: [{ title: "New Reservation — MAYRA Hotel ERP" }] }),
  component: NewReservationPage,
});

const SOURCES: BookingSource[] = [
  "Direct Website", "MakeMyTrip", "Goibibo", "BookMyShow",
  "Walk-in", "Phone", "WhatsApp", "Corporate", "Travel Agent",
];

function NewReservationPage() {
  const db = useDB();
  const nav = useNavigate();

  // Step 1: Guest & Stay Dates
  const [guestMode, setGuestMode] = useState<"existing" | "new">("existing");
  const [selectedGuestId, setSelectedGuestId] = useState<ID>(db.guests[0]?.id ?? "");
  const [newGuest, setNewGuest] = useState({
    salutation: "Mr.", name: "", mobile: "", email: "", city: "Pune", state: "Maharashtra", idType: "Aadhaar", idNumber: "", vip: false,
  });

  const [checkIn, setCheckIn] = useState(today());
  const [checkInTime, setCheckInTime] = useState(db.settings.checkInTime || "12:00 PM");
  const [checkOut, setCheckOut] = useState(iso(addDays(new Date(), 2)));
  const [checkOutTime, setCheckOutTime] = useState(db.settings.checkOutTime || "11:00 AM");
  const [source, setSource] = useState<BookingSource>("Walk-in");

  // Step 2: Room & Occupancy
  const [roomTypeId, setRoomTypeId] = useState<ID>(db.roomTypes[0]?.id ?? "");
  const [assignedRoomId, setAssignedRoomId] = useState<string>("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [extraBed, setExtraBed] = useState("0");

  // Step 3: Rate Plan & Commercials
  const [billingType, setBillingType] = useState<"GST" | "NON-GST">("GST");
  const [companyGstin, setCompanyGstin] = useState("");
  const [ratePlanId, setRatePlanId] = useState<ID>(db.ratePlans[0]?.id ?? "rp-cp");
  const [customRate, setCustomRate] = useState<string>("");
  const [discount, setDiscount] = useState("0");
  const [advanceAmount, setAdvanceAmount] = useState("0");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [remarks, setRemarks] = useState("");
  const [purpose, setPurpose] = useState("Leisure");

  // Success State
  const [successBooking, setSuccessBooking] = useState<{ id: string; grc: string; guestName: string; total: number; roomName: string; billingType: string } | null>(null);

  const nights = nightsBetween(checkIn, checkOut);
  const selectedType = db.roomTypes.find((r) => r.id === roomTypeId);
  const effectiveRate = +customRate > 0 ? +customRate : (selectedType?.baseRate ?? 4000);

  const calc = calcBooking(
    {
      roomTypeId, ratePlanId, rateNight: effectiveRate, nights,
      rooms: 1, adults: +adults, children: +children, extraBed: +extraBed,
      discount: +discount, billingType,
    },
    db,
  );

  const availableRooms = db.rooms.filter(
    (r) => r.typeId === roomTypeId && r.status === "available"
  );

  function handleCreateBooking() {
    let gId = selectedGuestId;
    let gName = db.guests.find((g) => g.id === gId)?.name ?? "Guest";

    if (guestMode === "new") {
      if (!newGuest.name.trim() || !newGuest.mobile.trim()) {
        toast.error("Please enter guest name and mobile number");
        return;
      }
      const created = guestService.create(newGuest);
      gId = created.id;
      gName = created.name;
    } else if (!gId && db.guests.length > 0) {
      gId = db.guests[0].id;
      gName = db.guests[0].name;
    }

    const rTypeId = roomTypeId || db.roomTypes[0]?.id || "rt-deluxe";

    const b = bookingService.create({
      guestId: gId,
      source,
      billingType,
      companyGstin: billingType === "GST" ? companyGstin : undefined,
      roomTypeId: rTypeId,
      roomIds: assignedRoomId ? [assignedRoomId] : (availableRooms[0] ? [availableRooms[0].id] : []),
      ratePlanId,
      checkIn,
      checkInTime,
      checkOut,
      checkOutTime,
      adults: +adults,
      children: +children,
      extraBed: +extraBed,
      rateNight: effectiveRate,
      discount: +discount,
      purpose,
      remarks,
    });

    if (+advanceAmount > 0) {
      paymentService.add({
        bookingId: b.id,
        date: today(),
        mode: paymentMode as never,
        amount: +advanceAmount,
        kind: "payment",
        reference: `ADV-${b.grc}`,
      });
    }

    setSuccessBooking({
      id: b.id,
      grc: b.grc,
      guestName: gName,
      total: calc.total,
      roomName: selectedType?.name ?? "Room",
      billingType: b.billingType || "GST",
    });
    toast.success(`Booking confirmed (${b.billingType}) for ${gName}!`);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Btn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => nav({ to: "/reservations" })}>
          Back to Reservations
        </Btn>
        <span className="text-muted-foreground">|</span>
        <Badge tone="primary" className="shimmer-purple-badge px-3 py-1">New Booking Wizard</Badge>
      </div>

      <PageHeader
        title="Create New Reservation"
        subtitle="Complete dedicated reservation & tariff calculator"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Form Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Guest Selection */}
          <Card title="1. Guest Information" className="relative overflow-hidden">
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setGuestMode("existing")}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${guestMode === "existing" ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm" : "border-border hover:bg-secondary"}`}
              >
                Existing Guest
              </button>
              <button
                type="button"
                onClick={() => setGuestMode("new")}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${guestMode === "new" ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm" : "border-border hover:bg-secondary"}`}
              >
                + New Guest Profile
              </button>
            </div>

            {guestMode === "existing" ? (
              <div className="space-y-3">
                <Field label="Search / Select Existing Guest">
                  <Select
                    value={selectedGuestId}
                    onChange={(e) => setSelectedGuestId(e.target.value)}
                    options={db.guests.map((g) => ({
                      value: g.id,
                      label: `${g.name} (${g.mobile}) — ${g.city} ${g.vip ? "⭐ VIP" : ""}`,
                    }))}
                  />
                </Field>
                {selectedGuestId && (
                  <div className="rounded-lg bg-secondary/60 p-3 text-xs flex justify-between items-center border border-border/80">
                    <div>
                      <span className="font-semibold text-foreground">{db.guests.find((g) => g.id === selectedGuestId)?.name}</span>
                      <p className="text-muted-foreground mt-0.5">{db.guests.find((g) => g.id === selectedGuestId)?.email} · {db.guests.find((g) => g.id === selectedGuestId)?.mobile}</p>
                    </div>
                    <Badge tone="success">Verified Profile</Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full Name" required>
                  <Input value={newGuest.name} onChange={(e) => setNewGuest((g) => ({ ...g, name: e.target.value }))} placeholder="e.g. Rahul Sharma" />
                </Field>
                <Field label="Mobile Number" required>
                  <Input value={newGuest.mobile} onChange={(e) => setNewGuest((g) => ({ ...g, mobile: e.target.value }))} placeholder="10-digit mobile" />
                </Field>
                <Field label="Email Address">
                  <Input type="email" value={newGuest.email} onChange={(e) => setNewGuest((g) => ({ ...g, email: e.target.value }))} placeholder="guest@example.com" />
                </Field>
                <Field label="City">
                  <Input value={newGuest.city} onChange={(e) => setNewGuest((g) => ({ ...g, city: e.target.value }))} />
                </Field>
                <Field label="ID Proof Type">
                  <Select
                    value={newGuest.idType}
                    onChange={(e) => setNewGuest((g) => ({ ...g, idType: e.target.value }))}
                    options={["Aadhaar", "Passport", "Driving License", "Voter ID"].map((t) => ({ value: t, label: t }))}
                  />
                </Field>
                <Field label="ID Number">
                  <Input value={newGuest.idNumber} onChange={(e) => setNewGuest((g) => ({ ...g, idNumber: e.target.value }))} placeholder="XXXX-XXXX-XXXX" />
                </Field>
              </div>
            )}
          </Card>

          {/* 2. Dates & Room Configuration */}
          <Card title="2. Stay Dates, Timings & Room Selection">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
              <Field label="Check-in Date">
                <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              </Field>
              <Field label="Standard Check-In Time">
                <Select
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  options={[
                    { value: "10:00 AM", label: "10:00 AM (Early)" },
                    { value: "11:00 AM", label: "11:00 AM (Early)" },
                    { value: "12:00 PM", label: "12:00 PM (Standard Check-in)" },
                    { value: "01:00 PM", label: "01:00 PM" },
                    { value: "02:00 PM", label: "02:00 PM (Standard)" },
                    { value: "04:00 PM", label: "04:00 PM" },
                    { value: "06:00 PM", label: "06:00 PM (Evening)" },
                    { value: "08:00 PM", label: "08:00 PM (Late)" },
                  ]}
                />
              </Field>
              <Field label="Check-out Date">
                <Input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} />
              </Field>
              <Field label="Standard Check-Out Time">
                <Select
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  options={[
                    { value: "10:00 AM", label: "10:00 AM" },
                    { value: "11:00 AM", label: "11:00 AM (Standard Check-out)" },
                    { value: "12:00 PM", label: "12:00 PM (Grace/Late)" },
                    { value: "01:00 PM", label: "01:00 PM (Late Checkout)" },
                    { value: "02:00 PM", label: "02:00 PM (Late Checkout)" },
                  ]}
                />
              </Field>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Room Category</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {db.roomTypes.map((rt) => {
                  const free = db.rooms.filter((r) => r.typeId === rt.id && r.status === "available").length;
                  const isSelected = roomTypeId === rt.id;
                  return (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => {
                        setRoomTypeId(rt.id);
                        setCustomRate("");
                        setAssignedRoomId("");
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm"
                          : "border-border hover:bg-secondary/60"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-sm">{rt.name}</span>
                        <span className="text-sm font-bold text-primary">{money(rt.baseRate)}/nt</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{rt.description}</p>
                      <div className="mt-2.5 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{rt.beds} Bed(s) · Max {rt.maxOccupancy} Pax</span>
                        <Badge tone={free > 0 ? "success" : "danger"}>{free} Available</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-4 pt-2">
                <Field label="Adults">
                  <Select value={adults} onChange={(e) => setAdults(e.target.value)} options={["1", "2", "3", "4"].map((v) => ({ value: v, label: `${v} Adult${+v > 1 ? "s" : ""}` }))} />
                </Field>
                <Field label="Children">
                  <Select value={children} onChange={(e) => setChildren(e.target.value)} options={["0", "1", "2"].map((v) => ({ value: v, label: `${v} Child` }))} />
                </Field>
                <Field label="Extra Bed">
                  <Select value={extraBed} onChange={(e) => setExtraBed(e.target.value)} options={["0", "1", "2"].map((v) => ({ value: v, label: `${v} Extra Bed` }))} />
                </Field>
                <Field label="Assign Specific Room">
                  <Select
                    value={assignedRoomId}
                    onChange={(e) => setAssignedRoomId(e.target.value)}
                    options={[
                      { value: "", label: "Auto Assign" },
                      ...availableRooms.map((r) => ({ value: r.id, label: `Room ${r.number} (Floor ${r.floor})` })),
                    ]}
                  />
                </Field>
              </div>
            </div>
          </Card>

          {/* 3. Rate Plan & Commercials */}
          <Card title="3. Billing Mode & Commercials">
            {/* Billing Mode Toggle */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-foreground block mb-1.5">Registration & Billing Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBillingType("GST")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    billingType === "GST"
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    GST Tax Invoice (B2B / B2C)
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Series: GBK-xxx · MYR/GST/25-26/xxx (12%/18% GST)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBillingType("NON-GST")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    billingType === "NON-GST"
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-600" />
                    Non-GST / Bill of Supply
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Series: NBK-xxx · MYR/BOS/25-26/xxx (0% Tax)
                  </div>
                </button>
              </div>
            </div>

            {billingType === "GST" && (
              <div className="mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50/30">
                <Field label="Company GSTIN (Optional for B2B Input Credit)">
                  <Input
                    placeholder="e.g. 08AAAAA0000A1Z5"
                    value={companyGstin}
                    onChange={(e) => setCompanyGstin(e.target.value.toUpperCase())}
                    className="font-mono text-xs uppercase"
                  />
                </Field>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Meal / Rate Plan">
                <Select
                  value={ratePlanId}
                  onChange={(e) => setRatePlanId(e.target.value)}
                  options={db.ratePlans.map((rp) => ({
                    value: rp.id,
                    label: `${rp.name} (${rp.code}) — +${money(rp.mealRate)}/pax/nt`,
                  }))}
                />
              </Field>
              <Field label="Booking Source">
                <Select value={source} onChange={(e) => setSource(e.target.value as BookingSource)} options={SOURCES.map((s) => ({ value: s, label: s }))} />
              </Field>
              <Field label="Custom Nightly Rate (Optional)">
                <Input
                  type="number"
                  placeholder={`Base rate is ${money(selectedType?.baseRate ?? 4000)}`}
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                />
              </Field>
              <Field label="Special Discount (₹)">
                <Input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 mt-3">
              <Field label="Purpose of Visit">
                <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Business, Leisure, Wedding" />
              </Field>
              <Field label="Remarks & Guest Preferences">
                <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. High floor, Early checkin request" />
              </Field>
            </div>
          </Card>
        </div>

        {/* Right Col: Live Folio Breakdown Preview */}
        <div className="space-y-4">
          <Card title="Live Tariff Breakdown" className="sticky top-6 border-primary/30 shadow-lg">
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs text-muted-foreground">Registration ID:</span>
                <span className="font-mono text-xs font-bold text-primary">
                  {billingType === "NON-GST" ? "NBK-XXXX (Non-GST)" : "GBK-XXXX (GST)"}
                </span>
              </div>
              <KV label="Room Category" value={selectedType?.name} />
              <KV label="Stay Duration" value={`${nights} Night(s)`} />
              <KV label="Base Room Tariff" value={money(calc.roomCost)} />
              {calc.mealCost > 0 && <KV label="Meal Inclusions" value={money(calc.mealCost)} />}
              {calc.extraBedCost > 0 && <KV label="Extra Bed Charges" value={money(calc.extraBedCost)} />}
              {calc.discount > 0 && <KV label="Discount Applied" value={<span className="text-danger">- {money(calc.discount)}</span>} />}

              <div className="border-t border-border pt-2 space-y-1.5 text-xs">
                <KV label="Taxable Base" value={money(calc.taxable)} />
                {billingType === "GST" ? (
                  <>
                    <KV label={`GST (${calc.taxRate}%)`} value={money(calc.tax)} />
                    <div className="flex justify-between text-[11px] text-muted-foreground pl-2">
                      <span>CGST ({calc.taxRate / 2}%)</span>
                      <span>{money(calc.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground pl-2">
                      <span>SGST ({calc.taxRate / 2}%)</span>
                      <span>{money(calc.sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-amber-800 font-medium">
                    <span>Tax (Non-GST / Exempted)</span>
                    <span>₹0.00</span>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-border/80 pt-3 flex items-center justify-between">
                <span className="text-base font-bold">Total Tariff:</span>
                <span className="text-xl font-bold text-primary">{money(calc.total)}</span>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4 space-y-3">
              <Btn
                variant="primary"
                size="lg"
                className="w-full shadow-md font-bold tracking-wide shimmer-gold"
                icon={Check}
                onClick={handleCreateBooking}
              >
                Confirm & Create Reservation
              </Btn>
              <Btn
                variant="outline"
                size="md"
                className="w-full text-xs"
                onClick={() => nav({ to: "/reservations" })}
              >
                Cancel
              </Btn>
            </div>
          </Card>
        </div>
      </div>

      {/* Success Celebration Dialog */}
      {successBooking && (
        <SuccessModal
          open={!!successBooking}
          onClose={() => nav({ to: "/reservations" })}
          title="Reservation Confirmed!"
          subtitle={`Booking has been created in ${successBooking.billingType} mode.`}
          details={[
            { label: "Booking ID", value: successBooking.id },
            { label: "Registration Type", value: successBooking.billingType },
            { label: "GRC Number", value: successBooking.grc },
            { label: "Guest Name", value: successBooking.guestName },
            { label: "Room Category", value: successBooking.roomName },
            { label: "Total Payable", value: money(successBooking.total) },
          ]}
          primaryAction={{
            label: "Open Dedicated Booking Page",
            icon: FileText,
            onClick: () => nav({ to: `/reservations/${successBooking.id}` as never }),
          }}
          secondaryAction={{
            label: "Return to Reservations",
            onClick: () => nav({ to: "/reservations" }),
          }}
        />
      )}
    </div>
  );
}
