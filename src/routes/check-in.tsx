import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle, LogIn } from "lucide-react";
import { Badge, Btn, Card, Drawer, Field, Input, KV, Modal, PageHeader, Select, Tabs, SuccessModal } from "@/components/kit";
import { bookingService, fmtDate, guestOf, money, today, useDB, calcBooking, paymentService, folioTotals, roomLabel } from "@/lib/store";
import type { Booking } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/check-in")({
  head: () => ({ meta: [{ title: "Check-in — Hotel Amara ERP" }] }),
  component: CheckInPage,
});

const STATUS_TONE: Record<string, string> = { confirmed: "info", "checked-in": "success" };

function CheckInPage() {
  const db = useDB();
  const nav = useNavigate();
  const [tab, setTab] = useState("pending");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [payMode, setPayMode] = useState("Cash");
  const [advance, setAdvance] = useState("0");
  const [step, setStep] = useState(1);
  const [checkedInSuccess, setCheckedInSuccess] = useState<{ guestName: string; roomNumber: string; grc: string; id: string } | null>(null);

  const d = today();
  const pending = db.bookings.filter((b) => b.status === "confirmed" && b.checkIn <= d);
  const future = db.bookings.filter((b) => b.status === "confirmed" && b.checkIn > d);
  const checkedInToday = db.bookings.filter((b) => b.status === "checked-in" && b.checkInTime?.slice(0, 10) === d);

  const TABS = [
    { value: "pending", label: "Due Check-in", count: pending.length },
    { value: "future", label: "Upcoming", count: future.length },
    { value: "done", label: "Checked-in Today", count: checkedInToday.length },
  ];

  const list = { pending, future, done: checkedInToday }[tab] ?? [];

  function doCheckIn() {
    if (!selected) return;
    const gName = guestOf(selected, db)?.name ?? "Guest";
    const rNo = roomLabel(selected.roomIds, db);
    const grcNo = selected.grc;
    const bId = selected.id;

    bookingService.checkIn(selected.id);
    if (+advance > 0) {
      paymentService.add({ bookingId: selected.id, date: d, mode: payMode as never, amount: +advance, kind: "payment", reference: `CI-${selected.grc}` });
    }
    toast.success(`Checked in ${gName} — Room ${rNo}`);
    setCheckedInSuccess({ guestName: gName, roomNumber: rNo, grc: grcNo, id: bId });
    setSelected(null);
    setStep(1);
    setAdvance("0");
  }

  const selGuest = selected ? guestOf(selected, db) : null;
  const selTotals = selected ? folioTotals(selected, db) : null;

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Express Check-in" subtitle="Verify identity, allocate key card, and process guest arrivals" />

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <div className="space-y-2.5">
        {list.length === 0 && <div className="py-12 text-center text-xs font-semibold text-slate-400">No bookings in this lane</div>}
        {list.map((b) => {
          const g = guestOf(b, db);
          const rooms = roomLabel(b.roomIds, db);
          const t = folioTotals(b, db);
          return (
            <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 hover:border-purple-300 hover:shadow-xs transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{g?.name ?? "—"}</span>
                  {g?.vip && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">★ VIP</span>}
                  <Badge tone={STATUS_TONE[b.status] ?? "muted"}>{b.status}</Badge>
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  <span className="font-mono text-purple-700 font-bold">{b.id}</span> · Room <span className="font-bold text-slate-900">{rooms || "—"}</span> · {b.nights}N · {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)} · <span className="text-slate-400">{b.source}</span>
                </div>
                {t.balance > 0 && <div className="mt-1 text-xs text-rose-600 font-bold">Balance: {money(t.balance)}</div>}
              </div>
              {tab !== "done" && (
                <Btn variant="primary" size="sm" icon={LogIn} onClick={() => { setSelected(b); setStep(1); setAdvance(String(Math.round(t.balance * 0.3))); }}>
                  Express Check-in
                </Btn>
              )}
              {tab === "done" && (
                <Badge tone="success"><CheckCircle className="h-3.5 w-3.5" /> Checked In</Badge>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => { setSelected(null); setStep(1); }}
        title={`Check-in Wizard · Step ${step} of 3`}
        footer={
          <div className="flex w-full justify-between items-center">
            <Btn onClick={() => step > 1 ? setStep(s => s - 1) : setSelected(null)}>
              {step > 1 ? "← Back" : "Cancel"}
            </Btn>
            {step < 3 ? (
              <Btn variant="primary" onClick={() => setStep(s => s + 1)}>Next Step →</Btn>
            ) : (
              <Btn variant="primary" icon={CheckCircle} onClick={doCheckIn}>Confirm Check-in</Btn>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-purple-900">Step 1: Verify Guest Identity & KYC</p>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 space-y-1.5 text-xs">
                <KV label="Guest Name" value={selGuest?.name ?? "—"} />
                <KV label="Mobile" value={selGuest?.mobile ?? "—"} />
                <KV label="ID Proof" value={`${selGuest?.idType || "KYC"}: ${selGuest?.idNumber || "—"}`} />
                <KV label="Address" value={`${selGuest?.city || ""}, ${selGuest?.state || "India"}`} />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-purple-900">Step 2: Room & Rate Plan Verification</p>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 space-y-1.5 text-xs">
                <KV label="Assigned Room" value={selected ? (roomLabel(selected.roomIds, db) || "—") : "—"} />
                <KV label="Room Category" value={db.roomTypes.find((t) => t.id === selected?.roomTypeId)?.name ?? "—"} />
                <KV label="Meal / Rate Plan" value={(() => { const p = db.ratePlans.find((rp) => rp.id === selected?.ratePlanId); return p ? `${p.code} — ${p.name} (${p.description})` : "—"; })()} />

                <KV label="Check-in Date" value={selected ? fmtDate(selected.checkIn) : "—"} />
                <KV label="Check-out Date" value={selected ? fmtDate(selected.checkOut) : "—"} />
                <KV label="Total Stay Duration" value={`${selected?.nights} Night(s)`} />
                <KV label="Rate / Night" value={selected ? money(selected.rateNight) : "—"} />
              </div>
            </div>
          )}
          {step === 3 && selTotals && (
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-purple-900">Step 3: Collect Advance Payment</p>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 space-y-1.5 text-xs font-semibold text-slate-700">
                <KV label="Total Estimated Folio" value={money(selTotals.total)} />
                <KV label="Advance Already Paid" value={money(selTotals.paid)} />
                <KV label="Outstanding Balance" value={<span className="text-rose-600 font-bold">{money(selTotals.balance)}</span>} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <Field label="Advance to Collect (₹)">
                  <Input type="number" min="0" value={advance} onChange={(e) => setAdvance(e.target.value)} />
                </Field>
                <Field label="Payment Mode">
                  <Select value={payMode} onChange={(e) => setPayMode(e.target.value)} options={["Cash", "UPI", "Card", "Bank Transfer"].map((s) => ({ value: s, label: s }))} />
                </Field>
              </div>
            </div>
          )}
        </div>
      </Modal>


      {checkedInSuccess && (
        <SuccessModal
          open={!!checkedInSuccess}
          onClose={() => setCheckedInSuccess(null)}
          title="Guest Checked-In Successfully!"
          subtitle="Key card issued and room status transitioned to Occupied."
          details={[
            { label: "Guest Name", value: checkedInSuccess.guestName },
            { label: "Assigned Room", value: checkedInSuccess.roomNumber },
            { label: "GRC Number", value: checkedInSuccess.grc },
            { label: "Booking ID", value: checkedInSuccess.id },
          ]}
          primaryAction={{
            label: "Open Guest Folio",
            onClick: () => {
              setCheckedInSuccess(null);
              nav({ to: "/folios" });
            },
          }}
          secondaryAction={{
            label: "Back to Front Desk",
            onClick: () => {
              setCheckedInSuccess(null);
              nav({ to: "/front-desk" });
            },
          }}
        />
      )}
    </div>
  );
}
