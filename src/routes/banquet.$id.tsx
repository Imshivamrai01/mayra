import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Calendar, CheckCircle, Clock, CreditCard, Download, Edit3,
  FileText, Home, Phone, Plus, Printer, Trash2, User, Users, Utensils,
  Sparkles, AlertTriangle
} from "lucide-react";
import {
  Badge, Btn, Card, Field, Input, PageHeader, StatCard, SuccessModal, Table
} from "@/components/kit";
import {
  fmtDate, money, today, uid, update, useDB
} from "@/lib/store";
import type { BanquetEvent } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/banquet/$id")({
  head: () => ({ meta: [{ title: "Banquet Event Details — Hotel Amara ERP" }] }),
  component: BanquetDetailPage,
});

function BanquetDetailPage() {
  const { id } = Route.useParams();
  const db = useDB();
  const nav = useNavigate();

  const event = db.events.find((e) => e.id === id);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmt, setPayAmt] = useState("");
  const [printDoc, setPrintDoc] = useState<boolean>(false);

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
        <AlertTriangle className="h-12 w-12 text-warning" />
        <h2 className="text-xl font-bold">Banquet Event Not Found</h2>
        <p className="text-sm text-muted-foreground">The event with ID "{id}" could not be located.</p>
        <Btn variant="primary" onClick={() => nav({ to: "/banquet/events" })}>Back to Banquet Events</Btn>
      </div>
    );
  }

  const hall = db.halls.find((h) => h.id === event.hallId);
  const pkg = db.banquetPackages.find((p) => p.id === event.packageId);
  const foodCost = event.guests * (pkg?.perPerson ?? 0);
  const subtotal = foodCost + event.decoration + event.otherCharges;
  const grandTotal = subtotal - event.discount;
  const balance = grandTotal - event.advance;

  function changeStatus(newStatus: BanquetEvent["status"]) {
    update((d) => {
      const e = d.events.find((x) => x.id === event.id);
      if (e) e.status = newStatus;
    });
    toast.success(`Event status updated to ${newStatus}`);
  }

  function handleAddAdvance() {
    const amt = parseFloat(payAmt);
    if (!amt || amt <= 0) { toast.error("Please enter a valid amount"); return; }
    update((d) => {
      const e = d.events.find((x) => x.id === event.id);
      if (e) e.advance += amt;
    });
    toast.success(`Payment of ${money(amt)} added to advance deposit`);
    setPayOpen(false);
    setPayAmt("");
  }

  const statusTone: Record<string, "info" | "success" | "muted" | "danger"> = {
    enquiry: "info", confirmed: "success", completed: "muted", cancelled: "danger",
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Btn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => nav({ to: "/banquet/events" })}>
            Back to Events
          </Btn>
          <span className="text-muted-foreground">|</span>
          <span className="font-mono text-sm font-semibold">{event.code}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Btn size="sm" icon={Printer} onClick={() => setPrintDoc(true)}>
            Print Function Sheet (BEO)
          </Btn>
          {event.status === "enquiry" && (
            <Btn variant="primary" size="sm" icon={CheckCircle} onClick={() => changeStatus("confirmed")}>
              Confirm Event
            </Btn>
          )}
          {event.status === "confirmed" && (
            <Btn variant="success" size="sm" icon={CheckCircle} onClick={() => changeStatus("completed")}>
              Mark Completed
            </Btn>
          )}
          {event.status !== "cancelled" && (
            <Btn variant="danger" size="sm" icon={Trash2} onClick={() => changeStatus("cancelled")}>
              Cancel Event
            </Btn>
          )}
        </div>
      </div>

      <PageHeader
        title={event.name}
        subtitle={`${event.customer} · ${fmtDate(event.date)} at ${event.time} · ${hall?.name ?? "Hall"}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={statusTone[event.status]} className="text-sm px-3 py-1 font-semibold uppercase">
              {event.status}
            </Badge>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Estimated Grand Total" value={money(grandTotal)} sub={`Catering + Decor + AV Setup`} tone="primary" />
        <StatCard label="Advance Deposited" value={money(event.advance)} sub="Received to date" tone="success" />
        <StatCard
          label="Balance Payable"
          value={money(balance)}
          sub={balance <= 0 ? "Fully Paid" : "Pending Settlement"}
          tone={balance > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Guaranteed Guests"
          value={`${event.guests} Pax`}
          sub={`${hall?.name ?? "Hall"} (Cap: ${hall?.capacity ?? "—"})`}
          tone="info"
        />
      </div>

      {/* Main Breakdown */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left Column: Customer & Venue details */}
        <div className="space-y-4 lg:col-span-1">
          <Card title="Customer & Venue Details">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Host / Customer</span>
                <span className="font-semibold">{event.customer}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Phone Number</span>
                <span className="font-mono">{event.phone || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Event Date & Time</span>
                <span>{fmtDate(event.date)} ({event.time})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Banquet Hall</span>
                <span className="font-semibold">{hall?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Hall Floor / Area</span>
                <span>Floor {hall?.floor} · {hall?.sqft} sq.ft</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Catering Package</span>
                <span className="font-semibold">{pkg?.name} (₹{pkg?.perPerson}/pax)</span>
              </div>
            </div>

            {event.notes && (
              <div className="mt-3 pt-3 border-t border-border text-xs">
                <span className="text-muted-foreground block mb-1 font-semibold">Special Instructions:</span>
                <p className="rounded bg-secondary/70 p-2 italic">{event.notes}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Commercial Statement */}
        <div className="space-y-4 lg:col-span-2">
          <Card
            title="Commercial Billing Statement"
            action={
              <Btn variant="primary" size="sm" icon={CreditCard} onClick={() => { setPayAmt(String(Math.max(0, balance))); setPayOpen(true); }}>
                Record Advance / Settlement
              </Btn>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-border/60">
                <div>
                  <div className="font-semibold">Catering Package: {pkg?.name}</div>
                  <div className="text-muted-foreground">₹{pkg?.perPerson} × {event.guests} Guaranteed Pax</div>
                </div>
                <span className="font-semibold text-sm">{money(foodCost)}</span>
              </div>

              {event.decoration > 0 && (
                <div className="flex justify-between py-2 border-b border-border/60">
                  <div>
                    <div className="font-semibold">Floral, Stage & Ambience Decor</div>
                    <div className="text-muted-foreground">Custom Stage Setup & Lighting</div>
                  </div>
                  <span className="font-semibold text-sm">{money(event.decoration)}</span>
                </div>
              )}

              {event.otherCharges > 0 && (
                <div className="flex justify-between py-2 border-b border-border/60">
                  <div>
                    <div className="font-semibold">AV Equipment, DJ & Additional Services</div>
                    <div className="text-muted-foreground">Projector, Mics, Audio System</div>
                  </div>
                  <span className="font-semibold text-sm">{money(event.otherCharges)}</span>
                </div>
              )}

              {event.discount > 0 && (
                <div className="flex justify-between py-2 border-b border-border/60 text-success">
                  <div className="font-semibold">Special Event Discount</div>
                  <span className="font-semibold text-sm">- {money(event.discount)}</span>
                </div>
              )}

              <div className="pt-3 space-y-1.5 border-t border-border">
                <div className="flex justify-between font-bold text-sm">
                  <span>Grand Total</span>
                  <span>{money(grandTotal)}</span>
                </div>
                <div className="flex justify-between text-success font-semibold">
                  <span>Advance Received</span>
                  <span>{money(event.advance)}</span>
                </div>
                <div className={`flex justify-between font-bold text-base border-t border-border pt-1.5 ${balance > 0 ? "text-danger" : "text-success"}`}>
                  <span>Balance Payable</span>
                  <span>{money(balance)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Record Advance Modal */}
      {payOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-base">Record Advance Deposit · {event.code}</h3>
              <button onClick={() => setPayOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-3">
              <Field label="Deposit Amount (₹)">
                <Input type="number" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} placeholder="0.00" />
              </Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Btn onClick={() => setPayOpen(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleAddAdvance}>Confirm Deposit</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Printable BEO Sheet */}
      {printDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-xl border border-border bg-card p-6 shadow-2xl my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3 no-print">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">Banquet Event Order (BEO) Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="primary" size="sm" icon={Printer} onClick={() => window.print()}>Print Now</Btn>
                <Btn size="sm" onClick={() => setPrintDoc(false)}>Close</Btn>
              </div>
            </div>

            <div className="rounded border p-6 bg-white text-black text-xs space-y-4">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-primary">HOTEL AMARA</h1>
                  <p className="text-gray-600">Banquet & Convention Center</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-gray-100 font-bold uppercase rounded border">BANQUET EVENT ORDER (BEO)</span>
                  <p className="mt-1 font-mono font-bold text-sm">{event.code}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">Host & Event Info:</h4>
                  <p className="font-bold text-sm">{event.name}</p>
                  <p>Client: {event.customer} ({event.phone})</p>
                  <p>Guaranteed Guests: {event.guests} Pax</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">Venue Schedule:</h4>
                  <p>Hall: <span className="font-bold">{hall?.name}</span></p>
                  <p>Date & Time: {fmtDate(event.date)} at {event.time}</p>
                  <p>Catering Package: {pkg?.name}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-sm">
                  <span>Grand Total Commercials:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-800">
                  <span>Advance Received:</span>
                  <span>₹{event.advance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-800 font-bold">
                  <span>Balance Payable:</span>
                  <span>₹{balance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
