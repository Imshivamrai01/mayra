import {
  BedDouble, Boxes, CalendarRange, ChefHat, ClipboardList, CreditCard, Gauge,
  Landmark, PartyPopper, Settings2, Shirt, Sparkles, Users, Utensils, Network, BarChart3,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
}
export interface NavGroup {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  { key: "dashboard", label: "Dashboard", icon: Gauge, items: [{ label: "Overview", to: "/" }] },
  {
    key: "front-office", label: "Front Office", icon: ClipboardList,
    items: [
      { label: "Reservations", to: "/reservations" },
      { label: "Reservation Calendar", to: "/reservations/calendar" },
      { label: "Front Desk", to: "/front-desk" },
      { label: "Room Grid", to: "/rooms/grid" },
      { label: "Guests", to: "/guests" },
      { label: "Folios", to: "/folios" },
      { label: "Check-in", to: "/check-in" },
      { label: "Check-out", to: "/check-out" },
    ],
  },
  {
    key: "rooms", label: "Rooms", icon: BedDouble,
    items: [
      { label: "Room List", to: "/rooms/list" },
      { label: "Room Types", to: "/rooms/types" },
      { label: "Rate Plans", to: "/rooms/rate-plans" },
      { label: "Packages", to: "/rooms/packages" },
      { label: "Room Status", to: "/rooms/status" },
      { label: "Housekeeping", to: "/housekeeping" },
      { label: "Maintenance", to: "/rooms/maintenance" },
    ],
  },
  {
    key: "restaurant", label: "Restaurant", icon: Utensils,
    items: [
      { label: "POS", to: "/pos" },
      { label: "Tables", to: "/restaurant/tables" },
      { label: "Menu", to: "/restaurant/menu" },
      { label: "Modifiers", to: "/restaurant/modifiers" },
      { label: "KOT", to: "/restaurant/kot" },
      { label: "Kitchen Display", to: "/restaurant/kds" },
      { label: "Live Orders", to: "/restaurant/live" },
      { label: "All Orders", to: "/restaurant/orders" },
      { label: "Room Charges", to: "/restaurant/room-charges" },
      { label: "QR Ordering", to: "/restaurant/qr" },
    ],
  },
  {
    key: "inventory", label: "Inventory", icon: Boxes,
    items: [
      { label: "Products", to: "/inventory/products" },
      { label: "Categories", to: "/inventory/categories" },
      { label: "Stock", to: "/inventory/stock" },
      { label: "Purchase Requisition", to: "/inventory/requisition" },
      { label: "Purchase Orders", to: "/inventory/purchase-orders" },
      { label: "GRN", to: "/inventory/grn" },
      { label: "Vendors", to: "/inventory/vendors" },
      { label: "Recipes", to: "/inventory/recipes" },
      { label: "Stock Transfer", to: "/inventory/transfer" },
      { label: "Wastage", to: "/inventory/wastage" },
    ],
  },
  {
    key: "banquet", label: "Banquet", icon: PartyPopper,
    items: [
      { label: "Enquiries", to: "/banquet/enquiries" },
      { label: "Events", to: "/banquet/events" },
      { label: "Halls", to: "/banquet/halls" },
      { label: "Packages", to: "/banquet/packages" },
      { label: "Event Calendar", to: "/banquet/calendar" },
      { label: "Banquet Billing", to: "/banquet/billing" },
    ],
  },
  {
    key: "laundry", label: "Laundry", icon: Shirt,
    items: [
      { label: "Orders", to: "/laundry/orders" },
      { label: "Categories", to: "/laundry/categories" },
      { label: "Laundry Items", to: "/laundry/items" },
      { label: "Vendors", to: "/laundry/vendors" },
      { label: "Loss / Damage", to: "/laundry/damage" },
    ],
  },
  {
    key: "hr", label: "HR", icon: Users,
    items: [
      { label: "Employees", to: "/hr/employees" },
      { label: "Attendance", to: "/hr/attendance" },
      { label: "Shifts", to: "/hr/shifts" },
      { label: "Leave", to: "/hr/leave" },
      { label: "Payroll", to: "/hr/payroll" },
    ],
  },
  {
    key: "finance", label: "Finance", icon: Landmark,
    items: [
      { label: "Cash Management", to: "/finance/cash" },
      { label: "Payments", to: "/finance/payments" },
      { label: "Expenses", to: "/finance/expenses" },
      { label: "Receivables", to: "/finance/receivables" },
      { label: "Payables", to: "/finance/payables" },
      { label: "Ledger", to: "/finance/ledger" },
      { label: "GST", to: "/finance/gst" },
      { label: "Day Closing", to: "/finance/day-closing" },
      { label: "Night Audit", to: "/finance/night-audit" },
    ],
  },
  {
    key: "channel", label: "Channel Manager", icon: Network,
    items: [
      { label: "Overview", to: "/channels/overview" },
      { label: "OTA Calendar", to: "/channels/calendar" },
      { label: "Inventory & Rates", to: "/channels/inventory" },
      { label: "MakeMyTrip", to: "/channels/makemytrip" },
      { label: "Goibibo", to: "/channels/goibibo" },
      { label: "BookMyShow", to: "/channels/bookmyshow" },
      { label: "Direct Booking", to: "/channels/direct" },
      { label: "Room Mapping", to: "/channels/room-mapping" },
      { label: "Rate Mapping", to: "/channels/rate-mapping" },
      { label: "Sync Logs", to: "/channels/logs" },
    ],
  },
  {
    key: "crm", label: "CRM", icon: Sparkles,
    items: [
      { label: "Guests", to: "/crm/guests" },
      { label: "VIP Guests", to: "/crm/vip" },
      { label: "Loyalty", to: "/crm/loyalty" },
      { label: "Feedback", to: "/crm/feedback" },
      { label: "Campaigns", to: "/crm/campaigns" },
    ],
  },
  {
    key: "reports", label: "Reports", icon: BarChart3,
    items: [
      { label: "Hotel Reports", to: "/reports/hotel" },
      { label: "Revenue Reports", to: "/reports/revenue" },
      { label: "POS Reports", to: "/reports/pos" },
      { label: "Inventory Reports", to: "/reports/inventory" },
      { label: "Finance Reports", to: "/reports/finance" },
      { label: "GST Reports", to: "/reports/gst" },
      { label: "HR Reports", to: "/reports/hr" },
      { label: "Channel Reports", to: "/reports/channel" },
      { label: "Audit Reports", to: "/reports/audit" },
    ],
  },
  {
    key: "settings", label: "Settings", icon: Settings2,
    items: [
      { label: "Hotel Settings", to: "/settings/hotel" },
      { label: "Tax Settings", to: "/settings/tax" },
      { label: "Booking Settings", to: "/settings/booking" },
      { label: "Invoice Settings", to: "/settings/invoice" },
      { label: "Users & Roles", to: "/settings/users" },
      { label: "System Settings", to: "/settings/system" },
    ],
  },
];

export const KITCHEN_ICON = ChefHat;
export const PAY_ICON = CreditCard;
export const CAL_ICON = CalendarRange;
