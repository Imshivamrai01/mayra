import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Btn, Card, PageHeader } from "@/components/kit";
import { posService, useDB } from "@/lib/store";
import type { RTable } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/restaurant/tables")({
  head: () => ({ meta: [{ title: "Tables — MAYRA Hotel ERP" }] }),
  component: TablesPage,
});

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  available: { label: "Available", bg: "bg-success/10 border-success/30", color: "text-success" },
  occupied: { label: "Occupied", bg: "bg-primary/10 border-primary/30", color: "text-primary" },
  reserved: { label: "Reserved", bg: "bg-info/10 border-info/30", color: "text-info" },
  billing: { label: "Billing", bg: "bg-warning/10 border-warning/30", color: "text-warning" },
  cleaning: { label: "Cleaning", bg: "bg-secondary border-border", color: "text-muted-foreground" },
};

function TablesPage() {
  const db = useDB();
  const nav = useNavigate();
  const [selectedTable, setSelectedTable] = useState<RTable | null>(null);

  const areas = [...new Set(db.tables.map((t) => t.area))];
  const counts = Object.keys(STATUS_META).reduce((acc, s) => { acc[s] = db.tables.filter((t) => t.status === s).length; return acc; }, {} as Record<string, number>);

  function openPOS(t: RTable) {
    if (t.status === "available" || t.status === "occupied") {
      nav({ to: "/pos" as never });
      toast.info(`Opening POS for ${t.name}`);
    }
    setSelectedTable(null);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Table Management" subtitle="Restaurant floor plan" />

      <div className="flex flex-wrap gap-3">
        {Object.entries(STATUS_META).map(([s, m]) => (
          <div key={s} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${m.bg} ${m.color}`}>
            <span className={`h-2 w-2 rounded-full ${m.color.replace("text-", "bg-")}`} />
            {m.label} ({counts[s] ?? 0})
          </div>
        ))}
      </div>

      {areas.map((area) => {
        const areaTables = db.tables.filter((t) => t.area === area);
        return (
          <Card key={area} title={area}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {areaTables.map((t) => {
                const meta = STATUS_META[t.status] ?? STATUS_META.available;
                const activeOrder = db.orders.find((o) => o.tableId === t.id && ["open", "kot"].includes(o.status));
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTable(t)}
                    className={`rounded-lg border-2 p-3 text-center transition-all hover:shadow-md ${meta.bg}`}
                  >
                    <div className={`text-base font-bold ${meta.color}`}>{t.name}</div>
                    <div className="text-[11px] text-muted-foreground">{t.seats} seats</div>
                    <div className={`mt-1 text-[10px] font-semibold uppercase ${meta.color}`}>{meta.label}</div>
                    {activeOrder && <div className="mt-1 text-[10px] text-muted-foreground">{activeOrder.items.length} items</div>}
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })}

      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-xs rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-pop)]">
            <div className="text-center mb-4">
              <div className="text-2xl font-bold">{selectedTable.name}</div>
              <div className="text-sm text-muted-foreground">{selectedTable.seats} seats · {selectedTable.area}</div>
              <Badge tone={selectedTable.status === "available" ? "success" : selectedTable.status === "occupied" ? "primary" : "muted"} className="mt-2">{selectedTable.status}</Badge>
            </div>
            <div className="space-y-2">
              <Btn className="w-full" variant="primary" onClick={() => openPOS(selectedTable)}>Open POS for {selectedTable.name}</Btn>
              {selectedTable.status !== "available" && (
                <Btn className="w-full" onClick={() => {
                  posService.save(db.orders.find((o) => o.tableId === selectedTable.id && ["open", "kot"].includes(o.status))?.id ?? "", {});
                  setSelectedTable(null);
                }}>View Current Order</Btn>
              )}
              <Btn className="w-full" onClick={() => setSelectedTable(null)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
