import type {
  DB,
  Booking,
  BookingSource,
  Guest,
  MenuItem,
  Product,
  Room,
  RoomStatus,
} from "./types";

/* deterministic RNG so demo data is stable */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260816);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]!;
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;

export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (d: Date | string, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const today = () => iso(new Date());

const FIRST = [
  "Rahul", "Priya", "Amit", "Neha", "Rohan", "Anjali", "Vikram", "Sneha", "Arjun", "Kavya",
  "Karan", "Pooja", "Siddharth", "Divya", "Manish", "Ritu", "Aditya", "Meera", "Sanjay", "Isha",
  "Nikhil", "Shreya", "Varun", "Tanvi", "Rajesh", "Swati", "Harsh", "Aarti", "Gaurav", "Nisha",
  "Deepak", "Kritika", "Abhishek", "Payal", "Suresh", "Lakshmi", "Imran", "Farah", "Joseph", "Maria",
];
const LAST = [
  "Sharma", "Singh", "Verma", "Gupta", "Kumar", "Patel", "Reddy", "Nair", "Mehta", "Joshi",
  "Chopra", "Malhotra", "Iyer", "Bose", "Desai", "Rao", "Kapoor", "Agarwal", "Khan", "Fernandes",
];
const CITIES: [string, string][] = [
  ["Mumbai", "Maharashtra"], ["Pune", "Maharashtra"], ["Delhi", "Delhi"], ["Gurugram", "Haryana"],
  ["Bengaluru", "Karnataka"], ["Hyderabad", "Telangana"], ["Chennai", "Tamil Nadu"],
  ["Ahmedabad", "Gujarat"], ["Jaipur", "Rajasthan"], ["Kolkata", "West Bengal"],
  ["Indore", "Madhya Pradesh"], ["Lucknow", "Uttar Pradesh"], ["Kochi", "Kerala"], ["Surat", "Gujarat"],
];
const COMPANIES = [
  "Infosys Ltd", "TCS", "Wipro", "HDFC Bank", "Reliance Retail", "Tata Motors", "Zomato",
  "Larsen & Toubro", "Asian Paints", "Bharti Airtel", "",
];
const SOURCES: BookingSource[] = [
  "Direct Website", "MakeMyTrip", "Goibibo", "BookMyShow", "Walk-in", "Phone", "WhatsApp",
  "Corporate", "Travel Agent",
];

const mobile = () => "9" + String(int(100000000, 899999999)).padStart(9, "0");

export function buildSeed(): DB {
  const now = new Date();
  const nowIso = new Date().toISOString();

  const roomTypes = [
    {
      id: "rt-deluxe", name: "Deluxe", code: "DLX",
      description: "Warm 320 sq.ft. room with king bed, work desk and city view.",
      maxOccupancy: 3, beds: 1, baseRate: 4500, extraAdult: 900, extraChild: 500, extraBed: 500,
      amenities: ["AC", "Smart TV", "Wi-Fi", "Mini Bar", "Tea/Coffee", "Safe"], active: true,
    },
    {
      id: "rt-family", name: "Family Room", code: "FAM",
      description: "Spacious 450 sq.ft. room with one king and one twin bed.",
      maxOccupancy: 4, beds: 2, baseRate: 6200, extraAdult: 1000, extraChild: 500, extraBed: 600,
      amenities: ["AC", "Smart TV", "Wi-Fi", "Sofa", "Bath Tub", "Mini Bar"], active: true,
    },
    {
      id: "rt-suite", name: "Suite", code: "STE",
      description: "620 sq.ft. suite with separate living area and premium amenities.",
      maxOccupancy: 4, beds: 2, baseRate: 8900, extraAdult: 1200, extraChild: 600, extraBed: 800,
      amenities: ["AC", "Living Room", "Smart TV", "Wi-Fi", "Bath Tub", "Lounge Access"], active: true,
    },
    {
      id: "rt-premium", name: "Premium", code: "PRM",
      description: "Top floor premium room with balcony and pool view.",
      maxOccupancy: 3, beds: 1, baseRate: 7400, extraAdult: 1100, extraChild: 600, extraBed: 700,
      amenities: ["AC", "Balcony", "Smart TV", "Wi-Fi", "Espresso Machine"], active: true,
    },
  ];

  // 48 rooms across 4 floors
  const typePlan: string[] = [
    ...Array(30).fill("rt-deluxe"),
    ...Array(8).fill("rt-family"),
    ...Array(6).fill("rt-suite"),
    ...Array(4).fill("rt-premium"),
  ];
  const rooms: Room[] = [];
  let ti = 0;
  for (let floor = 1; floor <= 4; floor++) {
    for (let i = 1; i <= 12; i++) {
      const idx = ti++;
      rooms.push({
        id: `room-${floor}${String(i).padStart(2, "0")}`,
        number: `${floor}${String(i).padStart(2, "0")}`,
        floor,
        typeId: typePlan[idx]!,
        status: "available",
      });
    }
  }

  const ratePlans = [
    { id: "rp-ep", code: "EP", name: "European Plan", description: "Room Only (No Meals)", mealRate: 0, active: true },
    { id: "rp-cp", code: "CP", name: "Continental Plan", description: "Room + Breakfast", mealRate: 450, active: true },
    { id: "rp-map", code: "MAP", name: "Modified American Plan", description: "Room + Breakfast + Lunch OR Dinner", mealRate: 950, active: true },
    { id: "rp-ap", code: "AP", name: "American Plan", description: "Room + Breakfast + Lunch + Dinner", mealRate: 1400, active: true },
    { id: "rp-ai", code: "AI", name: "All Inclusive", description: "Room + All Meals + Drinks & Inclusions", mealRate: 1900, active: true },
  ];


  // Guests
  const guests: Guest[] = [];
  for (let i = 0; i < 320; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const [city, state] = pick(CITIES);
    const company = pick(COMPANIES);
    const vip = rnd() < 0.08;
    guests.push({
      id: `g-${i + 1}`,
      salutation: pick(["Mr.", "Ms.", "Mrs.", "Dr."]),
      name: `${first} ${last}`,
      gender: pick(["Male", "Female"]),
      age: int(22, 62),
      mobile: mobile(),
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      city, state,
      address: `${int(1, 120)}, ${pick(["Green Park", "Rose Villa", "MG Road", "Palm Grove", "Lake View"])}, ${city}`,
      nationality: rnd() < 0.94 ? "Indian" : pick(["British", "German", "American", "Nepali"]),
      company: company || undefined,
      idType: pick(["Aadhaar", "PAN", "Passport", "Driving Licence"]),
      idNumber: String(int(100000000000, 999999999999)),
      vip,
      segment: vip ? "VIP" : company ? "Corporate" : pick(["New", "Returning", "OTA", "Direct"]),
      preferences: pick(["High floor", "Non-smoking", "Away from lift", "Early breakfast", "Extra pillows"]),
      createdAt: iso(addDays(now, -int(10, 700))),
    });
  }
  // Signature guests used in the demo script
  guests[0] = { ...guests[0]!, name: "Rahul Sharma", mobile: "9876543210", email: "rahul.sharma@example.com", vip: true, segment: "VIP", city: "Mumbai", state: "Maharashtra" };
  guests[1] = { ...guests[1]!, name: "Priya Singh", mobile: "9812345678", email: "priya.singh@example.com", segment: "OTA" };
  guests[2] = { ...guests[2]!, name: "Amit Verma", mobile: "9823456712", email: "amit.verma@example.com", segment: "OTA" };

  // Bookings
  const bookings: Booking[] = [];
  const payments: DB["payments"] = [];
  const usedRoomToday = new Set<string>();
  const roomsByType: Record<string, Room[]> = {};
  rooms.forEach((r) => (roomsByType[r.typeId] = [...(roomsByType[r.typeId] || []), r]));

  const mkBooking = (i: number, offset: number, nights: number, status: Booking["status"]): Booking => {
    const rt = roomTypes[rnd() < 0.62 ? 0 : int(1, 3)]!;
    const plan = ratePlans[int(0, 3)]!;
    const g = guests[int(0, guests.length - 1)]!;
    const pool = roomsByType[rt.id]!;
    let room = pool[int(0, pool.length - 1)]!;
    const inD = iso(addDays(now, offset));
    const active = status === "checked-in" || (status === "confirmed" && offset <= 0 && offset + nights > 0);
    if (active) {
      const free = pool.filter((r) => !usedRoomToday.has(r.id));
      if (!free.length) return null as unknown as Booking;
      room = free[int(0, free.length - 1)]!;
      usedRoomToday.add(room.id);
    }
    const adults = int(1, 2);
    const source = pick(SOURCES);
    const rate = Math.round((rt.baseRate + int(-4, 8) * 50) / 50) * 50;
    const b: Booking = {
      id: `bk-${i}`,
      grc: `GRC-${2600 + i}`,
      invoiceNo: `AMR/25-26/${1000 + i}`,
      guestId: g.id,
      source,
      roomTypeId: rt.id,
      roomIds: [room.id],
      ratePlanId: plan.id,
      checkIn: inD,
      checkOut: iso(addDays(now, offset + nights)),
      nights,
      adults,
      children: rnd() < 0.2 ? 1 : 0,
      extraBed: rnd() < 0.15 ? 1 : 0,
      rateNight: rate,
      discount: rnd() < 0.25 ? int(2, 10) * 100 : 0,
      status,
      charges: [],
      createdAt: iso(addDays(now, offset - int(1, 25))),
      arrivalFrom: pick(["Mumbai", "Delhi", "Pune", "Bengaluru", "Nashik"]),
      purpose: pick(["Leisure", "Business", "Wedding", "Conference", "Transit"]),
      simulated: ["MakeMyTrip", "Goibibo", "BookMyShow"].includes(source),
    };
    b.charges.push({
      id: `ch-${i}-room`, date: inD, kind: "Room",
      description: `${rt.name} · ${plan.code} · ${nights} night(s)`,
      qty: nights, rate: rate + plan.mealRate * adults,
      amount: (rate + plan.mealRate * adults) * nights, taxRate: rate > 7500 ? 18 : 12,
    });
    if (rnd() < 0.45) {
      const amt = int(4, 26) * 100;
      b.charges.push({ id: `ch-${i}-fb`, date: inD, kind: "Restaurant", description: "Restaurant · Multi-cuisine", qty: 1, rate: amt, amount: amt, taxRate: 5 });
    }
    if (rnd() < 0.7 && status !== "cancelled") {
      const adv = Math.round((b.charges[0]!.amount * (rnd() < 0.5 ? 0.3 : 1)) / 100) * 100;
      payments.push({
        id: `pay-${i}`, bookingId: b.id, date: b.createdAt,
        mode: pick(["Cash", "UPI", "Card", "Bank Transfer"]) as never,
        amount: adv, kind: "payment", reference: `TXN${int(100000, 999999)}`, source,
      });
    }
    return b;
  };

  let n = 0;
  // in-house
  for (let i = 0; i < 74; i++) {
    const b = mkBooking(++n, -int(1, 4), int(2, 6), "checked-in");
    if (b) bookings.push(b);
  }
  // arrivals today
  for (let i = 0; i < 18; i++) {
    const b = mkBooking(++n, 0, int(1, 4), "confirmed");
    if (b) bookings.push(b);
  }
  // future
  for (let i = 0; i < 34; i++) {
    const b = mkBooking(++n, int(1, 40), int(1, 5), "confirmed");
    if (b) bookings.push(b);
  }
  // past
  for (let i = 0; i < 60; i++) {
    const b = mkBooking(++n, -int(5, 90), int(1, 4), "checked-out");
    if (b) bookings.push(b);
  }
  for (let i = 0; i < 8; i++) {
    const b = mkBooking(++n, -int(1, 30), int(1, 3), "cancelled");
    if (b) bookings.push(b);
  }
  // demo OTA bookings
  const otaSpecs: [string, string, string, BookingSource, number, number][] = [
    ["AMR-MMT-1024", "g-1", "rt-deluxe", "MakeMyTrip", 2, 9800],
    ["AMR-GIB-8831", "g-2", "rt-suite", "Goibibo", 3, 18500],
    ["AMR-BMS-2214", "g-3", "rt-family", "BookMyShow", 1, 7200],
  ];
  otaSpecs.forEach(([id, gid, rtid, src, nights, amt], k) => {
    const pool = roomsByType[rtid]!.filter((r) => !usedRoomToday.has(r.id));
    const room = pool[0] ?? roomsByType[rtid]![0]!;
    usedRoomToday.add(room.id);
    const b: Booking = {
      id, grc: `GRC-29${k}0`, invoiceNo: `AMR/25-26/2${k}00`, guestId: gid, source: src,
      roomTypeId: rtid, roomIds: [room.id], ratePlanId: "rp-cp",
      checkIn: iso(addDays(now, k)), checkOut: iso(addDays(now, k + nights)), nights,
      adults: 2, children: 0, extraBed: 0, rateNight: Math.round(amt / nights),
      discount: 0, status: "confirmed",
      charges: [{ id: `${id}-r`, date: iso(addDays(now, k)), kind: "Room", description: `OTA booking · ${nights} night(s)`, qty: nights, rate: Math.round(amt / nights), amount: amt, taxRate: 12 }],
      createdAt: iso(addDays(now, -int(2, 12))), simulated: true,
      purpose: "Leisure", arrivalFrom: "OTA",
    };
    bookings.push(b);
    if (k !== 1) payments.push({ id: `pay-${id}`, bookingId: id, date: b.createdAt, mode: "UPI", amount: amt, kind: "payment", reference: `OTA${int(10000, 99999)}`, source: src });
    else payments.push({ id: `pay-${id}`, bookingId: id, date: b.createdAt, mode: "UPI", amount: 6000, kind: "payment", reference: `OTA${int(10000, 99999)}`, source: src });
  });

  // Room status from bookings
  const roomStatus: Record<string, RoomStatus> = {};
  bookings.forEach((b) => {
    if (b.status === "checked-in") b.roomIds.forEach((r) => (roomStatus[r] = "occupied"));
    else if (b.status === "confirmed" && b.checkIn === today()) b.roomIds.forEach((r) => (roomStatus[r] = roomStatus[r] ?? "reserved"));
  });
  const freeRooms = rooms.filter((r) => !roomStatus[r.id]);
  freeRooms.slice(0, 6).forEach((r) => (roomStatus[r.id] = "dirty"));
  freeRooms.slice(6, 9).forEach((r) => (roomStatus[r.id] = "cleaning"));
  freeRooms.slice(9, 11).forEach((r) => (roomStatus[r.id] = "maintenance"));
  freeRooms.slice(11, 12).forEach((r) => (roomStatus[r.id] = "blocked"));
  rooms.forEach((r) => (r.status = roomStatus[r.id] ?? "available"));

  // Inventory products
  const invCats: [string, string, string[], number][] = [
    ["Vegetables", "kg", ["Onion", "Tomato", "Potato", "Capsicum", "Cabbage", "Carrot", "Spinach", "Cauliflower", "Green Chilli", "Ginger", "Garlic", "Lemon", "Cucumber", "Beans", "Mushroom", "Paneer"], 60],
    ["Dairy", "ltr", ["Milk", "Curd", "Butter", "Fresh Cream", "Cheese Slice", "Ghee", "Khoya", "Condensed Milk"], 220],
    ["Meat & Poultry", "kg", ["Chicken Boneless", "Chicken Curry Cut", "Mutton", "Fish Surmai", "Prawns", "Eggs"], 320],
    ["Groceries", "kg", ["Basmati Rice", "Wheat Flour", "Maida", "Sugar", "Salt", "Toor Dal", "Chana Dal", "Rajma", "Poha", "Semolina", "Besan", "Cornflour", "Refined Oil", "Mustard Oil", "Vinegar", "Soy Sauce"], 95],
    ["Spices", "kg", ["Turmeric", "Red Chilli Powder", "Coriander Powder", "Garam Masala", "Cumin Seeds", "Black Pepper", "Cardamom", "Cloves", "Bay Leaf", "Kasuri Methi", "Tandoori Masala", "Saffron"], 480],
    ["Beverages", "pcs", ["Mineral Water 1L", "Cola 300ml", "Lemon Soda", "Orange Juice", "Tea Leaves", "Coffee Powder", "Green Tea Bags", "Energy Drink"], 45],
    ["Housekeeping", "pcs", ["Floor Cleaner", "Glass Cleaner", "Detergent Powder", "Room Freshener", "Garbage Bag", "Mop Refill", "Toilet Cleaner", "Disinfectant"], 130],
    ["Guest Amenities", "pcs", ["Shampoo Sachet", "Soap Bar", "Body Lotion", "Dental Kit", "Shaving Kit", "Slippers", "Laundry Bag", "Sewing Kit", "Comb", "Shower Cap"], 22],
    ["Linen", "pcs", ["Bed Sheet King", "Bed Sheet Twin", "Pillow Cover", "Bath Towel", "Hand Towel", "Face Towel", "Duvet Cover", "Bath Mat"], 380],
    ["Stationery", "pcs", ["Notepad", "Pen", "Envelope", "Do Not Disturb Card", "Bill Folder", "KOT Roll", "Invoice Roll"], 18],
  ];
  const products: Product[] = [];
  let pid = 0;
  invCats.forEach(([cat, unit, names, base]) => {
    names.forEach((nm) => {
      const variants = cat === "Linen" || cat === "Guest Amenities" ? 2 : 3;
      for (let v = 0; v < variants; v++) {
        pid++;
        const label = v === 0 ? nm : `${nm} ${["", "(Premium)", "(Bulk)"][v]}`.trim();
        const rate = Math.round(base * (0.7 + rnd() * 0.9));
        products.push({
          id: `p-${pid}`, name: label, category: cat, unit,
          stock: Math.round(int(0, 180) * (rnd() < 0.12 ? 0.1 : 1)),
          minStock: int(10, 40), purchaseRate: rate, sellingRate: Math.round(rate * 1.35), active: true,
        });
      }
    });
  });

  const findP = (n2: string) => products.find((p) => p.name === n2)?.id ?? products[0]!.id;

  // Menu
  const menuSpec: [string, [string, number, boolean][]][] = [
    ["Starters", [["Paneer Tikka", 380, true], ["Chicken Tikka", 440, false], ["Malai Broccoli", 360, true], ["Hara Bhara Kebab", 320, true], ["Fish Amritsari", 520, false], ["Mutton Seekh Kebab", 560, false], ["Tandoori Mushroom", 390, true], ["Chilli Paneer Dry", 350, true], ["Crispy Corn", 290, true], ["Chicken Lollipop", 420, false]]],
    ["Main Course", [["Butter Chicken", 520, false], ["Paneer Butter Masala", 420, true], ["Dal Makhani", 340, true], ["Kadhai Paneer", 430, true], ["Rogan Josh", 620, false], ["Chicken Curry", 480, false], ["Palak Paneer", 410, true], ["Malai Kofta", 400, true], ["Egg Curry", 300, false], ["Veg Kolhapuri", 360, true], ["Dal Tadka", 280, true], ["Chana Masala", 300, true]]],
    ["Breads", [["Garlic Naan", 90, true], ["Butter Naan", 80, true], ["Tandoori Roti", 45, true], ["Laccha Paratha", 85, true], ["Missi Roti", 70, true], ["Kulcha", 95, true], ["Rumali Roti", 60, true]]],
    ["Rice & Biryani", [["Hyderabadi Chicken Biryani", 540, false], ["Veg Dum Biryani", 420, true], ["Mutton Biryani", 680, false], ["Jeera Rice", 220, true], ["Steamed Rice", 180, true], ["Veg Pulao", 280, true], ["Curd Rice", 210, true]]],
    ["Chinese", [["Veg Hakka Noodles", 300, true], ["Chicken Fried Rice", 360, false], ["Chilli Chicken", 420, false], ["Manchurian Gravy", 320, true], ["Schezwan Noodles", 330, true], ["Chicken Manchow Soup", 240, false], ["Hot & Sour Soup", 220, true], ["Spring Rolls", 280, true]]],
    ["Beverages", [["Masala Chai", 90, true], ["Filter Coffee", 110, true], ["Cold Coffee", 180, true], ["Fresh Lime Soda", 140, true], ["Mango Lassi", 160, true], ["Buttermilk", 100, true], ["Mineral Water 1L", 60, true], ["Cola 300ml", 80, true], ["Green Tea", 100, true], ["Virgin Mojito", 220, true]]],
    ["Desserts", [["Gulab Jamun", 160, true], ["Gajar Halwa", 180, true], ["Rasmalai", 190, true], ["Chocolate Brownie", 240, true], ["Ice Cream Scoop", 120, true], ["Kheer", 150, true], ["Sizzling Brownie", 320, true]]],
    ["Combos", [["Veg Thali", 480, true], ["Non-Veg Thali", 620, false], ["Executive Lunch Veg", 420, true], ["Executive Lunch Non-Veg", 520, false], ["Breakfast Buffet", 550, true], ["Kids Meal", 320, true], ["High Tea Combo", 380, true], ["Banquet Silver Plate", 950, true], ["Banquet Gold Plate", 1350, false]]],
  ];
  const recipeMap: Record<string, [string, number][]> = {
    "Butter Chicken": [["Chicken Boneless", 0.25], ["Butter", 0.05], ["Fresh Cream", 0.05], ["Tomato", 0.2], ["Garam Masala", 0.01]],
    "Paneer Tikka": [["Paneer", 0.2], ["Curd", 0.05], ["Capsicum", 0.05], ["Tandoori Masala", 0.01]],
    "Garlic Naan": [["Maida", 0.12], ["Garlic", 0.01], ["Butter", 0.01]],
    "Dal Makhani": [["Rajma", 0.05], ["Butter", 0.03], ["Fresh Cream", 0.03]],
    "Hyderabadi Chicken Biryani": [["Basmati Rice", 0.25], ["Chicken Curry Cut", 0.3], ["Curd", 0.08], ["Saffron", 0.001]],
    "Masala Chai": [["Tea Leaves", 0.01], ["Milk", 0.15], ["Sugar", 0.02]],
  };
  const menu: MenuItem[] = [];
  let mi = 0;
  menuSpec.forEach(([cat, items]) => {
    items.forEach(([nm, price, veg]) => {
      mi++;
      menu.push({
        id: `m-${mi}`, name: nm, category: cat, price, veg, active: true,
        modifiers: cat === "Beverages" ? ["Less Sugar", "No Sugar", "Extra Hot"] : cat === "Breads" ? ["Extra Butter", "No Butter"] : ["Less Spicy", "Extra Spicy", "No Onion Garlic", "Jain"],
        recipe: (recipeMap[nm] ?? []).map(([p, q]) => ({ productId: findP(p), qty: q })),
      });
    });
  });

  const tables: DB["tables"] = Array.from({ length: 12 }, (_, i) => ({
    id: `t-${i + 1}`,
    name: `T${String(i + 1).padStart(2, "0")}`,
    seats: i % 3 === 0 ? 6 : 4,
    area: i < 6 ? "Main Dining" : i < 9 ? "Terrace" : "Private",
    status: "available",
  }));

  const vendors: DB["vendors"] = [
    ["Shree Balaji Traders", "Groceries", "Nitin Shah"], ["Fresh Farm Vegetables", "Vegetables", "Ramesh Patil"],
    ["Amul Distributor", "Dairy", "Sunil More"], ["Coastal Meats", "Meat & Poultry", "Iqbal Shaikh"],
    ["Hindustan Beverages", "Beverages", "Anil Jain"], ["CleanPro Supplies", "Housekeeping", "Deepa Rao"],
    ["Hotel Linen House", "Linen", "Vikas Bansal"], ["Aroma Amenities", "Guest Amenities", "Sneha Kulkarni"],
    ["SwiftPrint Stationery", "Stationery", "Manoj Gupta"], ["Sparkle Laundry Services", "Laundry", "Rakesh Yadav"],
  ].map(([name, category, contact], i) => ({
    id: `v-${i + 1}`, name: name as string, contact: contact as string, phone: mobile(),
    email: `${(name as string).toLowerCase().replace(/[^a-z]/g, "")}@vendors.in`,
    gstin: `27${["AABCU", "AAFCS", "AADCB"][i % 3]}${int(1000, 9999)}${["A", "B", "C"][i % 3]}1Z${i}`,
    address: `${pick(CITIES)[0]}, India`, category: category as string,
    outstanding: rnd() < 0.6 ? int(20, 480) * 100 : 0, active: true,
  }));

  // HR
  const deps: [string, string[]][] = [
    ["Front Office", ["Front Office Manager", "Receptionist", "Guest Relations", "Bell Captain"]],
    ["Housekeeping", ["Executive Housekeeper", "Room Attendant", "Laundry Attendant", "Supervisor"]],
    ["F&B Service", ["Restaurant Manager", "Captain", "Steward", "Bartender"]],
    ["Kitchen", ["Executive Chef", "Sous Chef", "Commis", "Kitchen Steward"]],
    ["Maintenance", ["Chief Engineer", "Electrician", "Plumber", "Technician"]],
    ["Accounts", ["Accounts Manager", "Cashier", "Night Auditor"]],
    ["HR & Admin", ["HR Manager", "Admin Executive", "Security"]],
    ["Sales", ["Sales Manager", "Banquet Executive", "Reservation Executive"]],
  ];
  const employees: DB["employees"] = [];
  for (let i = 0; i < 56; i++) {
    const [dep, desigs] = deps[i % deps.length]!;
    employees.push({
      id: `e-${i + 1}`, code: `MYR-E${String(101 + i)}`,
      name: `${pick(FIRST)} ${pick(LAST)}`, department: dep, designation: pick(desigs),
      phone: mobile(), joining: iso(addDays(now, -int(60, 2000))),
      salary: int(16, 95) * 1000, shift: pick(["Morning (7-3)", "Evening (3-11)", "Night (11-7)", "General (9-6)"]),
      status: rnd() < 0.95 ? "active" : "inactive",
    });
  }
  const attendance: DB["attendance"] = [];
  for (let d = 0; d < 14; d++) {
    const date = iso(addDays(now, -d));
    employees.forEach((e) => {
      const r = rnd();
      attendance.push({
        id: `at-${e.id}-${d}`, employeeId: e.id, date,
        status: r < 0.82 ? "Present" : r < 0.88 ? "Late" : r < 0.93 ? "Leave" : r < 0.97 ? "Half Day" : "Absent",
      });
    });
  }
  const leaves: DB["leaves"] = employees.slice(0, 12).map((e, i) => ({
    id: `lv-${i}`, employeeId: e.id, from: iso(addDays(now, int(1, 10))), to: iso(addDays(now, int(11, 15))),
    type: pick(["Casual", "Sick", "Earned", "Comp Off"]), reason: pick(["Family function", "Medical", "Personal work", "Travel"]),
    status: i % 3 === 0 ? "pending" : i % 3 === 1 ? "approved" : "rejected",
  }));

  // Housekeeping / maintenance
  const hkTasks: DB["hkTasks"] = rooms
    .filter((r) => ["dirty", "cleaning", "inspection"].includes(r.status))
    .map((r, i) => ({
      id: `hk-${i}`, roomId: r.id, type: pick(["Checkout Cleaning", "Stayover", "Deep Cleaning", "Amenities Refill"]),
      assignedTo: pick(employees.filter((e) => e.department === "Housekeeping")).name,
      priority: pick(["Low", "Medium", "High"]) as never,
      status: r.status as never, createdAt: nowIso,
    }));
  const tickets: DB["tickets"] = rooms.filter((r) => r.status === "maintenance").map((r, i) => ({
    id: `mt-${i}`, roomId: r.id, issue: pick(["AC not cooling", "Geyser leakage", "TV remote faulty", "Bathroom drainage slow"]),
    priority: "High" as const, assignedTo: pick(employees.filter((e) => e.department === "Maintenance")).name,
    status: "in-progress" as const, createdAt: nowIso,
  }));
  ["Lobby light flickering", "Lift door sensor", "Pool pump noise", "Kitchen exhaust cleaning"].forEach((issue, i) =>
    tickets.push({
      id: `mt-a${i}`, area: pick(["Lobby", "Lift Block", "Pool", "Kitchen"]), issue,
      priority: pick(["Low", "Medium", "High"]) as never,
      assignedTo: pick(employees.filter((e) => e.department === "Maintenance")).name,
      status: pick(["open", "in-progress", "resolved"]) as never, createdAt: nowIso,
    }),
  );

  // Laundry
  const inhouse = bookings.filter((b) => b.status === "checked-in");
  const laundry: DB["laundry"] = inhouse.slice(0, 9).map((b, i) => {
    const g = guests.find((x) => x.id === b.guestId)!;
    const room = rooms.find((r) => r.id === b.roomIds[0]);
    return {
      id: `ln-${i + 1}`, number: `LND-${3100 + i}`, bookingId: b.id, guestName: g.name, roomNo: room?.number,
      items: [
        { name: pick(["Shirt", "Trouser", "Saree", "Kurta", "Suit"]), qty: int(1, 4), rate: int(6, 18) * 10 },
        { name: pick(["Jeans", "T-Shirt", "Dress", "Blazer"]), qty: int(1, 3), rate: int(8, 22) * 10 },
      ],
      status: pick(["received", "washing", "ironing", "ready", "delivered"]) as never,
      vendorId: "v-10", createdAt: nowIso, postedToFolio: rnd() < 0.4, express: rnd() < 0.3,
    };
  });

  // Banquet
  const halls: DB["halls"] = [
    { id: "h-1", name: "Mayur Grand Ballroom", capacity: 500, rate: 120000, status: "available" },
    { id: "h-2", name: "Emerald Hall", capacity: 250, rate: 65000, status: "available" },
    { id: "h-3", name: "Ruby Conference Room", capacity: 80, rate: 28000, status: "available" },
    { id: "h-4", name: "Terrace Lawn", capacity: 350, rate: 90000, status: "available" },
  ];
  const banquetPackages: DB["banquetPackages"] = [
    { id: "bp-1", name: "Silver Veg", perPerson: 950, type: "Veg", inclusions: "Welcome drink, 2 starters, 4 mains, dessert" },
    { id: "bp-2", name: "Gold Veg", perPerson: 1350, type: "Veg", inclusions: "4 starters, live counter, 6 mains, 3 desserts" },
    { id: "bp-3", name: "Gold Non-Veg", perPerson: 1650, type: "Non-Veg", inclusions: "5 starters, 7 mains, live grill, desserts" },
    { id: "bp-4", name: "Corporate Hi-Tea", perPerson: 650, type: "Veg", inclusions: "Tea/coffee, 4 snacks, 1 dessert" },
  ];
  const events: DB["events"] = Array.from({ length: 10 }, (_, i) => ({
    id: `ev-${i + 1}`, code: `BQ-${5100 + i}`,
    name: pick(["Sharma Wedding Reception", "Annual Sales Meet", "Birthday Celebration", "Product Launch", "Engagement Ceremony", "Corporate Offsite"]),
    customer: `${pick(FIRST)} ${pick(LAST)}`, phone: mobile(),
    date: iso(addDays(now, int(-15, 45))), time: pick(["11:00", "13:00", "19:00", "20:00"]),
    guests: int(60, 420), hallId: pick(halls).id, packageId: pick(banquetPackages).id,
    decoration: int(0, 60) * 1000, otherCharges: int(0, 25) * 1000, discount: int(0, 20) * 1000,
    advance: int(20, 150) * 1000, status: pick(["enquiry", "confirmed", "confirmed", "completed"]) as never,
  }));

  // Finance
  const expenses: DB["expenses"] = Array.from({ length: 42 }, (_, i) => ({
    id: `ex-${i + 1}`, date: iso(addDays(now, -int(0, 30))),
    category: pick(["Utilities", "Salaries", "Maintenance", "Purchases", "Marketing", "Fuel", "Miscellaneous"]),
    description: pick(["Electricity bill", "Diesel for generator", "Plumbing repair", "Google Ads", "Vegetable purchase", "Staff welfare", "Water tanker"]),
    amount: int(8, 480) * 100, mode: pick(["Cash", "UPI", "Bank Transfer", "Card"]), paidTo: pick(vendors).name,
  }));
  const cash: DB["cash"] = [
    { id: "c-open", date: today(), type: "opening", amount: 25000, note: "Opening cash balance" },
    { id: "c-1", date: today(), type: "in", amount: 18400, note: "Front desk cash collection" },
    { id: "c-2", date: today(), type: "out", amount: 4200, note: "Vegetable purchase" },
  ];
  const dayCloses: DB["dayCloses"] = Array.from({ length: 6 }, (_, i) => ({
    id: `dc-${i}`, date: iso(addDays(now, -(i + 1))),
    roomRevenue: int(240, 380) * 1000, fbRevenue: int(120, 220) * 1000, otherRevenue: int(20, 70) * 1000,
    collections: int(300, 560) * 1000, expenses: int(40, 90) * 1000, closedAt: nowIso,
  }));

  // Channels
  const channels: DB["channels"] = [
    { id: "ch-mmt", name: "MakeMyTrip", connected: true, lastSync: nowIso, commission: 18 },
    { id: "ch-gib", name: "Goibibo", connected: true, lastSync: nowIso, commission: 17 },
    { id: "ch-bms", name: "BookMyShow", connected: true, lastSync: nowIso, commission: 15 },
    { id: "ch-dir", name: "Direct Website", connected: true, lastSync: nowIso, commission: 0 },
  ];
  const mappings: DB["mappings"] = [];
  channels.filter((c) => c.name !== "Direct Website").forEach((c) => {
    roomTypes.forEach((rt) =>
      mappings.push({ id: `map-${c.id}-${rt.id}`, channel: c.name, local: rt.name, remote: `${rt.name} Room`, kind: "room" }),
    );
    ["EP", "CP", "MAP"].forEach((rp) =>
      mappings.push({ id: `rmap-${c.id}-${rp}`, channel: c.name, local: `AMARA ${rp}`, remote: `${c.name.slice(0, 3).toUpperCase()} ${rp}`, kind: "rate" }),
    );
  });
  const syncLogs: DB["syncLogs"] = Array.from({ length: 14 }, (_, i) => ({
    id: `sl-${i}`, time: new Date(Date.now() - i * 1000 * 60 * 37).toISOString(),
    channel: pick(channels).name, action: pick(["Inventory Updated", "Rate Pushed", "Booking Pulled", "Restriction Updated"]),
    detail: pick(["Deluxe 5 → 4", "Suite ₹8,900 → ₹9,400", "1 new reservation", "CTA removed for 12 Aug"]),
    status: rnd() < 0.9 ? "SUCCESS" : "WARNING",
  }));

  // CRM
  const feedback: DB["feedback"] = Array.from({ length: 26 }, (_, i) => ({
    id: `fb-${i}`, guestId: `g-${int(1, 300)}`, date: iso(addDays(now, -int(0, 45))),
    rating: rnd() < 0.7 ? int(4, 5) : int(2, 3), category: pick(["Room", "Restaurant", "Staff", "Housekeeping", "Check-in"]),
    comment: pick(["Excellent service and very clean rooms.", "Breakfast spread could be better.", "Staff was courteous and quick.", "AC took time to cool.", "Loved the suite and the view.", "Check-in was slightly slow."]),
    resolved: rnd() < 0.6,
  }));
  const campaigns: DB["campaigns"] = [
    { id: "cp-1", name: "Monsoon Staycation 20% Off", channel: "Email", segment: "Returning", sent: 1840, opened: 712, status: "sent", date: iso(addDays(now, -12)) },
    { id: "cp-2", name: "Diwali Banquet Enquiry Drive", channel: "WhatsApp", segment: "Corporate", sent: 420, opened: 288, status: "sent", date: iso(addDays(now, -4)) },
    { id: "cp-3", name: "VIP Loyalty Upgrade Offer", channel: "SMS", segment: "VIP", sent: 0, opened: 0, status: "scheduled", date: iso(addDays(now, 6)) },
  ];

  // POS orders (today)
  const orders: DB["orders"] = [];
  for (let i = 0; i < 26; i++) {
    const items = Array.from({ length: int(1, 4) }, (_, k) => {
      const m = pick(menu);
      return { id: `oi-${i}-${k}`, menuItemId: m.id, name: m.name, price: m.price, qty: int(1, 3), modifiers: [] };
    });
    const settled = i > 5;
    orders.push({
      id: `o-${i + 1}`, number: `ORD-${1020 + i}`, kot: `KOT-${420 + i}`,
      mode: pick(["Dine In", "Dine In", "Takeaway", "Room Charge", "Delivery"]) as never,
      tableId: pick(tables).id, waiter: pick(employees.filter((e) => e.department === "F&B Service")).name,
      items, discount: rnd() < 0.2 ? 100 : 0,
      status: settled ? "settled" : "kot",
      kds: settled ? "served" : (pick(["new", "preparing", "ready"]) as never),
      createdAt: new Date(Date.now() - i * 1000 * 60 * 23).toISOString(),
      settledAt: settled ? new Date(Date.now() - i * 1000 * 60 * 18).toISOString() : undefined,
      paymentMode: settled ? pick(["Cash", "UPI", "Card"]) : undefined,
    });
  }
  orders.filter((o) => o.status === "kot").forEach((o) => {
    const t = tables.find((x) => x.id === o.tableId);
    if (t && o.mode === "Dine In") t.status = "occupied";
  });
  tables[9]!.status = "reserved";
  tables[11]!.status = "cleaning";

  const stockMoves: DB["stockMoves"] = products.slice(0, 40).map((p, i) => ({
    id: `sm-${i}`, date: iso(addDays(now, -int(0, 12))), productId: p.id,
    qty: int(5, 60), type: "purchase", ref: `GRN-${800 + i}`,
  }));

  const purchases: DB["purchases"] = Array.from({ length: 12 }, (_, i) => {
    const type = i < 4 ? "requisition" : i < 8 ? "po" : "grn";
    return {
      id: `pu-${i + 1}`,
      number: `${type === "requisition" ? "PR" : type === "po" ? "PO" : "GRN"}-${900 + i}`,
      type: type as never, vendorId: pick(vendors).id, date: iso(addDays(now, -int(0, 20))),
      status: type === "requisition" ? (i % 2 ? "pending" : "approved") : type === "po" ? "approved" : "received",
      items: Array.from({ length: int(2, 4) }, () => {
        const p = pick(products);
        return { productId: p.id, qty: int(5, 40), rate: p.purchaseRate };
      }),
    };
  });

  return {
    version: 1,
    settings: {
      hotelName: "HOTEL AMARA", legalName: "Amara Hospitality Pvt. Ltd.",
      address: "Plot 12, Riverside Road, Koregaon Park, Pune 411001",
      phone: "+91 20 4988 1200", email: "reservations@hotelamara.in",
      gstin: "27AAGCM1234K1ZP", state: "Maharashtra", currency: "₹",
      gstSlabLow: 12, gstSlabHigh: 18, gstThreshold: 7500, fbTax: 5,
      checkInTime: "14:00", checkOutTime: "11:00",
      invoicePrefix: "AMR/25-26/", grcPrefix: "GRC-",
      terms: "Tariff is subject to applicable GST. Check-out at 11:00 AM. Late check-out subject to availability.",
      role: "Admin", user: "Admin",
    },
    roomTypes, rooms, ratePlans, guests, bookings, payments, menu, tables, orders,
    products, vendors, purchases, stockMoves, hkTasks, tickets, laundry, halls,
    banquetPackages, events, employees, attendance, leaves, expenses, cash, dayCloses,
    channels, syncLogs, mappings, feedback, campaigns,
    otaListings: [],
    ledger: [
      { id: "le-1", type: "income", category: "Room Revenue", description: "Room charges collected", amount: 85000, date: today(), reference: "NA-001" },
      { id: "le-2", type: "income", category: "Restaurant Revenue", description: "F&B sales", amount: 24000, date: today(), reference: "ORD-batch" },
      { id: "le-3", type: "expense", category: "Salaries", description: "Staff salaries — August", amount: 150000, date: iso(addDays(now, -5)), reference: "SAL-AUG" },
      { id: "le-4", type: "expense", category: "Utilities", description: "Electricity bill", amount: 28000, date: iso(addDays(now, -10)), reference: "ELEC-AUG" },
      { id: "le-5", type: "expense", category: "Food & Beverage", description: "Raw material purchase", amount: 42000, date: iso(addDays(now, -3)), reference: "GRN-batch" },
    ],
    counters: { booking: 400, order: 1100, kot: 500, grc: 3000, invoice: 3000, payment: 900, hk: 700, ticket: 700, laundry: 3200, event: 5200, purchase: 950, guest: 400, po: 1020, le: 10 },

  };
}
