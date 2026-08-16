import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle, LogIn } from "lucide-react";
import { Badge, Btn, Card, Drawer, Field, Input, KV, PageHeader, Select, Tabs, SuccessModal } from "@/components/kit";
import { bookingService, fmtDate, guestOf, money, today, useDB, calcBooking, paymentService, folioTotals, roomLabel } from "@/lib/store";
import type { Booking } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/check-in")({
  head: () => ({ meta: [{ title: "Check-in — MAYRA Hotel ERP" }] }),
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
    <div className="space-y-4">
      <PageHeader title="Check-in" subtitle="Process guest arrivals" />

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <div className="space-y-2">
        {list.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No bookings in this category</div>}
        {list.map((b) => {
          const g = guestOf(b, db);
          const rooms = roomLabel(b.roomIds, db);
          const t = folioTotals(b, db);
          return (
            <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{g?.name ?? "—"}</span>
                  {g?.vip && <Badge tone="primary">VIP</Badge>}
                  <Badge tone={STATUS_TONE[b.status] ?? "muted"}>{b.status}</Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {b.id} · Room {rooms || "—"} · {b.nights}N · {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)} · {b.source}
                </div>
                {t.balance > 0 && <div className="mt-0.5 text-xs text-danger">Balance: {money(t.balance)}</div>}
              </div>
              {tab !== "done" && (
                <Btn variant="primary" size="sm" icon={LogIn} onClick={() => { setSelected(b); setStep(1); setAdvance(String(Math.round(t.balance * 0.3))); }}>
                  Check-in
                </Btn>
              )}
              {tab === "done" && (
                <Badge tone="success"><CheckCircle className="h-3 w-3" /> Checked In</Badge>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 p-4 backdrop-blur-[2px]">
          <div className="mt-10 w-full max-w-lg rounded-xl border border-border bg-card shadow-[var(--shadow-pop)]">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Check-in — Step {step} of 3</h3>
              <button onClick={() => { setSelected(null); setStep(1); }} className="rounded-md p-1 hover:bg-secondary">✕</button>
            </header>
            <div className="p-4 space-y-4">
              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Step 1: Verify Guest Details</p>
                  <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
                    <KV label="Guest Name" value={selGuest?.name ?? "—"} />
                    <KV label="Mobile" value={selGuest?.mobile ?? "—"} />
                    <KV label="ID Proof" value={`${selGuest?.idType}: ${selGuest?.idNumber}`} />
                    <KV label="Address" value={`${selGuest?.city}, ${selGuest?.state}`} />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Step 2: Verify Room</p>
                  <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
                    <KV label="Room(s)" value={roomLabel(selected.roomIds, db) || "—"} />
                    <KV label="Room Type" value={db.roomTypes.find((t) => t.id === selected.roomTypeId)?.name ?? "—"} />
                    <KV label="Package" value={db.ratePlans.find((p) => p.id === selected.ratePlanId)?.code ?? "—"} />
                    <KV label="Check-in" value={fmtDate(selected.checkIn)} />
                    <KV label="Check-out" value={fmtDate(selected.checkOut)} />
                    <KV label="Nights" value={selected.nights} />
                    <KV label="Rate / Night" value={money(selected.rateNight)} />
                  </div>
                </div>
              )}
              {step === 3 && selTotals && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Step 3: Collect Advance</p>
                  <div className="rounded-lg bg-secondary/50 p-3 space-y-1 text-sm">
                    <KV label="Total Bill" value={money(selTotals.total)} />
                    <KV label="Already Paid" value={money(selTotals.paid)} />
                    <KV label="Balance Due" value={<span className="text-danger font-semibold">{money(selTotals.balance)}</span>} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
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
            <footer className="flex justify-between gap-2 border-t border-border px-4 py-3">
              <Btn onClick={() => step > 1 ? setStep(s => s - 1) : setSelected(null)}>
                {step > 1 ? "Back" : "Cancel"}
              </Btn>
              {step < 3 ? (
                <Btn variant="primary" onClick={() => setStep(s => s + 1)}>Next →</Btn>
              ) : (
                <Btn variant="primary" icon={CheckCircle} onClick={doCheckIn}>Confirm Check-in</Btn>
              )}
            </footer>
          </div>
        </div>
      )}

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
