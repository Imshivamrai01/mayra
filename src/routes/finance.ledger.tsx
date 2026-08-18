import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Download } from "lucide-react";
import { Badge, Btn, Card, DataTable, Field, Input, KV, Modal, PageHeader, Select, StatCard, Tabs, exportCSV } from "@/components/kit";
import { financeService, money, today, uid, update, useDB } from "@/lib/store";
import type { Ledger } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/finance/ledger")({
  head: () => ({ meta: [{ title: "Ledger — Hotel Amara ERP" }] }),
  component: LedgerPage,
});

const INCOME_CATS = ["Room Revenue", "Restaurant Revenue", "Laundry Income", "Banquet Revenue", "Other Income"];
const EXPENSE_CATS = ["Salaries", "Utilities", "Supplies", "Maintenance", "Marketing", "Food & Beverage", "Admin", "Other Expense"];

function LedgerPage() {
  const db = useDB();
  const [tab, setTab] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ type: "income" as "income" | "expense", category: "Room Revenue", description: "", amount: "0", date: today(), reference: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const income = db.ledger.filter((l) => l.type === "income");
  const expense = db.ledger.filter((l) => l.type === "expense");
  const totalIncome = income.reduce((s, l) => s + l.amount, 0);
  const totalExpense = expense.reduce((s, l) => s + l.amount, 0);

  const TABS = [
    { value: "all", label: "All Entries", count: db.ledger.length },
    { value: "income", label: "Income", count: income.length },
    { value: "expense", label: "Expense", count: expense.length },
  ];
  const list = { all: db.ledger, income, expense }[tab] ?? db.ledger;

  function addEntry() {
    if (!form.description.trim() || +form.amount <= 0) { toast.error("Fill all fields"); return; }
    financeService.add({ type: form.type, category: form.category, description: form.description, amount: +form.amount, date: form.date, reference: form.reference || undefined });
    toast.success("Ledger entry added");
    setAddOpen(false);
    setForm({ type: "income", category: "Room Revenue", description: "", amount: "0", date: today(), reference: "" });
  }

  return (
    <div className="space-y-5 pb-12">
      <PageHeader
        title="Finance & Accounts Ledger"
        subtitle="Double-entry financial journal, income vs expenditure & cash flow ledger"
        actions={
          <>
            <Btn size="sm" icon={Download} onClick={() => exportCSV("ledger.csv", db.ledger.map((l) => ({ date: l.date, type: l.type, category: l.category, description: l.description, amount: l.amount })))}>Export CSV</Btn>
            <Btn variant="primary" size="sm" onClick={() => setAddOpen(true)}>Add Ledger Entry</Btn>
          </>
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-3">
        <StatCard label="Total Income" value={money(totalIncome)} tone="success" icon={TrendingUp} />
        <StatCard label="Total Expense" value={money(totalExpense)} tone="danger" icon={TrendingDown} />
        <StatCard label="Net Profit" value={money(totalIncome - totalExpense)} tone={totalIncome >= totalExpense ? "primary" : "danger"} icon={DollarSign} />
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <DataTable
        rows={list.sort((a, b) => b.date.localeCompare(a.date))}
        searchKeys={["description", "category", "reference"]}
        columns={[
          { key: "date", label: "Date" },
          { key: "type", label: "Type", render: (l) => <Badge tone={l.type === "income" ? "success" : "danger"}>{l.type}</Badge> },
          { key: "category", label: "Category", render: (l) => <span className="text-xs font-bold text-slate-700">{l.category}</span> },
          { key: "description", label: "Description" },
          { key: "reference", label: "Reference", render: (l) => <span className="font-mono text-xs text-purple-700 font-bold">{l.reference ?? "—"}</span> },
          { key: "amount", label: "Amount", align: "right", render: (l) => <span className={l.type === "income" ? "text-emerald-700 font-bold tabular-nums" : "text-rose-600 font-bold tabular-nums"}>{l.type === "expense" ? "- " : ""}{money(l.amount)}</span> },
        ]}
        pageSize={20}
      />

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Ledger Entry"
        footer={
          <>
            <Btn onClick={() => setAddOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={addEntry}>Add Entry</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Type">
            <div className="flex gap-2">
              {(["income", "expense"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { set("type", t); set("category", t === "income" ? INCOME_CATS[0]! : EXPENSE_CATS[0]!); }}
                  className={`flex-1 rounded-xl border py-2.5 text-xs font-bold capitalize transition-all cursor-pointer ${form.type === t ? "border-purple-600 bg-purple-50 text-purple-900 shadow-2xs" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={(e) => set("category", e.target.value)} options={(form.type === "income" ? INCOME_CATS : EXPENSE_CATS).map((c) => ({ value: c, label: c }))} />
          </Field>
          <Field label="Description"><Input value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="Amount (₹)"><Input type="number" min="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} /></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
          <Field label="Reference"><Input value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder="Invoice no, bill no etc." /></Field>
        </div>
      </Modal>
    </div>
  );
}

