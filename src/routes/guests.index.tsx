import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Eye, Star } from "lucide-react";
import { Badge, Btn, Card, DataTable, Drawer, Field, Input, KV, PageHeader, Select, Tabs } from "@/components/kit";
import { guestService, money, fmtDate, useDB, folioTotals } from "@/lib/store";
import type { Guest } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/guests/")({
  head: () => ({ meta: [{ title: "Guests — MAYRA Hotel ERP" }] }),
  component: GuestsPage,
});

const SEGMENTS = ["New", "Returning", "VIP", "Corporate", "OTA", "Direct"];

function GuestForm({ onClose, guest }: { onClose: () => void; guest?: Guest }) {
  const [form, setForm] = useState({
    salutation: guest?.salutation ?? "Mr.",
    name: guest?.name ?? "",
    gender: guest?.gender ?? "Male",
    mobile: guest?.mobile ?? "",
    email: guest?.email ?? "",
    city: guest?.city ?? "",
    state: guest?.state ?? "",
    nationality: guest?.nationality ?? "Indian",
    idType: guest?.idType ?? "Aadhaar",
    idNumber: guest?.idNumber ?? "",
    company: guest?.company ?? "",
    vip: guest?.vip ? "yes" : "no",
    preferences: guest?.preferences ?? "",
    notes: guest?.notes ?? "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function save() {
    if (!form.name.trim() || !form.mobile.trim()) { toast.error("Name and mobile required"); return; }
    const data = { ...form, vip: form.vip === "yes" };
    if (guest) {
      guestService.save(guest.id, data);
      toast.success("Guest updated");
    } else {
      guestService.create(data);
      toast.success("Guest created");
    }
    onClose();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Salutation"><Select value={form.salutation} onChange={(e) => set("salutation", e.target.value)} options={["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."].map((s) => ({ value: s, label: s }))} /></Field>
        <Field label="Full Name" className="sm:col-span-2" required><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Gender"><Select value={form.gender} onChange={(e) => set("gender", e.target.value)} options={["Male", "Female", "Other"].map((s) => ({ value: s, label: s }))} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Mobile" required><Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="City"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
        <Field label="State"><Input value={form.state} onChange={(e) => set("state", e.target.value)} /></Field>
        <Field label="Nationality"><Input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ID Type"><Select value={form.idType} onChange={(e) => set("idType", e.target.value)} options={["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID"].map((s) => ({ value: s, label: s }))} /></Field>
        <Field label="ID Number"><Input value={form.idNumber} onChange={(e) => set("idNumber", e.target.value)} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Company"><Input value={form.company} onChange={(e) => set("company", e.target.value)} /></Field>
        <Field label="VIP Guest"><Select value={form.vip} onChange={(e) => set("vip", e.target.value)} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes — VIP" }]} /></Field>
      </div>
      <Field label="Preferences"><Input value={form.preferences} onChange={(e) => set("preferences", e.target.value)} placeholder="e.g. High floor, vegetarian" /></Field>
      <Field label="Notes"><Input value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
      <div className="flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save}>{guest ? "Update" : "Create Guest"}</Btn>
      </div>
    </div>
  );
}

function GuestDetail({ guest, onClose }: { guest: Guest; onClose: () => void }) {
  const db = useDB();
  const stats = guestService.stats(guest.id, db);
  const [tab, setTab] = useState("bookings");

  const TABS = [
    { value: "bookings", label: "Bookings", count: stats.bookings.length },
    { value: "feedback", label: "Feedback", count: db.feedback.filter((f) => f.guestId === guest.id).length },
  ];

  const loyalty = stats.spend >= 100000 ? "Platinum" : stats.spend >= 50000 ? "Gold" : "Silver";
  const loyaltyTone = loyalty === "Platinum" ? "primary" : loyalty === "Gold" ? "warning" : "muted";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
          {guest.name[0]}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{guest.salutation} {guest.name}</h3>
            {guest.vip && <Badge tone="primary"><Star className="h-3 w-3" /> VIP</Badge>}
            <Badge tone={loyaltyTone}>{loyalty}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{guest.mobile} · {guest.email}</p>
          <p className="text-xs text-muted-foreground">{guest.city}, {guest.state} · {guest.nationality}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-secondary/40 p-3 text-center">
          <div className="text-lg font-bold">{stats.bookings.length}</div>
          <div className="text-xs text-muted-foreground">Total Stays</div>
        </div>
        <div className="rounded-lg border border-border bg-secondary/40 p-3 text-center">
          <div className="text-lg font-bold">{money(stats.spend)}</div>
          <div className="text-xs text-muted-foreground">Total Revenue</div>
        </div>
        <div className="rounded-lg border border-border bg-secondary/40 p-3 text-center">
          <div className="text-lg font-bold">{stats.last ? fmtDate(stats.last) : "—"}</div>
          <div className="text-xs text-muted-foreground">Last Visit</div>
        </div>
      </div>
      <div className="grid gap-2 text-sm">
        <KV label="ID Proof" value={`${guest.idType}: ${guest.idNumber}`} />
        {guest.company && <KV label="Company" value={guest.company} />}
        {guest.preferences && <KV label="Preferences" value={guest.preferences} />}
        {guest.notes && <KV label="Notes" value={guest.notes} />}
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "bookings" && (
        <div className="space-y-2">
          {stats.bookings.map((b) => (
            <div key={b.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-mono text-xs font-semibold">{b.id}</span>
                <Badge tone={b.status === "confirmed" ? "info" : b.status === "checked-in" ? "success" : "muted"}>{b.status}</Badge>
              </div>
              <div className="mt-1 text-muted-foreground">{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)} · {money(folioTotals(b, db).total)}</div>
            </div>
          ))}
          {stats.bookings.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No bookings yet</p>}
        </div>
      )}
      {tab === "feedback" && (
        <div className="space-y-2">
          {db.feedback.filter((f) => f.guestId === guest.id).map((f) => (
            <div key={f.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{f.category}</span>
                <span className="text-warning">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{f.comment}</p>
            </div>
          ))}
          {db.feedback.filter((f) => f.guestId === guest.id).length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No feedback yet</p>}
        </div>
      )}
    </div>
  );
}

function GuestsPage() {
  const db = useDB();
  const nav = useNavigate();
  const [tab, setTab] = useState("all");

  const vipList = db.guests.filter((g) => g.vip);
  const filtered = tab === "vip" ? vipList : tab === "returning" ? db.guests.filter((g) => g.segment === "Returning" || g.segment === "VIP") : db.guests;

  const TABS = [
    { value: "all", label: "All Guests", count: db.guests.length },
    { value: "vip", label: "VIP", count: vipList.length },
    { value: "returning", label: "Returning", count: db.guests.filter((g) => g.segment === "Returning" || g.segment === "VIP").length },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Guests"
        subtitle="Guest profiles and CRM"
        actions={<Btn variant="primary" size="sm" icon={Plus} className="shimmer-gold font-semibold shadow-sm" onClick={() => nav({ to: "/guests/new" as never })}>New Guest</Btn>}
      />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <DataTable
        rows={filtered}
        searchKeys={["name", "phone", "email", "city", (g) => g.company ?? ""]}
        columns={[
          { key: "name", label: "Name", render: (g) => (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{g.name[0]}</div>
              <div>
                <div className="font-medium flex items-center gap-1">{g.name}{g.vip && <Badge tone="primary">VIP</Badge>}</div>
                <div className="text-xs text-muted-foreground">{g.phone}</div>
              </div>
            </div>
          )},
          { key: "email", label: "Email", render: (g) => <span className="text-sm">{g.email || "—"}</span> },
          { key: "city", label: "Location", render: (g) => `${g.city || "Jaipur"}, ${g.country || "India"}` },
          { key: "segment", label: "Segment", render: (g) => <Badge tone={g.vip ? "primary" : g.segment === "Returning" ? "success" : "muted"}>{g.vip ? "VIP" : (g.segment || "Standard")}</Badge> },
          { key: "idType", label: "KYC ID", render: (g) => <span className="text-xs font-medium">{g.idType ? `${g.idType} (${g.idNumber || "Verified"})` : "Pending"}</span> },
          { key: "actions", label: "", sortable: false, render: (g) => (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Btn size="sm" variant="ghost" onClick={() => nav({ to: `/guests/${g.id}` as never })}>
                View Profile →
              </Btn>
            </div>
          )},
        ]}
        pageSize={15}
        onRowClick={(g) => nav({ to: `/guests/${g.id}` as never })}
      />
    </div>
  );
}
