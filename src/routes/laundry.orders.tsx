import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Btn, Modal, Field, Select, Input } from "@/components/kit";
import { laundryService, money, today, uid, update, useDB } from "@/lib/store";
import type { LaundryOrder } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/laundry/orders")({
  head: () => ({ meta: [{ title: "Aurelia HMS — Laundry Management" }] }),
  component: LaundryPage,
});

export function LaundryPage() {
  const db = useDB();
  const nav = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ roomNo: "Room 304", itemType: "Bedsheet, Pillow Cover", qty: 4, staff: "Maria S." });

  const activeOrders = [
    { id: "1", batchId: "#LB-4092", location: "Room 304", itemType: "Bedsheet, Pillow Cover", qty: 4, receivedTime: "08:30 AM", stage: "Washing", staff: "Maria S.", status: "IN PROGRESS" },
    { id: "2", batchId: "#LB-4093", location: "Restaurant", itemType: "Table Linen", qty: 45, receivedTime: "09:15 AM", stage: "Ironing", staff: "David K.", status: "PROCESSING" },
    { id: "3", batchId: "#LB-4094", location: "Room 412", itemType: "Towel, Bath Mat", qty: 6, receivedTime: "09:45 AM", stage: "Drying", staff: "Elena R.", status: "IN PROGRESS" },
    { id: "4", batchId: "#LB-4095", location: "Front Desk", itemType: "Uniform", qty: 2, receivedTime: "10:00 AM", stage: "Ready", staff: "James W.", status: "COMPLETED" },
  ];

  function createBatch() {
    toast.success("New laundry batch created and assigned to washing pipeline");
    setCreateOpen(false);
  }

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-[#d1c4bd]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#170f0a] tracking-tight">
            Laundry
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#4e4540] mt-1">
            Manage daily processing, batch tracking, and dispatch.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="bg-[#fed65b] text-[#745c00] hover:bg-[#e9c349] font-label-caps text-xs px-5 py-3 rounded-[0.25rem] font-bold transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          NEW LAUNDRY BATCH
        </button>
      </div>

      {/* 6 Pipeline KPI Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pb-4 border-b border-[#d1c4bd]">
        <div>
          <span className="font-label-caps text-[10px] text-[#4e4540] block">ITEMS RECEIVED</span>
          <span className="font-serif text-3xl font-bold text-[#170f0a] block mt-1">850</span>
        </div>

        <div>
          <span className="font-label-caps text-[10px] text-[#4e4540] block">WASHING</span>
          <span className="font-serif text-3xl font-bold text-[#735c00] block mt-1">120</span>
        </div>

        <div>
          <span className="font-label-caps text-[10px] text-[#4e4540] block">DRYING</span>
          <span className="font-serif text-3xl font-bold text-[#170f0a] block mt-1">200</span>
        </div>

        <div>
          <span className="font-label-caps text-[10px] text-[#4e4540] block">IRONING</span>
          <span className="font-serif text-3xl font-bold text-[#170f0a] block mt-1">150</span>
        </div>

        <div>
          <span className="font-label-caps text-[10px] text-[#4e4540] block">READY</span>
          <span className="font-serif text-3xl font-bold text-[#170f0a] block mt-1">320</span>
        </div>

        <div>
          <span className="font-label-caps text-[10px] text-[#4e4540] block">DISPATCHED</span>
          <span className="font-serif text-3xl font-bold text-[#170f0a] block mt-1">60</span>
        </div>
      </section>

      {/* Active Processing Table Card */}
      <div className="border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem] overflow-hidden">
        <div className="p-5 border-b border-[#d1c4bd] flex items-center justify-between bg-[#f5f3ee]">
          <h3 className="font-serif text-lg font-semibold text-[#170f0a]">Active Processing</h3>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#7f756f] cursor-pointer">filter_list</span>
            <span className="material-symbols-outlined text-[18px] text-[#7f756f] cursor-pointer">more_vert</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#d1c4bd] bg-[#fbf9f4]">
                <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">BATCH ID</th>
                <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">ROOM / DEPT</th>
                <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">ITEM TYPE</th>
                <th className="p-4 font-label-caps text-[10px] text-[#4e4540] text-center">QTY</th>
                <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">RECEIVED TIME</th>
                <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">CURRENT STAGE</th>
                <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">ASSIGNED STAFF</th>
                <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">STATUS</th>
              </tr>
            </thead>
            <tbody className="font-data-tabular divide-y divide-[#d1c4bd]/40 text-[#170f0a]">
              {activeOrders.map((batch) => (
                <tr key={batch.id} className="hover:bg-[#ffffff] transition-colors">
                  <td className="p-4 font-bold text-[#170f0a]">{batch.batchId}</td>
                  <td className="p-4 font-medium">{batch.location}</td>
                  <td className="p-4 text-[#4e4540]">{batch.itemType}</td>
                  <td className="p-4 text-center font-bold">{batch.qty}</td>
                  <td className="p-4 text-[#7f756f]">{batch.receivedTime}</td>
                  <td className="p-4 font-medium text-[#735c00]">{batch.stage}</td>
                  <td className="p-4 text-[#170f0a]">{batch.staff}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-[0.125rem] text-[9px] font-label-caps border uppercase",
                      batch.status === "COMPLETED" ? "bg-[#e5eedc] text-[#285430] border-[#c0d6b0]" :
                      batch.status === "PROCESSING" ? "bg-[#fed65b]/20 text-[#745c00] border-[#fed65b]" :
                      "bg-[#f0eee9] text-[#170f0a] border-[#d1c4bd]"
                    )}>
                      {batch.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Batch Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Laundry Batch"
        footer={
          <>
            <Btn variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={createBatch}>Create Batch</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Room / Department">
            <Input value={form.roomNo} onChange={(e) => setForm((f) => ({ ...f, roomNo: e.target.value }))} />
          </Field>
          <Field label="Item Types">
            <Input value={form.itemType} onChange={(e) => setForm((f) => ({ ...f, itemType: e.target.value }))} />
          </Field>
          <Field label="Quantity">
            <Input type="number" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: +e.target.value }))} />
          </Field>
          <Field label="Assigned Staff">
            <Input value={form.staff} onChange={(e) => setForm((f) => ({ ...f, staff: e.target.value }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
