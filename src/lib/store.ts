import { useSyncExternalStore } from "react";
import { buildSeed, iso, addDays, today } from "./seed";
import type {
  Booking, DB, FolioCharge, Guest, HKTask, ID, MenuItem, POSOrder, Payment, Room,
  RoomStatus, Role,
} from "./types";

const KEY = "mayra-erp-db-v1";

let db: DB = buildSeed();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  db = { ...db };
  listeners.add(() => {});
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* quota */
  }
}

export const STANDARD_RATE_PLANS = [
  { id: "rp-ep", code: "EP", name: "European Plan", description: "Room Only (No Meals)", mealRate: 0, active: true },
  { id: "rp-cp", code: "CP", name: "Continental Plan", description: "Room + Breakfast", mealRate: 450, active: true },
  { id: "rp-map", code: "MAP", name: "Modified American Plan", description: "Room + Breakfast + Lunch OR Dinner", mealRate: 950, active: true },
  { id: "rp-ap", code: "AP", name: "American Plan", description: "Room + Breakfast + Lunch + Dinner", mealRate: 1400, active: true },
  { id: "rp-ai", code: "AI", name: "All Inclusive", description: "Room + All Meals + Drinks & Inclusions", mealRate: 1900, active: true },
];

export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed && parsed.version === 1) {
        if (!parsed.ratePlans || parsed.ratePlans.length < 5) {
          parsed.ratePlans = STANDARD_RATE_PLANS;
        } else {
          parsed.ratePlans = STANDARD_RATE_PLANS.map((std) => {
            const existing = parsed.ratePlans.find((p) => p.code === std.code || p.id === std.id);
            return existing ? { ...existing, description: std.description, name: std.name } : std;
          });
        }
        db = parsed;
      }
    } else persist();
  } catch {
    /* ignore */
  }
  emit();
}


function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const getSnapshot = () => db;

export function useDB(): DB {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Mutate the database and notify all subscribers. */
export function update(fn: (draft: DB) => void) {
  fn(db);
  persist();
  emit();
}

export function resetDemo() {
  db = buildSeed();
  persist();
  emit();
}
export function clearLocal() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  db = buildSeed();
  emit();
}

export function nextNo(key: string, prefix: string, pad = 4) {
  const n = (db.counters[key] ?? 1000) + 1;
  db.counters[key] = n;
  return `${prefix}${String(n).padStart(pad, "0")}`;
}

export const uid = (p = "id") => `${p}-${Math.random().toString(36).slice(2, 9)}`;

/* ----------------------------- formatting ----------------------------- */
export const money = (n: number) =>
  "₹" + Math.round(n || 0).toLocaleString("en-IN");
export const moneyShort = (n: number) => {
  const v = n || 0;
  if (Math.abs(v) >= 10000000) return "₹" + (v / 10000000).toFixed(2) + "Cr";
  if (Math.abs(v) >= 100000) return "₹" + (v / 100000).toFixed(2) + "L";
  if (Math.abs(v) >= 1000) return "₹" + (v / 1000).toFixed(1) + "K";
  return "₹" + Math.round(v);
};
export const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const fmtDay = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—";
export const fmtTime = (d?: string) =>
  d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
export { iso, addDays, today };

export const nightsBetween = (a: string, b: string) =>
  Math.max(1, Math.round((+new Date(b) - +new Date(a)) / 86400000));

/* ----------------------------- calculations ----------------------------- */
export interface BookingCalcInput {
  roomTypeId: ID;
  ratePlanId: ID;
  rateNight: number;
  nights: number;
  rooms: number;
  adults: number;
  children: number;
  extraBed: number;
  discount: number;
  billingType?: "GST" | "NON-GST";
  interState?: boolean;
}
export function calcBooking(input: BookingCalcInput, data: DB = db) {
  const rt = data.roomTypes.find((r) => r.id === input.roomTypeId);
  const rp = data.ratePlans.find((r) => r.id === input.ratePlanId);
  const rooms = Math.max(1, input.rooms);
  const roomCost = input.rateNight * input.nights * rooms;
  const mealCost = (rp?.mealRate ?? 0) * (input.adults + input.children) * input.nights * rooms;
  const extraBedCost = (rt?.extraBed ?? 500) * input.extraBed * input.nights;
  const extraAdult = Math.max(0, input.adults - (rt?.maxOccupancy ?? 3)) * (rt?.extraAdult ?? 0) * input.nights;
  const subtotal = roomCost + mealCost + extraBedCost + extraAdult;
  const discount = Math.min(input.discount || 0, subtotal);
  const taxable = subtotal - discount;
  const isNonGst = input.billingType === "NON-GST";
  const perNight = input.rateNight;
  const rate = isNonGst ? 0 : (perNight > data.settings.gstThreshold ? data.settings.gstSlabHigh : data.settings.gstSlabLow);
  const tax = isNonGst ? 0 : (taxable * rate) / 100;
  const igst = isNonGst ? 0 : (input.interState ? tax : 0);
  const cgst = isNonGst ? 0 : (input.interState ? 0 : tax / 2);
  const sgst = isNonGst ? 0 : (input.interState ? 0 : tax / 2);
  return {
    roomCost, mealCost, extraBedCost, extraAdult, subtotal, discount, taxable,
    taxRate: rate, cgst, sgst, igst, tax, total: taxable + tax, isNonGst,
  };
}

export function folioTotals(booking: Booking, data: DB = db) {
  let subtotal = 0;
  let tax = 0;
  let discount = 0;
  booking.charges.forEach((c) => {
    if (c.kind === "Discount") discount += Math.abs(c.amount);
    else {
      subtotal += c.amount;
      tax += (c.amount * c.taxRate) / 100;
    }
  });
  const pays = data.payments.filter((p) => p.bookingId === booking.id);
  const paid = pays.filter((p) => p.kind === "payment").reduce((s, p) => s + p.amount, 0);
  const refund = pays.filter((p) => p.kind === "refund").reduce((s, p) => s + p.amount, 0);
  const total = subtotal - discount + tax;
  return { subtotal, tax, discount, total, paid, refund, balance: total - paid + refund, payments: pays };
}

export function orderTotals(order: POSOrder, data: DB = db) {
  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = Math.min(order.discount || 0, subtotal);
  const taxable = subtotal - discount;
  const rate = order.mode === "Complimentary" ? 0 : data.settings.fbTax;
  const tax = (taxable * rate) / 100;
  return { subtotal, discount, taxable, cgst: tax / 2, sgst: tax / 2, tax, total: taxable + tax };
}

/* ----------------------------- lookups ----------------------------- */
export const byId = <T extends { id: string }>(arr: T[], id?: string) => arr.find((a) => a.id === id);
export const guestOf = (b: Booking | undefined, data: DB = db) => data.guests.find((g) => g.id === b?.guestId);
export const roomLabel = (ids: string[], data: DB = db) =>
  ids.map((i) => data.rooms.find((r) => r.id === i)?.number ?? "—").join(", ");

export const ROOM_STATUS_META: Record<RoomStatus, { label: string; tone: string }> = {
  available: { label: "Available", tone: "success" },
  reserved: { label: "Reserved", tone: "info" },
  occupied: { label: "Occupied", tone: "primary" },
  dirty: { label: "Dirty", tone: "danger" },
  cleaning: { label: "Cleaning", tone: "warning" },
  inspection: { label: "Inspection", tone: "info" },
  maintenance: { label: "Maintenance", tone: "muted" },
  blocked: { label: "Blocked", tone: "muted" },
};

export const BOOKING_STATUS_META: Record<BookingStatus, { label: string; tone: string }> = {
  confirmed: { label: "Confirmed", tone: "info" },
  "checked-in": { label: "In-House", tone: "primary" },
  "checked-out": { label: "Checked-out", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  "no-show": { label: "No Show", tone: "muted" },
};

export const roomTypeOf = (typeId?: ID, data: DB = db) => data.roomTypes.find((r) => r.id === typeId);

export function isRoomFree(roomId: ID, checkIn: string, checkOut: string, data: DB = db, ignore?: ID) {
  const conflict = data.bookings.some(
    (b) =>
      b.id !== ignore &&
      b.roomIds.includes(roomId) &&
      ["confirmed", "checked-in"].includes(b.status) &&
      !(b.checkOut <= checkIn || b.checkIn >= checkOut),
  );
  const room = data.rooms.find((r) => r.id === roomId);
  return !conflict && !!room && !["maintenance", "blocked"].includes(room.status);
}

/* ----------------------------- services ----------------------------- */
export const roomService = {
  setStatus(roomId: ID, status: RoomStatus) {
    update((d) => {
      const r = d.rooms.find((x) => x.id === roomId);
      if (r) r.status = status;
    });
  },
  available(data: DB, checkIn: string, checkOut: string, typeId?: ID) {
    return data.rooms.filter(
      (r) => (!typeId || r.typeId === typeId) && isRoomFree(r.id, checkIn, checkOut, data),
    );
  },
};

export const guestService = {
  create(g: Partial<Guest>): Guest {
    const guest: Guest = {
      id: uid("g"), salutation: g.salutation ?? "Mr.", name: g.name ?? "Guest",
      gender: g.gender ?? "Male", mobile: g.mobile ?? "", email: g.email ?? "",
      city: g.city ?? "", state: g.state ?? "", nationality: g.nationality ?? "Indian",
      idType: g.idType ?? "Aadhaar", idNumber: g.idNumber ?? "", vip: !!g.vip,
      segment: g.segment ?? "New", createdAt: new Date().toISOString(), ...g,
    } as Guest;
    update((d) => {
      d.guests.unshift(guest);
    });
    return guest;
  },
  save(id: ID, patch: Partial<Guest>) {
    update((d) => {
      const g = d.guests.find((x) => x.id === id);
      if (g) Object.assign(g, patch);
    });
  },
  stats(guestId: ID, data: DB) {
    const bks = data.bookings.filter((b) => b.guestId === guestId);
    const spend = bks.reduce((s, b) => s + folioTotals(b, data).total, 0);
    const stays = bks.filter((b) => b.status === "checked-out").length;
    const last = bks.map((b) => b.checkIn).sort().pop();
    return { bookings: bks, stays, spend, last, avg: stays ? spend / stays : 0 };
  },
};

export const bookingService = {
  create(payload: Partial<Booking> & { guestId?: ID }): Booking {
    const cIn = payload.checkIn || today();
    const cOut = payload.checkOut || iso(addDays(new Date(), 1));
    const nights = Math.max(1, nightsBetween(cIn, cOut));
    let created!: Booking;
    update((d) => {
      const isNonGst = payload.billingType === "NON-GST";
      const bookingId = isNonGst ? nextNo("nonGstBooking", "NBK-") : nextNo("booking", "GBK-");
      const grcNo = isNonGst ? nextNo("nonGstGrc", "N-GRC-") : nextNo("grc", "G-GRC-");
      const invoiceNo = isNonGst ? nextNo("nonGstInvoice", "MYR/BOS/25-26/") : nextNo("invoice", "MYR/GST/25-26/");

      const gId = payload.guestId || d.guests[0]?.id || uid("g");
      const rTypeId = payload.roomTypeId || d.roomTypes[0]?.id || "rt-deluxe";

      let rIds = payload.roomIds && payload.roomIds.length ? payload.roomIds : [];
      if (!rIds.length) {
        const freeRoom = d.rooms.find((r) => r.typeId === rTypeId && r.status === "available");
        const anyRoom = d.rooms.find((r) => r.typeId === rTypeId);
        if (freeRoom) rIds = [freeRoom.id];
        else if (anyRoom) rIds = [anyRoom.id];
        else if (d.rooms[0]) rIds = [d.rooms[0].id];
      }

      const b: Booking = {
        id: bookingId,
        grc: grcNo,
        invoiceNo: invoiceNo,
        guestId: gId,
        source: payload.source ?? "Direct Website",
        billingType: isNonGst ? "NON-GST" : "GST",
        companyGstin: payload.companyGstin,
        roomTypeId: rTypeId,
        roomIds: rIds,
        ratePlanId: payload.ratePlanId ?? "rp-ep",
        checkIn: cIn, checkOut: cOut, nights,
        checkInTime: payload.checkInTime || d.settings.checkInTime || "12:00 PM",
        checkOutTime: payload.checkOutTime || d.settings.checkOutTime || "11:00 AM",
        adults: payload.adults ?? 1, children: payload.children ?? 0,
        extraBed: payload.extraBed ?? 0, rateNight: payload.rateNight ?? 0,
        discount: payload.discount ?? 0, status: "confirmed", charges: [],
        createdAt: new Date().toISOString(),
        arrivalFrom: payload.arrivalFrom, purpose: payload.purpose, remarks: payload.remarks,
        simulated: payload.simulated,
      };
      const calc = calcBooking(
        { roomTypeId: b.roomTypeId, ratePlanId: b.ratePlanId, rateNight: b.rateNight, nights, rooms: b.roomIds.length || 1, adults: b.adults, children: b.children, extraBed: b.extraBed, discount: b.discount, billingType: b.billingType },
        d,
      );
      const rt = d.roomTypes.find((r) => r.id === b.roomTypeId);
      const rp = d.ratePlans.find((r) => r.id === b.ratePlanId);
      const roomChargeTotal = calc.roomCost + calc.mealCost + calc.extraBedCost;
      b.charges.push({
        id: uid("ch"), date: b.checkIn, kind: "Room",
        description: `${rt?.name ?? "Room"} · ${rp?.code ?? "EP"} · ${nights} night(s) [${b.billingType}]`,
        qty: nights, rate: nights > 0 ? roomChargeTotal / nights : roomChargeTotal,
        amount: roomChargeTotal, taxRate: calc.taxRate ?? 0,
        billingType: b.billingType,
      });
      if (b.discount > 0)
        b.charges.push({ id: uid("ch"), date: b.checkIn, kind: "Discount", description: "Booking discount", qty: 1, rate: b.discount, amount: b.discount, taxRate: 0, billingType: b.billingType });
      d.bookings.unshift(b);
      b.roomIds.forEach((rid) => {
        const r = d.rooms.find((x) => x.id === rid);
        if (r && r.status === "available") r.status = "reserved";
      });
      created = b;
    });
    return created;
  },
  patch(id: ID, patch: Partial<Booking>) {
    update((d) => {
      const b = d.bookings.find((x) => x.id === id);
      if (b) Object.assign(b, patch);
    });
  },
  checkIn(id: ID) {
    update((d) => {
      const b = d.bookings.find((x) => x.id === id);
      if (!b) return;
      b.status = "checked-in";
      const now = new Date();
      b.checkInTime = b.checkInTime || "12:00 PM";
      b.actualCheckInTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      b.roomIds.forEach((rid) => {
        const r = d.rooms.find((x) => x.id === rid);
        if (r) r.status = "occupied";
      });
    });
  },
  checkOut(id: ID) {
    update((d) => {
      const b = d.bookings.find((x) => x.id === id);
      if (!b) return;
      b.status = "checked-out";
      const now = new Date();
      b.checkOutTime = b.checkOutTime || "11:00 AM";
      b.actualCheckOutTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      b.roomIds.forEach((rid) => {
        const r = d.rooms.find((x) => x.id === rid);
        if (r) r.status = "dirty";
        d.hkTasks.unshift({
          id: uid("hk"), roomId: rid, type: "Checkout Cleaning",
          assignedTo: d.employees.find((e) => e.department === "Housekeeping")?.name ?? "Unassigned",
          priority: "High", status: "dirty", createdAt: new Date().toISOString(),
        });
      });
    });
  },
  cancel(id: ID) {
    update((d) => {
      const b = d.bookings.find((x) => x.id === id);
      if (!b) return;
      b.status = "cancelled";
      b.roomIds.forEach((rid) => {
        const r = d.rooms.find((x) => x.id === rid);
        if (r && (r.status === "reserved" || r.status === "occupied")) r.status = "available";
      });
    });
  },
  changeRoom(id: ID, roomId: ID) {
    update((d) => {
      const b = d.bookings.find((x) => x.id === id);
      if (!b) return;
      b.roomIds.forEach((rid) => {
        const r = d.rooms.find((x) => x.id === rid);
        if (r) r.status = b.status === "checked-in" ? "dirty" : "available";
      });
      b.roomIds = [roomId];
      const nr = d.rooms.find((x) => x.id === roomId);
      if (nr) nr.status = b.status === "checked-in" ? "occupied" : "reserved";
    });
  },
  addCharge(id: ID, charge: Omit<FolioCharge, "id">) {
    update((d) => {
      const b = d.bookings.find((x) => x.id === id);
      if (b) b.charges.push({ ...charge, id: uid("ch") });
    });
  },
};

export const paymentService = {
  add(p: Omit<Payment, "id">) {
    update((d) => {
      d.payments.unshift({ ...p, id: nextNo("payment", "PAY-") });
      if (p.mode === "Cash")
        d.cash.unshift({
          id: uid("c"), date: p.date, type: p.kind === "payment" ? "in" : "out",
          amount: p.amount, note: p.note || (p.kind === "payment" ? "Payment received" : "Refund issued"),
        });
    });
  },
};

export const hkService = {
  move(taskId: ID, status: HKTask["status"]) {
    update((d) => {
      const t = d.hkTasks.find((x) => x.id === taskId);
      if (!t) return;
      t.status = status;
      const r = d.rooms.find((x) => x.id === t.roomId);
      if (r) r.status = status === "ready" ? "available" : status;
      if (status === "ready") t.completedAt = new Date().toISOString();
    });
  },
  create(roomId: ID, type: string, assignedTo: string, priority: HKTask["priority"]) {
    update((d) => {
      d.hkTasks.unshift({ id: uid("hk"), roomId, type, assignedTo, priority, status: "dirty", createdAt: new Date().toISOString() });
      const r = d.rooms.find((x) => x.id === roomId);
      if (r && ["available", "dirty"].includes(r.status)) r.status = "dirty";
    });
  },
};

export const inventoryService = {
  consumeForOrder(order: POSOrder) {
    update((d) => {
      order.items.forEach((it) => {
        const m = d.menu.find((x) => x.id === it.menuItemId);
        m?.recipe.forEach((r) => {
          const p = d.products.find((x) => x.id === r.productId);
          if (p) {
            p.stock = Math.max(0, +(p.stock - r.qty * it.qty).toFixed(2));
            d.stockMoves.unshift({ id: uid("sm"), date: today(), productId: p.id, qty: -(r.qty * it.qty), type: "consumption", ref: order.number });
          }
        });
      });
    });
  },
  adjust(productId: ID, qty: number, type: "purchase" | "wastage" | "adjustment" | "transfer", note?: string) {
    update((d) => {
      const p = d.products.find((x) => x.id === productId);
      if (!p) return;
      p.stock = Math.max(0, +(p.stock + qty).toFixed(2));
      d.stockMoves.unshift({ id: uid("sm"), date: today(), productId, qty, type, note });
    });
  },
  receiveGRN(poId: ID) {
    update((d) => {
      const po = d.purchases.find((x) => x.id === poId);
      if (!po) return;
      po.status = "received";
      const grn: DB["purchases"][number] = {
        id: uid("pu"), number: nextNo("purchase", "GRN-"), type: "grn", vendorId: po.vendorId,
        date: today(), status: "received", items: po.items, linkedTo: po.id,
      };
      d.purchases.unshift(grn);
      po.items.forEach((i) => {
        const p = d.products.find((x) => x.id === i.productId);
        if (p) p.stock = +(p.stock + i.qty).toFixed(2);
        d.stockMoves.unshift({ id: uid("sm"), date: today(), productId: i.productId, qty: i.qty, type: "purchase", ref: grn.number });
      });
    });
  },
};

export const posService = {
  createOrder(partial: Partial<POSOrder>): POSOrder {
    let created!: POSOrder;
    update((d) => {
      const o: POSOrder = {
        id: uid("o"), number: nextNo("order", "ORD-"), mode: partial.mode ?? "Dine In",
        tableId: partial.tableId, bookingId: partial.bookingId, roomId: partial.roomId,
        waiter: partial.waiter ?? "Front Desk", items: partial.items ?? [],
        discount: partial.discount ?? 0, status: "open", kds: "new",
        createdAt: new Date().toISOString(),
      };
      d.orders.unshift(o);
      created = o;
    });
    return created;
  },
  save(id: ID, patch: Partial<POSOrder>) {
    update((d) => {
      const o = d.orders.find((x) => x.id === id);
      if (o) Object.assign(o, patch);
    });
  },
  sendKOT(id: ID) {
    update((d) => {
      const o = d.orders.find((x) => x.id === id);
      if (!o) return;
      if (!o.kot) o.kot = nextNo("kot", "KOT-");
      o.status = "kot";
      o.kds = "new";
      if (o.tableId && o.mode === "Dine In") {
        const t = d.tables.find((x) => x.id === o.tableId);
        if (t) t.status = "occupied";
      }
    });
  },
  setKds(id: ID, kds: POSOrder["kds"]) {
    update((d) => {
      const o = d.orders.find((x) => x.id === id);
      if (o) {
        o.kds = kds;
        if (kds === "ready" && o.tableId && o.mode === "Dine In") {
          const t = d.tables.find((x) => x.id === o.tableId);
          if (t && t.status !== "billing") t.status = "billing";
        }
      }
    });
  },
  settle(id: ID, mode: string) {
    const order = db.orders.find((o) => o.id === id);
    if (!order) return;
    inventoryService.consumeForOrder(order);
    update((d) => {
      const o = d.orders.find((x) => x.id === id)!;
      o.status = "settled";
      o.kds = "served";
      o.paymentMode = mode;
      o.settledAt = new Date().toISOString();
      const totals = orderTotals(o, d);
      if (o.tableId) {
        const t = d.tables.find((x) => x.id === o.tableId);
        if (t) t.status = "cleaning";
      }
      if (mode !== "Room Charge" && o.mode !== "Complimentary")
        d.payments.unshift({
          id: nextNo("payment", "PAY-"), date: today(), mode: mode as never,
          amount: totals.total, kind: "payment", reference: o.number, source: "Restaurant",
        });
      if (mode === "Cash")
        d.cash.unshift({ id: uid("c"), date: today(), type: "in", amount: totals.total, note: `POS ${o.number}` });
    });
  },
  postToRoom(id: ID, bookingId: ID) {
    const order = db.orders.find((o) => o.id === id);
    if (!order) return;
    inventoryService.consumeForOrder(order);
    update((d) => {
      const o = d.orders.find((x) => x.id === id)!;
      const b = d.bookings.find((x) => x.id === bookingId);
      if (!b) return;
      const totals = orderTotals(o, d);
      o.status = "posted";
      o.bookingId = bookingId;
      o.roomId = b.roomIds[0];
      o.mode = "Room Charge";
      o.kds = o.kds === "new" ? "preparing" : o.kds;
      b.charges.push({
        id: uid("ch"), date: today(), kind: "Restaurant",
        description: `Restaurant ${o.number} · ${o.items.length} item(s)`,
        qty: 1, rate: totals.taxable, amount: totals.taxable, taxRate: d.settings.fbTax, ref: o.number,
      });
      if (o.tableId) {
        const t = d.tables.find((x) => x.id === o.tableId);
        if (t) t.status = "cleaning";
      }
    });
  },
  voidOrder(id: ID) {
    update((d) => {
      const o = d.orders.find((x) => x.id === id);
      if (!o) return;
      o.status = "void";
      if (o.tableId) {
        const t = d.tables.find((x) => x.id === o.tableId);
        if (t) t.status = "available";
      }
    });
  },
};

export const laundryService = {
  postToFolio(laundryId: ID) {
    update((d) => {
      const l = d.laundry.find((x) => x.id === laundryId);
      if (!l || !l.bookingId || l.postedToFolio) return;
      const b = d.bookings.find((x) => x.id === l.bookingId);
      if (!b) return;
      const amt = l.items.reduce((s, i) => s + i.qty * i.rate, 0) * (l.express ? 1.5 : 1);
      b.charges.push({ id: uid("ch"), date: today(), kind: "Laundry", description: `Laundry ${l.number}`, qty: 1, rate: amt, amount: amt, taxRate: 18, ref: l.number });
      l.postedToFolio = true;
    });
  },
  move(id: ID, status: DB["laundry"][number]["status"]) {
    update((d) => {
      const l = d.laundry.find((x) => x.id === id);
      if (l) l.status = status;
    });
  },
};

export const channelService = {
  inventoryFor(data: DB, typeId: ID, date = today()) {
    const total = data.rooms.filter((r) => r.typeId === typeId).length;
    const sold = data.bookings.filter(
      (b) => b.roomTypeId === typeId && ["confirmed", "checked-in"].includes(b.status) && b.checkIn <= date && b.checkOut > date,
    ).length;
    const blocked = data.rooms.filter((r) => r.typeId === typeId && ["maintenance", "blocked"].includes(r.status)).length;
    return { total, sold, blocked, available: Math.max(0, total - sold - blocked) };
  },
  log(channel: string, action: string, detail: string, status: DB["syncLogs"][number]["status"] = "SUCCESS") {
    update((d) => {
      d.syncLogs.unshift({ id: uid("sl"), time: new Date().toISOString(), channel, action, detail, status });
      const c = d.channels.find((x) => x.name === channel);
      if (c) c.lastSync = new Date().toISOString();
    });
  },
  simulateBooking(channelName: string, typeId: ID) {
    const data = db;
    const rt = data.roomTypes.find((r) => r.id === typeId)!;
    const before = channelService.inventoryFor(data, typeId).available;
    if (before <= 0) return null;
    const guest = data.guests[Math.floor(Math.random() * 200)]!;
    const room = roomService.available(data, today(), iso(addDays(new Date(), 2)), typeId)[0];
    const nights = 2;
    const b = bookingService.create({
      guestId: guest.id, source: channelName as never, roomTypeId: typeId,
      roomIds: room ? [room.id] : [], ratePlanId: "rp-cp",
      checkIn: today(), checkOut: iso(addDays(new Date(), nights)),
      adults: 2, children: 0, extraBed: 0, rateNight: rt.baseRate, discount: 0, simulated: true,
    });
    paymentService.add({ bookingId: b.id, date: today(), mode: "UPI", amount: rt.baseRate * nights, kind: "payment", reference: `OTA${Math.floor(Math.random() * 99999)}`, source: channelName });
    channelService.log(channelName, "Booking Pulled", `${rt.name} ${before} → ${before - 1} · ${guest.name}`);
    return b;
  },
};

export const financeService = {
  cashSummary(data: DB, date = today()) {
    const entries = data.cash.filter((c) => c.date === date);
    const opening = entries.filter((c) => c.type === "opening").reduce((s, c) => s + c.amount, 0);
    const cashIn = entries.filter((c) => c.type === "in").reduce((s, c) => s + c.amount, 0);
    const cashOut = entries.filter((c) => c.type === "out").reduce((s, c) => s + c.amount, 0);
    const adj = entries.filter((c) => c.type === "adjustment").reduce((s, c) => s + c.amount, 0);
    return { opening, cashIn, cashOut, adj, expected: opening + cashIn - cashOut + adj, entries };
  },
  runNightAudit(data: DB) {
    const d = today();
    const roomRevenue = data.bookings
      .filter((b) => ["checked-in", "checked-out"].includes(b.status))
      .reduce((s, b) => s + b.charges.filter((c) => c.kind === "Room" && c.date === d).reduce((x, c) => x + c.amount, 0), 0);
    const fb = data.orders.filter((o) => o.createdAt.slice(0, 10) === d && o.status !== "void")
      .reduce((s, o) => s + orderTotals(o, data).total, 0);
    const collections = data.payments.filter((p) => p.date === d && p.kind === "payment").reduce((s, p) => s + p.amount, 0);
    const expenses = data.expenses.filter((e) => e.date === d).reduce((s, e) => s + e.amount, 0);
    const exceptions: { level: "critical" | "warning"; text: string }[] = [];
    const openOrders = data.orders.filter((o) => o.status === "open" || o.status === "kot");
    if (openOrders.length) exceptions.push({ level: "critical", text: `${openOrders.length} unsettled restaurant order(s)` });
    const dueArrivals = data.bookings.filter((b) => b.status === "confirmed" && b.checkIn < d);
    if (dueArrivals.length) exceptions.push({ level: "warning", text: `${dueArrivals.length} reservation(s) past arrival date — mark as no-show` });
    const dirty = data.rooms.filter((r) => r.status === "dirty").length;
    if (dirty) exceptions.push({ level: "warning", text: `${dirty} room(s) pending housekeeping` });
    return { roomRevenue, fb, collections, expenses, exceptions };
  },
  closeDay(summary: { roomRevenue: number; fb: number; collections: number; expenses: number }) {
    update((d) => {
      d.dayCloses.unshift({
        id: uid("dc"), date: today(), roomRevenue: summary.roomRevenue, fbRevenue: summary.fb,
        otherRevenue: 0, collections: summary.collections, expenses: summary.expenses,
        closedAt: new Date().toISOString(),
      });
    });
  },
  add(entry: { type: "income" | "expense"; category: string; description: string; amount: number; date: string; reference?: string }) {
    update((d) => {
      d.ledger.unshift({ id: uid("le"), ...entry });
    });
  },
};

export function nightAudit(date: string) {
  update((d) => {
    // Post nightly room charges for all in-house guests
    d.bookings.filter((b) => b.status === "checked-in").forEach((b) => {
      const alreadyPostedToday = b.charges.some((c) => c.kind === "Room" && c.date === date && c.description.includes("Night Audit"));
      if (!alreadyPostedToday) {
        const rt = d.roomTypes.find((r) => r.id === b.roomTypeId);
        const rp = d.ratePlans.find((r) => r.id === b.ratePlanId);
        const mealRate = rp?.mealRate ?? 0;
        const chargeAmt = b.rateNight + mealRate * (b.adults + b.children);
        b.charges.push({
          id: uid("ch"), date, kind: "Room",
          description: `Night Audit — ${date}`,
          qty: 1, rate: chargeAmt, amount: chargeAmt, taxRate: d.settings.gstSlabLow,
        });
      }
    });
  });
}


/* ----------------------------- analytics ----------------------------- */
export function dashboardMetrics(data: DB) {
  const d = today();
  const rooms = data.rooms;
  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const available = rooms.filter((r) => r.status === "available").length;
  const dirty = rooms.filter((r) => r.status === "dirty").length;
  const cleaning = rooms.filter((r) => r.status === "cleaning").length;
  const maintenance = rooms.filter((r) => r.status === "maintenance").length;
  const reserved = rooms.filter((r) => r.status === "reserved").length;
  const inHouse = data.bookings.filter((b) => b.status === "checked-in");
  const arrivals = data.bookings.filter((b) => b.checkIn === d && b.status === "confirmed");
  const departures = data.bookings.filter((b) => b.checkOut === d && ["checked-in", "checked-out"].includes(b.status));
  const roomRevenue = inHouse.reduce((s, b) => s + b.rateNight, 0) +
    data.bookings.filter((b) => b.status === "checked-out" && b.checkOut === d).reduce((s, b) => s + b.rateNight, 0);
  const fbRevenue = data.orders
    .filter((o) => o.createdAt.slice(0, 10) === d && o.status !== "void")
    .reduce((s, o) => s + orderTotals(o, data).total, 0);
  const laundryRevenue = data.laundry.reduce((s, l) => s + l.items.reduce((x, i) => x + i.qty * i.rate, 0), 0);
  const banquetRevenue = data.events
    .filter((e) => e.date === d && e.status !== "cancelled")
    .reduce((s, e) => s + e.guests * (data.banquetPackages.find((p) => p.id === e.packageId)?.perPerson ?? 0), 0);
  const occupancy = (occupied / rooms.length) * 100;
  const adr = occupied ? roomRevenue / occupied : 0;
  const revpar = roomRevenue / rooms.length;
  let pendingBills = 0;
  let pendingAmount = 0;
  data.bookings.filter((b) => b.status === "checked-in").forEach((b) => {
    const t = folioTotals(b, data);
    if (t.balance > 1) {
      pendingBills++;
      pendingAmount += t.balance;
    }
  });
  return {
    occupancy, adr, revpar, roomRevenue, fbRevenue, laundryRevenue, banquetRevenue,
    totalRevenue: roomRevenue + fbRevenue + banquetRevenue + laundryRevenue * 0.2,
    occupied, available, dirty, cleaning, maintenance, reserved,
    inHouse: inHouse.length, arrivals: arrivals.length, departures: departures.length,
    pendingBills, pendingAmount, totalRooms: rooms.length,
  };
}

export function revenueSeries(data: DB, days: number) {
  const out: { date: string; room: number; fb: number; banquet: number; laundry: number; other: number; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dt = iso(addDays(new Date(), -i));
    const room = data.bookings
      .filter((b) => b.status !== "cancelled" && b.checkIn <= dt && b.checkOut > dt)
      .reduce((s, b) => s + b.rateNight, 0);
    const fb = data.orders.filter((o) => o.createdAt.slice(0, 10) === dt && o.status !== "void")
      .reduce((s, o) => s + orderTotals(o, data).total, 0) || Math.round(room * 0.42);
    const banquet = data.events.filter((e) => e.date === dt && e.status !== "cancelled")
      .reduce((s, e) => s + e.guests * (data.banquetPackages.find((p) => p.id === e.packageId)?.perPerson ?? 0), 0);
    const laundry = Math.round(room * 0.03);
    const other = Math.round(room * 0.05);
    out.push({ date: dt, room, fb, banquet, laundry, other, total: room + fb + banquet + laundry + other });
  }
  return out;
}

export function sourceAnalytics(data: DB) {
  const map = new Map<string, { source: string; bookings: number; nights: number; revenue: number; cancelled: number }>();
  data.bookings.forEach((b) => {
    const e = map.get(b.source) ?? { source: b.source, bookings: 0, nights: 0, revenue: 0, cancelled: 0 };
    e.bookings++;
    if (b.status === "cancelled") e.cancelled++;
    else {
      e.nights += b.nights;
      e.revenue += b.rateNight * b.nights;
    }
    map.set(b.source, e);
  });
  return [...map.values()]
    .map((e) => ({ ...e, abv: e.bookings ? e.revenue / e.bookings : 0 }))
    .sort((a, b) => b.revenue - a.revenue);
}

/* ----------------------------- roles ----------------------------- */
export const ROLE_ACCESS: Record<Role, string[] | "*"> = {
  Admin: "*",
  "Hotel Manager": "*",
  Receptionist: ["dashboard", "front-office", "rooms", "crm", "restaurant", "banquet", "laundry"],
  "Restaurant Manager": ["dashboard", "restaurant", "inventory", "reports"],
  Waiter: ["dashboard", "restaurant"],
  Chef: ["dashboard", "restaurant", "inventory"],
  Housekeeping: ["dashboard", "rooms", "laundry"],
  Accountant: ["dashboard", "finance", "reports", "front-office", "inventory"],
  HR: ["dashboard", "hr", "reports"],
};

export function setRole(role: Role) {
  update((d) => {
    d.settings.role = role;
  });
}

export function globalSearch(data: DB, q: string) {
  const term = q.trim().toLowerCase();
  if (term.length < 2) return [];
  const res: { type: string; title: string; sub: string; to: string; params?: Record<string, string> }[] = [];
  data.guests.slice(0, 400).forEach((g) => {
    if (g.name.toLowerCase().includes(term) || g.mobile.includes(term) || g.email.toLowerCase().includes(term))
      res.push({ type: "Guest", title: g.name, sub: `${g.mobile} · ${g.city}`, to: `/guests/${g.id}` });
  });
  data.bookings.forEach((b) => {
    const g = data.guests.find((x) => x.id === b.guestId);
    if (b.id.toLowerCase().includes(term) || b.grc.toLowerCase().includes(term) || b.invoiceNo.toLowerCase().includes(term) || g?.name.toLowerCase().includes(term))
      res.push({ type: "Booking", title: `${b.id} · ${g?.name ?? ""}`, sub: `${b.grc} · ${fmtDay(b.checkIn)} → ${fmtDay(b.checkOut)}`, to: `/reservations?q=${b.id}` });
  });
  data.rooms.forEach((r) => {
    if (r.number.includes(term))
      res.push({ type: "Room", title: `Room ${r.number}`, sub: ROOM_STATUS_META[r.status].label, to: `/rooms/grid?q=${r.number}` });
  });
  data.orders.forEach((o) => {
    if (o.number.toLowerCase().includes(term) || o.kot?.toLowerCase().includes(term))
      res.push({ type: "Order", title: o.number, sub: `${o.mode} · ${o.items.length} items`, to: `/restaurant/orders?q=${o.number}` });
  });
  data.employees.forEach((e) => {
    if (e.name.toLowerCase().includes(term) || e.code.toLowerCase().includes(term))
      res.push({ type: "Employee", title: e.name, sub: `${e.designation} · ${e.department}`, to: `/hr/employees?q=${e.name}` });
  });
  data.products.forEach((p) => {
    if (p.name.toLowerCase().includes(term))
      res.push({ type: "Product", title: p.name, sub: `${p.stock} ${p.unit} in stock`, to: `/inventory/products?q=${p.name}` });
  });
  data.payments.slice(0, 200).forEach((p) => {
    if (p.id.toLowerCase().includes(term) || p.reference?.toLowerCase().includes(term))
      res.push({ type: "Payment", title: p.id, sub: `${money(p.amount)} · ${p.mode}`, to: `/finance/payments?q=${p.id}` });
  });
  return res.slice(0, 24);
}

export type { DB, Booking, Guest, Room, MenuItem, POSOrder, Payment };
