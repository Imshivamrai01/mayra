import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Package, Boxes, Sparkles } from "lucide-react";
import { Badge, Btn, Card, Field, Input, PageHeader, Select, SuccessModal } from "@/components/kit";
import { money, uid, update, useDB } from "@/lib/store";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory/products/new")({
  head: () => ({ meta: [{ title: "New Inventory Product — MAYRA Hotel ERP" }] }),
  component: NewProductPage,
});

const CATEGORIES = ["Food", "Beverage", "Cleaning", "Toiletries", "Laundry Supplies", "Stationery", "Linen", "Maintenance Parts", "Kitchen Utilities", "Other"];
const UNITS = ["kg", "g", "litre", "ml", "pcs", "box", "pack", "bottle", "dozen", "meter", "can"];

function NewProductPage() {
  const db = useDB();
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "Food",
    unit: "kg",
    minStock: "5",
    initialStock: "10",
    purchaseRate: "120",
    sellingRate: "0",
  });

  const [createdProd, setCreatedProd] = useState<Product | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    let prod!: Product;
    update((d) => {
      prod = {
        id: uid("pr"),
        name: form.name,
        category: form.category,
        unit: form.unit,
        stock: +form.initialStock,
        minStock: +form.minStock,
        purchaseRate: +form.purchaseRate,
        sellingRate: +form.sellingRate,
        active: true,
      };
      d.products.unshift(prod);
    });

    setCreatedProd(prod);
    toast.success(`Product added to inventory: ${prod.name}!`);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Btn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => nav({ to: "/inventory/products" })}>
          Back to Products
        </Btn>
        <span className="text-muted-foreground">|</span>
        <Badge tone="primary" className="shimmer-gold-badge px-3 py-1">Inventory Catalog</Badge>
      </div>

      <PageHeader
        title="Add New Inventory Product"
        subtitle="Catalog raw material, kitchen ingredient, or operational consumable"
      />

      <div className="grid gap-6">
        <Card title="1. Product Classification">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product Name" required className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Basmati Rice (Premium)" />
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => set("category", e.target.value)} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </Field>
            <Field label="Unit of Measurement (UOM)">
              <Select value={form.unit} onChange={(e) => set("unit", e.target.value)} options={UNITS.map((u) => ({ value: u, label: u }))} />
            </Field>
          </div>
        </Card>

        <Card title="2. Stock Thresholds & Initial Quantities">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Initial In-Stock Quantity">
              <Input type="number" min="0" value={form.initialStock} onChange={(e) => set("initialStock", e.target.value)} />
            </Field>
            <Field label="Re-order Min Stock Threshold (Alert level)">
              <Input type="number" min="0" value={form.minStock} onChange={(e) => set("minStock", e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card title="3. Valuation & Rates">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Purchase Cost per ${form.unit} (₹)`} required>
              <Input type="number" min="0" value={form.purchaseRate} onChange={(e) => set("purchaseRate", e.target.value)} />
            </Field>
            <Field label={`Retail Selling Rate per ${form.unit} (₹, optional)`}>
              <Input type="number" min="0" value={form.sellingRate} onChange={(e) => set("sellingRate", e.target.value)} />
            </Field>
          </div>
          <div className="mt-4 rounded-lg bg-secondary/50 p-3 text-xs flex justify-between items-center border border-border">
            <span>Initial Inventory Valuation:</span>
            <span className="font-bold text-foreground text-sm">{money(+form.initialStock * +form.purchaseRate)}</span>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Btn variant="outline" size="lg" onClick={() => nav({ to: "/inventory/products" })}>
            Cancel
          </Btn>
          <Btn variant="primary" size="lg" icon={Check} className="shimmer-gold font-bold px-8 shadow-md" onClick={handleSave}>
            Save Product to Inventory
          </Btn>
        </div>
      </div>

      {createdProd && (
        <SuccessModal
          open={!!createdProd}
          onClose={() => nav({ to: "/inventory/products" })}
          title="Product Added to Inventory!"
          subtitle="Stock tracking and low-inventory alerts are now enabled for this item."
          details={[
            { label: "Product Name", value: createdProd.name },
            { label: "Category", value: createdProd.category },
            { label: "Initial Stock", value: `${createdProd.stock} ${createdProd.unit}` },
            { label: "Purchase Rate", value: `${money(createdProd.purchaseRate)} / ${createdProd.unit}` },
          ]}
          primaryAction={{
            label: "View Inventory Products",
            icon: Boxes,
            onClick: () => nav({ to: "/inventory/products" }),
          }}
          secondaryAction={{
            label: "Create Purchase Order",
            onClick: () => nav({ to: "/inventory/grn" }),
          }}
        />
      )}
    </div>
  );
}
