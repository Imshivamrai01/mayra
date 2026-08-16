import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Utensils, Users, Clock, Receipt, Sparkles, CheckCircle2, ChevronRight, Plus } from "lucide-react";
import { Badge, Btn, Card, Modal, PageHeader } from "@/components/kit";
import { posService, useDB, money } from "@/lib/store";
import type { RTable } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/restaurant/tables")({
  head: () => ({ meta: [{ title: "Table Floor Plan — MAYRA Hotel ERP" }] }),
  component: TablesPage,
});

const STATUS_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  available: { label: "Available", bg: "bg-emerald-50 border-emerald-200 text-emerald-800", text: "text-emerald-700", dot: "bg-emerald-500" },
  occupied: { label: "Occupied / Dining", bg: "bg-purple-50 border-purple-300 text-purple-900", text: "text-purple-700", dot: "bg-purple-600" },
  reserved: { label: "Reserved", bg: "bg-blue-50 border-blue-200 text-blue-800", text: "text-blue-700", dot: "bg-blue-500" },
  billing: { label: "Bill Requested", bg: "bg-amber-50 border-amber-300 text-amber-900", text: "text-amber-700", dot: "bg-amber-500" },
  cleaning: { label: "Cleaning / Turnover", bg: "bg-slate-50 border-slate-200 text-slate-600", text: "text-slate-600", dot: "bg-slate-400" },
};

function TablesPage() {
  const db = useDB();
  const nav = useNavigate();
  const [selectedTable, setSelectedTable] = useState<RTable | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const areas = [...new Set(db.tables.map((t) => t.area))];
  const counts = Object.keys(STATUS_META).reduce((acc, s) => {
    acc[s] = db.tables.filter((t) => t.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  function openPOS(t: RTable) {
    nav({ to: "/pos" as never });
    toast.info(`Opening POS for ${t.name}`);
    setSelectedTable(null);
  }

  const activeOrder = selectedTable ? db.orders.find((o) => o.tableId === selectedTable.id && ["open", "kot"].includes(o.status)) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Restaurant Floor Plan"
        subtitle="Live Dine-in Table Status & Table Turnover Management"
        actions={
          <Btn variant="primary" size="sm" icon={Utensils} onClick={() => nav({ to: "/pos" as never })}>
            Open POS Terminal
          </Btn>
        }
      />

      {/* Status Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
            statusFilter === "all" ? "bg-purple-700 text-white shadow-xs" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50",
          )}
        >
          All Tables ({db.tables.length})
        </button>
        {Object.entries(STATUS_META).map(([s, m]) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer",
              statusFilter === s ? "bg-purple-700 text-white border-purple-700 shadow-xs" : `${m.bg} hover:shadow-2xs`,
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", statusFilter === s ? "bg-white" : m.dot)} />
            <span>{m.label} ({counts[s] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Floor Plan Areas */}
      {areas.map((area) => {
        const areaTables = db.tables
          .filter((t) => t.area === area)
          .filter((t) => statusFilter === "all" || t.status === statusFilter);

        if (areaTables.length === 0) return null;

        return (
          <div key={area} className="card-surface rounded-2xl bg-white border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">{area} Dining Section</span>
              <span className="text-xs font-semibold text-slate-400">{areaTables.length} Tables</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {areaTables.map((t) => {
                const meta = STATUS_META[t.status] ?? STATUS_META.available;
                const order = db.orders.find((o) => o.tableId === t.id && ["open", "kot"].includes(o.status));
                const orderTotal = order ? order.items.reduce((sum, item) => sum + item.price * item.qty, 0) : 0;

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTable(t)}
                    className={cn(
                      "p-3.5 rounded-2xl border-2 text-left transition-all hover:scale-102 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-32",
                      meta.bg,
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-base font-black text-slate-900 block leading-tight">{t.name}</span>
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3" /> {t.seats} Pax
                        </span>
                      </div>
                      <span className={cn("h-2.5 w-2.5 rounded-full mt-1 shrink-0", meta.dot)} />
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold">
                      <span className={meta.text}>{meta.label}</span>
                      {order ? (
                        <span className="text-slate-900 font-extrabold">{money(orderTotal)}</span>
                      ) : (
                        <span className="text-slate-400">Ready</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Table Detail Modal */}
      <Modal
        open={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        title={selectedTable ? `${selectedTable.name} — ${selectedTable.area}` : "Table Details"}
        subtitle={selectedTable ? `${selectedTable.seats} Seats Capacity · Current Status: ${selectedTable.status.toUpperCase()}` : ""}
        maxWidth="max-w-md"
      >
        {selectedTable && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500">Status</span>
                <span className={cn("font-bold", STATUS_META[selectedTable.status]?.text)}>
                  {STATUS_META[selectedTable.status]?.label}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500">Capacity</span>
                <span className="text-slate-900 font-bold">{selectedTable.seats} Guests</span>
              </div>
              {activeOrder && (
                <>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Active KOT / Order</span>
                    <span className="text-purple-700 font-bold">{activeOrder.number} ({activeOrder.items.length} items)</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Assigned Waiter</span>
                    <span className="text-slate-900 font-bold">{activeOrder.waiter || "Staff"}</span>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Btn
                className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold"
                size="md"
                icon={Utensils}
                onClick={() => openPOS(selectedTable)}
              >
                {activeOrder ? "Add Items / Modify Order" : `Take Order for ${selectedTable.name}`}
              </Btn>
              {activeOrder && (
                <Btn
                  className="w-full"
                  variant="outline"
                  size="md"
                  icon={Receipt}
                  onClick={() => {
                    nav({ to: "/restaurant/billing" as never });
                    setSelectedTable(null);
                  }}
                >
                  Generate Bill & Settle Desk →
                </Btn>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

