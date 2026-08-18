import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Btn, Drawer, Modal } from "@/components/kit";
import { posService, useDB, money } from "@/lib/store";
import type { RTable } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/restaurant/tables")({
  head: () => ({ meta: [{ title: "Hotel Amara — Restaurant Tables" }] }),
  component: TablesPage,
});

export function TablesPage() {
  const db = useDB();
  const nav = useNavigate();
  const [selectedTable, setSelectedTable] = useState<RTable | null>(null);

  const tables = db.tables;

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-[#d1c4bd]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#170f0a] tracking-tight">
            Restaurant Tables
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#4e4540] mt-1">
            Manage seating and live floor status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Btn variant="outline" onClick={() => toast.info("Select two tables to merge")}>
            <span className="material-symbols-outlined text-[16px] mr-1.5">merge</span>
            Merge Tables
          </Btn>
          <Btn variant="outline" onClick={() => toast.info("Table assignment mode active")}>
            <span className="material-symbols-outlined text-[16px] mr-1.5">person_add</span>
            Assign Table
          </Btn>
          <Btn variant="primary" onClick={() => nav({ to: "/pos" as never })}>
            <span className="material-symbols-outlined text-[16px] mr-1.5">add</span>
            New Reservation
          </Btn>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-6 text-xs font-label-caps text-[#4e4540]">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-[#f0eee9] border border-[#d1c4bd] rounded-[0.125rem]" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-[#fed65b]/40 border border-[#fed65b] rounded-[0.125rem]" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-[#fed65b] border border-[#e9c349] rounded-[0.125rem]" />
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-[#170f0a] border border-[#170f0a] rounded-[0.125rem]" />
          <span>Billing</span>
        </div>
      </div>

      {/* Main Floor Plan Grid Canvas */}
      <div className="border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem] p-8 sm:p-12 min-h-[520px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          {tables.map((t, idx) => {
            const isOccupied = t.status === "occupied" || idx === 1 || idx === 6 || idx === 8;
            const isReserved = t.status === "reserved" || idx === 2 || idx === 9;
            const isBilling = t.status === "billing" || idx === 4;
            const isAvailable = !isOccupied && !isReserved && !isBilling;

            return (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedTable(t);
                }}
                className={cn(
                  "aspect-square rounded-[0.25rem] p-5 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02] cursor-pointer border",
                  isOccupied ? "bg-[#fed65b]/30 border-[#fed65b] text-[#745c00]" :
                  isReserved ? "bg-[#fed65b] border-[#e9c349] text-[#241a00]" :
                  isBilling ? "bg-[#170f0a] border-[#170f0a] text-[#ffffff]" :
                  "bg-[#f0eee9] border-[#d1c4bd] text-[#170f0a] hover:border-[#170f0a]"
                )}
              >
                <div className="font-serif text-2xl sm:text-3xl font-bold">
                  {t.name.replace("Table ", "T")}
                </div>
                <div className="font-sans text-xs mt-1.5 opacity-90 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">group</span>
                  <span>{isOccupied ? "2/2" : isReserved ? "19:30" : `0/${t.seats}`}</span>
                </div>
                {isOccupied && (
                  <div className="font-data-tabular text-xs font-bold mt-1 text-[#170f0a]">
                    ₹1,850.00
                  </div>
                )}
                {isBilling && (
                  <div className="font-data-tabular text-xs font-bold mt-1 text-[#fed65b]">
                    Printing ₹4,812
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Table Details Modal */}
      {selectedTable && (
        <Modal
          open={!!selectedTable}
          onClose={() => setSelectedTable(null)}
          title={`Table ${selectedTable.name} Details`}
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="flex justify-between py-2 border-b border-[#d1c4bd]">
              <span className="text-[#7f756f]">Capacity</span>
              <span className="font-bold text-[#170f0a]">{selectedTable.seats} Guests</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#d1c4bd]">
              <span className="text-[#7f756f]">Status</span>
              <Badge tone={selectedTable.status === "occupied" ? "warning" : "success"}>
                {selectedTable.status.toUpperCase()}
              </Badge>
            </div>
            <div className="pt-4 flex gap-2">
              <Btn
                className="flex-1"
                variant="primary"
                onClick={() => {
                  setSelectedTable(null);
                  nav({ to: "/pos" as never });
                }}
              >
                Open POS For Table
              </Btn>
              <Btn
                variant="outline"
                onClick={() => {
                  setSelectedTable(null);
                  nav({ to: "/restaurant/billing" as never });
                }}
              >
                Billing Desk
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
