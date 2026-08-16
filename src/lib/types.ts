export type ID = string;

export type RoomStatus =
  | "available"
  | "reserved"
  | "occupied"
  | "dirty"
  | "cleaning"
  | "inspection"
  | "maintenance"
  | "blocked";

export interface RoomType {
  id: ID;
  name: string;
  code: string;
  description: string;
  maxOccupancy: number;
  beds: number;
  baseRate: number;
  extraAdult: number;
  extraChild: number;
  extraBed: number;
  amenities: string[];
  active: boolean;
}

export interface Room {
  id: ID;
  number: string;
  floor: number;
  typeId: ID;
  status: RoomStatus;
  note?: string;
}

export interface RatePlan {
  id: ID;
  code: string;
  name: string;
  description: string;
  /** per person per night meal supplement */
  mealRate: number;
  active: boolean;
}

export interface Guest {
  id: ID;
  salutation: string;
  name: string;
  gender: string;
  age?: number;
  mobile: string;
  whatsapp?: string;
  email: string;
  address?: string;
  city: string;
  state: string;
  nationality: string;
  dob?: string;
  anniversary?: string;
  company?: string;
  idType: string;
  idNumber: string;
  vip: boolean;
  segment: "New" | "Returning" | "VIP" | "Corporate" | "OTA" | "Direct";
  preferences?: string;
  notes?: string;
  createdAt: string;
}

export type OTAChannel =
  | "MakeMyTrip"
  | "Goibibo"
  | "Booking.com"
  | "Expedia"
  | "Agoda"
  | "Airbnb"
  | "Yatra";

export interface OTAListing {
  id: ID;
  channel: OTAChannel;
  roomTypeId: ID;
  enabled: boolean;
  markup: number;
  minStay: number;
  availability: number;
}

export type BookingSource =
  | "Direct Website"
  | "MakeMyTrip"
  | "Goibibo"
  | "BookMyShow"
  | "Walk-in"
  | "Phone"
  | "WhatsApp"
  | "Corporate"
  | "Travel Agent";

export type BookingStatus =
  | "confirmed"
  | "checked-in"
  | "checked-out"
  | "cancelled"
  | "no-show";

export type ChargeKind =
  | "Room"
  | "Restaurant"
  | "Room Service"
  | "Laundry"
  | "Banquet"
  | "Other"
  | "Discount";

export interface FolioCharge {
  id: ID;
  date: string;
  kind: ChargeKind;
  description: string;
  qty: number;
  rate: number;
  amount: number;
  taxRate: number;
  billingType?: "GST" | "NON-GST";
  ref?: string;
}

export interface Payment {
  id: ID;
  bookingId?: ID;
  date: string;
  mode: "Cash" | "UPI" | "Card" | "Bank Transfer" | "Wallet";
  amount: number;
  kind: "payment" | "refund";
  reference?: string;
  note?: string;
  source?: string;
}

export interface Booking {
  id: ID;
  grc: string;
  invoiceNo: string;
  guestId: ID;
  source: BookingSource;
  billingType?: "GST" | "NON-GST";
  companyGstin?: string;
  roomTypeId: ID;
  roomIds: ID[];
  ratePlanId: ID;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  extraBed: number;
  rateNight: number;
  discount: number;
  status: BookingStatus;
  charges: FolioCharge[];
  createdAt: string;
  checkInTime?: string;
  checkOutTime?: string;
  arrivalFrom?: string;
  purpose?: string;
  remarks?: string;
  simulated?: boolean;
}

export interface MenuItem {
  id: ID;
  name: string;
  category: string;
  price: number;
  veg: boolean;
  active: boolean;
  modifiers: string[];
  recipe: { productId: ID; qty: number }[];
}

export type TableStatus = "available" | "occupied" | "reserved" | "billing" | "cleaning";
export interface RTable {
  id: ID;
  name: string;
  seats: number;
  area: string;
  status: TableStatus;
}

export type OrderMode =
  | "Dine In"
  | "Takeaway"
  | "Room Charge"
  | "Delivery"
  | "Banquet"
  | "Complimentary";
export type KdsStatus = "new" | "preparing" | "ready" | "served";
export interface OrderItem {
  id: ID;
  menuItemId: ID;
  name: string;
  price: number;
  qty: number;
  modifiers: string[];
  note?: string;
}
export interface POSOrder {
  id: ID;
  number: string;
  kot?: string;
  mode: OrderMode;
  tableId?: ID;
  bookingId?: ID;
  roomId?: ID;
  waiter: string;
  items: OrderItem[];
  discount: number;
  status: "open" | "kot" | "settled" | "void" | "posted";
  kds: KdsStatus;
  createdAt: string;
  settledAt?: string;
  paymentMode?: string;
}

export interface Product {
  id: ID;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  purchaseRate: number;
  sellingRate: number;
  active: boolean;
}

export interface Vendor {
  id: ID;
  name: string;
  contact: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  category: string;
  outstanding: number;
  active: boolean;
}

export interface PurchaseDoc {
  id: ID;
  number: string;
  type: "requisition" | "po" | "grn";
  vendorId?: ID;
  date: string;
  status: "draft" | "pending" | "approved" | "rejected" | "received";
  items: { productId: ID; qty: number; rate: number }[];
  linkedTo?: ID;
  note?: string;
}

export interface StockMove {
  id: ID;
  date: string;
  productId: ID;
  qty: number;
  type: "purchase" | "consumption" | "wastage" | "transfer" | "adjustment";
  ref?: string;
  note?: string;
}

export interface HKTask {
  id: ID;
  roomId: ID;
  type: string;
  assignedTo: string;
  priority: "Low" | "Medium" | "High";
  status: "dirty" | "cleaning" | "inspection" | "ready";
  createdAt: string;
  completedAt?: string;
}

export interface MaintTicket {
  id: ID;
  roomId?: ID;
  area?: string;
  issue: string;
  priority: "Low" | "Medium" | "High";
  assignedTo: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  createdAt: string;
  resolvedAt?: string;
}

export interface LaundryOrder {
  id: ID;
  number: string;
  bookingId?: ID;
  guestName: string;
  roomNo?: string;
  items: { name: string; qty: number; rate: number }[];
  status: "received" | "washing" | "ironing" | "ready" | "delivered";
  vendorId?: ID;
  createdAt: string;
  postedToFolio: boolean;
  express: boolean;
}

export interface Hall {
  id: ID;
  name: string;
  capacity: number;
  rate: number;
  status: "available" | "blocked";
}
export interface BanquetPackage {
  id: ID;
  name: string;
  perPerson: number;
  type: string;
  inclusions: string;
}
export interface BanquetEvent {
  id: ID;
  code: string;
  name: string;
  customer: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  hallId: ID;
  packageId: ID;
  decoration: number;
  otherCharges: number;
  discount: number;
  advance: number;
  status: "enquiry" | "confirmed" | "completed" | "cancelled";
  notes?: string;
}

export interface Employee {
  id: ID;
  code?: string;
  name: string;
  department: string;
  designation: string;
  phone?: string;
  mobile?: string;
  email?: string;
  joining?: string;
  joinDate?: string;
  salary: number;
  shift?: string;
  status: "active" | "inactive";
}
export interface Attendance {
  id: ID;
  employeeId: ID;
  date: string;
  status: "Present" | "Absent" | "Late" | "Half Day" | "Leave";
}
export interface LeaveReq {
  id: ID;
  employeeId: ID;
  from: string;
  to: string;
  type: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

export interface Expense {
  id: ID;
  date: string;
  category: string;
  description: string;
  amount: number;
  mode: string;
  paidTo: string;
}
export interface CashEntry {
  id: ID;
  date: string;
  type: "in" | "out" | "opening" | "adjustment";
  amount: number;
  note: string;
}
export interface DayClose {
  id: ID;
  date: string;
  roomRevenue: number;
  fbRevenue: number;
  otherRevenue: number;
  collections: number;
  expenses: number;
  closedAt: string;
}

export interface Channel {
  id: ID;
  name: string;
  connected: boolean;
  lastSync: string;
  commission: number;
}
export interface SyncLog {
  id: ID;
  time: string;
  channel: string;
  action: string;
  detail: string;
  status: "SUCCESS" | "FAILED" | "WARNING";
}
export interface Mapping {
  id: ID;
  channel: string;
  local: string;
  remote: string;
  kind: "room" | "rate";
}

export interface Feedback {
  id: ID;
  guestId: ID;
  bookingId?: ID;
  date: string;
  rating: number;
  category: string;
  comment: string;
  source?: string;
  resolved: boolean;
}

// Alias for clarity
export type GuestFeedback = Feedback;
export interface Campaign {
  id: ID;
  name: string;
  channel: string;
  segment: string;
  sent: number;
  opened: number;
  status: "draft" | "scheduled" | "sent";
  date: string;
}

export type Role =
  | "Admin"
  | "Hotel Manager"
  | "Receptionist"
  | "Restaurant Manager"
  | "Waiter"
  | "Chef"
  | "Housekeeping"
  | "Accountant"
  | "HR";

export interface Settings {
  hotelName: string;
  legalName: string;
  address: string;
  address1?: string;
  address2?: string;
  city?: string;
  state: string;
  pincode?: string;
  country?: string;
  phone: string;
  email: string;
  website?: string;
  gstin: string;
  currency: string;
  gstSlabLow: number;
  gstSlabHigh: number;
  gstThreshold: number;
  fbTax: number;
  fbTaxRate?: number;
  luxuryTaxRate?: number;
  taxRate?: number;
  checkInTime: string;
  checkOutTime: string;
  invoicePrefix: string;
  grcPrefix: string;
  propertyCode?: string;
  invoiceNumber?: string;
  paymentTerms?: string;
  sessionTimeout?: string;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
  whatsappEnabled?: boolean;
  terms: string;
  role: Role;
  user: string;
}

export interface LedgerEntry {
  id: ID;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  date: string;
  reference?: string;
}

export interface DB {
  version: number;
  settings: Settings;
  roomTypes: RoomType[];
  rooms: Room[];
  ratePlans: RatePlan[];
  guests: Guest[];
  bookings: Booking[];
  payments: Payment[];
  menu: MenuItem[];
  tables: RTable[];
  orders: POSOrder[];
  products: Product[];
  vendors: Vendor[];
  purchases: PurchaseDoc[];
  stockMoves: StockMove[];
  hkTasks: HKTask[];
  tickets: MaintTicket[];
  laundry: LaundryOrder[];
  halls: Hall[];
  banquetPackages: BanquetPackage[];
  events: BanquetEvent[];
  employees: Employee[];
  attendance: Attendance[];
  leaves: LeaveReq[];
  expenses: Expense[];
  cash: CashEntry[];
  dayCloses: DayClose[];
  channels: Channel[];
  syncLogs: SyncLog[];
  mappings: Mapping[];
  otaListings: OTAListing[];
  feedback: Feedback[];
  campaigns: Campaign[];
  ledger: LedgerEntry[];
  counters: Record<string, number>;
}
