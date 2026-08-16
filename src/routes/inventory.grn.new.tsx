import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Package, Plus, Trash2, FileCheck } from "lucide-react";
import { Badge, Btn, Card, Field, Input, KV, PageHeader, Select, SuccessModal } from "@/components/kit";
import { money, today, uid, update, useDB } from "@/lib/store";
import type { PurchaseDoc } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory/grn/new")({
  head: () => ({ meta: [{ title: "New Purchase Order — MAYRA Hotel ERP" }] }),
  component: NewPOPage,
});

function NewPOPage() {
  const db = useDB();
  const nav = useNavigate();

  const [vendorId, setVendorId] = useState(db.vendors[0]?.id ?? "");
  const [docType, setDocType] = useState<"po" | "requisition">("po");
  const [orderDate, setOrderDate] = useState(today());
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<{ productId: string; qty: string; rate: string }[]>([
    { productId: db.products[0]?.id ?? "", qty: "20", rate: String(db.products[0]?.purchaseRate ?? 100) },
    { productId: db.products[1]?.id ?? "", qty: "10", rate: String(db.products[1]?.purchaseRate ?? 50) },
  ]);

  const [createdDoc, setCreatedDoc] = useState<PurchaseDoc | null>(null);

  function addItem() {
    setItems((prev) => [...prev, { productId: db.products[0]?.id ?? "", qty: "5", rate: "100" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, key: string, val: string) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [key]: val };
        if (key === "productId") {
          const p = db.products.find((x) => x.id === val);
          if (p) updated.rate = String(p.purchaseRate);
        }
        return updated;
      })
    );
  }

  const grandTotal = items.reduce((s, it) => s + (+it.qty * +it.rate), 0);
  const selectedVendor = db.vendors.find((v) => v.id === vendorId);

  function handleSave() {
    const validItems = items.filter((i) => i.productId && +i.qty > 0);
    if (!vendorId || validItems.length === 0) {
      toast.error("Please select a vendor and add at least one line item");
      return;
    }

    let doc!: PurchaseDoc;
    update((d) => {
      const num = `${docType === "po" ? "PO" : "PR"}-${String((d.counters.po ?? 1020) + 1).padStart(4, "0")}`;
      d.counters.po = (d.counters.po ?? 1020) + 1;
      doc = {
        id: uid("pu"),
        number: num,
        type: docType,
        vendorId,
        date: orderDate,
        status: docType === "po" ? "pending" : "draft",
        items: validItems.map((i) => ({ productId: i.productId, qty: +i.qty, rate: +i.rate })),
        note: notes,
      };
      d.purchases.unshift(doc);
    });

    setCreatedDoc(doc);
    toast.success(`Purchase Order created: ${doc.number}!`);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Btn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => nav({ to: "/inventory/grn" })}>
          Back to Purchase & GRN
        </Btn>
        <span className="text-muted-foreground">|</span>
        <Badge tone="primary" className="shimmer-gold-badge px-3 py-1">Procurement Builder</Badge>
      </div>

      <PageHeader
        title="Create New Purchase Order"
        subtitle="Issue procurement order for hotel stock and raw materials"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card title="1. Order Header & Vendor Selection">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Document Type">
                <Select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as "po" | "requisition")}
                  options={[
                    { value: "po", label: "Purchase Order (PO)" },
                    { value: "requisition", label: "Purchase Requisition (PR)" },
                  ]}
                />
              </Field>
              <Field label="Select Supplier / Vendor" className="sm:col-span-2" required>
                <Select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  options={db.vendors.map((v) => ({
                    value: v.id,
                    label: `${v.name} (${v.category}) — GST: ${v.gstin}`,
                  }))}
                />
              </Field>
              <Field label="Order Date">
                <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
              </Field>
              <Field label="Special Delivery Instructions" className="sm:col-span-2">
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Delivery at Main Kitchen Loading Dock" />
              </Field>
            </div>
          </Card>

          <Card
            title="2. Product Line Items"
            action={
              <Btn size="sm" variant="primary" icon={Plus} onClick={addItem}>
                Add Line Item
              </Btn>
            }
          >
            <div className="space-y-3">
              {items.map((it, idx) => {
                const prod = db.products.find((p) => p.id === it.productId);
                const lineTotal = +it.qty * +it.rate;
                return (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border border-border/80 bg-secondary/40">
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">Product</label>
                      <Select
                        value={it.productId}
                        onChange={(e) => updateItem(idx, "productId", e.target.value)}
                        options={db.products.map((p) => ({ value: p.id, label: `${p.name} (${p.unit})` }))}
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">Qty ({prod?.unit ?? "units"})</label>
                      <Input type="number" min="1" value={it.qty} onChange={(e) => updateItem(idx, "qty", e.target.value)} />
                    </div>
                    <div className="w-32">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">Rate / unit (₹)</label>
                      <Input type="number" min="0" value={it.rate} onChange={(e) => updateItem(idx, "rate", e.target.value)} />
                    </div>
                    <div className="w-28 text-right sm:pt-4">
                      <div className="text-xs text-muted-foreground">Line Total</div>
                      <div className="text-sm font-bold text-foreground">{money(lineTotal)}</div>
                    </div>
                    {items.length > 1 && (
                      <div className="sm:pt-4">
                        <Btn size="sm" variant="ghost" icon={Trash2} className="text-danger px-2" onClick={() => removeItem(idx)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div>
          <Card title="Order Summary" className="sticky top-6 border-primary/30 shadow-lg">
            <div className="space-y-3 text-sm">
              <KV label="Supplier" value={selectedVendor?.name} />
              <KV label="Category" value={selectedVendor?.category} />
              <KV label="Total Items" value={`${items.length} Products`} />
              <KV label="Order Date" value={orderDate} />

              <div className="border-t-2 border-border/80 pt-3 flex items-center justify-between">
                <span className="text-base font-bold">Total Order Value:</span>
                <span className="text-xl font-bold text-primary">{money(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Btn
                variant="primary"
                size="lg"
                className="w-full shadow-md font-bold shimmer-gold"
                icon={Check}
                onClick={handleSave}
              >
                Issue Purchase Order
              </Btn>
              <Btn
                variant="outline"
                size="md"
                className="w-full text-xs"
                onClick={() => nav({ to: "/inventory/grn" })}
              >
                Cancel
              </Btn>
            </div>
          </Card>
        </div>
      </div>

      {createdDoc && (
        <SuccessModal
          open={!!createdDoc}
          onClose={() => nav({ to: "/inventory/grn" })}
          title="Purchase Order Issued!"
          subtitle="Purchase order document generated. Ready for Goods Receiving (GRN)."
          details={[
            { label: "PO Number", value: createdDoc.number },
            { label: "Supplier", value: selectedVendor?.name ?? "Vendor" },
            { label: "Line Items", value: `${createdDoc.items.length} products` },
            { label: "Total PO Value", value: money(grandTotal) },
          ]}
          primaryAction={{
            label: "View Purchase Orders & GRN",
            icon: FileCheck,
            onClick: () => nav({ to: "/inventory/grn" }),
          }}
          secondaryAction={{
            label: "Return to Inventory",
            onClick: () => nav({ to: "/inventory/products" }),
          }}
        />
      )}
    </div>
  );
}
