import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Printer } from "lucide-react";
import { Badge, Btn, Card, Drawer, Field, Input, KV, Modal, PageHeader, Select, Tabs, SuccessModal } from "@/components/kit";
import { bookingService, fmtDate, fmtTime, guestOf, money, today, uid, update, useDB, folioTotals, paymentService } from "@/lib/store";
import type { Booking, ChargeKind, FolioCharge } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/folios")({
  head: () => ({ meta: [{ title: "Folios — Hotel Amara ERP" }] }),
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
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
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

  function printFolio() { setInvoicePreviewOpen(true); }

  const rp = db.ratePlans.find((r) => r.id === booking.ratePlanId);
  const roomNums = booking.roomIds.map((rid) => db.rooms.find((r) => r.id === rid)?.number).filter(Boolean).join(", ");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">{guest?.name}</h3>
          <p className="text-xs font-semibold text-slate-500">{booking.id} · GRC: {booking.grc} · INV: {booking.invoiceNo}</p>
          <p className="text-xs text-slate-400 mt-0.5">Check-in: {fmtDate(booking.checkIn)} · Check-out: {fmtDate(booking.checkOut)}</p>
        </div>
        <div className="flex gap-2">
          <Btn size="sm" onClick={() => setAddOpen(true)} icon={Plus}>Add Charge</Btn>
          <Btn size="sm" variant="primary" onClick={() => setPayOpen(true)}>Add Payment</Btn>
          <Btn size="sm" icon={Printer} className="shimmer-gold font-bold" onClick={() => setInvoicePreviewOpen(true)}>Tax Invoice</Btn>
        </div>
      </div>


      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
        <table className="w-full min-w-[500px] text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80">
              <th className="px-3.5 py-2.5 text-left text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">Date</th>
              <th className="px-3.5 py-2.5 text-left text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">Description</th>
              <th className="px-3.5 py-2.5 text-left text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">Dept</th>
              <th className="px-3.5 py-2.5 text-right text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">Amount</th>
              <th className="px-3.5 py-2.5 text-right text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">Tax</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {booking.charges.map((c) => (
              <tr key={c.id} className="hover:bg-purple-50/30 transition-colors">
                <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">{fmtDate(c.date)}</td>
                <td className="px-3.5 py-2.5 font-bold text-slate-900">{c.description}</td>
                <td className="px-3.5 py-2.5"><Badge tone={KIND_TONE[c.kind] ?? "muted"}>{c.kind}</Badge></td>
                <td className="px-3.5 py-2.5 text-right tabular-nums font-bold text-slate-800">{c.kind === "Discount" ? `- ${money(c.amount)}` : money(c.amount)}</td>
                <td className="px-3.5 py-2.5 text-right tabular-nums text-slate-500">{c.taxRate}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50/60 border-t border-slate-200 text-xs">
            <tr className="border-b border-slate-100">
              <td colSpan={3} className="px-3.5 py-2 font-bold text-slate-600">Subtotal</td>
              <td className="px-3.5 py-2 text-right tabular-nums font-bold">{money(totals.subtotal)}</td>
              <td />
            </tr>
            {totals.discount > 0 && (
              <tr className="border-b border-slate-100">
                <td colSpan={3} className="px-3.5 py-1.5 font-semibold text-emerald-700">Discount</td>
                <td className="px-3.5 py-1.5 text-right tabular-nums font-bold text-emerald-700">- {money(totals.discount)}</td>
                <td />
              </tr>
            )}
            <tr className="border-b border-slate-100">
              <td colSpan={3} className="px-3.5 py-1.5 font-semibold text-slate-600">Tax</td>
              <td className="px-3.5 py-1.5 text-right tabular-nums font-bold">{money(totals.tax)}</td>
              <td />
            </tr>
            <tr className="border-b border-slate-200 bg-purple-50/40">
              <td colSpan={3} className="px-3.5 py-2 font-black text-slate-900 text-sm">Grand Total</td>
              <td className="px-3.5 py-2 text-right tabular-nums font-black text-purple-700 text-sm">{money(totals.total)}</td>
              <td />
            </tr>
            <tr className="border-b border-slate-100">
              <td colSpan={3} className="px-3.5 py-1.5 font-semibold text-slate-600">Total Paid</td>
              <td className="px-3.5 py-1.5 text-right tabular-nums font-bold text-emerald-700">{money(totals.paid)}</td>
              <td />
            </tr>
            <tr>
              <td colSpan={3} className="px-3.5 py-2 font-black text-slate-900">Balance Due</td>
              <td className={`px-3.5 py-2 text-right tabular-nums font-black text-sm ${totals.balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>{money(totals.balance)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Folio Charge"
        footer={
          <>
            <Btn onClick={() => setAddOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={addCharge}>Add Charge</Btn>
          </>
        }
      >
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
      </Modal>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Add Payment"
        footer={
          <>
            <Btn onClick={() => setPayOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={addPayment}>Record Payment</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Amount (₹)"><Input type="number" value={payment.amount} onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))} /></Field>
          <Field label="Payment Mode">
            <Select value={payment.mode} onChange={(e) => setPayment((p) => ({ ...p, mode: e.target.value }))} options={["Cash", "UPI", "Card", "Bank Transfer"].map((s) => ({ value: s, label: s }))} />
          </Field>
          <Field label="Note"><Input value={payment.note} onChange={(e) => setPayment((p) => ({ ...p, note: e.target.value }))} /></Field>
        </div>
      </Modal>

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

      {/* Luxury Tax Invoice Modal */}
      <Modal
        open={invoicePreviewOpen}
        onClose={() => setInvoicePreviewOpen(false)}
        title="Official Guest Tax Invoice"
        subtitle={`Invoice #${booking.invoiceNo} · GRC: ${booking.grc}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs font-sans p-2">
          {/* Header Banner */}
          <div className="flex items-start justify-between pb-3 border-b-2 border-slate-900">
            <div>
              <span className="text-base font-black tracking-wider text-slate-900 block">HOTEL AMARA & RESIDENCES</span>
              <span className="text-[11px] font-semibold text-slate-500 block">Luxury Business & Leisure Suites</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">12 Barakhamba Road, Connaught Place, New Delhi 110001</span>
              <span className="text-[10px] font-mono font-bold text-slate-700 block">GSTIN: 07AAAAA0000A1Z5 · SAC: 996311</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-900 inline-block">Tax Invoice</span>
              <span className="text-xs font-black text-slate-900 block mt-1">INV-{booking.invoiceNo}</span>
              <span className="text-[10px] text-slate-500 block">Date: {fmtDate(today())}</span>
            </div>
          </div>

          {/* Guest & Stay Meta Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Guest Details</span>
              <span className="text-xs font-bold text-slate-900 block">{guest?.salutation} {guest?.name}</span>
              <span className="text-[11px] text-slate-600 block">{guest?.mobile} · {guest?.city}</span>
              {guest?.vip && <span className="text-[9.5px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded inline-block mt-0.5">VIP Guest</span>}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Stay Information</span>
              <span className="text-xs font-bold text-slate-900 block">Room(s): {roomNums || "—"}</span>
              <span className="text-[11px] text-slate-600 block">{fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)} ({booking.nights} Nts)</span>
              <span className="text-[10px] font-bold text-purple-700 block">Plan: {rp ? `${rp.code} (${rp.name})` : "EP"}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr className="text-[10px] font-black uppercase text-slate-600 text-left">
                  <th className="p-2">Description</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Tax</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {booking.charges.map((c) => (
                  <tr key={c.id}>
                    <td className="p-2 font-semibold text-slate-800">{c.description}</td>
                    <td className="p-2 text-center text-slate-500">{c.qty || 1}</td>
                    <td className="p-2 text-right text-slate-600">{money(c.rate || c.amount)}</td>
                    <td className="p-2 text-right text-slate-500">{c.taxRate}%</td>
                    <td className="p-2 text-right font-bold text-slate-900">{money(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold">
                <tr>
                  <td colSpan={4} className="p-2 text-right text-slate-600">Subtotal</td>
                  <td className="p-2 text-right font-bold text-slate-900">{money(totals.subtotal)}</td>
                </tr>
                {totals.discount > 0 && (
                  <tr>
                    <td colSpan={4} className="p-2 text-right text-emerald-700">Special Discount</td>
                    <td className="p-2 text-right font-bold text-emerald-700">- {money(totals.discount)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={4} className="p-2 text-right text-slate-600">GST (CGST 6% + SGST 6%)</td>
                  <td className="p-2 text-right font-bold text-slate-900">{money(totals.tax)}</td>
                </tr>
                <tr className="bg-purple-50 text-sm font-black border-t border-purple-200">
                  <td colSpan={4} className="p-2 text-right text-purple-950">Grand Total</td>
                  <td className="p-2 text-right text-purple-700">{money(totals.total)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="p-2 text-right text-slate-600">Paid Amount</td>
                  <td className="p-2 text-right font-bold text-emerald-700">{money(totals.paid)}</td>
                </tr>
                <tr className="border-t border-slate-200 bg-slate-100 font-bold">
                  <td colSpan={4} className="p-2 text-right text-slate-800">Net Due Balance</td>
                  <td className="p-2 text-right font-black text-emerald-700">
                    {money(totals.balance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Terms & Signatory */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-[10px] text-slate-400">
            <div>
              <p>Thank you for staying at Hotel Amara & Residences.</p>
              <p>Computer generated invoice, no physical signature required.</p>
            </div>
            <div className="text-right">
              <span className="block font-bold text-slate-700">Authorized Signatory</span>
              <span className="block text-slate-400 mt-1">Amara Hospitality Desk</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Btn variant="outline" size="sm" onClick={() => setInvoicePreviewOpen(false)}>Close</Btn>
            <Btn variant="primary" size="sm" icon={Printer} className="shimmer-gold font-bold" onClick={() => window.print()}>
              Print Tax Invoice
            </Btn>
          </div>
        </div>
      </Modal>

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
    <div className="space-y-5 pb-12">
      <PageHeader title="Guest Folios & Billing" subtitle="All active and settled guest accounts" />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((b) => {
          const g = guestOf(b, db);
          const t = folioTotals(b, db);
          return (
            <button
              key={b.id}
              onClick={() => setSelected(b)}
              className="card-surface rounded-2xl bg-white border border-slate-200/80 p-4.5 text-left hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-sm">
                    {g?.name}
                    {g?.vip && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">★ VIP</span>}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-0.5">{b.id} · {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</div>
                </div>
                <Badge tone={b.status === "checked-in" ? "success" : b.status === "confirmed" ? "info" : "muted"}>{b.status}</Badge>
              </div>
              <div className="mt-3.5 space-y-1.5 text-xs font-semibold pt-2.5 border-t border-slate-100">
                <div className="flex justify-between text-slate-500"><span>Total</span><span className="font-bold text-slate-900">{money(t.total)}</span></div>
                <div className="flex justify-between text-slate-500"><span>Paid</span><span className="text-emerald-700 font-bold">{money(t.paid)}</span></div>
                <div className="flex justify-between font-extrabold text-slate-900 pt-1 border-t border-slate-100"><span>Balance</span><span className={t.balance > 0 ? "text-rose-600" : "text-emerald-700"}>{money(t.balance)}</span></div>
              </div>
            </button>
          );
        })}
      </div>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Folio — ${selected ? guestOf(selected, db)?.name : ""}`}
        subtitle={`Booking Reference: ${selected?.id}`}
        width="max-w-2xl"
      >
        {selected && <FolioDetail booking={selected} />}
      </Drawer>
    </div>
  );
}
