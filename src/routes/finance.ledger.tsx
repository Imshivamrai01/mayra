import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Badge, Btn, Card, DataTable, Field, Input, KV, PageHeader, Select, StatCard, Tabs } from "@/components/kit";
import { financeService, money, today, uid, update, useDB } from "@/lib/store";
import type { Ledger } from "@/lib/types";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { exportCSV } from "@/components/kit";

export const Route = createFileRoute("/finance/ledger")({
  head: () => ({ meta: [{ title: "Ledger — MAYRA Hotel ERP" }] }),
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
    <div className="space-y-4">
      <PageHeader
        title="Ledger"
        subtitle="Income & expense tracking"
        actions={
          <>
            <Btn size="sm" icon={Download} onClick={() => exportCSV("ledger.csv", db.ledger.map((l) => ({ date: l.date, type: l.type, category: l.category, description: l.description, amount: l.amount })))}>Export</Btn>
            <Btn variant="primary" size="sm" onClick={() => setAddOpen(true)}>Add Entry</Btn>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
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
          { key: "category", label: "Category", render: (l) => <span className="text-xs">{l.category}</span> },
          { key: "description", label: "Description" },
          { key: "reference", label: "Reference", render: (l) => <span className="font-mono text-xs">{l.reference ?? "—"}</span> },
          { key: "amount", label: "Amount", align: "right", render: (l) => <span className={l.type === "income" ? "text-success font-medium" : "text-danger"}>{l.type === "expense" ? "- " : ""}{money(l.amount)}</span> },
        ]}
        pageSize={20}
      />

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-pop)]">
            <h4 className="mb-4 font-semibold">Add Ledger Entry</h4>
            <div className="space-y-3">
              <Field label="Type">
                <div className="flex gap-2">
                  {(["income", "expense"] as const).map((t) => (
                    <button key={t} onClick={() => { set("type", t); set("category", t === "income" ? INCOME_CATS[0]! : EXPENSE_CATS[0]!); }} className={`flex-1 rounded-md border py-2 text-sm font-medium capitalize transition-colors ${form.type === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"}`}>{t}</button>
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
            <div className="mt-4 flex justify-end gap-2">
              <Btn onClick={() => setAddOpen(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={addEntry}>Add Entry</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
