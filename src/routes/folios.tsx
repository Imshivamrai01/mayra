import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Printer } from "lucide-react";
import { Badge, Btn, Card, Field, Input, KV, PageHeader, Select, Tabs, SuccessModal } from "@/components/kit";
import { bookingService, fmtDate, fmtTime, guestOf, money, today, uid, update, useDB, folioTotals, paymentService } from "@/lib/store";
import type { Booking, ChargeKind, FolioCharge } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/folios")({
  head: () => ({ meta: [{ title: "Folios — MAYRA Hotel ERP" }] }),
  component: FoliosPage,
});

const KIND_TONE: Record<string, string> = {
  Room: "primary", Restaurant: "success", "Room Service": "info",
  Laundry: "warning", Banquet: "info", Other: "muted", Discount: "danger",
};

function FolioDetail({ booking }: { booking: Booking }) {
  const db = useDB();
  const guest = guestOf(booking, db);
  const totals = folioTotals(booking, db);
  const [addOpen, setAddOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [charge, setCharge] = useState({ kind: "Other" as ChargeKind, description: "", amount: "0", taxRate: "0" });
  const [payment, setPayment] = useState({ mode: "Cash", amount: String(Math.max(0, totals.balance)), note: "" });
  const [paidReceipt, setPaidReceipt] = useState<{ amount: number; mode: string } | null>(null);

  function addCharge() {
    if (!charge.description || +charge.amount <= 0) { toast.error("Fill description and amount"); return; }
    bookingService.addCharge(booking.id, { date: today(), kind: charge.kind, description: charge.description, qty: 1, rate: +charge.amount, amount: +charge.amount, taxRate: +charge.taxRate });
    toast.success("Charge added");
    setAddOpen(false);
  }

  function addPayment() {
    const amt = +payment.amount;
    if (amt <= 0) { toast.error("Enter valid amount"); return; }
    paymentService.add({ bookingId: booking.id, date: today(), mode: payment.mode as never, amount: amt, kind: "payment", note: payment.note });
    toast.success("Payment recorded");
    setPayOpen(false);
    setPaidReceipt({ amount: amt, mode: payment.mode });
  }

  function printFolio() { window.print(); }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{guest?.name}</h3>
          <p className="text-xs text-muted-foreground">{booking.id} · GRC: {booking.grc} · INV: {booking.invoiceNo}</p>
          <p className="text-xs text-muted-foreground">Check-in: {fmtDate(booking.checkIn)} · Check-out: {fmtDate(booking.checkOut)}</p>
        </div>
        <div className="flex gap-2">
          <Btn size="sm" onClick={() => setAddOpen(true)} icon={Plus}>Add Charge</Btn>
          <Btn size="sm" variant="primary" onClick={() => setPayOpen(true)}>Add Payment</Btn>
          <Btn size="sm" icon={Printer} onClick={printFolio}>Print</Btn>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[500px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/60">
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-muted-foreground">Date</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-muted-foreground">Description</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-muted-foreground">Dept</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase text-muted-foreground">Amount</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase text-muted-foreground">Tax</th>
            </tr>
          </thead>
          <tbody>
            {booking.charges.map((c) => (
              <tr key={c.id} className="border-b border-border/60">
                <td className="px-3 py-2 text-muted-foreground">{fmtDate(c.date)}</td>
                <td className="px-3 py-2">{c.description}</td>
                <td className="px-3 py-2"><Badge tone={KIND_TONE[c.kind] ?? "muted"}>{c.kind}</Badge></td>
                <td className="px-3 py-2 text-right tabular-nums">{c.kind === "Discount" ? `- ${money(c.amount)}` : money(c.amount)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{c.taxRate}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-secondary/30">
              <td colSpan={3} className="px-3 py-2 font-semibold">Summary</td>
              <td colSpan={2} />
            </tr>
            <tr>
              <td colSpan={3} className="px-3 py-1 text-muted-foreground">Subtotal</td>
              <td className="px-3 py-1 text-right tabular-nums">{money(totals.subtotal)}</td>
              <td />
            </tr>
            <tr>
              <td colSpan={3} className="px-3 py-1 text-muted-foreground">Discount</td>
              <td className="px-3 py-1 text-right tabular-nums text-danger">- {money(totals.discount)}</td>
              <td />
            </tr>
            <tr>
              <td colSpan={3} className="px-3 py-1 text-muted-foreground">Tax</td>
              <td className="px-3 py-1 text-right tabular-nums">{money(totals.tax)}</td>
              <td />
            </tr>
            <tr className="font-semibold">
              <td colSpan={3} className="px-3 py-2">Grand Total</td>
              <td className="px-3 py-2 text-right tabular-nums text-base">{money(totals.total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Payments Received</p>
        {totals.payments.map((p) => (
          <div key={p.id} className="flex justify-between rounded-md border border-border px-3 py-2 text-sm">
            <span>{fmtDate(p.date)} · {p.mode}</span>
            <span className="text-success font-medium">{money(p.amount)}</span>
          </div>
        ))}
        {totals.payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet</p>}
        <div className="flex justify-between rounded-md border border-border bg-secondary/30 px-3 py-2 font-semibold">
          <span>Balance Due</span>
          <span className={totals.balance > 0 ? "text-danger" : "text-success"}>{money(totals.balance)}</span>
        </div>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-pop)]">
            <h4 className="mb-4 font-semibold">Add Folio Charge</h4>
            <div className="space-y-3">
              <Field label="Category">
                <Select value={charge.kind} onChange={(e) => setCharge((c) => ({ ...c, kind: e.target.value as ChargeKind }))} options={["Room", "Restaurant", "Room Service", "Laundry", "Banquet", "Other", "Discount"].map((k) => ({ value: k, label: k }))} />
              </Field>
              <Field label="Description"><Input value={charge.description} onChange={(e) => setCharge((c) => ({ ...c, description: e.target.value }))} /></Field>
              <div className="grid gap-3 grid-cols-2">
                <Field label="Amount (₹)"><Input type="number" value={charge.amount} onChange={(e) => setCharge((c) => ({ ...c, amount: e.target.value }))} /></Field>
                <Field label="Tax Rate (%)"><Input type="number" value={charge.taxRate} onChange={(e) => setCharge((c) => ({ ...c, taxRate: e.target.value }))} /></Field>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Btn onClick={() => setAddOpen(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={addCharge}>Add Charge</Btn>
            </div>
          </div>
        </div>
      )}

      {payOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-pop)]">
            <h4 className="mb-4 font-semibold">Add Payment</h4>
            <div className="space-y-3">
              <Field label="Amount (₹)"><Input type="number" value={payment.amount} onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))} /></Field>
              <Field label="Payment Mode">
                <Select value={payment.mode} onChange={(e) => setPayment((p) => ({ ...p, mode: e.target.value }))} options={["Cash", "UPI", "Card", "Bank Transfer"].map((s) => ({ value: s, label: s }))} />
              </Field>
              <Field label="Note"><Input value={payment.note} onChange={(e) => setPayment((p) => ({ ...p, note: e.target.value }))} /></Field>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Btn onClick={() => setPayOpen(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={addPayment}>Record Payment</Btn>
            </div>
          </div>
        </div>
      )}

      {paidReceipt && (
        <SuccessModal
          open={!!paidReceipt}
          onClose={() => setPaidReceipt(null)}
          title="Payment Recorded Successfully!"
          subtitle="Transaction voucher generated and deducted from folio balance."
          details={[
            { label: "Guest Name", value: guest?.name ?? "Guest" },
            { label: "Booking ID", value: booking.id },
            { label: "Amount Paid", value: money(paidReceipt.amount) },
            { label: "Payment Mode", value: paidReceipt.mode },
            { label: "Remaining Balance", value: money(Math.max(0, totals.balance - paidReceipt.amount)) },
          ]}
          primaryAction={{
            label: "Print Updated Folio Receipt",
            icon: Printer,
            onClick: () => {
              setPaidReceipt(null);
              window.print();
            },
          }}
          secondaryAction={{
            label: "Close Window",
            onClick: () => setPaidReceipt(null),
          }}
        />
      )}
    </div>
  );
}

function FoliosPage() {
  const db = useDB();
  const [selected, setSelected] = useState<Booking | null>(null);
  const [tab, setTab] = useState("open");

  const open = db.bookings.filter((b) => ["confirmed", "checked-in"].includes(b.status));
  const closed = db.bookings.filter((b) => b.status === "checked-out");

  const TABS = [
    { value: "open", label: "Open Folios", count: open.length },
    { value: "closed", label: "Closed Folios", count: closed.length },
  ];
  const list = tab === "open" ? open : closed;

  return (
    <div className="space-y-4">
      <PageHeader title="Guest Folios" subtitle="All billing accounts" />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((b) => {
          const g = guestOf(b, db);
          const t = folioTotals(b, db);
          return (
            <button key={b.id} onClick={() => setSelected(b)} className="card-surface p-4 text-left hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold flex items-center gap-1.5">{g?.name}{g?.vip && <Badge tone="primary">VIP</Badge>}</div>
                  <div className="text-xs text-muted-foreground">{b.id} · {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</div>
                </div>
                <Badge tone={b.status === "checked-in" ? "success" : b.status === "confirmed" ? "info" : "muted"}>{b.status}</Badge>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>{money(t.total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="text-success">{money(t.paid)}</span></div>
                <div className="flex justify-between font-semibold"><span>Balance</span><span className={t.balance > 0 ? "text-danger" : "text-success"}>{money(t.balance)}</span></div>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-[2px]">
          <div className="flex-1" onClick={() => setSelected(null)} />
          <aside className="flex h-full w-full max-w-2xl flex-col border-l border-border bg-card shadow-[var(--shadow-pop)]">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Folio — {guestOf(selected, db)?.name}</h3>
              <button onClick={() => setSelected(null)} className="rounded-md p-1 hover:bg-secondary">✕</button>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              <FolioDetail booking={selected} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
