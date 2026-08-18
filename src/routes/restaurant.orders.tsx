import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Btn, Card, DataTable, PageHeader, Tabs, exportCSV } from "@/components/kit";
import { money, orderTotals, posService, fmtTime, useDB } from "@/lib/store";
import type { POSOrder } from "@/lib/types";
import { toast } from "sonner";
import { Download } from "lucide-react";

export const Route = createFileRoute("/restaurant/orders")({
  head: () => ({ meta: [{ title: "All Orders — Hotel Amara ERP" }] }),
  component: AllOrdersPage,
});

const STATUS_TONE: Record<string, string> = {
  open: "info", kot: "warning", settled: "success", void: "danger", posted: "primary",
};
const KDS_TONE: Record<string, string> = {
  new: "danger", preparing: "warning", ready: "success", served: "muted",
};

function AllOrdersPage() {
  const db = useDB();
  const nav = useNavigate();
  const [tab, setTab] = useState("all");

  const TABS = [
    { value: "all", label: "All Orders", count: db.orders.length },
    { value: "open", label: "Open", count: db.orders.filter((o) => o.status === "open" || o.status === "kot").length },
    { value: "settled", label: "Settled", count: db.orders.filter((o) => o.status === "settled" || o.status === "posted").length },
    { value: "void", label: "Void", count: db.orders.filter((o) => o.status === "void").length },
  ];

  const filtered = tab === "all" ? db.orders : tab === "settled" ? db.orders.filter((o) => ["settled", "posted"].includes(o.status)) : db.orders.filter((o) => o.status === tab || (tab === "open" && o.status === "kot"));

  return (
    <div className="space-y-4">
      <PageHeader
        title="All Orders"
        subtitle="Restaurant & room service order history"
        actions={
          <>
            <Btn size="sm" icon={Download} onClick={() => exportCSV("orders.csv", filtered.map((o) => ({ id: o.id, number: o.number, kot: o.kot ?? "", mode: o.mode, status: o.status, items: o.items.length, total: orderTotals(o, db).total, created: o.createdAt })))}>Export</Btn>
            <Btn variant="primary" size="sm" onClick={() => nav({ to: "/pos" as never })}>New Order</Btn>
          </>
        }
      />

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <DataTable
        rows={filtered}
        searchKeys={["number", "kot", "mode", "waiter"]}
        columns={[
          { key: "number", label: "Order No", render: (o) => <span className="font-mono text-xs font-semibold">{o.number}</span> },
          { key: "kot", label: "KOT", render: (o) => o.kot ? <span className="text-xs">{o.kot}</span> : "—" },
          { key: "mode", label: "Mode", render: (o) => <Badge tone="muted">{o.mode}</Badge> },
          { key: "table", label: "Table", render: (o) => o.tableId ? db.tables.find((t) => t.id === o.tableId)?.name ?? "—" : "—" },
          { key: "items", label: "Items", align: "right", render: (o) => o.items.length },
          { key: "total", label: "Total", align: "right", render: (o) => money(orderTotals(o, db).total) },
          { key: "status", label: "Status", render: (o) => <Badge tone={STATUS_TONE[o.status] ?? "muted"}>{o.status}</Badge> },
          { key: "kds", label: "KDS", render: (o) => <Badge tone={KDS_TONE[o.kds] ?? "muted"}>{o.kds}</Badge> },
          { key: "waiter", label: "Waiter" },
          { key: "createdAt", label: "Time", render: (o) => fmtTime(o.createdAt) },
          { key: "actions", label: "", sortable: false, render: (o) => (
            <div className="flex gap-1">
              {(o.status === "open" || o.status === "kot") && (
                <Btn size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); posService.voidOrder(o.id); toast.success("Order voided"); }}>Void</Btn>
              )}
              <Btn size="sm" variant="ghost" onClick={() => window.print()}>Print</Btn>
            </div>
          )},
        ]}
        pageSize={20}
      />
    </div>
  );
}
