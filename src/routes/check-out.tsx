import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, CreditCard, Sparkles, CheckCircle } from "lucide-react";
import { Badge, Btn, Card, Field, KV, Modal, PageHeader, Select, Tabs, SuccessModal } from "@/components/kit";
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
    <div className="space-y-5 pb-12">
      <PageHeader title="Express Check-out" subtitle="Settle guest folios, print tax invoices, and flag room for housekeeping" />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <div className="space-y-2.5">
        {list.length === 0 && <div className="py-12 text-center text-xs font-semibold text-slate-400">No bookings in this lane</div>}
        {list.map((b) => {
          const g = guestOf(b, db);
          const t = folioTotals(b, db);
          return (
            <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 hover:border-purple-300 hover:shadow-xs transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{g?.name ?? "—"}</span>
                  {g?.vip && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">★ VIP</span>}
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  <span className="font-mono text-purple-700 font-bold">{b.id}</span> · Room <span className="font-bold text-slate-900">{roomLabel(b.roomIds, db)}</span> · {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  Total: <span className="font-bold text-slate-900">{money(t.total)}</span> · Paid: <span className="text-emerald-700 font-bold">{money(t.paid)}</span> · Balance: <span className={t.balance > 0 ? "text-rose-600 font-extrabold" : "text-emerald-700 font-extrabold"}>{money(t.balance)}</span>
                </div>
              </div>
              {tab !== "done" && (
                <Btn
                  variant="outline"
                  size="sm"
                  icon={LogOut}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 font-bold"
                  onClick={() => {
                    setSelected(b);
                    setCustomAmt(t.balance > 0 ? String(t.balance) : "");
                    setStep(1);
                  }}
                >
                  Express Check-out
                </Btn>
              )}

              {tab === "done" && <Badge tone="muted">Checked Out · {b.checkOutTime ? new Date(b.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}</Badge>}
            </div>
          );
        })}
      </div>

      <Modal
        open={Boolean(selected && selTotals)}
        onClose={() => { setSelected(null); setStep(1); }}
        title={`Check-out · ${selected?.id} — Step ${step} of 2`}
        footer={
          <div className="flex w-full justify-between items-center">
            <Btn onClick={() => step > 1 ? setStep(s => s - 1) : setSelected(null)}>
              {step > 1 ? "← Back" : "Cancel"}
            </Btn>
            {step < 2 ? (
              <Btn variant="primary" onClick={() => setStep(2)}>Next Step →</Btn>
            ) : (
              <Btn variant="primary" icon={LogOut} onClick={payAndCheckout}>Confirm Check-out</Btn>
            )}
          </div>
        }
      >
        {selected && selTotals && (
          <div className="space-y-4">
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-purple-900">Final Folio Statement — {selGuest?.name}</p>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                  <div className="space-y-1.5 text-xs">
                    {selected.charges.map((c) => (
                      <div key={c.id} className="flex justify-between font-medium text-slate-700">
                        <span>{c.description}</span>
                        <span className="font-bold">{money(c.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-2 space-y-1.5 font-semibold text-slate-600">
                      <KV label="Subtotal" value={money(selTotals.subtotal)} />
                      <KV label="Discount" value={`- ${money(selTotals.discount)}`} />
                      <KV label="Tax" value={money(selTotals.tax)} />
                      <KV label="Grand Total" value={<span className="text-sm font-black text-slate-900">{money(selTotals.total)}</span>} />
                      <KV label="Paid" value={<span className="text-emerald-700 font-bold">{money(selTotals.paid)}</span>} />
                      <KV label="Balance Due" value={<span className={selTotals.balance > 0 ? "text-rose-600 font-black text-sm" : "text-emerald-700 font-black"}>{money(selTotals.balance)}</span>} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-purple-900">Collect Final Folio Settlement</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Amount to Settle (₹) (blank = full balance)">
                    <input type="number" min="0" value={customAmt} onChange={(e) => setCustomAmt(e.target.value)} placeholder={String(selTotals.balance)} className="h-9.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-purple-600" />
                  </Field>
                  <Field label="Payment Mode">
                    <Select value={payMode} onChange={(e) => setPayMode(e.target.value)} options={["Cash", "UPI", "Card", "Bank Transfer"].map((s) => ({ value: s, label: s }))} />
                  </Field>
                </div>
                {selTotals.balance <= 0 && <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">✓ Folio is fully paid & settled — ready to release room.</p>}
              </div>
            )}
          </div>
        )}
      </Modal>


      {checkoutSuccess && (
        <SuccessModal
          open={!!checkoutSuccess}
          onClose={() => setCheckoutSuccess(null)}
          title="Guest Checked-Out & Folio Settled!"
          subtitle="Payment recorded, balance cleared, and room flagged as Dirty in Housekeeping Board."
          details={[
            { label: "Guest Name", value: checkoutSuccess.guestName },
            { label: "Vacated Room", value: `Room ${checkoutSuccess.roomNumber}` },
            { label: "Tax Invoice No", value: checkoutSuccess.invoiceNo },
            { label: "GRC Reference", value: checkoutSuccess.grc },
            { label: "Settlement Paid", value: money(checkoutSuccess.paidAmount) },
          ]}
          primaryAction={{
            label: "Print Settled Tax Invoice",
            onClick: () => {
              setCheckoutSuccess(null);
              window.print();
            },
          }}
          secondaryAction={{
            label: "Open Housekeeping Board",
            onClick: () => {
              setCheckoutSuccess(null);
              nav({ to: "/housekeeping" });
            },
          }}
        />
      )}

    </div>
  );
}
