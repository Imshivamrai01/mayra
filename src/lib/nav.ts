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
      { label: "⚡ EZ Room Dashboard", to: "/ez-dashboard" },
      { label: "Reservations", to: "/reservations" },
      { label: "Calendar View", to: "/reservations/calendar" },
      { label: "Front Desk Operations", to: "/front-desk" },
      { label: "Room Matrix / Grid", to: "/rooms/grid" },
      { label: "Guest Directory", to: "/guests" },
      { label: "Guest Folios & Billing", to: "/folios" },
      { label: "Express Check-in", to: "/check-in" },
      { label: "Express Check-out", to: "/check-out" },
    ],
  },
  {
    key: "rooms", label: "Rooms & HK", icon: BedDouble,
    items: [
      { label: "Room Inventory", to: "/rooms/list" },
      { label: "Housekeeping Board", to: "/housekeeping" },
      { label: "Maintenance Tickets", to: "/rooms/maintenance" },
    ],
  },
  {
    key: "restaurant", label: "Restaurant & POS", icon: Utensils,
    items: [
      { label: "Point of Sale (POS)", to: "/pos" },
      { label: "Cashier & Billing Desk", to: "/restaurant/billing" },
      { label: "Kitchen Display (KDS)", to: "/restaurant/kds" },
      { label: "Table Floor Plan", to: "/restaurant/tables" },
      { label: "All Orders & History", to: "/restaurant/orders" },
      { label: "Menu Management", to: "/restaurant/menu" },
    ],
  },
  {
    key: "inventory", label: "Inventory & Stores", icon: Boxes,
    items: [
      { label: "Stock & Products", to: "/inventory/products" },
      { label: "Purchase Orders & GRN", to: "/inventory/grn" },
    ],
  },
  {
    key: "banquet", label: "Banquet & Events", icon: PartyPopper,
    items: [
      { label: "Banquet Events & Billing", to: "/banquet/events" },
    ],
  },
  {
    key: "laundry", label: "Laundry", icon: Shirt,
    items: [
      { label: "Laundry Orders", to: "/laundry/orders" },
    ],
  },
  {
    key: "hr", label: "Human Resources", icon: Users,
    items: [
      { label: "Staff Directory & Payroll", to: "/hr/staff" },
    ],
  },
  {
    key: "finance", label: "Finance & Accounts", icon: Landmark,
    items: [
      { label: "Income & Expense Ledger", to: "/finance/ledger" },
    ],
  },
  {
    key: "channel", label: "Channel Manager", icon: Network,
    items: [
      { label: "OTA Channel Manager", to: "/channel-manager" },
    ],
  },
  {
    key: "crm", label: "CRM & Feedback", icon: Sparkles,
    items: [
      { label: "Guest Satisfaction & Reviews", to: "/crm/feedback" },
    ],
  },
  {
    key: "reports", label: "Reports & Analytics", icon: BarChart3,
    items: [
      { label: "Revenue & ADR Analytics", to: "/reports/revenue" },
      { label: "Occupancy & RevPAR", to: "/reports/occupancy" },
      { label: "Night Audit & Day Close", to: "/reports/audit" },
    ],
  },
  {
    key: "settings", label: "Settings", icon: Settings2,
    items: [
      { label: "Hotel & Billing Config", to: "/settings/hotel" },
    ],
  },
];

export const KITCHEN_ICON = ChefHat;
export const PAY_ICON = CreditCard;
export const CAL_ICON = CalendarRange;
