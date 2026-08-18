import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Moon, Play, CheckCircle2, AlertTriangle, ArrowRight, BedDouble, Utensils,
  Sparkles, FileText, ShieldCheck, Download, RefreshCw, Layers, DollarSign, Clock,
} from "lucide-react";
import { Badge, Btn, Card, KV, PageHeader, StatCard, exportCSV } from "@/components/kit";
import { dashboardMetrics, fmtDate, money, moneyShort, today, useDB, nightAudit } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports/audit")({
  head: () => ({ meta: [{ title: "Executive Night Audit — Hotel Amara ERP" }] }),
  component: NightAuditPage,
});

function NightAuditPage() {
  const db = useDB();
  const [currentStep, setCurrentStep] = useState(0); // 0: Ready, 1: Room Posting, 2: POS Check, 3: HK Rollover, 4: Done
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const m = dashboardMetrics(db);

  const inHouse = db.bookings.filter((b) => b.status === "checked-in");
  const dueArrivals = db.bookings.filter((b) => b.status === "confirmed" && b.checkIn === today());
  const dueDepartures = db.bookings.filter((b) => b.status === "checked-in" && b.checkOut === today());
  const openOrders = db.orders.filter((o) => o.status === "open" || o.status === "kot");

  async function executeNightAudit() {
    setRunning(true);
    const log: string[] = [];
    const d = today();

    // Step 1
    setCurrentStep(1);
    log.push(`[${new Date().toLocaleTimeString("en-IN")}] Step 1/4: In-House Room Posting started for ${inHouse.length} rooms`);
    inHouse.forEach((b) => {
      const g = db.guests.find((x) => x.id === b.guestId);
      const r = db.rooms.find((x) => x.id === b.roomIds[0]);
      log.push(`  → Room ${r?.number ?? "—"}: Tariff + GST posted for ${g?.name ?? b.id}`);
    });
    setAuditLog([...log]);

    // Step 2
    await new Promise((r) => setTimeout(r, 600));
    setCurrentStep(2);
    log.push(`[${new Date().toLocaleTimeString("en-IN")}] Step 2/4: Restaurant POS & Outlet reconciliation`);
    if (openOrders.length > 0) {
      log.push(`  ⚠ Warning: ${openOrders.length} unsettled POS orders found`);
    } else {
      log.push(`  ✓ All F&B outlets and POS registers balanced`);
    }
    setAuditLog([...log]);

    // Step 3
    await new Promise((r) => setTimeout(r, 600));
    setCurrentStep(3);
    log.push(`[${new Date().toLocaleTimeString("en-IN")}] Step 3/4: Housekeeping & Room Status Rollover`);
    log.push(`  ✓ Dispatched turn-down and departure cleaning tasks`);
    setAuditLog([...log]);

    // Step 4: Finalize
    await new Promise((r) => setTimeout(r, 600));
    nightAudit(d);
    setCurrentStep(4);
    log.push(`[${new Date().toLocaleTimeString("en-IN")}] Step 4/4: Financial Ledger lock & Daily Flash Generation`);
    log.push(`[${new Date().toLocaleTimeString("en-IN")}] 🎉 Night Audit for ${fmtDate(d)} completed successfully!`);
    setAuditLog([...log]);
    setRunning(false);
    toast.success("Executive Night Audit completed successfully!");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Executive Night Audit & Day-Close"
        subtitle={`System Operational Date: ${fmtDate(today())} · Hotel Ledger Close Wizard`}
        actions={
          currentStep === 4 ? (
            <div className="flex gap-2">
              <Btn
                variant="outline"
                size="sm"
                icon={Download}
                onClick={() => {
                  exportCSV(`night-audit-flash-${today()}.csv`, [
                    { Metric: "Date", Value: fmtDate(today()) },
                    { Metric: "Total Revenue", Value: m.totalRevenue },
                    { Metric: "Room Revenue", Value: m.roomRevenue },
                    { Metric: "F&B Revenue", Value: m.fbRevenue },
                    { Metric: "Occupancy %", Value: `${m.occupancy}%` },
                    { Metric: "ADR", Value: m.adr },
                    { Metric: "RevPAR", Value: m.revpar },
                  ]);
                }}
              >
                Download Flash Report
              </Btn>
              <Btn variant="primary" size="sm" onClick={() => { setCurrentStep(0); setAuditLog([]); }}>
                Run Again
              </Btn>
            </div>
          ) : (
            <Btn
              variant="primary"
              size="sm"
              icon={Play}
              disabled={running}
              onClick={executeNightAudit}
              className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 shadow-xs"
            >
              {running ? "Processing Audit…" : "Start Night Audit"}
            </Btn>
          )
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="In-House Guests" value={`${m.inHouse} Rooms`} tone="primary" />
        <StatCard label="Expected Arrivals" value={`${dueArrivals.length} Guests`} tone="info" />
        <StatCard label="Due Departures" value={`${dueDepartures.length} Rooms`} tone="warning" />
        <StatCard label="Available Inventory" value={`${m.available} Rooms`} tone="success" />
      </div>

      {/* 4-Step Visual Progress Stepper */}
      <div className="card-surface bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { step: 1, title: "Room Posting", desc: `${inHouse.length} in-house folios`, icon: BedDouble },
            { step: 2, title: "Outlet Settlement", desc: `${openOrders.length} open tickets`, icon: Utensils },
            { step: 3, title: "HK Rollover", desc: "Status turnover", icon: Sparkles },
            { step: 4, title: "Ledger Lock", desc: "Flash generation", icon: ShieldCheck },
          ].map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.step || currentStep === 4;
            const isActive = currentStep === s.step;
            return (
              <div
                key={s.step}
                className={cn(
                  "p-3 rounded-xl border transition-all flex items-start gap-3",
                  isCompleted ? "bg-emerald-50/70 border-emerald-200 text-emerald-950" :
                  isActive ? "bg-purple-50 border-purple-300 text-purple-950 shadow-2xs" :
                  "bg-slate-50/60 border-slate-200/70 text-slate-500",
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs",
                  isCompleted ? "bg-emerald-600 text-white" :
                  isActive ? "bg-purple-600 text-white animate-pulse" :
                  "bg-slate-200 text-slate-600",
                )}>
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-slate-900 leading-tight">{s.title}</span>
                  <span className="block text-[10.5px] font-medium text-slate-400 mt-0.5">{s.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Audit Console */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left 2 Cols: Terminal Console */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-surface bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">Audit Console Terminal</span>
              </div>
              <Badge tone={currentStep === 4 ? "success" : currentStep > 0 ? "primary" : "muted"}>
                {currentStep === 4 ? "Audit Completed" : currentStep > 0 ? "In Progress" : "Standby"}
              </Badge>
            </div>

            {auditLog.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Moon className="h-10 w-10 mx-auto text-purple-300" />
                <h4 className="text-sm font-bold text-slate-800">Ready to execute Night Audit</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click "Start Night Audit" to post room rates, reconcile F&B settlements, and lock the daily financial ledger.
                </p>
                <Btn variant="primary" size="sm" icon={Play} onClick={executeNightAudit}>
                  Start Night Audit Now
                </Btn>
              </div>
            ) : (
              <div className="bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl space-y-1.5 max-h-72 overflow-y-auto shadow-inner">
                {auditLog.map((line, i) => (
                  <div key={i} className={cn("leading-relaxed", line.includes("Warning") ? "text-amber-400" : line.includes("completed") ? "text-white font-bold" : "text-emerald-400")}>
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Daily Flash Snapshot */}
        <div className="space-y-4">
          <div className="card-surface bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">Day Flash Financials</span>
              <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                Live Numbers
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <KV label="Room Revenue" value={money(m.roomRevenue)} />
              <KV label="F&B & POS Revenue" value={money(m.fbRevenue)} />
              <KV label="Total Day Revenue" value={<span className="font-extrabold text-slate-900">{money(m.totalRevenue)}</span>} />
              <KV label="Pending Ledger Balance" value={<span className="font-bold text-rose-600">{money(m.pendingAmount)}</span>} />
              <KV label="Occupancy Rate" value={`${m.occupancy.toFixed(1)}%`} />
              <KV label="Average Daily Rate (ADR)" value={money(m.adr)} />
              <KV label="RevPAR" value={money(m.revpar)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

