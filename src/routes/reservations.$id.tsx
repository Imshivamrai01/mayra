import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, CheckCircle, Clock, CreditCard, Download, Edit3, FileText,
  Home, LogIn, LogOut, Phone, Mail, Plus, Printer, Trash2, User,
  Building, AlertTriangle, ShieldCheck, Tag, Receipt
} from "lucide-react";
import {
  Badge, Btn, Card, Field, Input, Modal, PageHeader, Select, StatCard, SuccessModal, Table
} from "@/components/kit";

import {
  bookingService, fmtDate, guestOf, money, paymentService, roomLabel,
  roomTypeOf, today, useDB, folioTotals, BOOKING_STATUS_META
} from "@/lib/store";
import type { Booking, FolioCharge } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/reservations/$id")({
  head: () => ({ meta: [{ title: "Booking Details — Hotel Amara ERP" }] }),
  component: ReservationDetailPage,
});

function ReservationDetailPage() {
  const { id } = Route.useParams();
  const db = useDB();
  const nav = useNavigate();

  const booking = db.bookings.find((b) => b.id === id);
  const [payOpen, setPayOpen] = useState(false);
  const [payMode, setPayMode] = useState("UPI");
  const [payAmt, setPayAmt] = useState("");
  const [payRef, setPayRef] = useState("");

  const [chargeOpen, setChargeOpen] = useState(false);
  const [chargeKind, setChargeKind] = useState<FolioCharge["kind"]>("Room Service");
  const [chargeDesc, setChargeDesc] = useState("");
  const [chargeAmt, setChargeAmt] = useState("");

  const [printDoc, setPrintDoc] = useState<"invoice" | "grc" | null>(null);
  const [successAction, setSuccessAction] = useState<{ title: string; subtitle: string; details: { label: string; value: string }[] } | null>(null);

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
        <AlertTriangle className="h-12 w-12 text-warning" />
        <h2 className="text-xl font-bold">Booking Not Found</h2>
        <p className="text-sm text-muted-foreground">The reservation with ID "{id}" could not be located.</p>
        <Btn variant="primary" onClick={() => nav({ to: "/reservations" })}>Back to All Reservations</Btn>
      </div>
    );
  }

  const guest = guestOf(booking, db);
  const rt = roomTypeOf(booking.roomTypeId, db);
  const totals = folioTotals(booking, db);
  const isNonGst = booking.billingType === "NON-GST";
  const stMeta = BOOKING_STATUS_META[booking.status];

  function handleCheckIn() {
    bookingService.checkIn(booking.id);
    toast.success(`Checked in ${guest?.name}`);
    setSuccessAction({
      title: "Guest Checked In Successfully!",
      subtitle: `Room ${roomLabel(booking.roomIds, db)} is now Occupied`,
      details: [
        { label: "Guest Name", value: guest?.name ?? "—" },
        { label: "Room Assigned", value: roomLabel(booking.roomIds, db) },
        { label: "GRC Number", value: booking.grc },
        { label: "Billing Mode", value: booking.billingType ?? "GST" },
      ],
    });
  }

  function handleCheckOut() {
    bookingService.checkOut(booking.id);
    toast.success(`Checked out ${guest?.name}`);
    setSuccessAction({
      title: "Guest Checked Out Successfully!",
      subtitle: `Room ${roomLabel(booking.roomIds, db)} is now Dirty and assigned to Housekeeping`,
      details: [
        { label: "Guest Name", value: guest?.name ?? "—" },
        { label: "Vacated Room", value: roomLabel(booking.roomIds, db) },
        { label: "Tax Invoice", value: booking.invoiceNo },
        { label: "Folio Balance", value: money(totals.balance) },
      ],
    });
  }

  function handleCancel() {
    if (confirm("Are you sure you want to cancel this reservation?")) {
      bookingService.cancel(booking.id);
      toast.success("Reservation cancelled");
    }
  }

  function handleAddPayment() {
    const amt = parseFloat(payAmt);
    if (!amt || amt <= 0) { toast.error("Please enter a valid amount"); return; }
    paymentService.add({
      bookingId: booking.id,
      date: today(),
      mode: payMode as never,
      amount: amt,
      kind: "payment",
      reference: payRef || `REC-${booking.grc}`,
    });
    toast.success(`Payment of ${money(amt)} recorded via ${payMode}`);
    setPayOpen(false);
    setPayAmt("");
    setPayRef("");
  }

  function handleAddCharge() {
    const amt = parseFloat(chargeAmt);
    if (!amt || amt <= 0) { toast.error("Please enter a valid charge amount"); return; }
    bookingService.addCharge(booking.id, {
      date: today(),
      kind: chargeKind,
      description: chargeDesc || `${chargeKind} charge`,
      qty: 1,
      rate: amt,
      amount: amt,
      taxRate: isNonGst ? 0 : 18,
      billingType: booking.billingType,
    });
    toast.success(`${chargeKind} charge added to folio`);
    setChargeOpen(false);
    setChargeDesc("");
    setChargeAmt("");
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Btn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => nav({ to: "/reservations" })}>
            Back to Reservations
          </Btn>
          <span className="text-muted-foreground">|</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">{booking.id}</span>
            <span className="text-xs text-muted-foreground">({booking.grc})</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isNonGst ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-blue-100 text-blue-900 border border-blue-300"}`}>
              {isNonGst ? "Non-GST / Bill of Supply" : "GST Tax Invoice"}
            </span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Btn size="sm" icon={Printer} onClick={() => setPrintDoc("invoice")}>
            Print {isNonGst ? "Bill of Supply" : "Tax Invoice"}
          </Btn>
          <Btn size="sm" icon={FileText} onClick={() => setPrintDoc("grc")}>
            Print GRC
          </Btn>
          {booking.status === "confirmed" && (
            <Btn variant="primary" size="sm" icon={LogIn} onClick={handleCheckIn}>
              Check-In Guest
            </Btn>
          )}
          {booking.status === "checked-in" && (
            <Btn variant="success" size="sm" icon={LogOut} onClick={handleCheckOut}>
              Check-Out Guest
            </Btn>
          )}
          {booking.status === "confirmed" && (
            <Btn variant="danger" size="sm" icon={Trash2} onClick={handleCancel}>
              Cancel Booking
            </Btn>
          )}
        </div>
      </div>

      <PageHeader
        title={`${guest?.name ?? "Guest"} · Room ${roomLabel(booking.roomIds, db)}`}
        subtitle={`${fmtDate(booking.checkIn)} → ${fmtDate(booking.checkOut)} (${booking.nights} night${booking.nights > 1 ? "s" : ""}) · ${booking.source}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={stMeta.tone as never} className="text-sm px-3 py-1 font-semibold">
              {stMeta.label}
            </Badge>
          </div>
        }
      />

      {/* KPI Stats Bar */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Tariff & Charges" value={money(totals.total)} sub={`${booking.charges.length} folio line item(s)`} tone="primary" />
        <StatCard label="Total Paid / Advance" value={money(totals.paid)} sub={`${totals.payments.length} transaction(s)`} tone="success" />
        <StatCard
          label="Balance Due"
          value={money(totals.balance)}
          sub={totals.balance <= 0 ? "Folio Fully Settled" : "Payment Pending"}
          tone={totals.balance > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Check-In"
          value={fmtDate(booking.checkIn)}
          sub={booking.actualCheckInTime ? `Checked in @ ${booking.actualCheckInTime}` : `Time: ${booking.checkInTime || "12:00 PM"}`}
          tone="primary"
        />
        <StatCard
          label="Check-Out"
          value={fmtDate(booking.checkOut)}
          sub={booking.actualCheckOutTime ? `Checked out @ ${booking.actualCheckOutTime}` : `Time: ${booking.checkOutTime || "11:00 AM"}`}
          tone="muted"
        />
        <StatCard
          label="Nights"
          value={`${booking.nights} Night${booking.nights > 1 ? "s" : ""}`}
          sub={`${booking.adults} Adults, ${booking.children} Kids`}
        />
        <StatCard
          label="Room Assigned"
          value={roomLabel(booking.roomIds, db)}
          sub={`${rt?.name ?? "Room"} (${rt?.code ?? ""})`}
          tone="info"
        />
      </div>

      {/* Main Grid: Left Guest & Stay Details, Right Folio Ledger */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left Column: Guest & Stay Details */}
        <div className="space-y-4 lg:col-span-1">
          {/* Guest Card */}
          <Card title="Guest Information">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-base">
                  {guest?.name?.slice(0, 2).toUpperCase() || "G"}
                </div>
                <div>
                  <div className="font-semibold text-base flex items-center gap-1.5">
                    {guest?.name}
                    {guest?.vip && <span className="rounded bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 border border-amber-300">VIP</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{guest?.city ? `${guest.city}, ` : ""}{guest?.country || "India"}</div>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{guest?.phone || "No phone recorded"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{guest?.email || "No email recorded"}</span>
                </div>
                {guest?.idType && (
                  <div className="flex items-center gap-2 text-xs">
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                    <span>KYC ID: {guest.idType} ({guest.idNumber})</span>
                  </div>
                )}
                {guest?.company && (
                  <div className="flex items-center gap-2 text-xs">
                    <Building className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Company: {guest.company}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Stay Configuration */}
          <Card title="Stay Details & Timings">
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Check-in</span>
                <span className="font-semibold text-foreground">{fmtDate(booking.checkIn)} · {booking.actualCheckInTime || booking.checkInTime || "12:00 PM"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Check-out</span>
                <span className="font-semibold text-foreground">{fmtDate(booking.checkOut)} · {booking.actualCheckOutTime || booking.checkOutTime || "11:00 AM"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Billing Type</span>
                <span className="font-bold">{booking.billingType ?? "GST"}</span>
              </div>
              {booking.companyGstin && (
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Company GSTIN</span>
                  <span className="font-mono font-semibold">{booking.companyGstin}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Invoice Number</span>
                <span className="font-mono font-semibold">{booking.invoiceNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">GRC Number</span>
                <span className="font-mono font-semibold">{booking.grc}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Room Category</span>
                <span>{rt?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Tariff per Night</span>
                <span className="font-semibold">{money(booking.rateNight)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Occupants</span>
                <span>{booking.adults} Adult(s), {booking.children} Child(ren)</span>
              </div>
              {booking.extraBed > 0 && (
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Extra Bed</span>
                  <span>{booking.extraBed} bed(s)</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Booking Source</span>
                <span className="font-medium">{booking.source}</span>
              </div>
              {booking.remarks && (
                <div className="py-1">
                  <span className="text-muted-foreground block mb-0.5">Special Requests / Notes:</span>
                  <p className="bg-secondary/60 p-2 rounded text-xs italic">{booking.remarks}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Folio Charges, Payments & Financial Statement */}
        <div className="space-y-4 lg:col-span-2">
          {/* Folio Charges Card */}
          <Card
            title="Folio Charges"
            action={
              <div className="flex items-center gap-2">
                <Btn size="sm" icon={Plus} onClick={() => setChargeOpen(true)}>Add Charge</Btn>
                <Btn variant="primary" size="sm" icon={CreditCard} onClick={() => { setPayAmt(String(Math.max(0, totals.balance))); setPayOpen(true); }}>
                  Record Payment
                </Btn>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Dept</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">Tax Rate</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {booking.charges.map((c) => (
                    <tr key={c.id} className="hover:bg-secondary/40">
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{fmtDate(c.date)}</td>
                      <td className="py-2.5 px-3">
                        <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium">{c.kind}</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium">{c.description}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{c.taxRate}%</td>
                      <td className="py-2.5 px-3 text-right font-semibold">{money(c.amount)}</td>
                    </tr>
                  ))}
                  {booking.charges.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-muted-foreground">No charges posted yet.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* Folio Total Calculation Breakdown */}
            <div className="mt-4 border-t border-border pt-4 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{money(totals.subtotal)}</span></div>
              {totals.discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>- {money(totals.discount)}</span></div>}
              {!isNonGst && (
                <>
                  <div className="flex justify-between text-muted-foreground"><span>CGST ({totals.subtotal > 0 ? (totals.tax / totals.subtotal * 50).toFixed(1) : 6}%)</span><span>{money(totals.tax / 2)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>SGST ({totals.subtotal > 0 ? (totals.tax / totals.subtotal * 50).toFixed(1) : 6}%)</span><span>{money(totals.tax / 2)}</span></div>
                </>
              )}
              {isNonGst && (
                <div className="flex justify-between text-amber-800 font-medium"><span>Tax (Non-GST / Exempted)</span><span>₹0.00</span></div>
              )}
              <div className="flex justify-between font-bold text-sm border-t border-border pt-1.5">
                <span>Grand Total</span>
                <span>{money(totals.total)}</span>
              </div>
              <div className="flex justify-between text-success font-semibold">
                <span>Total Received</span>
                <span>{money(totals.paid)}</span>
              </div>
              <div className={`flex justify-between font-bold text-base border-t border-border pt-1.5 ${totals.balance > 0 ? "text-danger" : "text-success"}`}>
                <span>Balance Due</span>
                <span>{money(totals.balance)}</span>
              </div>
            </div>
          </Card>

          {/* Payment History Card */}
          <Card title="Payment & Settlement History">
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Payment ID</th>
                    <th className="py-2 px-3">Mode</th>
                    <th className="py-2 px-3">Reference</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {totals.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/40">
                      <td className="py-2 px-3 text-muted-foreground">{fmtDate(p.date)}</td>
                      <td className="py-2 px-3 font-mono">{p.id}</td>
                      <td className="py-2 px-3"><Badge tone="primary">{p.mode}</Badge></td>
                      <td className="py-2 px-3 text-muted-foreground">{p.reference || "—"}</td>
                      <td className="py-2 px-3 text-right font-semibold text-success">{money(p.amount)}</td>
                    </tr>
                  ))}
                  {totals.payments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-muted-foreground">No payments recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title={`Record Payment · ${booking.id}`}
        footer={
          <>
            <Btn onClick={() => setPayOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleAddPayment}>Confirm & Post Payment</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Amount to Pay (₹)">
            <Input type="number" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Payment Mode">
            <Select
              value={payMode}
              onChange={(e) => setPayMode(e.target.value)}
              options={["Cash", "UPI", "Card", "Bank Transfer"].map((m) => ({ value: m, label: m }))}
            />
          </Field>
          <Field label="Transaction / Cheque / Auth Ref">
            <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="e.g. UPI-99823901" />
          </Field>
        </div>
      </Modal>

      {/* Add Charge Modal */}
      <Modal
        open={chargeOpen}
        onClose={() => setChargeOpen(false)}
        title="Add Charge to Folio"
        footer={
          <>
            <Btn onClick={() => setChargeOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleAddCharge}>Add to Folio</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Department">
            <Select
              value={chargeKind}
              onChange={(e) => setChargeKind(e.target.value as never)}
              options={["Room Service", "Restaurant", "Laundry", "Banquet", "Other"].map((k) => ({ value: k, label: k }))}
            />
          </Field>
          <Field label="Description">
            <Input value={chargeDesc} onChange={(e) => setChargeDesc(e.target.value)} placeholder="e.g. Dinner in Room 301, Express Laundry" />
          </Field>
          <Field label="Charge Amount (₹)">
            <Input type="number" value={chargeAmt} onChange={(e) => setChargeAmt(e.target.value)} placeholder="0.00" />
          </Field>
        </div>
      </Modal>

      {/* Document Print Modal */}
      <Modal
        open={Boolean(printDoc)}
        onClose={() => setPrintDoc(null)}
        wide
        title={
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-purple-700" />
            <span>{printDoc === "invoice" ? (isNonGst ? "Bill of Supply Preview" : "Tax Invoice Preview") : "Guest Registration Card (GRC)"}</span>
          </div>
        }
        footer={
          <>
            <Btn size="sm" onClick={() => setPrintDoc(null)}>Close</Btn>
            <Btn variant="primary" size="sm" icon={Printer} onClick={() => window.print()}>Print Document</Btn>
          </>
        }
      >


            {/* Printable Document Sheet */}
            <div className="rounded border border-border/80 p-6 bg-white text-black text-xs space-y-4">
              {/* Hotel Header */}
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-primary">HOTEL AMARA</h1>
                  <p className="text-gray-600">Hospitality Management System</p>
                  <p className="text-gray-500">12, Luxury Boulevard, Civil Lines, Jaipur, Rajasthan</p>
                  <p className="text-gray-500">GSTIN: 08AAACH1234F1Z8 · Phone: +91 98765 43210</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-gray-100 font-bold uppercase rounded border">
                    {printDoc === "invoice" ? (isNonGst ? "BILL OF SUPPLY" : "TAX INVOICE") : "GUEST REGISTRATION CARD"}
                  </span>
                  <p className="mt-1 font-mono font-bold text-sm">{printDoc === "invoice" ? booking.invoiceNo : booking.grc}</p>
                  <p className="text-gray-500">Date: {fmtDate(today())}</p>
                </div>
              </div>

              {/* Guest & Stay Meta */}
              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">Guest Details:</h4>
                  <p className="font-bold text-sm">{guest?.name}</p>
                  <p>Phone: {guest?.phone || "—"}</p>
                  <p>Email: {guest?.email || "—"}</p>
                  {booking.companyGstin && <p className="font-semibold text-blue-900">Company GSTIN: {booking.companyGstin}</p>}
                </div>
                <div>
                  <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">Reservation Details:</h4>
                  <p>Booking ID: <span className="font-mono font-bold">{booking.id}</span></p>
                  <p>Room: <span className="font-bold">{roomLabel(booking.roomIds, db)}</span> ({rt?.name})</p>
                  <p>Check-In: {fmtDate(booking.checkIn)} | Check-Out: {fmtDate(booking.checkOut)}</p>
                  <p>Duration: {booking.nights} Night(s) · {booking.adults} Adult(s)</p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Description</th>
                    <th className="py-2 px-2 text-right">Tax %</th>
                    <th className="py-2 px-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {booking.charges.map((c, i) => (
                    <tr key={c.id}>
                      <td className="py-2 px-2 text-gray-500">{i + 1}</td>
                      <td className="py-2 px-2 font-medium">{c.description}</td>
                      <td className="py-2 px-2 text-right">{c.taxRate}%</td>
                      <td className="py-2 px-2 text-right font-semibold">{c.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1 text-right">
                  <div className="flex justify-between"><span>Subtotal:</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
                  {totals.discount > 0 && <div className="flex justify-between text-green-700"><span>Discount:</span><span>- ₹{totals.discount.toFixed(2)}</span></div>}
                  {!isNonGst && (
                    <>
                      <div className="flex justify-between"><span>CGST:</span><span>₹{(totals.tax / 2).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>SGST:</span><span>₹{(totals.tax / 2).toFixed(2)}</span></div>
                    </>
                  )}
                  {isNonGst && (
                    <div className="flex justify-between text-amber-800 font-medium"><span>Tax (Exempted):</span><span>₹0.00</span></div>
                  )}
                  <div className="flex justify-between font-bold text-sm border-t pt-1"><span>Total Payable:</span><span>₹{totals.total.toFixed(2)}</span></div>
                  <div className="flex justify-between text-green-800"><span>Amount Paid:</span><span>₹{totals.paid.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-1 text-red-700"><span>Balance Due:</span><span>₹{totals.balance.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t text-center text-gray-500">
                <div className="border-t border-gray-400 pt-1">Guest Signature</div>
                <div className="border-t border-gray-400 pt-1">Authorized Signatory (Hotel Amara)</div>
              </div>
            </div>
      </Modal>


      {/* Action Success Celebration Modal */}
      {successAction && (
        <SuccessModal
          open={!!successAction}
          onClose={() => setSuccessAction(null)}
          title={successAction.title}
          subtitle={successAction.subtitle}
          details={successAction.details}
          primaryAction={{
            label: "Print Document",
            icon: Printer,
            onClick: () => {
              setSuccessAction(null);
              setPrintDoc("invoice");
            },
          }}
          secondaryAction={{
            label: "Back to Reservations",
            onClick: () => {
              setSuccessAction(null);
              nav({ to: "/reservations" });
            },
          }}
        />
      )}
    </div>
  );
}
