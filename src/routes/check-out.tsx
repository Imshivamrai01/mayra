import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, CreditCard, Sparkles, CheckCircle } from "lucide-react";
import { Badge, Btn, Card, Field, KV, PageHeader, Select, Tabs, SuccessModal } from "@/components/kit";
import { bookingService, fmtDate, guestOf, money, today, useDB, folioTotals, paymentService, roomLabel } from "@/lib/store";
import type { Booking } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/check-out")({
  head: () => ({ meta: [{ title: "Check-out — MAYRA Hotel ERP" }] }),
  component: CheckOutPage,
});

function CheckOutPage() {
  const db = useDB();
  const nav = useNavigate();
  const [tab, setTab] = useState("due");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [payMode, setPayMode] = useState("Cash");
  const [customAmt, setCustomAmt] = useState("");
  const [step, setStep] = useState(1);
  const [checkoutSuccess, setCheckoutSuccess] = useState<{ guestName: string; roomNumber: string; grc: string; invoiceNo: string; paidAmount: number } | null>(null);

  const d = today();
  const due = db.bookings.filter((b) => b.status === "checked-in" && b.checkOut <= d);
  const early = db.bookings.filter((b) => b.status === "checked-in" && b.checkOut > d);
  const checkedOut = db.bookings.filter((b) => b.status === "checked-out" && b.checkOutTime?.slice(0, 10) === d);

  const TABS = [
    { value: "due", label: "Due Check-out", count: due.length },
    { value: "early", label: "Early Check-out", count: early.length },
    { value: "done", label: "Checked-out Today", count: checkedOut.length },
  ];
  const list = { due, early, done: checkedOut }[tab] ?? [];
  const selGuest = selected ? guestOf(selected, db) : null;
  const selTotals = selected ? folioTotals(selected, db) : null;

  function payAndCheckout() {
    if (!selected || !selTotals) return;
    const amt = customAmt ? +customAmt : selTotals.balance;
    if (amt > 0) {
      paymentService.add({ bookingId: selected.id, date: d, mode: payMode as never, amount: amt, kind: "payment", reference: `CO-${selected.grc}` });
    }
    const gName = selGuest?.name ?? "Guest";
    const rNo = roomLabel(selected.roomIds, db);
    const grcNo = selected.grc;
    const invNo = selected.invoiceNo;

    bookingService.checkOut(selected.id);
    toast.success(`Checked out ${gName} · Room ${rNo} is now Dirty`);
    setCheckoutSuccess({ guestName: gName, roomNumber: rNo, grc: grcNo, invoiceNo: invNo, paidAmount: amt });
    setSelected(null);
    setStep(1);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Check-out" subtitle="Process guest departures" />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <div className="space-y-2">
        {list.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No bookings here</div>}
        {list.map((b) => {
          const g = guestOf(b, db);
          const t = folioTotals(b, db);
          return (
            <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{g?.name ?? "—"}</span>
                  {g?.vip && <Badge tone="primary">VIP</Badge>}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {b.id} · Room {roomLabel(b.roomIds, db)} · {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                </div>
                <div className="mt-0.5 text-xs">
                  Total: <span className="font-medium">{money(t.total)}</span> · Paid: <span className="text-success">{money(t.paid)}</span> · Balance: <span className={t.balance > 0 ? "text-danger font-semibold" : "text-success"}>{money(t.balance)}</span>
                </div>
              </div>
              {tab !== "done" && (
                <Btn variant="success" size="sm" icon={LogOut} onClick={() => { setSelected(b); setStep(1); }}>Check-out</Btn>
              )}
              {tab === "done" && <Badge tone="muted">Checked Out · {b.checkOutTime ? new Date(b.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}</Badge>}
            </div>
          );
        })}
      </div>

      {selected && selTotals && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 p-4 backdrop-blur-[2px]">
          <div className="mt-10 w-full max-w-lg rounded-xl border border-border bg-card shadow-[var(--shadow-pop)]">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Check-out · {selected.id} — Step {step} of 2</h3>
              <button onClick={() => { setSelected(null); setStep(1); }} className="rounded-md p-1 hover:bg-secondary">✕</button>
            </header>
            <div className="p-4 space-y-4">
              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Final Folio — {selGuest?.name}</p>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <div className="space-y-1.5 text-sm">
                      {selected.charges.map((c) => (
                        <div key={c.id} className="flex justify-between">
                          <span className="text-muted-foreground">{c.description}</span>
                          <span>{money(c.amount)}</span>
                        </div>
                      ))}
                      <div className="border-t border-border pt-1.5 space-y-1">
                        <KV label="Subtotal" value={money(selTotals.subtotal)} />
                        <KV label="Discount" value={`- ${money(selTotals.discount)}`} />
                        <KV label="Tax" value={money(selTotals.tax)} />
                        <KV label="Grand Total" value={<span className="text-base font-semibold">{money(selTotals.total)}</span>} />
                        <KV label="Paid" value={<span className="text-success">{money(selTotals.paid)}</span>} />
                        <KV label="Balance Due" value={<span className={selTotals.balance > 0 ? "text-danger font-semibold text-base" : "text-success"}>{money(selTotals.balance)}</span>} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Collect Payment</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Amount (₹) (blank = full balance)">
                      <input type="number" min="0" value={customAmt} onChange={(e) => setCustomAmt(e.target.value)} placeholder={String(selTotals.balance)} className="h-9 w-full rounded-md border border-border bg-card px-2.5 text-sm outline-none focus:border-primary" />
                    </Field>
                    <Field label="Payment Mode">
                      <Select value={payMode} onChange={(e) => setPayMode(e.target.value)} options={["Cash", "UPI", "Card", "Bank Transfer"].map((s) => ({ value: s, label: s }))} />
                    </Field>
                  </div>
                  {selTotals.balance <= 0 && <p className="text-sm text-success">✓ Folio fully settled — no payment required</p>}
                </div>
              )}
            </div>
            <footer className="flex justify-between gap-2 border-t border-border px-4 py-3">
              <Btn onClick={() => step > 1 ? setStep(s => s - 1) : setSelected(null)}>
                {step > 1 ? "Back" : "Cancel"}
              </Btn>
              {step < 2 ? (
                <Btn variant="primary" onClick={() => setStep(2)}>Next →</Btn>
              ) : (
                <Btn variant="success" icon={LogOut} onClick={payAndCheckout}>Confirm Check-out</Btn>
              )}
            </footer>
          </div>
        </div>
      )}

      {checkoutSuccess && (
        <SuccessModal
          open={!!checkoutSuccess}
          onClose={() => setCheckoutSuccess(null)}
          title="Guest Checked-Out Successfully!"
          subtitle="Folio settled. Room flagged as Dirty and sent to Housekeeping Queue."
          details={[
            { label: "Guest Name", value: checkoutSuccess.guestName },
            { label: "Vacated Room", value: checkoutSuccess.roomNumber },
            { label: "Tax Invoice No", value: checkoutSuccess.invoiceNo },
            { label: "Settlement Amount", value: money(checkoutSuccess.paidAmount) },
          ]}
          primaryAction={{
            label: "Open Housekeeping Board",
            onClick: () => {
              setCheckoutSuccess(null);
              nav({ to: "/housekeeping" });
            },
          }}
          secondaryAction={{
            label: "Back to Front Desk",
            onClick: () => {
              setCheckoutSuccess(null);
              nav({ to: "/front-desk" });
            },
          }}
        />
      )}
    </div>
  );
}
