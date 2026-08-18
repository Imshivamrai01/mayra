import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Package } from "lucide-react";
import { Badge, Btn, DataTable, Field, Input, KV, PageHeader, Select } from "@/components/kit";
import { inventoryService, money, today, uid, update, useDB } from "@/lib/store";
import type { PurchaseDoc } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory/grn/")({
  head: () => ({ meta: [{ title: "GRN — Hotel Amara ERP" }] }),
  component: GRNPage,
});

const STATUS_TONE: Record<string, string> = {
  draft: "muted", pending: "info", approved: "primary", received: "success", rejected: "danger",
};

function GRNPage() {
  const db = useDB();
  const nav = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [vendorId, setVendorId] = useState(db.vendors[0]?.id ?? "");
  const [items, setItems] = useState([{ productId: "", qty: "0", rate: "0" }]);

  const pos = db.purchases.filter((p) => p.type === "po");
  const grns = db.purchases.filter((p) => p.type === "grn");

  function addItem() { setItems((prev) => [...prev, { productId: "", qty: "0", rate: "0" }]); }
  function removeItem(i: number) { setItems((prev) => prev.filter((_, idx) => idx !== i)); }
  function setItem(i: number, k: string, v: string) { setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item)); }

  function createPO() {
    const validItems = items.filter((i) => i.productId && +i.qty > 0);
    if (!vendorId || !validItems.length) { toast.error("Select vendor and add items"); return; }
    update((d) => {
      d.purchases.unshift({
        id: uid("pu"),
        number: `PO-${String((d.counters.po ?? 1000) + 1).padStart(4, "0")}`,
        type: "po",
        vendorId,
        date: today(),
        status: "pending",
        items: validItems.map((i) => ({ productId: i.productId, qty: +i.qty, rate: +i.rate })),
      });
      d.counters.po = (d.counters.po ?? 1000) + 1;
    });
    toast.success("Purchase Order created");
    setCreateOpen(false);
    setItems([{ productId: "", qty: "0", rate: "0" }]);
  }

  function receiveGRN(poId: string) {
    inventoryService.receiveGRN(poId);
    toast.success("GRN received — stock updated");
  }

  const total = (p: PurchaseDoc) => p.items.reduce((s, i) => s + i.qty * i.rate, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders & GRN"
        subtitle="Stock procurement workflow"
        actions={<Btn variant="primary" size="sm" icon={Plus} className="shimmer-gold font-semibold shadow-sm" onClick={() => nav({ to: "/inventory/grn/new" as never })}>New Purchase Order</Btn>}
      />

      <div>
        <h3 className="mb-3 text-sm font-semibold">Purchase Orders</h3>
        <DataTable
          rows={pos}
          searchKeys={["number", (p) => db.vendors.find((v) => v.id === p.vendorId)?.name ?? ""]}
          columns={[
            { key: "number", label: "PO Number", render: (p) => <span className="font-mono text-xs font-semibold">{p.number}</span> },
            { key: "vendor", label: "Vendor", render: (p) => db.vendors.find((v) => v.id === p.vendorId)?.name ?? "—" },
            { key: "date", label: "Date" },
            { key: "items", label: "Items", align: "right", render: (p) => p.items.length },
            { key: "total", label: "Total", align: "right", render: (p) => money(total(p)) },
            { key: "status", label: "Status", render: (p) => <Badge tone={STATUS_TONE[p.status] ?? "muted"}>{p.status}</Badge> },
            { key: "actions", label: "", sortable: false, render: (p) => (
              p.status === "pending" || p.status === "approved" ? (
                <Btn size="sm" variant="primary" icon={Package} onClick={(e) => { e.stopPropagation(); receiveGRN(p.id); }}>Receive GRN</Btn>
              ) : null
            )},
          ]}
          pageSize={10}
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Goods Received Notes</h3>
        <DataTable
          rows={grns}
          searchKeys={["number"]}
          columns={[
            { key: "number", label: "GRN Number", render: (p) => <span className="font-mono text-xs font-semibold">{p.number}</span> },
            { key: "vendor", label: "Vendor", render: (p) => db.vendors.find((v) => v.id === p.vendorId)?.name ?? "—" },
            { key: "date", label: "Date" },
            { key: "items", label: "Items", align: "right", render: (p) => p.items.length },
            { key: "total", label: "Total", align: "right", render: (p) => money(total(p)) },
            { key: "status", label: "Status", render: () => <Badge tone="success">Received</Badge> },
          ]}
          pageSize={10}
        />
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 p-4">
          <div className="mt-10 w-full max-w-2xl rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-pop)]">
            <h4 className="mb-4 font-semibold">New Purchase Order</h4>
            <div className="space-y-4">
              <Field label="Vendor">
                <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)} options={db.vendors.map((v) => ({ value: v.id, label: v.name }))} />
              </Field>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Items</span>
                  <Btn size="sm" onClick={addItem}>+ Add Row</Btn>
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2">
                      <Select className="col-span-2" value={item.productId} onChange={(e) => setItem(i, "productId", e.target.value)} options={[{ value: "", label: "Select product" }, ...db.products.map((p) => ({ value: p.id, label: p.name }))]} />
                      <Input type="number" min="0" placeholder="Qty" value={item.qty} onChange={(e) => setItem(i, "qty", e.target.value)} />
                      <div className="flex gap-1">
                        <Input type="number" min="0" placeholder="Rate" value={item.rate} onChange={(e) => setItem(i, "rate", e.target.value)} />
                        <Btn size="sm" variant="ghost" onClick={() => removeItem(i)} className="text-danger px-1.5">✕</Btn>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Btn onClick={() => setCreateOpen(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={createPO}>Create PO</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
