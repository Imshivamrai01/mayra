import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Truck, Download } from "lucide-react";
import { Badge, Btn, DataTable, Field, Input, KV, PageHeader, Select, Tabs, exportCSV } from "@/components/kit";
import { inventoryService, money, today, uid, update, useDB } from "@/lib/store";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory/products/")({
  head: () => ({ meta: [{ title: "Products — Hotel Amara ERP" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const db = useDB();
  const nav = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [editProd, setEditProd] = useState<Product | null>(null);
  const [adjOpen, setAdjOpen] = useState<Product | null>(null);
  const [adjQty, setAdjQty] = useState("0");
  const [adjNote, setAdjNote] = useState("");
  const [form, setForm] = useState({ name: "", category: "Food", unit: "kg", minStock: "5", purchaseRate: "0", sellingRate: "0" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const lowStock = db.products.filter((p) => p.stock <= p.minStock);

  function saveProduct() {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    update((d) => {
      if (editProd) {
        const p = d.products.find((x) => x.id === editProd.id);
        if (p) { p.name = form.name; p.category = form.category; p.unit = form.unit; p.minStock = +form.minStock; p.purchaseRate = +form.purchaseRate; p.sellingRate = +form.sellingRate; }
      } else {
        d.products.push({ id: uid("pr"), name: form.name, category: form.category, unit: form.unit, stock: 0, minStock: +form.minStock, purchaseRate: +form.purchaseRate, sellingRate: +form.sellingRate, active: true });
      }
    });
    toast.success(editProd ? "Product updated" : "Product added");
    setAddOpen(false);
    setEditProd(null);
    setForm({ name: "", category: "Food", unit: "kg", minStock: "5", purchaseRate: "0", sellingRate: "0" });
  }

  function adjust() {
    if (!adjOpen) return;
    inventoryService.adjust(adjOpen.id, +adjQty, "adjustment", adjNote);
    toast.success(`Stock adjusted: ${adjOpen.name}`);
    setAdjOpen(null);
    setAdjQty("0");
    setAdjNote("");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        subtitle={`${db.products.length} products · ${lowStock.length} low stock`}
        actions={
          <>
            <Btn size="sm" icon={Download} onClick={() => exportCSV("products.csv", db.products.map((p) => ({ name: p.name, category: p.category, unit: p.unit, stock: p.stock, minStock: p.minStock, purchaseRate: p.purchaseRate })))}>Export</Btn>
            <Btn variant="primary" size="sm" icon={Plus} className="shimmer-gold font-semibold shadow-sm" onClick={() => nav({ to: "/inventory/products/new" as never })}>Add Product</Btn>
          </>
        }
      />

      <DataTable
        rows={db.products}
        searchKeys={["name", "category"]}
        columns={[
          { key: "name", label: "Product", render: (p) => <span className="font-medium">{p.name}</span> },
          { key: "category", label: "Category", render: (p) => <Badge tone="muted">{p.category}</Badge> },
          { key: "unit", label: "Unit" },
          { key: "stock", label: "In Stock", align: "right", render: (p) => (
            <span className={p.stock <= p.minStock ? "font-semibold text-danger" : ""}>
              {p.stock.toFixed(2)} {p.unit}
            </span>
          )},
          { key: "minStock", label: "Min Stock", align: "right", render: (p) => `${p.minStock} ${p.unit}` },
          { key: "purchaseRate", label: "Purchase Rate", align: "right", render: (p) => `₹${p.purchaseRate}/${p.unit}` },
          { key: "status", label: "Status", render: (p) => (
            p.stock <= 0 ? <Badge tone="danger">Out of Stock</Badge> :
            p.stock <= p.minStock ? <Badge tone="warning">Low Stock</Badge> :
            <Badge tone="success">In Stock</Badge>
          )},
          { key: "actions", label: "", sortable: false, render: (p) => (
            <div className="flex gap-1">
              <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setAdjOpen(p); }}>Adjust</Btn>
              <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditProd(p); setForm({ name: p.name, category: p.category, unit: p.unit, minStock: String(p.minStock), purchaseRate: String(p.purchaseRate), sellingRate: String(p.sellingRate) }); setAddOpen(true); }}>Edit</Btn>
            </div>
          )},
        ]}
        pageSize={20}
      />

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-pop)]">
            <h4 className="mb-4 font-semibold">{editProd ? "Edit Product" : "Add Product"}</h4>
            <div className="space-y-3">
              <Field label="Product Name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Category">
                <Select value={form.category} onChange={(e) => set("category", e.target.value)} options={["Food", "Beverage", "Cleaning", "Toiletries", "Laundry", "Stationery", "Other"].map((c) => ({ value: c, label: c }))} />
              </Field>
              <Field label="Unit">
                <Select value={form.unit} onChange={(e) => set("unit", e.target.value)} options={["kg", "g", "litre", "ml", "pcs", "box", "pack", "bottle", "dozen"].map((u) => ({ value: u, label: u }))} />
              </Field>
              <div className="grid gap-3 grid-cols-2">
                <Field label="Min Stock"><Input type="number" min="0" value={form.minStock} onChange={(e) => set("minStock", e.target.value)} /></Field>
                <Field label="Purchase Rate (₹)"><Input type="number" min="0" value={form.purchaseRate} onChange={(e) => set("purchaseRate", e.target.value)} /></Field>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Btn onClick={() => { setAddOpen(false); setEditProd(null); }}>Cancel</Btn>
              <Btn variant="primary" onClick={saveProduct}>{editProd ? "Update" : "Add"}</Btn>
            </div>
          </div>
        </div>
      )}

      {adjOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-xs rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-pop)]">
            <h4 className="mb-4 font-semibold">Adjust Stock — {adjOpen.name}</h4>
            <div className="text-sm text-muted-foreground mb-3">Current: {adjOpen.stock} {adjOpen.unit}</div>
            <div className="space-y-3">
              <Field label="Adjustment Qty (+ to add, - to remove)"><Input type="number" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} /></Field>
              <Field label="Note"><Input value={adjNote} onChange={(e) => setAdjNote(e.target.value)} placeholder="Reason for adjustment" /></Field>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Btn onClick={() => setAdjOpen(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={adjust}>Apply</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
