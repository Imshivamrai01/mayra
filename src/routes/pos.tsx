import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Badge, Btn, Modal, SuccessModal } from "@/components/kit";
import { money, orderTotals, posService, useDB } from "@/lib/store";
import type { MenuItem, OrderItem, OrderMode, POSOrder } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pos")({
  head: () => ({ meta: [{ title: "Hotel Amara — Restaurant POS Terminal" }] }),
  component: POSPage,
});

const CATEGORIES = ["Starters", "Main Course", "Indian", "Continental", "Chinese", "Desserts", "Beverages"];

export function POSPage() {
  const db = useDB();
  const nav = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("Main Course");
  const [dietFilter, setDietFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<OrderItem[]>([
    { id: "1", menuItemId: "m1", name: "Truffle Risotto", price: 1200, qty: 1, modifiers: ["No Onion"] },
    { id: "2", menuItemId: "m2", name: "Saffron Prawn Curry", price: 1850, qty: 2, modifiers: ["Extra Spicy"] },
  ]);
  const [tableId, setTableId] = useState("t4");
  const [guestName, setGuestName] = useState("Rahul Mehta");
  const [payOpen, setPayOpen] = useState(false);
  const [payMode, setPayMode] = useState("UPI");
  const [successOrder, setSuccessOrder] = useState<{ number: string; kot?: string; total: number; mode: string } | null>(null);

  const filteredMenu = useMemo(() => {
    return db.menu.filter((m) => {
      if (!m.active) return false;
      if (selectedCategory && m.category !== selectedCategory && selectedCategory !== "Main Course") {
        // Fallback matching
      }
      if (dietFilter === "veg" && !m.veg) return false;
      if (dietFilter === "non-veg" && m.veg) return false;
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [db.menu, selectedCategory, dietFilter, searchQuery]);

  function addItem(m: MenuItem) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.menuItemId === m.id);
      if (idx >= 0) {
        return prev.map((it, i) => i === idx ? { ...it, qty: it.qty + 1 } : it);
      }
      return [...prev, { id: m.id, menuItemId: m.id, name: m.name, price: m.price, qty: 1, modifiers: [] }];
    });
  }

  function updateQty(id: string, delta: number) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter((i) => i.qty > 0));
  }

  const mockOrder: Partial<POSOrder> = { items, discount: 0, mode: "Dine In" };
  const totals = orderTotals(mockOrder as POSOrder, db);

  function sendKOT() {
    if (!items.length) { toast.error("Please add items to the order first"); return; }
    const order = posService.createOrder({ mode: "Dine In", tableId: tableId || undefined, waiter: "Captain Rajesh", items, discount: 0 });
    posService.sendKOT(order.id);
    toast.success(`KOT #${order.kot || "1042"} sent to Kitchen!`);
    setSuccessOrder({
      number: order.number,
      kot: order.kot || "1042",
      total: totals.total,
      mode: "KOT Sent to Kitchen",
    });
  }

  function settle() {
    if (!items.length) { toast.error("Cart is empty"); return; }
    const order = posService.createOrder({ mode: "Dine In", tableId: tableId || undefined, waiter: "Captain Rajesh", items, discount: 0 });
    posService.settle(order.id, payMode);
    toast.success(`Order #${order.number} settled via ${payMode}`);
    setSuccessOrder({
      number: order.number,
      kot: order.kot,
      total: totals.total,
      mode: `Settled via ${payMode}`,
    });
    setItems([]);
    setPayOpen(false);
  }

  return (
    <div className="flex h-[calc(100vh-65px)] gap-0 -m-6 sm:-m-10 bg-[#fbf9f4] font-sans overflow-hidden">
      {/* Panel 1: Categories Sub-nav */}
      <div className="w-48 sm:w-56 border-r border-[#d1c4bd] bg-[#fbf9f4] p-4 flex flex-col justify-between shrink-0 h-full overflow-y-auto">
        <div className="space-y-1">
          <span className="font-label-caps text-[10px] text-[#7f756f] px-3 block mb-2">CATEGORIES</span>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-[0.25rem] text-left text-xs transition-colors cursor-pointer",
                  active
                    ? "bg-[#e4e2dd] text-[#170f0a] font-bold"
                    : "text-[#4e4540] hover:bg-[#f0eee9]"
                )}
              >
                <span>{cat}</span>
                {active && <span className="material-symbols-outlined text-[14px]">chevron_right</span>}
              </button>
            );
          })}
        </div>

        <div className="space-y-1 pt-4 border-t border-[#d1c4bd]">
          <button
            onClick={() => nav({ to: "/restaurant/tables" as never })}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#4e4540] hover:text-[#170f0a] rounded cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">table_restaurant</span>
            <span>Floor Plan</span>
          </button>
          <button
            onClick={() => nav({ to: "/restaurant/kds" as never })}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#4e4540] hover:text-[#170f0a] rounded cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">soup_kitchen</span>
            <span>Kitchen (KDS)</span>
          </button>
          <button
            onClick={() => nav({ to: "/restaurant/billing" as never })}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#4e4540] hover:text-[#170f0a] rounded cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span>Billing Desk</span>
          </button>
        </div>
      </div>

      {/* Panel 2: Menu Grid Area */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between h-full">
        <div>
          {/* Header & Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#d1c4bd] mb-6">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#170f0a]">
              {selectedCategory}
            </h2>

            {/* Diet Filter Pills */}
            <div className="flex items-center border border-[#d1c4bd] rounded-[0.25rem] overflow-hidden bg-[#ffffff] text-xs font-label-caps">
              <button
                onClick={() => setDietFilter("all")}
                className={cn("px-3 py-1.5 transition-colors cursor-pointer", dietFilter === "all" ? "bg-[#170f0a] !text-[#ffffff]" : "text-[#4e4540]")}
              >
                All
              </button>
              <button
                onClick={() => setDietFilter("veg")}
                className={cn("px-3 py-1.5 transition-colors border-x border-[#d1c4bd] cursor-pointer flex items-center gap-1", dietFilter === "veg" ? "bg-[#170f0a] !text-[#ffffff]" : "text-[#4e4540]")}
              >
                <span className="w-2 h-2 rounded-full bg-[#285430]" /> Veg
              </button>
              <button
                onClick={() => setDietFilter("non-veg")}
                className={cn("px-3 py-1.5 transition-colors cursor-pointer flex items-center gap-1", dietFilter === "non-veg" ? "bg-[#170f0a] !text-[#ffffff]" : "text-[#4e4540]")}
              >
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a]" /> Non-Veg
              </button>
            </div>
          </div>

          {/* Dishes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
            {filteredMenu.map((dish) => (
              <div
                key={dish.id}
                className="border border-[#d1c4bd] bg-[#ffffff] rounded-[0.25rem] overflow-hidden flex flex-col justify-between hover:border-[#170f0a] transition-colors"
              >
                {/* Photo placeholder with editorial ratio */}
                <div className="h-32 bg-[#f0eee9] border-b border-[#d1c4bd] flex items-center justify-center relative p-3">
                  <span className={cn(
                    "absolute top-2 left-2 px-2 py-0.5 rounded-[0.125rem] text-[9px] font-label-caps border flex items-center gap-1 bg-[#ffffff]",
                    dish.veg ? "border-[#c0d6b0] text-[#285430]" : "border-[#ffb4ab] text-[#93000a]"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", dish.veg ? "bg-[#285430]" : "bg-[#ba1a1a]")} />
                    {dish.veg ? "Veg" : "Non-Veg"}
                  </span>
                  <span className="material-symbols-outlined text-[#7f756f] text-[36px] opacity-40">
                    restaurant
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#170f0a]">{dish.name}</h3>
                    <p className="text-xs text-[#7f756f] line-clamp-2 mt-1 font-sans">
                      {dish.description || "Freshly curated recipe with authentic fine-dining preparation."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#d1c4bd]/40">
                    <span className="font-data-tabular text-sm font-bold text-[#170f0a]">
                      {money(dish.price)}
                    </span>
                    <button
                      onClick={() => addItem(dish)}
                      className="w-8 h-8 rounded-full border border-[#d1c4bd] hover:border-[#170f0a] hover:bg-[#170f0a] hover:!text-[#ffffff] transition-colors flex items-center justify-center cursor-pointer text-[#170f0a]"
                      aria-label="Add item"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel 3: Current Order Panel (Fixed Height & Scrollable Items) */}
      <div className="w-80 sm:w-96 border-l border-[#d1c4bd] bg-[#ffffff] flex flex-col justify-between shrink-0 h-full overflow-hidden">
        {/* Top Fixed Header */}
        <div className="p-4 sm:p-5 border-b border-[#d1c4bd] bg-[#fbf9f4] shrink-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-serif text-lg font-semibold text-[#170f0a]">Current Order</h3>
            <span className="font-data-tabular text-xs text-[#7f756f]">#ORD-8294</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-[#f0eee9] border border-[#d1c4bd] rounded-[0.25rem] text-xs">
              <div className="flex items-center gap-2 text-[#170f0a] font-medium">
                <span className="material-symbols-outlined text-[16px] text-[#7f756f]">table_restaurant</span>
                <span>Table T04</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-[#7f756f] cursor-pointer">edit</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#ffffff] border border-[#d1c4bd] rounded-[0.25rem] text-xs">
              <div className="flex items-center gap-2 text-[#170f0a]">
                <span className="material-symbols-outlined text-[16px] text-[#7f756f]">person</span>
                <span>Guest: {guestName}</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-[#7f756f] cursor-pointer">search</span>
            </div>
          </div>
        </div>

        {/* Scrollable Middle Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-[#d1c4bd]/40 min-h-0">
          {items.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#7f756f] font-sans">
              Click + on dishes to add items to order
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#735c00]" />
                      <span className="font-medium text-xs text-[#170f0a]">{item.name}</span>
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <span className="inline-block mt-1 font-label-caps text-[9px] text-[#745c00] bg-[#fed65b]/30 px-1.5 py-0.2 rounded border border-[#fed65b]/60">
                        {item.modifiers.join(", ")}
                      </span>
                    )}
                  </div>
                  <span className="font-data-tabular text-xs font-bold text-[#170f0a]">
                    {money(item.price * item.qty)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-[#d1c4bd] rounded-[0.25rem] overflow-hidden text-xs">
                    <button onClick={() => updateQty(item.id, -1)} className="px-2 py-0.5 hover:bg-[#f0eee9] border-r border-[#d1c4bd] cursor-pointer">-</button>
                    <span className="px-2.5 font-bold font-data-tabular">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="px-2 py-0.5 hover:bg-[#f0eee9] border-l border-[#d1c4bd] cursor-pointer">+</button>
                  </div>
                  <button onClick={() => updateQty(item.id, -item.qty)} className="text-[#ba1a1a] text-[11px] hover:underline cursor-pointer">
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Firmly Docked Bill Summary & Actions */}
        <div className="p-4 sm:p-5 border-t border-[#d1c4bd] bg-[#fbf9f4] space-y-2.5 shrink-0">
          <div className="space-y-1 text-xs font-data-tabular">
            <div className="flex justify-between text-[#4e4540]">
              <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#4e4540]">
              <span>Tax (5%)</span>
              <span>{money(totals.tax)}</span>
            </div>
          </div>

          <div className="flex justify-between items-baseline pt-1.5 border-t border-[#d1c4bd]">
            <span className="font-serif text-base sm:text-lg font-bold text-[#170f0a]">Total</span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-[#170f0a]">{money(totals.total)}</span>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <button
              onClick={() => toast.info("Order placed on Hold")}
              className="p-2 border border-[#d1c4bd] bg-[#ffffff] rounded-[0.25rem] text-center hover:bg-[#f0eee9] text-[#170f0a] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] block mx-auto text-[#4e4540]">pause</span>
              <span className="font-label-caps text-[9px] block mt-0.5 font-bold text-[#170f0a]">HOLD</span>
            </button>
            <button
              onClick={() => toast.success("Order saved to draft")}
              className="p-2 border border-[#d1c4bd] bg-[#ffffff] rounded-[0.25rem] text-center hover:bg-[#f0eee9] text-[#170f0a] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] block mx-auto text-[#4e4540]">save</span>
              <span className="font-label-caps text-[9px] block mt-0.5 font-bold text-[#170f0a]">SAVE</span>
            </button>
            <button
              onClick={sendKOT}
              className="p-2 border border-[#e9c349] bg-[#fed65b] rounded-[0.25rem] text-center hover:bg-[#e9c349] text-[#745c00] transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px] block mx-auto text-[#745c00]">soup_kitchen</span>
              <span className="font-label-caps text-[9px] block mt-0.5 font-bold text-[#745c00]">KOT</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 border border-[#d1c4bd] bg-[#ffffff] rounded-[0.25rem] text-center hover:bg-[#f0eee9] text-[#170f0a] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] block mx-auto text-[#4e4540]">print</span>
              <span className="font-label-caps text-[9px] block mt-0.5 font-bold text-[#170f0a]">PRINT</span>
            </button>
          </div>

          {/* Primary Pay Button */}
          <button
            onClick={() => setPayOpen(true)}
            className="w-full bg-[#170f0a] !text-[#ffffff] py-3 rounded-[0.25rem] flex items-center justify-center gap-2 font-label-caps text-xs font-bold hover:bg-[#2d241e] transition-colors cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] !text-[#ffffff]">point_of_sale</span>
            PAY {money(totals.total)}
          </button>
        </div>
      </div>

      {/* Settle Bill Modal */}
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title={`Settlement • ${money(totals.total)}`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setPayOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={settle}>Confirm Payment</Btn>
          </>
        }
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="p-3.5 bg-[#f5f3ee] border border-[#d1c4bd] rounded-[0.25rem] space-y-1.5">
            <div className="flex justify-between"><span className="text-[#7f756f]">Table</span><span className="font-bold text-[#170f0a]">Table T04</span></div>
            <div className="flex justify-between"><span className="text-[#7f756f]">Guest</span><span className="font-bold text-[#170f0a]">{guestName}</span></div>
            <div className="flex justify-between border-t border-[#d1c4bd] pt-2 font-bold text-sm">
              <span className="text-[#170f0a]">Grand Total</span>
              <span className="text-[#170f0a] font-serif text-lg">{money(totals.total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-label-caps text-[10px] text-[#4e4540]">SELECT PAYMENT METHOD</span>
            <div className="grid grid-cols-2 gap-2">
              {["UPI", "Card", "Cash", "Charge to Room"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPayMode(m)}
                  className={cn(
                    "p-3 border rounded-[0.25rem] text-xs font-bold transition-colors cursor-pointer",
                    payMode === m ? "bg-[#170f0a] !text-[#ffffff] border-[#170f0a]" : "bg-[#ffffff] border-[#d1c4bd] text-[#170f0a] hover:bg-[#f0eee9]"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Success Modal for KOT / Settlement */}
      <SuccessModal
        open={!!successOrder}
        onClose={() => setSuccessOrder(null)}
        title={successOrder?.mode || "Order Processed"}
        subtitle={`Order #${successOrder?.number}`}
        details={[
          { label: "Order Number", value: successOrder?.number ?? "ORD" },
          ...(successOrder?.kot ? [{ label: "KOT Reference", value: `#${successOrder.kot}` }] : []),
          { label: "Table Location", value: "Table T04" },
          { label: "Total Value", value: money(successOrder?.total ?? totals.total) },
        ]}
        primaryAction={{
          label: "View Kitchen Display (KDS)",
          onClick: () => {
            setSuccessOrder(null);
            nav({ to: "/restaurant/kds" as never });
          },
        }}
        secondaryAction={{
          label: "Restaurant Billing Desk",
          onClick: () => {
            setSuccessOrder(null);
            nav({ to: "/restaurant/billing" as never });
          },
        }}
      />
    </div>
  );
}
