import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Badge, Btn, DataTable, Field, Input, PageHeader, Select, Tabs } from "@/components/kit";
import { update, uid, useDB } from "@/lib/store";
import type { MenuItem } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/restaurant/menu")({
  head: () => ({ meta: [{ title: "Menu — MAYRA Hotel ERP" }] }),
  component: MenuPage,
});

const CATEGORIES = ["Breakfast", "Starters", "Main Course", "Breads", "Rice", "Beverages", "Desserts", "Mocktails", "Soups", "Salads"];

function MenuPage() {
  const db = useDB();
  const [catFilter, setCatFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ name: "", category: "Starters", price: "0", veg: "yes", active: "yes" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const cats = ["All", ...new Set(db.menu.map((m) => m.category))];
  const filtered = catFilter === "All" ? db.menu : db.menu.filter((m) => m.category === catFilter);

  function save() {
    if (!form.name.trim() || +form.price <= 0) { toast.error("Name and price required"); return; }
    update((d) => {
      if (editItem) {
        const m = d.menu.find((x) => x.id === editItem.id);
        if (m) { m.name = form.name; m.category = form.category; m.price = +form.price; m.veg = form.veg === "yes"; m.active = form.active === "yes"; }
      } else {
        d.menu.push({ id: uid("mi"), name: form.name, category: form.category, price: +form.price, veg: form.veg === "yes", active: form.active === "yes", modifiers: [], recipe: [] });
      }
    });
    toast.success(editItem ? "Menu item updated" : "Menu item added");
    setAddOpen(false);
    setEditItem(null);
    setForm({ name: "", category: "Starters", price: "0", veg: "yes", active: "yes" });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Menu Management"
        subtitle={`${db.menu.length} items across ${new Set(db.menu.map((m) => m.category)).size} categories`}
        actions={<Btn variant="primary" size="sm" icon={Plus} onClick={() => { setEditItem(null); setForm({ name: "", category: "Starters", price: "0", veg: "yes", active: "yes" }); setAddOpen(true); }}>Add Item</Btn>}
      />

      <div className="flex flex-wrap gap-1">
        {cats.map((c) => (
          <button key={c} onClick={() => setCatFilter(c)} className={`rounded-full px-2.5 py-1 text-xs font-medium ${catFilter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>{c}</button>
        ))}
      </div>

      <DataTable
        rows={filtered}
        searchKeys={["name", "category"]}
        columns={[
          { key: "veg", label: "", width: "40px", render: (m) => <span className={`inline-block h-4 w-4 rounded-sm border text-[9px] font-bold flex items-center justify-center ${m.veg ? "border-success text-success" : "border-danger text-danger"}`}>{m.veg ? "V" : "N"}</span> },
          { key: "name", label: "Item Name", render: (m) => <span className="font-medium">{m.name}</span> },
          { key: "category", label: "Category", render: (m) => <Badge tone="muted">{m.category}</Badge> },
          { key: "price", label: "Price", align: "right", render: (m) => `₹${m.price}` },
          { key: "active", label: "Status", render: (m) => <Badge tone={m.active ? "success" : "muted"}>{m.active ? "Active" : "Inactive"}</Badge> },
          { key: "actions", label: "", sortable: false, render: (m) => (
            <div className="flex gap-1">
              <Btn size="sm" variant="ghost" icon={Edit} onClick={(e) => { e.stopPropagation(); setEditItem(m); setForm({ name: m.name, category: m.category, price: String(m.price), veg: m.veg ? "yes" : "no", active: m.active ? "yes" : "no" }); setAddOpen(true); }} />
              <Btn size="sm" variant="ghost" icon={Trash2} onClick={(e) => { e.stopPropagation(); if (window.confirm(`Remove ${m.name}?`)) { update((d) => { d.menu = d.menu.filter((x) => x.id !== m.id); }); toast.success("Item removed"); } }} className="text-danger" />
            </div>
          )},
        ]}
        pageSize={20}
      />

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-pop)]">
            <h4 className="mb-4 font-semibold">{editItem ? "Edit Menu Item" : "Add Menu Item"}</h4>
            <div className="space-y-3">
              <Field label="Item Name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Category"><Select value={form.category} onChange={(e) => set("category", e.target.value)} options={CATEGORIES.map((c) => ({ value: c, label: c }))} /></Field>
              <Field label="Price (₹)"><Input type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} /></Field>
              <Field label="Veg / Non-Veg"><Select value={form.veg} onChange={(e) => set("veg", e.target.value)} options={[{ value: "yes", label: "Vegetarian" }, { value: "no", label: "Non-Vegetarian" }]} /></Field>
              <Field label="Status"><Select value={form.active} onChange={(e) => set("active", e.target.value)} options={[{ value: "yes", label: "Active" }, { value: "no", label: "Inactive" }]} /></Field>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Btn onClick={() => { setAddOpen(false); setEditItem(null); }}>Cancel</Btn>
              <Btn variant="primary" onClick={save}>{editItem ? "Update" : "Add Item"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
