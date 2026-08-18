import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Globe, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { Badge, Btn, Card, KV, PageHeader, StatCard } from "@/components/kit";
import { bookingService, fmtDate, money, today, uid, update, useDB } from "@/lib/store";
import type { OTAChannel, OTAListing } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/channel-manager")({
  head: () => ({ meta: [{ title: "Channel Manager — Hotel Amara ERP" }] }),
  component: ChannelManagerPage,
});

const CHANNELS: { name: OTAChannel; logo: string; color: string }[] = [
  { name: "MakeMyTrip", logo: "MMT", color: "bg-red-100 text-red-700 border-red-200" },
  { name: "Goibibo", logo: "GIB", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { name: "Booking.com", logo: "BDC", color: "bg-sky-100 text-sky-700 border-sky-200" },
  { name: "Expedia", logo: "EXP", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { name: "Agoda", logo: "AGA", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { name: "Airbnb", logo: "AIR", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { name: "Yatra", logo: "YAT", color: "bg-green-100 text-green-700 border-green-200" },
];

function ChannelManagerPage() {
  const db = useDB();
  const [syncing, setSyncing] = useState(false);

  const otaRevenue = db.bookings.filter((b) => b.simulated && b.status !== "cancelled").reduce((s, b) => {
    return s + b.charges.reduce((cs, c) => cs + c.amount, 0);
  }, 0);
  const otaBookings = db.bookings.filter((b) => b.simulated);

  const channelStats = CHANNELS.map((ch) => {
    const listings = db.otaListings.filter((l) => l.channel === ch.name);
    const enabled = listings.some((l) => l.enabled);
    const bookings = db.bookings.filter((b) => b.source === ch.name);
    const revenue = bookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.charges.reduce((cs, c) => cs + c.amount, 0), 0);
    return { ...ch, enabled, listings, bookings: bookings.length, revenue };
  });

  function toggleChannel(name: OTAChannel) {
    update((d) => {
      const existing = d.otaListings.filter((l) => l.channel === name);
      if (existing.length === 0) {
        d.roomTypes.forEach((rt) => {
          d.otaListings.push({ id: uid("ota"), channel: name, roomTypeId: rt.id, enabled: true, markup: 10, minStay: 1, availability: rt.available });
        });
        toast.success(`${name} connected — listings created`);
      } else {
        const allEnabled = existing.every((l) => l.enabled);
        existing.forEach((l) => { const found = d.otaListings.find((x) => x.id === l.id); if (found) found.enabled = !allEnabled; });
        toast.success(`${name} ${allEnabled ? "disabled" : "enabled"}`);
      }
    });
  }

  function simulateSync() {
    setSyncing(true);
    setTimeout(() => {
      // Simulate OTA bookings coming in
      const activeChannels = channelStats.filter((c) => c.enabled);
      if (activeChannels.length > 0) {
        const ch = activeChannels[Math.floor(Math.random() * activeChannels.length)]!;
        const guest = db.guests[Math.floor(Math.random() * db.guests.length)];
        if (guest) {
          const rt = db.roomTypes[Math.floor(Math.random() * db.roomTypes.length)];
          if (rt) {
            bookingService.create({
              guestId: guest.id, source: ch.name as OTAChannel,
              roomTypeId: rt.id, roomIds: [],
              ratePlanId: "rp-cp",
              checkIn: today(), checkOut: (() => { const d = new Date(); d.setDate(d.getDate() + 2 + Math.floor(Math.random() * 5)); return d.toISOString().slice(0, 10); })(),
              adults: 2, children: 0, extraBed: 0,
              rateNight: rt.baseRate * 1.1,
              discount: 0, arrivalFrom: "OTA Sync", purpose: "Leisure",
            });
            toast.success(`New booking synced from ${ch.name}`);
          }
        }
      }
      setSyncing(false);
    }, 2000);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Channel Manager"
        subtitle="OTA integration and inventory distribution"
        actions={
          <Btn size="sm" icon={RefreshCw} onClick={simulateSync} disabled={syncing} className={syncing ? "animate-spin" : ""}>
            {syncing ? "Syncing…" : "Simulate OTA Sync"}
          </Btn>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="OTA Bookings" value={otaBookings.length} tone="primary" />
        <StatCard label="OTA Revenue" value={money(otaRevenue)} tone="success" />
        <StatCard label="Active Channels" value={channelStats.filter((c) => c.enabled).length} tone="info" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {channelStats.map((ch) => (
          <div key={ch.name} className="card-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-bold ${ch.color}`}>
                  {ch.logo}
                </div>
                <div>
                  <div className="font-semibold">{ch.name}</div>
                  <div className="text-xs text-muted-foreground">{ch.listings.length} room types listed</div>
                </div>
              </div>
              <button onClick={() => toggleChannel(ch.name as OTAChannel)} className={`${ch.enabled ? "text-success" : "text-muted-foreground"} hover:opacity-75`}>
                {ch.enabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-md bg-secondary/40 px-2.5 py-1.5 text-center">
                <div className="text-sm font-semibold">{ch.bookings}</div>
                <div className="text-[11px] text-muted-foreground">Bookings</div>
              </div>
              <div className="rounded-md bg-secondary/40 px-2.5 py-1.5 text-center">
                <div className="text-sm font-semibold">{money(ch.revenue)}</div>
                <div className="text-[11px] text-muted-foreground">Revenue</div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <Badge tone={ch.enabled ? "success" : "muted"}>{ch.enabled ? "Connected" : "Disconnected"}</Badge>
              <span className="text-muted-foreground">+10% markup</span>
            </div>
          </div>
        ))}
      </div>

      <Card title="Rate Parity">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{ minWidth: 600 }}>
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-semibold">Room Type</th>
                <th className="px-3 py-2 text-right font-semibold">Direct Rate</th>
                {CHANNELS.slice(0, 5).map((c) => (
                  <th key={c.name} className="px-3 py-2 text-right font-semibold">{c.logo}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {db.roomTypes.map((rt) => (
                <tr key={rt.id} className="border-b border-border/60">
                  <td className="px-3 py-2 font-medium">{rt.name}</td>
                  <td className="px-3 py-2 text-right">₹{rt.baseRate.toLocaleString("en-IN")}</td>
                  {CHANNELS.slice(0, 5).map((c) => (
                    <td key={c.name} className="px-3 py-2 text-right">₹{Math.round(rt.baseRate * 1.1).toLocaleString("en-IN")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
