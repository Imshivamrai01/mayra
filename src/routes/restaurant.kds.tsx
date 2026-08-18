import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Btn } from "@/components/kit";
import { money, orderTotals, posService, useDB } from "@/lib/store";
import type { KdsStatus, POSOrder } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/restaurant/kds")({
  head: () => ({ meta: [{ title: "Aurelia HMS — Kitchen Display System" }] }),
  component: KDSPage,
});

export function KDSPage() {
  const db = useDB();
  const nav = useNavigate();
  const [search, setSearch] = useState("");

  const activeOrders = db.orders.filter((o) => ["kot", "open"].includes(o.status));

  const newOrders = activeOrders.filter((o) => o.kds === "new" || !o.kds);
  const preparingOrders = activeOrders.filter((o) => o.kds === "preparing");
  const readyOrders = activeOrders.filter((o) => o.kds === "ready");

  function moveStatus(orderId: string, nextStatus: KdsStatus) {
    posService.setKds(orderId, nextStatus);
    if (nextStatus === "ready") {
      toast.success("Order marked ready and sent to billing counter");
    } else {
      toast.success(`Order status updated to ${nextStatus.toUpperCase()}`);
    }
  }

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#d1c4bd]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#170f0a] tracking-tight">
            Kitchen Display System
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7f756f] text-[18px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders, items…"
              className="w-full text-xs bg-transparent border-b border-[#d1c4bd] pl-8 pr-2 py-1.5 outline-none focus:border-[#170f0a]"
            />
          </div>
          <Btn variant="outline" onClick={() => nav({ to: "/restaurant/billing" as never })}>
            Billing Desk
          </Btn>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: New Orders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#d1c4bd]">
            <h3 className="font-serif text-xl font-semibold text-[#170f0a]">New Orders</h3>
            <span className="w-5 h-5 rounded-full bg-[#f0eee9] border border-[#d1c4bd] text-[#170f0a] font-data-tabular text-xs flex items-center justify-center font-bold">
              {newOrders.length || 2}
            </span>
          </div>

          <div className="space-y-4">
            {/* Mock KOT Card 1 */}
            <div className="border border-[#d1c4bd] bg-[#ffffff] rounded-[0.25rem] p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#735c00]" />
                    <span className="font-label-caps text-xs text-[#170f0a] font-bold">KOT #1042</span>
                  </div>
                  <span className="font-serif text-base font-bold text-[#170f0a] block mt-0.5">Table 12</span>
                </div>
                <div className="text-right font-data-tabular">
                  <span className="text-[11px] text-[#7f756f] block">12:45 PM</span>
                  <span className="text-[11px] font-bold text-[#ba1a1a]">WAIT: 8m</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-[#170f0a] pt-2 border-t border-[#d1c4bd]/40">
                <div>2x Paneer Tikka</div>
                <div className="text-[11px] text-[#7f756f] pl-2">- Extra spicy</div>
                <div>1x Dal Makhani</div>
              </div>

              <div className="p-2 bg-[#ffdad6]/40 border border-[#ffb4ab] rounded-[0.125rem] text-xs text-[#93000a] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                <span>Allergy: Gluten</span>
              </div>

              <button
                onClick={() => toast.success("Order accepted for preparation")}
                className="w-full bg-[#170f0a] text-[#ffffff] py-2 rounded-[0.25rem] font-label-caps text-xs hover:bg-[#2d241e] transition-colors cursor-pointer"
              >
                Accept
              </button>
            </div>

            {/* Mock KOT Card 2 */}
            <div className="border border-[#d1c4bd] bg-[#ffffff] rounded-[0.25rem] p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-label-caps text-xs text-[#170f0a] font-bold">KOT #1043</span>
                  <span className="font-serif text-base font-bold text-[#170f0a] block mt-0.5">Table 04</span>
                </div>
                <div className="text-right font-data-tabular">
                  <span className="text-[11px] text-[#7f756f] block">12:50 PM</span>
                  <span className="text-[11px] font-bold text-[#ba1a1a]">WAIT: 3m</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-[#170f0a] pt-2 border-t border-[#d1c4bd]/40">
                <div>1x Caesar Salad</div>
                <div>2x Mushroom Risotto</div>
              </div>

              <button
                onClick={() => toast.success("Order accepted for preparation")}
                className="w-full bg-[#170f0a] text-[#ffffff] py-2 rounded-[0.25rem] font-label-caps text-xs hover:bg-[#2d241e] transition-colors cursor-pointer"
              >
                Accept
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Preparing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#d1c4bd]">
            <h3 className="font-serif text-xl font-semibold text-[#170f0a]">Preparing</h3>
            <span className="w-5 h-5 rounded-full bg-[#f0eee9] border border-[#d1c4bd] text-[#170f0a] font-data-tabular text-xs flex items-center justify-center font-bold">
              {preparingOrders.length || 1}
            </span>
          </div>

          <div className="space-y-4">
            <div className="border border-[#d1c4bd] border-t-2 border-t-[#735c00] bg-[#ffffff] rounded-[0.25rem] p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-label-caps text-xs text-[#170f0a] font-bold">KOT #1041</span>
                  <span className="font-serif text-base font-bold text-[#170f0a] block mt-0.5">Table 08</span>
                </div>
                <div className="text-right font-data-tabular">
                  <span className="text-[11px] text-[#7f756f] block">12:35 PM</span>
                  <span className="text-[11px] font-bold text-[#735c00]">IN PREP: 18m</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-[#170f0a] pt-2 border-t border-[#d1c4bd]/40">
                <div>3x Butter Chicken</div>
                <div>4x Garlic Naan</div>
                <div className="line-through text-[#7f756f]">1x Raita (Done)</div>
              </div>

              <Btn
                variant="outline"
                className="w-full text-xs"
                onClick={() => toast.success("KOT #1041 marked ready for delivery")}
              >
                Mark Ready
              </Btn>
            </div>
          </div>
        </div>

        {/* Column 3: Ready */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#d1c4bd]">
            <h3 className="font-serif text-xl font-semibold text-[#170f0a]">Ready</h3>
            <span className="w-5 h-5 rounded-full bg-[#f0eee9] border border-[#d1c4bd] text-[#170f0a] font-data-tabular text-xs flex items-center justify-center font-bold">
              {readyOrders.length}
            </span>
          </div>

          {readyOrders.length === 0 ? (
            <div className="border border-dashed border-[#d1c4bd] rounded-[0.25rem] p-12 text-center text-xs text-[#7f756f] bg-[#fbf9f4]">
              No orders ready
            </div>
          ) : (
            <div className="space-y-4">
              {readyOrders.map((o) => (
                <div key={o.id} className="border border-[#c0d6b0] bg-[#e5eedc]/30 rounded-[0.25rem] p-4 space-y-2">
                  <div className="flex justify-between font-bold text-xs">
                    <span>{o.kot || o.number}</span>
                    <span className="text-[#285430]">Ready</span>
                  </div>
                  <Btn
                    size="sm"
                    variant="primary"
                    className="w-full"
                    onClick={() => nav({ to: "/restaurant/billing" as never })}
                  >
                    View at Billing Desk →
                  </Btn>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
