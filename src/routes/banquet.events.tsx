import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, CalendarRange } from "lucide-react";
import { Badge, Btn, Card, DataTable, Field, Input, KV, PageHeader, Select, StatCard, Tabs } from "@/components/kit";
import { money, today, uid, update, useDB } from "@/lib/store";
import type { BanquetEvent } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/banquet/events")({
  head: () => ({ meta: [{ title: "Banquet Events — Hotel Amara ERP" }] }),
  component: BanquetPage,
});

const EVENT_TYPES = ["Wedding", "Reception", "Birthday", "Corporate", "Conference", "Engagement", "Party", "Anniversary"];
const STATUS_TONE: Record<string, string> = {
  enquiry: "info", confirmed: "success", completed: "muted", cancelled: "danger",
};

function BanquetPage() {
  const db = useDB();
  const nav = useNavigate();
  const [tab, setTab] = useState("upcoming");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<BanquetEvent | null>(null);
  const [form, setForm] = useState({
    name: "", customer: "", phone: "", date: today(), time: "18:00",
    guests: "50", hallId: db.halls[0]?.id ?? "", packageId: db.banquetPackages[0]?.id ?? "",
    eventType: "Wedding", decoration: "0", otherCharges: "0", discount: "0", advance: "0",
    notes: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const d = today();
  const upcoming = db.events.filter((e) => e.date >= d && e.status !== "cancelled").sort((a, b) => a.date.localeCompare(b.date));
  const today_ = db.events.filter((e) => e.date === d && e.status !== "cancelled");
  const enquiries = db.events.filter((e) => e.status === "enquiry");
  const all = db.events;

  const TABS = [
    { value: "upcoming", label: "Upcoming", count: upcoming.length },
    { value: "today", label: "Today", count: today_.length },
    { value: "enquiries", label: "Enquiries", count: enquiries.length },
    { value: "all", label: "All", count: all.length },
  ];
  const list: Record<string, BanquetEvent[]> = { upcoming, today: today_, enquiries, all };

  const revenue = db.events.filter((e) => e.status !== "cancelled").reduce((s, e) => {
    const pkg = db.banquetPackages.find((p) => p.id === e.packageId);
    return s + (e.guests * (pkg?.perPerson ?? 0)) + e.decoration + e.otherCharges - e.discount;
  }, 0);

  function createEvent() {
    if (!form.name.trim() || !form.customer.trim()) { toast.error("Event name and customer required"); return; }
    update((d) => {
      const n = `EVT-${String((d.counters.event ?? 1000) + 1).padStart(4, "0")}`;
      d.counters.event = (d.counters.event ?? 1000) + 1;
      d.events.unshift({
        id: uid("ev"), code: n, name: form.name, customer: form.customer, phone: form.phone,
        date: form.date, time: form.time, guests: +form.guests,
        hallId: form.hallId, packageId: form.packageId,
        decoration: +form.decoration, otherCharges: +form.otherCharges,
        discount: +form.discount, advance: +form.advance, status: "enquiry",
        notes: form.notes,
      });
    });
    toast.success("Banquet event created");
    setCreateOpen(false);
  }

  function changeStatus(id: string, status: BanquetEvent["status"]) {
    update((d) => { const e = d.events.find((x) => x.id === id); if (e) e.status = status; });
    toast.success(`Event → ${status}`);
    setSelected(null);
  }

  function eventTotal(e: BanquetEvent) {
    const pkg = db.banquetPackages.find((p) => p.id === e.packageId);
    return (e.guests * (pkg?.perPerson ?? 0)) + e.decoration + e.otherCharges - e.discount;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Banquet Events"
        subtitle="Halls, events and billing"
        actions={<Btn variant="primary" size="sm" icon={Plus} className="shimmer-gold font-semibold shadow-sm" onClick={() => nav({ to: "/banquet/new" as never })}>New Event</Btn>}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Total Events" value={db.events.length} sub="All time" />
        <StatCard label="Upcoming" value={upcoming.length} tone="info" />
        <StatCard label="Today" value={today_.length} tone="primary" />
        <StatCard label="Revenue" value={money(revenue)} tone="success" />
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <DataTable
        rows={list[tab] ?? []}
        searchKeys={["name", "customer", "phone"]}
        columns={[
          { key: "code", label: "Code", render: (e) => <span className="font-mono text-xs font-semibold text-primary">{e.code}</span> },
          { key: "name", label: "Event", render: (e) => <span className="font-medium">{e.name}</span> },
          { key: "customer", label: "Customer" },
          { key: "date", label: "Date" },
          { key: "guests", label: "Guests", align: "right" },
          { key: "hall", label: "Hall", render: (e) => db.halls.find((h) => h.id === e.hallId)?.name ?? "—" },
          { key: "total", label: "Total", align: "right", render: (e) => money(eventTotal(e)) },
          { key: "advance", label: "Advance", align: "right", render: (e) => money(e.advance) },
          { key: "balance", label: "Balance", align: "right", render: (e) => <span className={eventTotal(e) - e.advance > 0 ? "text-danger font-semibold" : "text-success"}>{money(eventTotal(e) - e.advance)}</span> },
          { key: "status", label: "Status", render: (e) => <Badge tone={STATUS_TONE[e.status] ?? "muted"}>{e.status}</Badge> },
          { key: "actions", label: "", sortable: false, render: (e) => (
            <div className="flex gap-1" onClick={(ev) => ev.stopPropagation()}>
              <Btn size="sm" variant="ghost" onClick={() => nav({ to: `/banquet/${e.id}` as never })}>
                View Event →
              </Btn>
            </div>
          )},
        ]}
        onRowClick={(e) => nav({ to: `/banquet/${e.id}` as never })}
        pageSize={15}
      />
    </div>
  );
}
