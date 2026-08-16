import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Star, Download } from "lucide-react";
import { Badge, Btn, DataTable, Field, Input, PageHeader, Select, StatCard, Tabs, exportCSV } from "@/components/kit";
import { fmtDate, money, today, uid, update, useDB, guestOf } from "@/lib/store";
import type { GuestFeedback } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/crm/feedback")({
  head: () => ({ meta: [{ title: "Guest Feedback — MAYRA Hotel ERP" }] }),
  component: FeedbackPage,
});

const CATEGORIES = ["Overall Stay", "Room Cleanliness", "Staff Behaviour", "Restaurant Food", "Room Service", "Front Office", "Housekeeping", "Banquet", "Amenities"];

function FeedbackPage() {
  const db = useDB();
  const [addOpen, setAddOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const [form, setForm] = useState({ guestId: "", bookingId: "", rating: "4", category: "Overall Stay", comment: "", source: "In-person" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const avg = db.feedback.length > 0 ? (db.feedback.reduce((s, f) => s + f.rating, 0) / db.feedback.length).toFixed(1) : "—";
  const dist = [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: db.feedback.filter((f) => f.rating === r).length }));
  const byCategory = CATEGORIES.map((c) => {
    const catFeedback = db.feedback.filter((f) => f.category === c);
    const catAvg = catFeedback.length > 0 ? catFeedback.reduce((s, f) => s + f.rating, 0) / catFeedback.length : null;
    return { category: c, count: catFeedback.length, avg: catAvg };
  }).filter((c) => c.count > 0);

  const fiveStars = db.feedback.filter((f) => f.rating === 5);
  const lowRating = db.feedback.filter((f) => f.rating <= 2);

  const TABS = [
    { value: "all", label: "All", count: db.feedback.length },
    { value: "5star", label: "⭐ 5 Stars", count: fiveStars.length },
    { value: "low", label: "⚠️ Low", count: lowRating.length },
  ];
  const list = { all: db.feedback, "5star": fiveStars, low: lowRating }[tab] ?? db.feedback;

  function addFeedback() {
    if (!form.guestId || !form.comment.trim()) { toast.error("Select guest and add comment"); return; }
    update((d) => {
      d.feedback.unshift({ id: uid("fb"), guestId: form.guestId, bookingId: form.bookingId || undefined, date: today(), rating: +form.rating, category: form.category, comment: form.comment, source: form.source });
    });
    toast.success("Feedback recorded");
    setAddOpen(false);
    setForm({ guestId: "", bookingId: "", rating: "4", category: "Overall Stay", comment: "", source: "In-person" });
  }

  function StarRating({ n }: { n: number }) {
    return <span className="text-warning">{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Guest Feedback"
        subtitle="Reviews and satisfaction tracking"
        actions={
          <>
            <Btn size="sm" icon={Download} onClick={() => exportCSV("feedback.csv", db.feedback.map((f) => ({ date: f.date, guest: db.guests.find((g) => g.id === f.guestId)?.name ?? "", rating: f.rating, category: f.category, comment: f.comment })))}>Export</Btn>
            <Btn variant="primary" size="sm" icon={Plus} onClick={() => setAddOpen(true)}>Add Feedback</Btn>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Avg Rating" value={avg === "—" ? avg : `${avg}/5`} tone="warning" icon={Star} />
        <StatCard label="Total Reviews" value={db.feedback.length} />
        <StatCard label="5-Star Reviews" value={fiveStars.length} tone="success" />
        <StatCard label="Low Ratings" value={lowRating.length} tone="danger" />
      </div>

      {byCategory.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Category Ratings</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {byCategory.map((c) => (
              <div key={c.category} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
                <span className="text-sm">{c.category}</span>
                <div className="text-right">
                  <div className="text-sm font-semibold">{c.avg?.toFixed(1)}/5</div>
                  <div className="text-xs text-muted-foreground">{c.count} reviews</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <DataTable
        rows={list.sort((a, b) => b.date.localeCompare(a.date))}
        searchKeys={[(f) => db.guests.find((g) => g.id === f.guestId)?.name ?? "", "comment", "category"]}
        columns={[
          { key: "date", label: "Date", render: (f) => fmtDate(f.date) },
          { key: "guest", label: "Guest", render: (f) => db.guests.find((g) => g.id === f.guestId)?.name ?? "—" },
          { key: "rating", label: "Rating", render: (f) => <StarRating n={f.rating} /> },
          { key: "category", label: "Category", render: (f) => <Badge tone="muted">{f.category}</Badge> },
          { key: "comment", label: "Comment", render: (f) => <span className="text-sm">{f.comment}</span> },
          { key: "source", label: "Source", render: (f) => <span className="text-xs text-muted-foreground">{f.source ?? "Direct"}</span> },
        ]}
        pageSize={15}
      />

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-pop)]">
            <h4 className="mb-4 font-semibold">Add Guest Feedback</h4>
            <div className="space-y-3">
              <Field label="Guest">
                <Select value={form.guestId} onChange={(e) => set("guestId", e.target.value)} options={[{ value: "", label: "Select guest" }, ...db.guests.map((g) => ({ value: g.id, label: g.name }))]} />
              </Field>
              <Field label="Rating">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button key={r} onClick={() => set("rating", String(r))} className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${+form.rating === r ? "border-warning bg-warning/10 text-warning" : "border-border hover:bg-secondary"}`}>{r}★</button>
                  ))}
                </div>
              </Field>
              <Field label="Category">
                <Select value={form.category} onChange={(e) => set("category", e.target.value)} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
              </Field>
              <Field label="Comment">
                <textarea value={form.comment} onChange={(e) => set("comment", e.target.value)} rows={3} className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary resize-none" placeholder="Guest's comments…" />
              </Field>
              <Field label="Source">
                <Select value={form.source} onChange={(e) => set("source", e.target.value)} options={["In-person", "WhatsApp", "Email", "MakeMyTrip", "Google", "TripAdvisor"].map((s) => ({ value: s, label: s }))} />
              </Field>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Btn onClick={() => setAddOpen(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={addFeedback}>Submit</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
