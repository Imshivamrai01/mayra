import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Moon, Play, CheckCircle } from "lucide-react";
import { Badge, Btn, Card, KV, PageHeader, StatCard } from "@/components/kit";
import { dashboardMetrics, fmtDate, money, today, useDB, nightAudit } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/reports/audit")({
  head: () => ({ meta: [{ title: "Night Audit — MAYRA Hotel ERP" }] }),
  component: NightAuditPage,
});

function NightAuditPage() {
  const db = useDB();
  const [ran, setRan] = useState(false);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const m = dashboardMetrics(db);

  function runAudit() {
    const log: string[] = [];
    const d = today();
    log.push(`[${new Date().toLocaleTimeString("en-IN")}] Night Audit started for ${fmtDate(d)}`);

    const inHouse = db.bookings.filter((b) => b.status === "checked-in");
    log.push(`[INFO] ${inHouse.length} in-house guests found`);

    inHouse.forEach((b) => {
      const g = db.guests.find((x) => x.id === b.guestId);
      log.push(`[POST] Room charges posted for ${g?.name ?? b.id} — Room ${db.rooms.find((r) => r.id === b.roomIds[0])?.number ?? "—"}`);
    });

    const due = db.bookings.filter((b) => b.status === "confirmed" && b.checkIn === d);
    log.push(`[INFO] ${due.length} arrivals expected today`);

    const dueOut = db.bookings.filter((b) => b.status === "checked-in" && b.checkOut === d);
    log.push(`[INFO] ${dueOut.length} departures today`);

    nightAudit(d);
    log.push(`[INFO] Room charges posted for ${inHouse.length} rooms`);

    const noShow = db.bookings.filter((b) => b.status === "confirmed" && b.checkIn < d);
    if (noShow.length > 0) log.push(`[WARN] ${noShow.length} potential no-shows detected`);

    log.push(`[${new Date().toLocaleTimeString("en-IN")}] Night Audit completed successfully ✓`);
    setAuditLog(log);
    setRan(true);
    toast.success("Night audit completed");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Night Audit"
        subtitle={`System date: ${fmtDate(today())}`}
        actions={!ran && <Btn variant="primary" size="sm" icon={Play} onClick={runAudit}>Run Night Audit</Btn>}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="In-House" value={m.inHouse} tone="primary" />
        <StatCard label="Departures" value={m.departures} tone="warning" />
        <StatCard label="Arrivals" value={m.arrivals} tone="info" />
        <StatCard label="Available" value={m.available} tone="success" />
      </div>

      {!ran ? (
        <Card>
          <div className="py-10 text-center space-y-3">
            <Moon className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="font-semibold">Night Audit</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Night audit posts room charges for all in-house guests, reconciles payments,
              identifies no-shows, and prepares the next day's reports.
            </p>
            <Btn variant="primary" icon={Play} onClick={runAudit}>Run Night Audit</Btn>
          </div>
        </Card>
      ) : (
        <Card title="Audit Log" className="bg-card">
          <div className="space-y-1 font-mono text-xs">
            {auditLog.map((line, i) => (
              <div key={i} className={`flex gap-2 ${line.includes("[WARN]") ? "text-warning" : line.includes("[ERROR]") ? "text-danger" : line.includes("completed") ? "text-success font-semibold" : "text-foreground"}`}>
                <span>{line}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-success/10 border border-success/30 p-3">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-success font-medium">Night audit completed for {fmtDate(today())}</span>
          </div>
          <Btn className="mt-3 w-full" onClick={() => { setRan(false); setAuditLog([]); }}>Reset</Btn>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Daily Summary">
          <div className="space-y-1 text-sm">
            <KV label="Room Revenue" value={money(m.roomRevenue)} />
            <KV label="F&B Revenue" value={money(m.fbRevenue)} />
            <KV label="Total Revenue" value={<span className="font-semibold">{money(m.totalRevenue)}</span>} />
            <KV label="Pending Collections" value={<span className="text-danger">{money(m.pendingAmount)}</span>} />
            <KV label="Occupancy" value={`${m.occupancy}%`} />
            <KV label="ADR" value={money(m.adr)} />
            <KV label="RevPAR" value={money(m.revpar)} />
          </div>
        </Card>
        <Card title="In-House Guests">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {db.bookings.filter((b) => b.status === "checked-in").map((b) => {
              const g = db.guests.find((x) => x.id === b.guestId);
              const r = db.rooms.find((x) => x.id === b.roomIds[0]);
              return (
                <div key={b.id} className="flex justify-between text-sm border-b border-border/60 pb-1.5 last:border-0">
                  <span className="font-medium">{g?.name}</span>
                  <span className="text-muted-foreground">Room {r?.number} · CO: {fmtDate(b.checkOut)}</span>
                </div>
              );
            })}
            {db.bookings.filter((b) => b.status === "checked-in").length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No in-house guests</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
