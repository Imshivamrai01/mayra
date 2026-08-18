import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Btn, Modal, Field, Select, Input, Textarea } from "@/components/kit";
import { update, uid, useDB } from "@/lib/store";
import type { MaintTicket } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rooms/maintenance")({
  head: () => ({ meta: [{ title: "Aurelia HMS — Room Maintenance" }] }),
  component: MaintenancePage,
});

export function MaintenancePage() {
  const db = useDB();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("2");
  const [editDesc, setEditDesc] = useState("Shower head is leaking at the joint when fully turned on. Water drips outside shower pan.");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editStaff, setEditStaff] = useState("Select Staff");

  const tickets = [
    {
      id: "1",
      room: "402",
      type: "Deluxe King",
      issue: "HVAC Malfunction - No cooling",
      reportedBy: "Hskp. J. Smith",
      reportedTime: "Today, 08:30 AM",
      priority: "High",
      assignedTo: "M. Torres",
      status: "In Progress",
      expected: "Today, 14:00",
    },
    {
      id: "2",
      room: "215",
      type: "Standard Double",
      issue: "Shower head leaking",
      reportedBy: "Guest",
      reportedTime: "Yesterday, 19:45",
      priority: "Med",
      assignedTo: "Unassigned",
      status: "Open",
      expected: "TBD",
    },
    {
      id: "3",
      room: "510",
      type: "Executive Suite",
      issue: "Curtain track stuck",
      reportedBy: "Hskp. A. Davis",
      reportedTime: "Yesterday, 14:00",
      priority: "Low",
      assignedTo: "L. Park",
      status: "Waiting (Parts)",
      expected: "Tomorrow, 10:00",
    },
  ];

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[1]!;

  function handleUpdate() {
    toast.success(`Maintenance ticket for Room ${selectedTicket.room} updated`);
  }

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-[#d1c4bd]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#170f0a] tracking-tight">
            Room Maintenance
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#4e4540] mt-1">
            Current out of order rooms and maintenance requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Btn variant="outline" onClick={() => toast.info("Filter active")}>
            <span className="material-symbols-outlined text-[16px] mr-1.5">filter_list</span>
            Filter
          </Btn>
          <Btn variant="primary" onClick={() => setCreateOpen(true)}>
            <span className="material-symbols-outlined text-[16px] mr-1.5">add</span>
            New Request
          </Btn>
        </div>
      </div>

      {/* Main Grid: Table (8 cols) & Request Details Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Table (8 cols) */}
        <div className="lg:col-span-8 border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#d1c4bd] bg-[#f5f3ee]">
                  <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">Room</th>
                  <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">Issue</th>
                  <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">Reported By</th>
                  <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">Priority</th>
                  <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">Assigned To</th>
                  <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">Status</th>
                  <th className="p-4 font-label-caps text-[10px] text-[#4e4540] text-right">Expected</th>
                </tr>
              </thead>
              <tbody className="font-data-tabular divide-y divide-[#d1c4bd]/40 text-[#170f0a]">
                {tickets.map((t) => {
                  const isSelected = t.id === selectedTicketId;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={cn(
                        "hover:bg-[#ffffff] transition-colors cursor-pointer",
                        isSelected && "bg-[#ffffff] font-medium"
                      )}
                    >
                      <td className="p-4">
                        <span className="font-serif font-bold text-sm block">{t.room}</span>
                        <span className="text-[10px] text-[#7f756f] block">{t.type}</span>
                      </td>
                      <td className="p-4 font-medium max-w-xs">{t.issue}</td>
                      <td className="p-4 text-[#4e4540]">
                        <span className="block">{t.reportedBy}</span>
                        <span className="text-[10px] text-[#7f756f] block">{t.reportedTime}</span>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-[0.125rem] text-[9px] font-label-caps border uppercase",
                          t.priority === "High" ? "bg-[#ffdad6] text-[#93000a] border-[#ffb4ab]" :
                          t.priority === "Med" ? "bg-[#fed65b]/30 text-[#745c00] border-[#fed65b]" :
                          "bg-[#f0eee9] text-[#4e4540] border-[#d1c4bd]"
                        )}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-4 text-[#170f0a]">{t.assignedTo}</td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-[0.125rem] text-[9px] font-label-caps border uppercase inline-flex items-center gap-1",
                          t.status === "In Progress" ? "bg-[#fed65b]/20 text-[#745c00] border-[#fed65b]" :
                          t.status === "Open" ? "bg-[#ffffff] text-[#170f0a] border-[#d1c4bd]" :
                          "bg-[#f0eee9] text-[#7f756f] border-[#d1c4bd]"
                        )}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#735c00]" />
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 text-right text-[#7f756f]">{t.expected}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Details Panel (4 cols) */}
        <div className="lg:col-span-4 border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem] p-6 space-y-5">
          <div>
            <span className="font-label-caps text-[10px] text-[#7f756f] block">REQUEST DETAILS</span>
            <h3 className="font-serif text-xl font-bold text-[#170f0a] mt-1">
              Room {selectedTicket.room}
            </h3>
            <p className="text-xs text-[#7f756f]">{selectedTicket.type}</p>
          </div>

          <div className="space-y-4">
            <Field label="Description">
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="text-xs min-h-[90px]"
              />
            </Field>

            <Field label="Priority">
              <Select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                options={[{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }]}
              />
            </Field>

            <Field label="Assign To">
              <Select
                value={editStaff}
                onChange={(e) => setEditStaff(e.target.value)}
                options={[{ value: "Select Staff", label: "Select Staff" }, { value: "M. Torres", label: "M. Torres" }, { value: "L. Park", label: "L. Park" }]}
              />
            </Field>

            <Field label="Expected Completion">
              <Input placeholder="mm/dd/yyyy, --:--" defaultValue="08/20/2026, 14:00" />
            </Field>

            <div>
              <span className="font-label-caps text-[10px] text-[#4e4540] block mb-1.5">Attachments (1)</span>
              <div className="w-20 h-20 bg-[#e4e2dd] border border-[#d1c4bd] rounded-[0.25rem] flex items-center justify-center text-[#7f756f]">
                <span className="material-symbols-outlined text-[24px]">shower</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleUpdate}
                className="w-full bg-[#170f0a] text-[#ffffff] py-2.5 rounded-[0.25rem] font-label-caps text-xs hover:bg-[#2d241e] transition-colors cursor-pointer"
              >
                UPDATE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Request Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Maintenance Request"
        footer={
          <>
            <Btn variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => { toast.success("Maintenance request created"); setCreateOpen(false); }}>Create Request</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Room Number">
            <Input placeholder="e.g. 215" />
          </Field>
          <Field label="Issue Description">
            <Textarea placeholder="Describe the maintenance issue…" />
          </Field>
          <Field label="Priority Level">
            <Select options={[{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }]} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
