import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Badge, Btn, Modal, SuccessModal } from "@/components/kit";
import { fmtDate, money, orderTotals, posService, today, useDB } from "@/lib/store";
import type { POSOrder } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/restaurant/billing")({
  head: () => ({ meta: [{ title: "Aurelia HMS — Restaurant Billing" }] }),
  component: RestaurantBillingPage,
});

export function RestaurantBillingPage() {
  const db = useDB();
  const nav = useNavigate();
  const [selectedPayMode, setSelectedPayMode] = useState<"Cash" | "Card" | "UPI" | "Charge Room">("Charge Room");
  const [successReceipt, setSuccessReceipt] = useState<{ number: string; total: number; mode: string } | null>(null);

  const billItems = [
    { name: "Truffle Risotto", qty: 2, rate: 1200, tax: "5%", amount: 2400 },
    { name: "Pan-Seared Scallops", qty: 1, rate: 1850, tax: "5%", amount: 1850 },
    { name: "Sparkling Water (Large)", qty: 1, rate: 350, tax: "18%", amount: 350 },
    { name: "Artisan Sourdough", qty: 1, rate: 250, tax: "5%", amount: 250 },
  ];

  const subtotal = 4850;
  const discount = 485;
  const serviceCharge = 218.25;
  const cgst = 114.58;
  const sgst = 114.58;
  const grandTotal = 4812.41;

  function completePayment() {
    toast.success(`Payment of ₹4,812.41 completed via ${selectedPayMode}`);
    setSuccessReceipt({
      number: "ORD-8294",
      total: grandTotal,
      mode: selectedPayMode,
    });
  }

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#d1c4bd]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#170f0a] tracking-tight">
            Restaurant Billing
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#4e4540] mt-1">
            Folio &amp; Settlement
          </p>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div>
            <span className="font-label-caps text-[10px] text-[#7f756f] block">TABLE</span>
            <span className="font-serif text-xl font-bold text-[#170f0a]">T04</span>
          </div>
          <div>
            <span className="font-label-caps text-[10px] text-[#7f756f] block">ROOM</span>
            <span className="font-serif text-xl font-bold text-[#170f0a]">204</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Bill Items (8 cols) & Summary Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Guest Name Card */}
          <div className="p-5 border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#e4e2dd] flex items-center justify-center text-[#7f756f]">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <div>
                <span className="font-label-caps text-[9px] text-[#7f756f] block">GUEST NAME</span>
                <span className="font-serif text-base font-bold text-[#170f0a]">Rahul Mehta</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-label-caps text-[9px] text-[#7f756f] block">SERVER</span>
              <span className="text-xs font-semibold text-[#170f0a]">Elena R.</span>
            </div>
          </div>

          {/* Bill Items Table */}
          <div className="border border-[#d1c4bd] bg-[#ffffff] rounded-[0.25rem] overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#d1c4bd] bg-[#f5f3ee]">
                  <th className="p-4 font-label-caps text-[10px] text-[#4e4540]">Item</th>
                  <th className="p-4 font-label-caps text-[10px] text-[#4e4540] text-center">Qty</th>
                  <th className="p-4 font-label-caps text-[10px] text-[#4e4540] text-right">Rate</th>
                  <th className="p-4 font-label-caps text-[10px] text-[#4e4540] text-center">Tax</th>
                  <th className="p-4 font-label-caps text-[10px] text-[#4e4540] text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="font-data-tabular divide-y divide-[#d1c4bd]/40 text-[#170f0a]">
                {billItems.map((item, i) => (
                  <tr key={i} className="hover:bg-[#fbf9f4] transition-colors">
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4 text-center">{item.qty}</td>
                    <td className="p-4 text-right">₹{item.rate.toLocaleString("en-IN")}</td>
                    <td className="p-4 text-center text-[#7f756f]">{item.tax}</td>
                    <td className="p-4 text-right font-bold">₹{item.amount.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Columns: Summary & Payment */}
        <div className="lg:col-span-4 space-y-6">
          {/* Summary Box */}
          <div className="p-6 border border-[#d1c4bd] bg-[#fbf9f4] rounded-[0.25rem] space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#170f0a]">Summary</h3>

            <div className="space-y-2 text-xs font-data-tabular">
              <div className="flex justify-between text-[#4e4540]">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[#735c00]">
                <span>Discount (10% Member)</span>
                <span>-₹{discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[#4e4540]">
                <span>Service Charge (5%)</span>
                <span>₹{serviceCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#7f756f]">
                <span>CGST (2.5%)</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#7f756f]">
                <span>SGST (2.5%)</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-4 border-t border-[#d1c4bd]">
              <span className="font-label-caps text-xs text-[#170f0a] font-bold">GRAND TOTAL</span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#170f0a]">
                ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Payment Method 4-Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "Cash", icon: "payments", label: "Cash" },
              { id: "Card", icon: "credit_card", label: "Card" },
              { id: "UPI", icon: "qr_code_2", label: "UPI" },
              { id: "Charge Room", icon: "hotel", label: "Charge Room" },
            ].map((pm) => (
              <button
                key={pm.id}
                onClick={() => setSelectedPayMode(pm.id as any)}
                className={cn(
                  "p-4 border rounded-[0.25rem] text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-1.5 h-24",
                  selectedPayMode === pm.id
                    ? "bg-[#fed65b]/20 border-[#fed65b] text-[#745c00]"
                    : "bg-[#ffffff] border-[#d1c4bd] text-[#170f0a] hover:bg-[#f5f3ee]"
                )}
              >
                <span className="material-symbols-outlined text-[24px]">{pm.icon}</span>
                <span className="font-label-caps text-[10px]">{pm.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#d1c4bd]">
        <div className="flex flex-wrap gap-3">
          <Btn variant="outline" onClick={() => window.print()}>
            <span className="material-symbols-outlined text-[16px] mr-1.5">print</span>
            Print Bill
          </Btn>
          <Btn variant="outline" onClick={() => toast.success("Bill emailed to guest")}>
            <span className="material-symbols-outlined text-[16px] mr-1.5">mail</span>
            Email
          </Btn>
          <Btn variant="outline" onClick={() => toast.info("Split bill mode enabled")}>
            <span className="material-symbols-outlined text-[16px] mr-1.5">call_split</span>
            Split Bill
          </Btn>
        </div>

        <button
          onClick={completePayment}
          className="bg-[#170f0a] text-[#ffffff] px-6 py-3 rounded-[0.25rem] flex items-center gap-2 font-label-caps text-xs hover:bg-[#2d241e] transition-colors cursor-pointer"
        >
          Complete Payment
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>

      <SuccessModal
        open={!!successReceipt}
        onClose={() => setSuccessReceipt(null)}
        title="Payment Settled"
        subtitle={`Order #${successReceipt?.number}`}
        details={[
          { label: "Guest", value: "Rahul Mehta" },
          { label: "Table", value: "Table T04" },
          { label: "Payment Mode", value: successReceipt?.mode ?? "Charge Room" },
          { label: "Grand Total", value: money(successReceipt?.total ?? grandTotal) },
        ]}
      />
    </div>
  );
}
