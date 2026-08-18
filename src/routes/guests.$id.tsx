import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Building, Calendar, CheckCircle, CreditCard, Edit3, Mail,
  Phone, Plus, ShieldCheck, Star, Trash2, User, UserCheck, BedDouble, AlertTriangle
} from "lucide-react";
import {
  Badge, Btn, Card, Field, Input, PageHeader, StatCard, Table
} from "@/components/kit";
import {
  fmtDate, guestService, money, roomLabel, useDB, folioTotals, BOOKING_STATUS_META
} from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/guests/$id")({
  head: () => ({ meta: [{ title: "Guest Profile — Hotel Amara ERP" }] }),
  component: GuestDetailPage,
});

function GuestDetailPage() {
  const { id } = Route.useParams();
  const db = useDB();
  const nav = useNavigate();

  const guest = db.guests.find((g) => g.id === id);

  if (!guest) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
        <AlertTriangle className="h-12 w-12 text-warning" />
        <h2 className="text-xl font-bold">Guest Profile Not Found</h2>
        <p className="text-sm text-muted-foreground">The guest with ID "{id}" could not be located.</p>
        <Btn variant="primary" onClick={() => nav({ to: "/guests" })}>Back to Guest Directory</Btn>
      </div>
    );
  }

  const stays = db.bookings.filter((b) => b.guestId === guest.id);
  const totalSpent = stays.reduce((sum, b) => sum + folioTotals(b, db).paid, 0);
  const totalNights = stays.reduce((sum, b) => sum + b.nights, 0);

  function handleToggleVip() {
    guestService.patch(guest.id, { vip: !guest.vip });
    toast.success(guest.vip ? "Removed VIP tag" : "Marked guest as VIP");
  }

  function handleNewBooking() {
    nav({ to: "/reservations/new" });
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Btn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => nav({ to: "/guests" })}>
            Back to Guest Directory
          </Btn>
          <span className="text-muted-foreground">|</span>
          <span className="font-mono text-sm font-semibold">{guest.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <Btn
            variant={guest.vip ? "outline" : "primary"}
            size="sm"
            icon={Star}
            onClick={handleToggleVip}
          >
            {guest.vip ? "Remove VIP Tag" : "Mark as VIP"}
          </Btn>
          <Btn variant="primary" size="sm" icon={BedDouble} className="shimmer-gold" onClick={handleNewBooking}>
            Book Room For Guest
          </Btn>
        </div>
      </div>

      {/* Header */}
      <PageHeader
        title={guest.name}
        subtitle={`${guest.city ? `${guest.city}, ` : ""}${guest.country || "India"} · Member since ${fmtDate(guest.createdAt || stays[0]?.createdAt || "2025-01-01")}`}
        actions={
          <div className="flex items-center gap-2">
            {guest.vip && <Badge tone="warning" className="text-xs px-3 py-1 font-bold">VIP GUEST</Badge>}
            <Badge tone="primary" className="text-xs px-3 py-1 font-semibold">{stays.length} Total Stay(s)</Badge>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Lifetime Spend" value={money(totalSpent)} sub="Across all stays & services" tone="primary" />
        <StatCard label="Total Completed Stays" value={stays.length} sub={`${totalNights} total room nights`} tone="success" />
        <StatCard label="KYC Document Status" value={guest.idType || "Pending"} sub={guest.idNumber ? `Verified (${guest.idNumber})` : "Unverified"} tone={guest.idNumber ? "info" : "warning"} />
        <StatCard label="Corporate Account" value={guest.company || "Individual"} sub={guest.gstin ? `GSTIN: ${guest.gstin}` : "Retail Guest"} tone="muted" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left Column: Personal & Contact Information */}
        <div className="space-y-4 lg:col-span-1">
          <Card title="Guest Information">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {guest.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-base">{guest.name}</div>
                  <div className="text-xs text-muted-foreground">{guest.phone || "No phone"}</div>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone</span>
                  <span className="font-medium">{guest.phone || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</span>
                  <span className="font-medium">{guest.email || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> KYC Type</span>
                  <span className="font-medium">{guest.idType || "—"}</span>
                </div>
                {guest.idNumber && (
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">KYC ID Number</span>
                    <span className="font-mono font-semibold">{guest.idNumber}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> Company</span>
                  <span>{guest.company || "Individual"}</span>
                </div>
                {guest.gstin && (
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">GSTIN</span>
                    <span className="font-mono font-semibold">{guest.gstin}</span>
                  </div>
                )}
              </div>

              {guest.notes && (
                <div className="pt-2 border-t border-border text-xs">
                  <span className="text-muted-foreground block mb-1 font-semibold">Guest Preferences / Notes:</span>
                  <p className="rounded bg-secondary/70 p-2.5 italic">{guest.notes}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Complete Stay History */}
        <div className="space-y-4 lg:col-span-2">
          <Card
            title="Complete Stay History"
            action={<Btn size="sm" icon={Plus} onClick={handleNewBooking}>New Booking</Btn>}
          >
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                    <th className="py-2 px-3">Booking ID</th>
                    <th className="py-2 px-3">Room</th>
                    <th className="py-2 px-3">Check-In</th>
                    <th className="py-2 px-3">Check-Out</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {stays.map((b) => {
                    const st = BOOKING_STATUS_META[b.status];
                    const tot = folioTotals(b, db);
                    return (
                      <tr key={b.id} className="hover:bg-secondary/40">
                        <td className="py-2.5 px-3 font-mono font-semibold text-primary">{b.id}</td>
                        <td className="py-2.5 px-3 font-medium">{roomLabel(b.roomIds, db)}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{fmtDate(b.checkIn)}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{fmtDate(b.checkOut)}</td>
                        <td className="py-2.5 px-3">
                          <Badge tone={st.tone as never}>{st.label}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">{money(tot.total)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <Btn
                            size="sm"
                            variant="ghost"
                            onClick={() => nav({ to: `/reservations/${b.id}` as never })}
                          >
                            View Folio →
                          </Btn>
                        </td>
                      </tr>
                    );
                  })}
                  {stays.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        No previous stays found for this guest.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
