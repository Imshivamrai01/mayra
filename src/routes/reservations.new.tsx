import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ArrowLeft, Search, Plus, UserCheck, Calendar, DollarSign, Building2, Sparkles, AlertCircle, FileText, ChevronDown, CheckCircle2 } from "lucide-react";
import { Badge, Btn, Card, Field, Input, KV, PageHeader, Select, SuccessModal } from "@/components/kit";
import { bookingService, fmtDate, guestService, money, today, useDB } from "@/lib/store";
import type { BookingSource, Guest, RoomType } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reservations/new")({
  head: () => ({ meta: [{ title: "Aurelia HMS — New Reservation" }] }),
  component: NewReservationPage,
});

const SOURCES: BookingSource[] = ["Direct Walk-in", "Phone", "Website Engine", "MakeMyTrip", "Booking.com", "Agoda", "Expedia", "Corporate"];

export function NewReservationPage() {
  const db = useDB();
  const nav = useNavigate();

  // Mode: Existing or New Guest
  const [guestMode, setGuestMode] = useState<"existing" | "new">("existing");
  const [selectedGuestId, setSelectedGuestId] = useState<string>(db.guests[0]?.id ?? "");
  const [guestSearchQuery, setGuestSearchQuery] = useState("");
  const [guestDropdownOpen, setGuestDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New Guest Form State
  const [newGuest, setNewGuest] = useState({
    salutation: "Mr.",
    name: "",
    gender: "Male",
    mobile: "",
    email: "",
    city: "",
    state: "",
    nationality: "Indian",
    idType: "Aadhaar",
    idNumber: "",
    company: "",
    vip: "no",
  });

  // Reservation Form State
  const [source, setSource] = useState<BookingSource>("Direct Walk-in");
  const [roomTypeId, setRoomTypeId] = useState<string>(db.roomTypes[0]?.id ?? "");
  const [assignedRoomId, setAssignedRoomId] = useState<string>("");
  const [ratePlanId, setRatePlanId] = useState<string>(db.ratePlans[0]?.id ?? "");
  const [billingType, setBillingType] = useState<"GST" | "NON-GST">("GST");
  const [companyGstin, setCompanyGstin] = useState("");

  const [checkIn, setCheckIn] = useState(today());
  const [checkInTime, setCheckInTime] = useState("12:00 PM");
  const [checkOut, setCheckOut] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [checkOutTime, setCheckOutTime] = useState("11:00 AM");

  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [extraBed, setExtraBed] = useState("0");
  const [customRate, setCustomRate] = useState<string>("");
  const [discount, setDiscount] = useState<string>("0");
  const [purpose, setPurpose] = useState("Leisure");
  const [remarks, setRemarks] = useState("");

  // Modal State after Success
  const [successBooking, setSuccessBooking] = useState<{
    id: string;
    grc: string;
    billingType: string;
    guestName: string;
    roomName: string;
    total: number;
  } | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setGuestDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered Guests for live search
  const filteredGuests = useMemo(() => {
    if (!guestSearchQuery.trim()) return db.guests.slice(0, 30);
    const q = guestSearchQuery.toLowerCase();
    return db.guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.mobile.includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.city.toLowerCase().includes(q)
    );
  }, [db.guests, guestSearchQuery]);

  const currentSelectedGuest = db.guests.find((g) => g.id === selectedGuestId) || db.guests[0];

  const selectedType = db.roomTypes.find((t) => t.id === roomTypeId);
  const selectedPlan = db.ratePlans.find((p) => p.id === ratePlanId);

  // Available Rooms for the selected Room Type
  const availableRooms = useMemo(() => {
    return db.rooms.filter(
      (r) => r.typeId === roomTypeId && r.status === "available"
    );
  }, [db.rooms, roomTypeId]);

  // Calculate Nights
  const nights = useMemo(() => {
    const d1 = new Date(checkIn).getTime();
    const d2 = new Date(checkOut).getTime();
    const diff = Math.ceil((d2 - d1) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 1;
  }, [checkIn, checkOut]);

  // Dynamic Live Commercial Calculation
  const calc = useMemo(() => {
    const baseRate = customRate ? parseFloat(customRate) : (selectedType?.baseRate ?? 4000);
    const mealAddon = (selectedPlan?.mealRate ?? 0) * parseInt(adults || "1", 10);
    const extraBedAddon = parseInt(extraBed || "0", 10) * 1000;
    const disc = parseFloat(discount || "0") || 0;

    const nightlyRate = Math.max(0, baseRate + mealAddon + extraBedAddon);
    const roomCost = nightlyRate * nights;
    const taxable = Math.max(0, roomCost - disc);

    let taxRate = 0;
    if (billingType === "GST") {
      if (taxable / nights <= 7500) taxRate = 12;
      else taxRate = 18;
    }

    const tax = Math.round(taxable * (taxRate / 100));
    const cgst = Math.round(tax / 2);
    const sgst = tax - cgst;
    const total = taxable + tax;

    return {
      baseRate,
      mealCost: mealAddon * nights,
      extraBedCost: extraBedAddon * nights,
      nightlyRate,
      roomCost,
      discount: disc,
      taxable,
      taxRate,
      tax,
      cgst,
      sgst,
      total,
    };
  }, [customRate, selectedType, selectedPlan, adults, extraBed, discount, nights, billingType]);

  function handleCreateBooking() {
    let guestId = selectedGuestId;

    if (guestMode === "new") {
      if (!newGuest.name.trim() || !newGuest.mobile.trim()) {
        toast.error("Please provide Guest Name and Mobile Number");
        return;
      }
      const created = guestService.create({
        salutation: newGuest.salutation,
        name: newGuest.name,
        gender: newGuest.gender,
        mobile: newGuest.mobile,
        email: newGuest.email,
        city: newGuest.city,
        state: newGuest.state,
        nationality: newGuest.nationality,
        idType: newGuest.idType,
        idNumber: newGuest.idNumber,
        company: newGuest.company || undefined,
        vip: newGuest.vip === "yes",
      });
      guestId = created.id;
    }

    const assigned = assignedRoomId ? [assignedRoomId] : availableRooms[0] ? [availableRooms[0].id] : [];

    const booking = bookingService.create({
      guestId,
      source,
      roomTypeId,
      roomIds: assigned,
      ratePlanId,
      checkIn,
      checkOut,
      nights,
      adults: parseInt(adults, 10),
      children: parseInt(children, 10),
      extraBed: parseInt(extraBed, 10),
      rateNight: calc.nightlyRate,
      discount: calc.discount,
      purpose,
      remarks: `${remarks} | Check-in: ${checkInTime}, Check-out: ${checkOutTime}`.trim(),
      billingType,
    });

    const guestObj = db.guests.find((g) => g.id === guestId) || newGuest;

    setSuccessBooking({
      id: booking.id,
      grc: booking.grc,
      billingType,
      guestName: guestObj.name,
      roomName: selectedType?.name || "Standard Room",
      total: calc.total,
    });

    toast.success(`Reservation ${booking.id} (${billingType}) created successfully!`);
  }

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#d1c4bd]">
        <div className="flex items-center gap-3">
          <Btn variant="outline" size="sm" icon={ArrowLeft} onClick={() => nav({ to: "/reservations" })}>
            Back to Reservations
          </Btn>
          <span className="text-[#7f756f]">|</span>
          <span className="font-serif text-2xl sm:text-3xl font-semibold text-[#170f0a]">
            Create New Reservation
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left 8 Cols: Form Sections */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. Guest Selection */}
          <div className="border border-[#d1c4bd] bg-[#ffffff] p-6 rounded-[0.25rem] space-y-6">
            <h3 className="font-serif text-lg font-semibold text-[#170f0a] border-b border-[#d1c4bd] pb-3">
              1. Guest Information
            </h3>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setGuestMode("existing")}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-[0.25rem] border text-xs font-label-caps transition-colors cursor-pointer",
                  guestMode === "existing"
                    ? "bg-[#170f0a] !text-[#ffffff] border-[#170f0a]"
                    : "bg-[#ffffff] border-[#d1c4bd] text-[#4e4540] hover:bg-[#f5f3ee]"
                )}
              >
                Existing Guest
              </button>
              <button
                type="button"
                onClick={() => setGuestMode("new")}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-[0.25rem] border text-xs font-label-caps transition-colors cursor-pointer",
                  guestMode === "new"
                    ? "bg-[#170f0a] !text-[#ffffff] border-[#170f0a]"
                    : "bg-[#ffffff] border-[#d1c4bd] text-[#4e4540] hover:bg-[#f5f3ee]"
                )}
              >
                + New Guest Profile
              </button>
            </div>

            {guestMode === "existing" ? (
              <div className="space-y-4" ref={dropdownRef}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-label-caps text-[10px] text-[#4e4540]">
                      Search &amp; Select Registered Guest Profile
                    </label>
                    <span className="font-data-tabular text-[11px] text-[#7f756f]">
                      {db.guests.length} Profiles in Database
                    </span>
                  </div>

                  <div className="relative">
                    <div
                      onClick={() => setGuestDropdownOpen(true)}
                      className={cn(
                        "relative flex items-center w-full h-11 rounded-[0.25rem] border bg-[#ffffff] px-3.5 cursor-pointer transition-colors",
                        guestDropdownOpen
                          ? "border-[#170f0a] ring-1 ring-[#170f0a]"
                          : "border-[#d1c4bd] hover:border-[#170f0a]"
                      )}
                    >
                      <Search className="h-4 w-4 text-[#7f756f] shrink-0 mr-2.5" />
                      <input
                        type="text"
                        value={guestDropdownOpen ? guestSearchQuery : `${currentSelectedGuest?.salutation || "Mr."} ${currentSelectedGuest?.name || ""} · ${currentSelectedGuest?.mobile || ""} (${currentSelectedGuest?.city || "India"})`}
                        onFocus={() => {
                          setGuestDropdownOpen(true);
                          setGuestSearchQuery("");
                        }}
                        onChange={(e) => {
                          setGuestSearchQuery(e.target.value);
                          if (!guestDropdownOpen) setGuestDropdownOpen(true);
                        }}
                        placeholder="Search guest by name, phone or city..."
                        className="w-full h-full bg-transparent text-xs font-medium text-[#170f0a] outline-none placeholder:text-[#7f756f] cursor-text"
                      />
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-[#7f756f] transition-transform shrink-0 ml-2",
                          guestDropdownOpen ? "rotate-180 text-[#170f0a]" : ""
                        )}
                      />
                    </div>

                    {/* Guest Dropdown Popover */}
                    {guestDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1.5 rounded-[0.25rem] border border-[#d1c4bd] bg-[#ffffff] p-3 shadow-lg space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-[#d1c4bd] text-xs">
                          <span className="font-label-caps text-[10px] text-[#7f756f]">
                            {filteredGuests.length} Guests Matching
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setGuestMode("new");
                              setGuestDropdownOpen(false);
                            }}
                            className="font-label-caps text-[10px] text-[#735c00] hover:text-[#170f0a] font-bold cursor-pointer"
                          >
                            + Add New Profile
                          </button>
                        </div>

                        <div className="overflow-y-auto space-y-1 max-h-72 divide-y divide-[#d1c4bd]/30">
                          {filteredGuests.map((g) => {
                            const isSelected = g.id === selectedGuestId;
                            return (
                              <div
                                key={g.id}
                                onClick={() => {
                                  setSelectedGuestId(g.id);
                                  setGuestDropdownOpen(false);
                                  setGuestSearchQuery("");
                                }}
                                className={cn(
                                  "flex items-center justify-between p-2.5 rounded-[0.25rem] cursor-pointer transition-colors text-xs",
                                  isSelected
                                    ? "bg-[#fed65b]/20 border border-[#fed65b] text-[#170f0a] font-bold"
                                    : "hover:bg-[#f5f3ee]"
                                )}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-8 w-8 rounded-full bg-[#e4e2dd] font-bold text-xs flex items-center justify-center text-[#170f0a] shrink-0">
                                    {g.name?.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-[#170f0a] truncate">
                                        {g.salutation || "Mr."} {g.name}
                                      </span>
                                      {g.vip && (
                                        <span className="text-[9px] font-label-caps text-[#745c00] bg-[#fed65b] px-1.5 py-0.2 rounded font-bold">
                                          VIP
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-[#7f756f] mt-0.5">
                                      {g.mobile} · {g.city || "India"}
                                    </div>
                                  </div>
                                </div>

                                {isSelected ? (
                                  <span className="w-5 h-5 rounded-full bg-[#170f0a] !text-[#ffffff] flex items-center justify-center text-xs font-bold shrink-0">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-xs text-[#7f756f] hover:text-[#170f0a]">
                                    Select →
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Guest Meta Summary Strip */}
                {currentSelectedGuest && !guestDropdownOpen && (
                  <div className="flex items-center justify-between p-3.5 rounded-[0.25rem] bg-[#fbf9f4] border border-[#d1c4bd] text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-[#170f0a] !text-[#ffffff] font-bold flex items-center justify-center text-xs shrink-0">
                        {currentSelectedGuest.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#170f0a]">
                            {currentSelectedGuest.salutation || "Mr."} {currentSelectedGuest.name}
                          </span>
                          {currentSelectedGuest.vip && (
                            <span className="text-[9px] font-label-caps text-[#745c00] bg-[#fed65b] px-1.5 py-0.2 rounded font-bold">
                              VIP GUEST
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#7f756f] mt-0.5">
                          {currentSelectedGuest.mobile} · {currentSelectedGuest.email || "No email"} · {currentSelectedGuest.city}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-label-caps text-[#285430] bg-[#e5eedc] border border-[#c0d6b0] px-2 py-0.5 rounded-[0.125rem]">
                      Verified Profile
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" required>
                  <Input value={newGuest.name} onChange={(e) => setNewGuest((g) => ({ ...g, name: e.target.value }))} placeholder="e.g. Rahul Sharma" />
                </Field>
                <Field label="Mobile Number" required>
                  <Input value={newGuest.mobile} onChange={(e) => setNewGuest((g) => ({ ...g, mobile: e.target.value }))} placeholder="10-digit mobile" />
                </Field>
                <Field label="Email Address">
                  <Input type="email" value={newGuest.email} onChange={(e) => setNewGuest((g) => ({ ...g, email: e.target.value }))} placeholder="guest@example.com" />
                </Field>
                <Field label="City">
                  <Input value={newGuest.city} onChange={(e) => setNewGuest((g) => ({ ...g, city: e.target.value }))} />
                </Field>
              </div>
            )}
          </div>

          {/* 2. Dates & Room Configuration */}
          <div className="border border-[#d1c4bd] bg-[#ffffff] p-6 rounded-[0.25rem] space-y-6">
            <h3 className="font-serif text-lg font-semibold text-[#170f0a] border-b border-[#d1c4bd] pb-3">
              2. Stay Dates &amp; Room Selection
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Check-in Date">
                <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              </Field>
              <Field label="Check-in Time">
                <Select
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  options={[
                    { value: "12:00 PM", label: "12:00 PM (Standard)" },
                    { value: "10:00 AM", label: "10:00 AM (Early)" },
                    { value: "02:00 PM", label: "02:00 PM" },
                    { value: "06:00 PM", label: "06:00 PM" },
                  ]}
                />
              </Field>
              <Field label="Check-out Date">
                <Input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} />
              </Field>
              <Field label="Check-out Time">
                <Select
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  options={[
                    { value: "11:00 AM", label: "11:00 AM (Standard)" },
                    { value: "12:00 PM", label: "12:00 PM" },
                    { value: "02:00 PM", label: "02:00 PM (Late)" },
                  ]}
                />
              </Field>
            </div>

            {/* Room Category Cards */}
            <div className="space-y-3">
              <label className="font-label-caps text-[10px] text-[#4e4540] block">Select Room Category</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {db.roomTypes.map((rt) => {
                  const free = db.rooms.filter((r) => r.typeId === rt.id && r.status === "available").length;
                  const isSelected = roomTypeId === rt.id;
                  return (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => {
                        setRoomTypeId(rt.id);
                        setCustomRate("");
                        setAssignedRoomId("");
                      }}
                      className={cn(
                        "p-4 rounded-[0.25rem] border text-left transition-colors cursor-pointer",
                        isSelected
                          ? "border-[#170f0a] bg-[#fbf9f4] ring-1 ring-[#170f0a]"
                          : "border-[#d1c4bd] bg-[#ffffff] hover:border-[#170f0a]"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-serif font-bold text-sm text-[#170f0a]">{rt.name}</span>
                        <span className="font-data-tabular font-bold text-sm text-[#170f0a]">{money(rt.baseRate)}/nt</span>
                      </div>
                      <p className="text-xs text-[#7f756f] mt-1 line-clamp-1">{rt.description}</p>
                      <div className="mt-3 flex items-center justify-between text-[11px]">
                        <span className="text-[#7f756f]">{rt.beds} Bed(s) · Max {rt.maxOccupancy} Pax</span>
                        <Badge tone={free > 0 ? "success" : "danger"}>{free} Available</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-4 pt-2">
                <Field label="Adults">
                  <Select value={adults} onChange={(e) => setAdults(e.target.value)} options={["1", "2", "3", "4"].map((v) => ({ value: v, label: `${v} Adult${+v > 1 ? "s" : ""}` }))} />
                </Field>
                <Field label="Children">
                  <Select value={children} onChange={(e) => setChildren(e.target.value)} options={["0", "1", "2"].map((v) => ({ value: v, label: `${v} Child` }))} />
                </Field>
                <Field label="Extra Bed">
                  <Select value={extraBed} onChange={(e) => setExtraBed(e.target.value)} options={["0", "1", "2"].map((v) => ({ value: v, label: `${v} Extra Bed` }))} />
                </Field>
                <Field label="Assign Specific Room">
                  <Select
                    value={assignedRoomId}
                    onChange={(e) => setAssignedRoomId(e.target.value)}
                    options={[
                      { value: "", label: "Auto Assign" },
                      ...availableRooms.map((r) => ({ value: r.id, label: `Room ${r.number} (Floor ${r.floor})` })),
                    ]}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* 3. Commercials & Billing Type */}
          <div className="border border-[#d1c4bd] bg-[#ffffff] p-6 rounded-[0.25rem] space-y-6">
            <h3 className="font-serif text-lg font-semibold text-[#170f0a] border-b border-[#d1c4bd] pb-3">
              3. Commercials &amp; Billing Mode
            </h3>

            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-[#4e4540] block">Billing Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBillingType("GST")}
                  className={cn(
                    "p-3 rounded-[0.25rem] border text-left transition-colors cursor-pointer",
                    billingType === "GST"
                      ? "border-[#170f0a] bg-[#170f0a] !text-[#ffffff]"
                      : "border-[#d1c4bd] bg-[#ffffff] text-[#4e4540] hover:bg-[#f5f3ee]"
                  )}
                >
                  <div className="font-bold text-xs">GST Tax Invoice (B2B / B2C)</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Series: GBK-xxx (12%/18% GST)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingType("NON-GST")}
                  className={cn(
                    "p-3 rounded-[0.25rem] border text-left transition-colors cursor-pointer",
                    billingType === "NON-GST"
                      ? "border-[#170f0a] bg-[#170f0a] !text-[#ffffff]"
                      : "border-[#d1c4bd] bg-[#ffffff] text-[#4e4540] hover:bg-[#f5f3ee]"
                  )}
                >
                  <div className="font-bold text-xs">Non-GST / Bill of Supply</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Series: NBK-xxx (0% Tax)</div>
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Meal / Rate Plan">
                <Select
                  value={ratePlanId}
                  onChange={(e) => setRatePlanId(e.target.value)}
                  options={db.ratePlans.map((rp) => ({
                    value: rp.id,
                    label: `${rp.code} — ${rp.name} (${rp.description})`,
                  }))}
                />
              </Field>
              <Field label="Booking Source">
                <Select value={source} onChange={(e) => setSource(e.target.value as BookingSource)} options={SOURCES.map((s) => ({ value: s, label: s }))} />
              </Field>
              <Field label="Special Discount (₹)">
                <Input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </Field>
              <Field label="Purpose of Visit">
                <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Live Folio Breakdown Preview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-[#d1c4bd] bg-[#fbf9f4] p-6 rounded-[0.25rem] space-y-4 sticky top-6">
            <h3 className="font-serif text-lg font-semibold text-[#170f0a] border-b border-[#d1c4bd] pb-3">
              Live Tariff Breakdown
            </h3>

            <div className="space-y-2.5 text-xs font-data-tabular">
              <div className="flex items-center justify-between pb-2 border-b border-[#d1c4bd]">
                <span className="text-[#7f756f]">Registration ID:</span>
                <span className="font-bold text-[#170f0a]">
                  {billingType === "NON-GST" ? "NBK-XXXX (Non-GST)" : "GBK-XXXX (GST)"}
                </span>
              </div>
              <div className="flex justify-between text-[#4e4540]">
                <span>Room Category</span>
                <span className="font-bold text-[#170f0a]">{selectedType?.name}</span>
              </div>
              <div className="flex justify-between text-[#4e4540]">
                <span>Stay Duration</span>
                <span className="font-bold text-[#170f0a]">{nights} Night(s)</span>
              </div>
              <div className="flex justify-between text-[#4e4540]">
                <span>Base Room Tariff</span>
                <span className="font-bold text-[#170f0a]">{money(calc.roomCost)}</span>
              </div>
              {calc.mealCost > 0 && (
                <div className="flex justify-between text-[#4e4540]">
                  <span>Meal Inclusions</span>
                  <span>{money(calc.mealCost)}</span>
                </div>
              )}
              {calc.discount > 0 && (
                <div className="flex justify-between text-[#735c00]">
                  <span>Discount</span>
                  <span>- {money(calc.discount)}</span>
                </div>
              )}

              <div className="border-t border-[#d1c4bd] pt-2 space-y-1.5">
                <div className="flex justify-between text-[#4e4540]">
                  <span>Taxable Base</span>
                  <span className="font-bold">{money(calc.taxable)}</span>
                </div>
                {billingType === "GST" ? (
                  <>
                    <div className="flex justify-between text-[#7f756f]">
                      <span>GST ({calc.taxRate}%)</span>
                      <span>{money(calc.tax)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-[#7f756f] pl-2">
                      <span>CGST ({calc.taxRate / 2}%)</span>
                      <span>{money(calc.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-[#7f756f] pl-2">
                      <span>SGST ({calc.taxRate / 2}%)</span>
                      <span>{money(calc.sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-[#735c00] font-medium">
                    <span>Tax (Non-GST / Exempted)</span>
                    <span>₹0.00</span>
                  </div>
                )}
              </div>

              <div className="border-t border-[#d1c4bd] pt-4 flex items-center justify-between">
                <span className="font-label-caps text-xs text-[#170f0a] font-bold">Total Tariff:</span>
                <span className="font-serif text-2xl font-bold text-[#170f0a]">{money(calc.total)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#d1c4bd] space-y-2">
              <button
                onClick={handleCreateBooking}
                className="w-full bg-[#170f0a] !text-[#ffffff] py-3 rounded-[0.25rem] font-label-caps text-xs font-bold hover:bg-[#2d241e] transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4 text-[#ffffff]" />
                Confirm &amp; Create Reservation
              </button>
              <Btn
                variant="outline"
                className="w-full text-xs"
                onClick={() => nav({ to: "/reservations" })}
              >
                Cancel
              </Btn>
            </div>
          </div>
        </div>
      </div>

      {/* Success Celebration Dialog */}
      {successBooking && (
        <SuccessModal
          open={!!successBooking}
          onClose={() => nav({ to: "/reservations" })}
          title="Reservation Confirmed!"
          subtitle={`Booking has been created in ${successBooking.billingType} mode.`}
          details={[
            { label: "Booking ID", value: successBooking.id },
            { label: "Registration Type", value: successBooking.billingType },
            { label: "GRC Number", value: successBooking.grc },
            { label: "Guest Name", value: successBooking.guestName },
            { label: "Room Category", value: successBooking.roomName },
            { label: "Total Payable", value: money(successBooking.total) },
          ]}
          primaryAction={{
            label: "Open Dedicated Booking Page",
            icon: FileText,
            onClick: () => nav({ to: `/reservations/${successBooking.id}` as never }),
          }}
          secondaryAction={{
            label: "Return to Reservations",
            onClick: () => nav({ to: "/reservations" }),
          }}
        />
      )}
    </div>
  );
}
