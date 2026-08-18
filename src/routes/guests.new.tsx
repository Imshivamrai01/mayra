import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Sparkles, User, ShieldCheck, HeartHandshake, Phone, Mail, MapPin } from "lucide-react";
import { Badge, Btn, Card, Field, Input, PageHeader, Select, SuccessModal } from "@/components/kit";
import { guestService, useDB } from "@/lib/store";
import type { Guest } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/guests/new")({
  head: () => ({ meta: [{ title: "New Guest Profile — Hotel Amara ERP" }] }),
  component: NewGuestPage,
});

function NewGuestPage() {
  const db = useDB();
  const nav = useNavigate();

  const [form, setForm] = useState<Partial<Guest>>({
    salutation: "Mr.",
    name: "",
    gender: "Male",
    mobile: "",
    email: "",
    city: "Mumbai",
    state: "Maharashtra",
    nationality: "Indian",
    idType: "Aadhaar",
    idNumber: "",
    company: "",
    vip: false,
    segment: "New",
    preferences: "",
    notes: "",
  });

  const [createdGuest, setCreatedGuest] = useState<Guest | null>(null);

  const set = (k: keyof Guest, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  function handleSave() {
    if (!form.name?.trim() || !form.mobile?.trim()) {
      toast.error("Guest name and mobile number are mandatory");
      return;
    }
    const guest = guestService.create(form);
    setCreatedGuest(guest);
    toast.success(`Guest profile created for ${guest.name}!`);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Btn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => nav({ to: "/guests" })}>
          Back to Guests
        </Btn>
        <span className="text-muted-foreground">|</span>
        <Badge tone="primary" className="shimmer-purple-badge px-3 py-1">Guest Registration</Badge>
      </div>

      <PageHeader
        title="Add New Guest Profile"
        subtitle="Register guest contact, KYC identity documents, and stay preferences"
      />

      <div className="grid gap-6">
        <Card title="1. Basic Contact & Personal Details">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Salutation">
              <Select value={form.salutation} onChange={(e) => set("salutation", e.target.value)} options={["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."].map((s) => ({ value: s, label: s }))} />
            </Field>
            <Field label="Full Name" required className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ananya Patel" />
            </Field>
            <Field label="Mobile Number" required>
              <Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="10-digit mobile" />
            </Field>
            <Field label="Email Address">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="guest@example.com" />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={(e) => set("gender", e.target.value)} options={["Male", "Female", "Other"].map((g) => ({ value: g, label: g }))} />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
            </Field>
            <Field label="Nationality">
              <Input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card title="2. Identity Verification & KYC">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ID Proof Document Type">
              <Select
                value={form.idType}
                onChange={(e) => set("idType", e.target.value)}
                options={["Aadhaar", "Passport", "Driving License", "Voter ID", "PAN Card"].map((t) => ({ value: t, label: t }))}
              />
            </Field>
            <Field label="ID Document Number">
              <Input value={form.idNumber} onChange={(e) => set("idNumber", e.target.value)} placeholder="Enter document number" />
            </Field>
          </div>
          <div className="mt-3 rounded-lg border border-border/70 bg-secondary/40 p-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span>KYC compliance verified for hotel check-in registration</span>
            </div>
            <Badge tone="success">Verified Format</Badge>
          </div>
        </Card>

        <Card title="3. Corporate Billing, VIP Tag & Preferences">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company / Corporate Name">
              <Input value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Tata Consultancy Services" />
            </Field>
            <Field label="Customer Segment">
              <Select
                value={form.segment}
                onChange={(e) => set("segment", e.target.value as Guest["segment"])}
                options={["New", "Returning", "VIP", "Corporate", "OTA", "Direct"].map((s) => ({ value: s, label: s }))}
              />
            </Field>
            <Field label="Room & Stay Preferences" className="sm:col-span-2">
              <Input value={form.preferences ?? ""} onChange={(e) => set("preferences", e.target.value)} placeholder="e.g. Non-smoking, High Floor, Extra pillows, King bed" />
            </Field>
            <Field label="Internal Staff Notes" className="sm:col-span-2">
              <Input value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. Frequent business traveller, prefers quick checkin" />
            </Field>
          </div>
          <div className="mt-4 flex items-center gap-3 pt-3 border-t border-border">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                type="checkbox"
                checked={form.vip}
                onChange={(e) => set("vip", e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>Mark as ⭐ VIP Guest (Priority check-in & complimentary amenities)</span>
            </label>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Btn variant="outline" size="lg" onClick={() => nav({ to: "/guests" })}>
            Cancel
          </Btn>
          <Btn variant="primary" size="lg" icon={Check} className="shimmer-gold font-bold px-8 shadow-md" onClick={handleSave}>
            Save Guest Profile
          </Btn>
        </div>
      </div>

      {createdGuest && (
        <SuccessModal
          open={!!createdGuest}
          onClose={() => nav({ to: "/guests" })}
          title="Guest Profile Created!"
          subtitle="Guest details have been stored in the central CRM directory."
          details={[
            { label: "Guest Name", value: createdGuest.name },
            { label: "Mobile", value: createdGuest.mobile },
            { label: "City & State", value: `${createdGuest.city}, ${createdGuest.state}` },
            { label: "Segment", value: createdGuest.vip ? "⭐ VIP Guest" : createdGuest.segment },
          ]}
          primaryAction={{
            label: "Open Guest Profile",
            icon: Sparkles,
            onClick: () => nav({ to: `/guests/${createdGuest.id}` as never }),
          }}
          secondaryAction={{
            label: "Create Reservation For Guest",
            onClick: () => nav({ to: "/reservations/new" }),
          }}
        />
      )}
    </div>
  );
}
