import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Save, RefreshCw } from "lucide-react";
import { Badge, Btn, Card, Field, Input, KV, PageHeader, Select, Tabs } from "@/components/kit";
import { money, today, update, useDB } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/hotel")({
  head: () => ({ meta: [{ title: "Hotel Settings — Hotel Amara ERP" }] }),
  component: HotelSettingsPage,
});

function HotelSettingsPage() {
  const db = useDB();
  const [tab, setTab] = useState("general");
  const [form, setForm] = useState({ ...db.settings });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function save() {
    update((d) => { Object.assign(d.settings, form); });
    toast.success("Settings saved");
  }

  const TABS = [
    { value: "general", label: "General" },
    { value: "billing", label: "Billing & Tax" },
    { value: "notifications", label: "Notifications" },
    { value: "security", label: "Security" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Hotel Settings"
        subtitle="Configure your property"
        actions={<Btn variant="primary" size="sm" icon={Save} onClick={save}>Save Settings</Btn>}
      />

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "general" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Property Information">
            <div className="space-y-3">
              <Field label="Hotel Name"><Input value={form.hotelName} onChange={(e) => set("hotelName", e.target.value)} /></Field>
              <Field label="Property Code"><Input value={form.propertyCode ?? ""} onChange={(e) => set("propertyCode", e.target.value)} /></Field>
              <Field label="Address Line 1"><Input value={form.address1 ?? ""} onChange={(e) => set("address1", e.target.value)} /></Field>
              <Field label="Address Line 2"><Input value={form.address2 ?? ""} onChange={(e) => set("address2", e.target.value)} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="City"><Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} /></Field>
                <Field label="State"><Input value={form.state ?? ""} onChange={(e) => set("state", e.target.value)} /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="PIN Code"><Input value={form.pincode ?? ""} onChange={(e) => set("pincode", e.target.value)} /></Field>
                <Field label="Country"><Input value={form.country ?? "India"} onChange={(e) => set("country", e.target.value)} /></Field>
              </div>
            </div>
          </Card>
          <Card title="Contact Details">
            <div className="space-y-3">
              <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="Email"><Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field label="Website"><Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} /></Field>
              <Field label="Check-in Time"><Input type="time" value={form.checkInTime ?? "14:00"} onChange={(e) => set("checkInTime", e.target.value)} /></Field>
              <Field label="Check-out Time"><Input type="time" value={form.checkOutTime ?? "11:00"} onChange={(e) => set("checkOutTime", e.target.value)} /></Field>
              <Field label="Currency"><Select value={form.currency ?? "INR"} onChange={(e) => set("currency", e.target.value)} options={["INR", "USD", "EUR", "GBP"].map((c) => ({ value: c, label: c }))} /></Field>
            </div>
          </Card>
        </div>
      )}

      {tab === "billing" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Tax Configuration">
            <div className="space-y-3">
              <Field label="GSTIN"><Input value={form.gstin ?? ""} onChange={(e) => set("gstin", e.target.value)} placeholder="e.g. 29AABCT1332L1ZT" /></Field>
              <Field label="Room Tax Rate (%)"><Input type="number" min="0" max="100" value={String(form.taxRate ?? 12)} onChange={(e) => set("taxRate", e.target.value)} /></Field>
              <Field label="F&B Tax Rate (%)"><Input type="number" min="0" max="100" value={String(form.fbTaxRate ?? 5)} onChange={(e) => set("fbTaxRate", e.target.value)} /></Field>
              <Field label="Luxury Tax Rate (%)"><Input type="number" min="0" max="100" value={String(form.luxuryTaxRate ?? 0)} onChange={(e) => set("luxuryTaxRate", e.target.value)} /></Field>
            </div>
          </Card>
          <Card title="Invoice Settings">
            <div className="space-y-3">
              <Field label="Invoice Prefix"><Input value={form.invoicePrefix ?? "INV"} onChange={(e) => set("invoicePrefix", e.target.value)} /></Field>
              <Field label="Payment Terms"><Select value={form.paymentTerms ?? "Due on check-out"} onChange={(e) => set("paymentTerms", e.target.value)} options={["Due on check-out", "Due on check-in", "Advance required", "Net 7", "Net 15"].map((s) => ({ value: s, label: s }))} /></Field>
              <div className="rounded-lg bg-secondary/40 p-3 text-sm space-y-1">
                <KV label="GST Slab (< ₹7500)" value="12% GST" />
                <KV label="GST Slab (₹7500–₹12500)" value="18% GST" />
                <KV label="GST Slab (> ₹12500)" value="28% GST" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "notifications" && (
        <Card title="Notification Channels">
          <div className="space-y-4">
            {[
              { key: "smsEnabled", label: "SMS Alerts", desc: "Send SMS for booking confirmation, check-in/out" },
              { key: "emailEnabled", label: "Email Alerts", desc: "Send email for invoices and confirmation" },
              { key: "whatsappEnabled", label: "WhatsApp Messages", desc: "Send WhatsApp for booking updates" },
            ].map((n) => (
              <div key={n.key} className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
                <div>
                  <div className="font-medium text-sm">{n.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.desc}</div>
                </div>
                <button
                  onClick={() => set(n.key, String(!(form as Record<string, unknown>)[n.key]))}
                  className={`relative h-6 w-11 rounded-full transition-colors ${(form as Record<string, unknown>)[n.key] ? "bg-primary" : "bg-border"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${(form as Record<string, unknown>)[n.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
            <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 text-sm text-warning">
              ⚠️ All notification channels are simulated. No real SMS/email/WhatsApp is sent.
            </div>
          </div>
        </Card>
      )}

      {tab === "security" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Access Control">
            <div className="space-y-3">
              <Field label="Admin Username"><Input value={form.user ?? "admin"} onChange={(e) => set("user", e.target.value)} /></Field>
              <Field label="Session Timeout">
                <Select value={form.sessionTimeout ?? "30"} onChange={(e) => set("sessionTimeout", e.target.value)} options={["15", "30", "60", "120"].map((v) => ({ value: v, label: `${v} minutes` }))} />
              </Field>
            </div>
          </Card>
          <Card title="Data Management">
            <div className="space-y-3">
              <div className="rounded-lg bg-secondary/40 p-3 text-sm">
                <p className="font-medium mb-1">Local Storage</p>
                <p className="text-muted-foreground">All data is persisted in browser localStorage. Export regularly to prevent data loss.</p>
              </div>
              <Btn className="w-full" onClick={() => { const d = JSON.stringify(db, null, 2); const blob = new Blob([d], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `hotel-amara-backup-${today()}.json`; a.click(); toast.success("Backup downloaded"); }}>
                Export Data Backup
              </Btn>
              <Btn className="w-full" variant="danger" onClick={() => { if (window.confirm("Reset all demo data? This cannot be undone.")) { localStorage.clear(); window.location.reload(); } }}>
                Reset to Demo Data
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
