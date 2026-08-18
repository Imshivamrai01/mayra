import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Star, Download } from "lucide-react";
import { Badge, Btn, DataTable, Field, Input, Modal, PageHeader, Select, StatCard, Tabs, exportCSV } from "@/components/kit";
import { fmtDate, money, today, uid, update, useDB, guestOf } from "@/lib/store";
import type { GuestFeedback } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/crm/feedback")({
  head: () => ({ meta: [{ title: "Guest Feedback — Hotel Amara ERP" }] }),
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
    return <span className="text-amber-500 font-bold tracking-widest text-sm">{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
  }

  return (
    <div className="space-y-5 pb-12">
      <PageHeader
        title="Guest Feedback & CRM"
        subtitle="Guest satisfaction scores, department ratings & feedback intelligence"
        actions={
          <>
            <Btn size="sm" icon={Download} onClick={() => exportCSV("feedback.csv", db.feedback.map((f) => ({ date: f.date, guest: db.guests.find((g) => g.id === f.guestId)?.name ?? "", rating: f.rating, category: f.category, comment: f.comment })))}>Export CSV</Btn>
            <Btn variant="primary" size="sm" icon={Plus} onClick={() => setAddOpen(true)}>Add Feedback</Btn>
          </>
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-4">
        <StatCard label="Avg Rating" value={avg === "—" ? avg : `${avg}/5`} tone="warning" icon={Star} />
        <StatCard label="Total Reviews" value={db.feedback.length} />
        <StatCard label="5-Star Reviews" value={fiveStars.length} tone="success" />
        <StatCard label="Low Ratings" value={lowRating.length} tone="danger" />
      </div>

      {byCategory.length > 0 && (
        <div className="card-surface rounded-2xl bg-white border border-slate-200/80 p-5 shadow-2xs">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3.5">Departmental Ratings</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {byCategory.map((c) => (
              <div key={c.category} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
                <span className="text-xs font-bold text-slate-700">{c.category}</span>
                <div className="text-right">
                  <div className="text-xs font-black text-purple-700">{c.avg?.toFixed(1)} / 5 ★</div>
                  <div className="text-[10px] font-semibold text-slate-400">{c.count} reviews</div>
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
          { key: "guest", label: "Guest", render: (f) => <span className="font-bold text-slate-900">{db.guests.find((g) => g.id === f.guestId)?.name ?? "—"}</span> },
          { key: "rating", label: "Rating", render: (f) => <StarRating n={f.rating} /> },
          { key: "category", label: "Category", render: (f) => <Badge tone="muted">{f.category}</Badge> },
          { key: "comment", label: "Comment", render: (f) => <span className="text-xs font-medium text-slate-700">{f.comment}</span> },
          { key: "source", label: "Source", render: (f) => <span className="text-xs font-semibold text-slate-400">{f.source ?? "Direct"}</span> },
        ]}
        pageSize={15}
      />

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Guest Feedback"
        footer={
          <>
            <Btn onClick={() => setAddOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={addFeedback}>Submit Feedback</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Guest">
            <Select value={form.guestId} onChange={(e) => set("guestId", e.target.value)} options={[{ value: "", label: "Select guest" }, ...db.guests.map((g) => ({ value: g.id, label: g.name }))]} />
          </Field>
          <Field label="Rating">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => set("rating", String(r))}
                  className={`flex-1 rounded-xl border py-2.5 text-xs font-black transition-all cursor-pointer ${+form.rating === r ? "border-amber-500 bg-amber-50 text-amber-900 shadow-2xs" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"}`}
                >
                  {r} ★
                </button>
              ))}
            </div>
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={(e) => set("category", e.target.value)} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </Field>
          <Field label="Comment">
            <textarea value={form.comment} onChange={(e) => set("comment", e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-purple-600 resize-none shadow-2xs" placeholder="Guest's review / comments…" />
          </Field>
          <Field label="Source">
            <Select value={form.source} onChange={(e) => set("source", e.target.value)} options={["In-person", "WhatsApp", "Email", "MakeMyTrip", "Google", "TripAdvisor"].map((s) => ({ value: s, label: s }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

