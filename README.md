# Mayra Hospitality Suite

You are a senior product architect, UX designer and frontend engineer.

Build a COMPLETE, PREMIUM, FULLY WORKING FRONTEND-ONLY Hotel ERP + PMS + POS for a hotel named:

MAYRA

IMPORTANT:

This is a CLIENT DEMO PRODUCT.

DO NOT BUILD A BACKEND.

DO NOT CREATE A DATABASE SERVER.

DO NOT CREATE API ENDPOINTS.

DO NOT CONNECT TO REAL MMT, GOIBIBO, BOOKMYSHOW OR PAYMENT APIs.

DO NOT REQUIRE ENVIRONMENT VARIABLES.

DO NOT REQUIRE API KEYS.

DO NOT ASK ME QUESTIONS.

DO NOT STOP AFTER CREATING A BASIC UI.

DO NOT CREATE EMPTY PLACEHOLDER PAGES.

Everything must work on the frontend using realistic mock data and browser persistence.

Use localStorage / IndexedDB or a lightweight frontend state store wherever necessary.

The architecture must be designed so that a real backend can be connected later without rewriting the UI.

==================================================

1. CORE PRODUCT

==================================================

Product name:

MAYRA HOTEL ERP

Product type:

Hotel Property Management System + Restaurant POS + Hotel ERP + Channel Manager Demo

The system should feel like a serious commercial hotel management product, not a student project.

Take conceptual inspiration from:

- modern hotel PMS systems

- Petpooja-style fast POS workflows

- modern SaaS dashboards

- premium hospitality software

BUT DO NOT COPY any company's exact UI.

The final UI should be better organized, cleaner, more premium and more usable.

==================================================

2. DESIGN DIRECTION

==================================================

LIGHT THEME ONLY.

Use a premium hospitality visual language.

Primary visual identity:

- warm ivory / off-white backgrounds

- white cards

- deep navy text

- muted gold as primary brand color

- subtle green for success

- red for danger

- amber for warnings

- blue for informational states

Suggested palette:

Background:

#F7F7F5

Card:

#FFFFFF

Primary:

#B8922E

Dark:

#172033

Muted:

#667085

Border:

#E4E7EC

Success:

#12B76A

Warning:

#F79009

Danger:

#F04438

Info:

#2563EB

DO NOT use excessive gradients.

DO NOT use excessive shadows.

DO NOT make every element heavily rounded.

Avoid childish colorful dashboard design.

Use:

- 8px / 12px / 16px spacing system

- clean typography

- clear hierarchy

- compact professional tables

- premium cards

- subtle borders

- useful hover states

- clear empty states

- skeleton loaders only where useful

- tooltips for unfamiliar icons

==================================================

3. RESPONSIVE BEHAVIOUR

==================================================

Desktop-first ERP.

Optimize for:

1440px

1366px

1280px

1024px

Also make responsive for:

tablet

mobile

Desktop should be the primary experience.

POS, Kitchen Display, Housekeeping and Front Desk must work especially well on tablets.

==================================================

4. GLOBAL LAYOUT

==================================================

Create:

LEFT SIDEBAR

TOP HEADER

MAIN CONTENT AREA

Sidebar:

MAYRA

HOTEL ERP

Navigation:

DASHBOARD

Front Office

- Reservations

- Reservation Calendar

- Front Desk

- Room Grid

- Guests

- Folios

- Check-in

- Check-out

Rooms

- Room List

- Room Types

- Rate Plans

- Packages

- Room Status

- Housekeeping

- Maintenance

Restaurant

- POS

- Tables

- Menu

- Modifiers

- KOT

- Kitchen Display

- Live Orders

- All Orders

- Room Charges

- QR Ordering

Inventory

- Products

- Categories

- Stock

- Purchase Requisition

- Purchase Orders

- GRN

- Vendors

- Recipes

- Stock Transfer

- Wastage

Banquet

- Enquiries

- Events

- Halls

- Packages

- Event Calendar

- Banquet Billing

Laundry

- Orders

- Categories

- Laundry Items

- Vendors

- Loss / Damage Reports

HR

- Employees

- Attendance

- Shifts

- Leave

- Payroll

Finance

- Cash Management

- Payments

- Expenses

- Receivables

- Payables

- Ledger

- GST

- Day Closing

- Night Audit

Channel Manager

- Overview

- OTA Calendar

- Inventory & Rates

- MakeMyTrip

- Goibibo

- BookMyShow

- Direct Booking

- Room Mapping

- Rate Mapping

- Sync Logs

CRM

- Guests

- VIP Guests

- Loyalty

- Feedback

- Campaigns

Reports

- Hotel Reports

- Revenue Reports

- POS Reports

- Inventory Reports

- Finance Reports

- GST Reports

- HR Reports

- Channel Reports

- Audit Reports

Settings

- Hotel Settings

- Tax Settings

- Booking Settings

- Invoice Settings

- Users & Roles

- System Settings

==================================================

5. TOP HEADER

==================================================

Top header should contain:

Global Search

Notifications

Quick Actions

Current Property

Date

User Profile

Role

Global search must search across:

Guests

Bookings

GRC

Rooms

Invoices

Orders

Payments

Employees

Products

Example:

Search "Rahul"

should show guest + booking + room + invoice results.

Add keyboard shortcut:

CTRL + K

Opening a Quick Action Command Palette.

Quick actions:

- New Booking

- Walk-in

- Check-in

- Check-out

- New POS Order

- New Purchase

- New Expense

- Search Guest

- Search Room

- Run Night Audit

==================================================

6. DASHBOARD

==================================================

Create a premium hotel management dashboard.

Header:

Good Morning, Admin

MAYRA HOTEL

Current Date

Filters:

Today

Yesterday

7 Days

30 Days

Custom Date Range

Primary KPIs:

Occupancy

ADR

RevPAR

Room Revenue

F&B Revenue

Total Revenue

Pending Payments

Available Rooms

Use realistic demo values.

Example:

Occupancy:

78.4%

ADR:

₹4,850

RevPAR:

₹3,802

Room Revenue:

₹3.24L

F&B Revenue:

₹1.82L

Total Revenue:

₹5.74L

Add trend indicators.

==================================================

7. LIVE OPERATIONS

==================================================

Create a Live Operations section:

Today's Arrivals

Today's Departures

In-House Guests

Available Rooms

Dirty Rooms

Cleaning Rooms

Maintenance Rooms

Pending Bills

Pending Payments

Each card MUST be clickable.

Example:

Dirty Rooms = 6

Clicking it should open Housekeeping filtered to Dirty.

==================================================

8. ROOM STATUS

==================================================

Create room status visualization:

Available

Reserved

Occupied

Dirty

Cleaning

Inspection

Maintenance

Blocked

Use professional status colors.

Clicking a status filters the room grid.

==================================================

9. REVENUE ANALYTICS

==================================================

Create charts:

Revenue Overview

Room Revenue

Restaurant Revenue

Banquet Revenue

Laundry Revenue

Other Revenue

Filters:

7 Days

30 Days

90 Days

Custom

Use Recharts or another lightweight frontend chart library.

==================================================

10. BOOKING SOURCE ANALYTICS

==================================================

Show:

Direct Website

MakeMyTrip

Goibibo

BookMyShow

Walk-in

Phone

WhatsApp

Corporate

Travel Agent

Display:

Bookings

Room Nights

Revenue

Cancellation

Average Booking Value

==================================================

11. RESERVATIONS

==================================================

Create professional Reservation Management.

Table columns:

Booking ID

GRC No

Guest

Source

Room

Room Type

Check-in

Check-out

Nights

Amount

Payment

Status

Actions

Filters:

Date

Source

Room Type

Status

Payment

Guest

Actions:

View

Edit

Check-in

Change Room

Add Charge

Payment

Cancel

Print

Duplicate

==================================================

12. RESERVATION CALENDAR

==================================================

Create hotel room timeline calendar.

Rows:

Rooms

Columns:

Dates

Display booking blocks.

Booking block should show:

Guest

Booking source

Room

Status

Support:

Today

Week

Month

Click booking block opens booking drawer.

==================================================

13. FRONT DESK

==================================================

Create Front Desk dashboard.

Show:

Arrivals

Departures

In-House

Walk-ins

Expected Arrivals

Late Checkout

Pending Documents

Pending Payments

Actions:

New Walk-in

Check-in

Check-out

Room Change

Payment

Print GRC

==================================================

14. ROOM GRID

==================================================

Create visual hotel room grid.

Group rooms by floor.

Example:

FIRST FLOOR

101

102

103

104

105

SECOND FLOOR

201

202

203

204

Each room card:

Room Number

Room Type

Status

Guest

Checkout Date

Click room opens Room Details drawer.

Actions:

Assign Guest

Change Status

Housekeeping

Maintenance

View Booking

Add Charge

==================================================

15. ROOM TYPES

==================================================

Create:

Deluxe

Family Room

Suite

Premium

Each room type has:

Name

Description

Max Occupancy

Beds

Base Rate

Extra Adult

Extra Child

Extra Bed

Amenities

Number of Rooms

Status

==================================================

16. RATE PLANS

==================================================

Create:

EP

Room Only

CP

Room + Breakfast

MAP

Room + Breakfast + Lunch/Dinner

AP

Room + All Meals

AI

All Inclusive

Rate plans must affect booking calculations.

==================================================

17. BOOKING FORM

==================================================

Create a premium multi-step booking experience.

Steps:

1. Stay

2. Guest

3. Room

4. Charges

5. Payment

6. Confirmation

Do NOT create one giant ugly form.

==================================================

18. GRC

==================================================

Booking form must support:

GRC Number

Invoice Number

Returning Guest Search:

- GRC

- Name

- Mobile

Guest fields:

Salutation

Guest Name

Age

Gender

Mobile

WhatsApp

Email

Address

City

State

Nationality

DOB

Anniversary

Company

ID Proof Type

ID Proof Number

ID Proof Images

Guest Photo

VIP Status

Images are optional.

==================================================

19. STAY INFORMATION

==================================================

Fields:

Check-in Date

Check-out Date

Number of Rooms

Check-in Time

Check-out Time

Arrival From

Purpose of Visit

Extra Bed

Remarks

==================================================

20. BOOKING CALCULATION ENGINE

==================================================

All calculations must work in frontend.

Calculate:

Room Cost

Number of Nights

Extra Bed

Meals

Discount

Taxable Amount

CGST

SGST

IGST if applicable

Grand Total

Advance

Balance

Example:

Room:

₹4,500 × 2 nights

Extra Bed:

₹500

Subtotal:

₹9,500

Discount:

₹500

CGST:

Calculated

SGST:

Calculated

Total:

Calculated automatically

Advance:

₹3,000

Balance:

Calculated automatically

Changing dates, rooms, quantities, rate plan or discount must update totals instantly.

==================================================

21. GUEST CRM

==================================================

Create Guest Management.

Guest profile:

Name

Mobile

Email

Nationality

VIP

Total Stays

Total Spend

Last Stay

Average Spend

Preferences

Tabs:

Bookings

Folios

Payments

Restaurant

Laundry

Feedback

Documents

Notes

==================================================

22. FOLIO

==================================================

Create hotel guest folio.

Sections:

Room Charges

Restaurant

Room Service

Laundry

Banquet

Other Charges

Discounts

Payments

Refunds

Show:

Subtotal

Tax

Total

Paid

Balance

Actions:

Add Charge

Add Payment

Refund

Print Folio

Checkout

==================================================

23. CHECK-IN

==================================================

Create fast check-in flow.

Verify:

Guest

Room

ID

Payment

Documents

Then:

Confirm Check-in

Room status automatically changes:

Reserved → Occupied

==================================================

24. CHECK-OUT

==================================================

Show complete folio.

Actions:

Add Charge

Payment

Discount

Refund

Then:

Checkout

Room status:

Occupied → Dirty

Housekeeping task automatically created.

==================================================

25. RESTAURANT POS

==================================================

This is one of the MOST IMPORTANT screens.

Create a fast Petpooja-inspired restaurant POS workflow, but with a unique MAYRA design.

Layout:

LEFT:

Categories

CENTER:

Menu Items

RIGHT:

Cart / Current Order

Categories:

Starters

Main Course

Breads

Rice

Chinese

Beverages

Desserts

Combos

Cart features:

Add

Remove

Quantity

Modifiers

Notes

Discount

Tax

Order modes:

Dine In

Takeaway

Room Charge

Delivery

Banquet

Complimentary

==================================================

26. RESTAURANT TABLES

==================================================

Create visual restaurant floor plan.

Tables:

T01

T02

T03

T04

T05

T06

T07

T08

T09

T10

Statuses:

Available

Occupied

Reserved

Billing

Cleaning

Click table:

Open Order

Add Items

Transfer

Merge

Split

Print KOT

Bill

==================================================

27. KOT

==================================================

Create KOT workflow.

KOT includes:

KOT Number

Table

Waiter

Items

Quantity

Modifiers

Special Notes

Time

Actions:

Send to Kitchen

Print KOT

Cancel Item

==================================================

28. KITCHEN DISPLAY SYSTEM

==================================================

Create KDS.

Columns:

NEW

PREPARING

READY

SERVED

Each order is draggable.

Example:

#1042

Table 08

Paneer Tikka ×2

Butter Chicken ×1

Garlic Naan ×2

[START]

Then:

Preparing

Then:

Ready

Then:

Served

Changes should persist in frontend state.

==================================================

29. ROOM CHARGE

==================================================

Restaurant order can be posted to hotel room.

Select:

Room

Guest

Booking

Then:

Post to Folio

The amount must appear inside the guest folio.

==================================================

30. ROOM SERVICE

==================================================

Create:

Create Order

Today's Orders

Order History

Statuses:

Received

Preparing

Ready

Delivered

Cancelled

==================================================

31. INVENTORY

==================================================

Create inventory management.

Products table:

Product

Category

Unit

Current Stock

Minimum Stock

Purchase Rate

Selling Rate

Status

Features:

Add Product

Edit

Stock Adjustment

Purchase

Transfer

Wastage

Low Stock Alert

==================================================

32. INVENTORY CONSUMPTION

==================================================

Use frontend mock recipe logic.

Example:

Butter Chicken consumes:

Chicken

Butter

Cream

Spices

When POS order is completed, mock stock should reduce.

This must work locally.

==================================================

33. PURCHASE

==================================================

Workflow:

Purchase Requisition

→ Approval

→ Purchase Order

→ GRN

→ Stock Update

Create working frontend screens.

==================================================

34. VENDORS

==================================================

Vendor fields:

Vendor Name

Contact

Phone

Email

GSTIN

Address

Category

Outstanding

Status

==================================================

35. HOUSEKEEPING

==================================================

Create Kanban board:

DIRTY

CLEANING

INSPECTION

READY

Room cards can be moved.

Moving:

Dirty → Cleaning → Inspection → Ready

must update room status globally.

==================================================

36. HOUSEKEEPING TASKS

==================================================

Task:

Room

Task

Assigned Staff

Priority

Status

Created Time

Completed Time

Types:

Checkout Cleaning

Stayover

Deep Cleaning

Inspection

Amenities Refill

==================================================

37. MAINTENANCE

==================================================

Create ticket system.

Ticket:

ID

Room

Issue

Priority

Assigned Staff

Status

Created

Resolved

Statuses:

Open

In Progress

Resolved

Closed

==================================================

38. LAUNDRY

==================================================

Create:

Orders

Categories

Items

Vendors

Loss/Damage Reports

Laundry workflow:

Received

Washing

Ironing

Ready

Delivered

Laundry charges must be optionally postable to guest folio.

==================================================

39. BANQUET

==================================================

Create:

Enquiries

Events

Halls

Packages

Calendar

Billing

Event fields:

Event Name

Customer

Date

Time

Guests

Hall

Package

Menu

Decoration

Advance

Balance

Status

Calculate:

Per Person × Guests

Additional Services

Tax

Discount

Advance

Balance

==================================================

40. HR

==================================================

Create:

Employees

Attendance

Shifts

Leave

Payroll

Employee:

Name

Employee ID

Department

Designation

Phone

Joining Date

Salary

Status

Attendance:

Present

Absent

Late

Half Day

Leave

==================================================

41. FINANCE

==================================================

Create:

Cash Management

Payments

Expenses

Receivables

Payables

Ledger

GST

Day Closing

Night Audit

==================================================

42. CASH MANAGEMENT

==================================================

Show:

Opening Cash

Cash Sales

Cash Expenses

Refunds

Expected Cash

Actual Cash

Difference

Allow:

Cash In

Cash Out

Expense

Adjustment

Day Close

==================================================

43. NIGHT AUDIT

==================================================

Create working frontend night audit.

Checklist:

Room Charges

POS Settlement

Cash

UPI

Card

Pending Folios

Tax

Discounts

Cancellations

No Shows

Show exceptions.

Button:

RUN NIGHT AUDIT

Then:

CLOSE BUSINESS DAY

Use confirmation modal.

==================================================

44. CHANNEL MANAGER

==================================================

IMPORTANT:

This is a FRONTEND SIMULATION.

Do not claim real OTA connectivity.

Create UI architecture that is ready for future backend integration.

Channels:

MakeMyTrip

Goibibo

BookMyShow

Direct Website

Each channel card:

Connection Status

Last Sync

Bookings

Revenue

Inventory

Rates

Actions:

Manage

Sync Now

View Logs

==================================================

45. OTA ROOM MAPPING

==================================================

Create mapping:

MAYRA ROOM TYPE

→

OTA ROOM TYPE

Example:

Deluxe

→ Deluxe Room

Family

→ Family Room

Suite

→ Suite

==================================================

46. OTA RATE MAPPING

==================================================

Example:

MAYRA EP

→ MMT EP

MAYRA CP

→ Goibibo CP

MAYRA MAP

→ BookMyShow MAP

==================================================

47. OTA INVENTORY SIMULATION

==================================================

Create shared inventory simulation.

Example:

Deluxe inventory:

5

Show:

MAYRA

5

MMT

5

Goibibo

5

BookMyShow

5

Direct

5

When a simulated MMT booking occurs:

5 → 4

Then all channel availability displays:

4

This is a DEMO simulation only.

==================================================

48. OTA SYNC SIMULATOR

==================================================

Button:

SYNC ALL CHANNELS

Show realistic progress:

MakeMyTrip

Syncing...

Goibibo

Syncing...

BookMyShow

Syncing...

Direct

Syncing...

Then:

✓ Inventory synced

✓ Rates synced

✓ Restrictions synced

✓ Bookings synced

Create Sync Logs.

Example:

10:44 AM

MMT

Inventory Updated

Deluxe 5 → 4

SUCCESS

==================================================

49. OTA BOOKINGS

==================================================

Create realistic demo OTA bookings.

Example:

MYR-MMT-1024

Rahul Sharma

Deluxe

2 Nights

₹9,800

Paid

Confirmed

MYR-GIB-8831

Priya Singh

Suite

3 Nights

₹18,500

Partial

Confirmed

MYR-BMS-2214

Amit Verma

Family Room

1 Night

₹7,200

Paid

Confirmed

Clearly label simulated/demo data.

==================================================

50. CRM

==================================================

Create:

Guests

VIP Guests

Loyalty

Feedback

Campaigns

Guest segmentation:

New

Returning

VIP

Corporate

OTA

Direct

==================================================

51. REPORTS

==================================================

Create professional reports.

Hotel:

Occupancy

ADR

RevPAR

Room Revenue

Arrivals

Departures

Cancellations

No Shows

POS:

Sales

Item Sales

Category Sales

Waiter Sales

KOT

Discount

Void

Inventory:

Stock

Purchase

Consumption

Wastage

Low Stock

Finance:

Revenue

Expenses

Payments

Receivables

Payables

GST

Channel:

MMT

Goibibo

BookMyShow

Direct

Walk-in

Corporate

HR:

Attendance

Leave

Payroll

Every report needs:

Date Range

Filters

Search

Export CSV

Print

==================================================

52. INVOICES & PRINT

==================================================

Create print-friendly:

Hotel Invoice

Guest Folio

GRC

Payment Receipt

POS Bill

KOT

Purchase Order

Banquet Quotation

Banquet Invoice

Laundry Receipt

Use browser print.

Documents should look professional when printed.

==================================================

53. ROLE-BASED FRONTEND DEMO

==================================================

No backend authentication.

Create demo role switcher.

Roles:

Admin

Hotel Manager

Receptionist

Restaurant Manager

Waiter

Chef

Housekeeping

Accountant

HR

Changing role changes visible navigation and dashboard context.

Example:

Waiter sees:

POS

Tables

Orders

KOT

Housekeeping sees:

Room Status

Housekeeping

Maintenance

Accountant sees:

Finance

Payments

Expenses

Reports

Admin sees everything.

==================================================

54. DEMO DATA

==================================================

Do NOT start with an empty system.

Seed realistic data.

Hotel:

MAYRA HOTEL

Rooms:

48

Room Types:

Deluxe:

30

Family:

8

Suite:

6

Premium:

4

Guests:

300+

Bookings:

100+

Employees:

50+

Inventory:

200+

Restaurant Menu:

80+

Use realistic Indian hotel data.

Names:

Rahul Sharma

Priya Singh

Amit Verma

Neha Gupta

Rohan Kumar

Anjali Singh

etc.

Use realistic Indian phone numbers and INR amounts.

==================================================

55. GLOBAL DATA STATE

==================================================

Create a centralized frontend data layer.

Do NOT duplicate mock data in every page.

Use a clean structure such as:

/data

/services

/store

/types

/components

/pages

/utils

Example:

bookingService

roomService

guestService

posService

inventoryService

paymentService

housekeepingService

channelService

reportService

All services initially use local browser storage/mock data.

==================================================

56. FRONTEND PERSISTENCE

==================================================

Use localStorage or IndexedDB.

If user:

creates booking

changes room status

adds POS order

updates inventory

creates employee

changes housekeeping status

adds payment

then refreshing the page should preserve the data.

Provide a:

RESET DEMO DATA

button inside Settings.

==================================================

57. CROSS-MODULE CONNECTIONS

==================================================

This is CRITICAL.

Modules must not feel isolated.

Example:

BOOKING

→ Room becomes Reserved

CHECK-IN

→ Room becomes Occupied

CHECK-OUT

→ Room becomes Dirty

HOUSEKEEPING

→ Room becomes Ready

POS ROOM CHARGE

→ Guest Folio increases

LAUNDRY

→ Guest Folio can increase

PAYMENT

→ Folio balance decreases

BOOKING CANCELLATION

→ Room inventory becomes available

OTA BOOKING SIMULATION

→ Shared inventory decreases

PURCHASE GRN

→ Inventory increases

POS SALE

→ Inventory decreases according to recipe

NIGHT AUDIT

→ Daily financial totals update

DASHBOARD

→ All metrics reflect current local state

==================================================

58. UX REQUIREMENTS

==================================================

Every button must have a meaningful action.

No dead buttons.

No fake links.

No "Coming Soon" pages unless absolutely necessary.

Use:

Drawer

Modal

Tabs

Dropdown

Toast

Confirmation Dialog

Data Table

Filter Bar

Date Picker

Search

Pagination

Sorting

Empty State

Loading State

Error State

For destructive actions show confirmation.

Example:

Cancel Booking?

This action will release the room inventory.

[Cancel Booking]

[Keep Booking]

==================================================

59. TOAST SYSTEM

==================================================

After actions show clear feedback.

Examples:

Booking created successfully

Room status updated

Payment recorded

KOT sent to kitchen

Order completed

Stock updated

Invoice generated

Sync completed

Housekeeping task completed

==================================================

60. TABLE UX

==================================================

Tables should support:

Search

Filter

Sort

Pagination

Column alignment

Status badges

Row actions

Bulk selection where useful

Avoid unnecessarily huge tables.

==================================================

61. LOADING / EMPTY STATES

==================================================

Create useful empty states.

Example:

No bookings found.

Try changing the date range or filters.

[Clear Filters]

==================================================

62. ACCESSIBILITY

==================================================

Buttons must have labels.

Icons must have tooltips.

Inputs must have labels.

Keyboard navigation should work wherever practical.

Use sufficient contrast.

==================================================

63. PERFORMANCE

==================================================

IMPORTANT FOR AI CREDIT AND PROJECT SIZE:

Do NOT overengineer.

Do NOT generate unnecessary libraries.

Do NOT generate backend.

Do NOT generate Docker.

Do NOT generate API servers.

Do NOT generate authentication servers.

Do NOT generate unnecessary animations.

Do NOT generate large image assets.

Use CSS / Lucide icons instead of generating images.

Use reusable components.

Do not duplicate similar pages.

Build shared components once and reuse them.

==================================================

64. COMPONENT SYSTEM

==================================================

Create reusable:

AppShell

Sidebar

Header

PageHeader

StatCard

ChartCard

DataTable

StatusBadge

FilterBar

SearchInput

DateRangePicker

Modal

Drawer

ConfirmDialog

Toast

Tabs

Dropdown

FormField

EmptyState

LoadingState

RoomCard

BookingCard

GuestCard

PaymentCard

KOTCard

OrderCard

Timeline

Pagination

==================================================

65. ANIMATION

==================================================

Use subtle professional animations only.

Allowed:

fade

slide

scale

hover

drawer

modal

page transition

Do not use excessive animations.

ERP should feel fast.

==================================================

66. DEMO EXPERIENCE

==================================================

When the client opens the system, it should immediately look populated.

Dashboard should show:

Occupancy:

78.4%

Today's Arrivals:

18

Today's Departures:

12

In-House:

74

Available:

21

Dirty:

6

Maintenance:

2

Room Revenue:

₹3.24L

F&B Revenue:

₹1.82L

Total Revenue:

₹5.74L

==================================================

67. IMPORTANT DEMO FLOW

==================================================

Make this exact scenario work:

1. Create a new booking.

2. Select:

Deluxe Room

2 nights

CP plan

3. Add guest:

Rahul Sharma

4. Calculate charges.

5. Add ₹3,000 advance.

6. Confirm booking.

7. Room status becomes RESERVED.

8. Open Front Desk.

9. Check-in Rahul.

10. Room becomes OCCUPIED.

11. Open POS.

12. Select Table 04.

13. Add:

Paneer Tikka ×2

Butter Chicken ×1

Garlic Naan ×2

14. Send KOT.

15. Open Kitchen Display.

16. Move order:

NEW → PREPARING → READY → SERVED.

17. Post restaurant order to Room 204.

18. Guest folio updates.

19. Add laundry charge.

20. Open checkout.

21. Collect remaining payment.

22. Checkout guest.

23. Room automatically becomes DIRTY.

24. Open Housekeeping.

25. Move room:

DIRTY → CLEANING → INSPECTION → READY.

26. Dashboard updates.

This complete flow MUST WORK without backend.

==================================================

68. DEMO RESET

==================================================

Settings → Demo Data

Buttons:

Reset Demo Data

Clear Local Data

Load Fresh Demo Data

Show confirmation before reset.

==================================================

69. ERROR HANDLING

==================================================

Do not allow invalid states.

Examples:

Cannot check-in without room.

Cannot checkout already checked-out booking.

Cannot sell more inventory than available.

Cannot pay more than balance without confirmation.

Cannot book unavailable room.

Cannot complete KOT without items.

Cannot close night audit with unresolved critical exceptions.

Show useful validation messages.

==================================================

70. FINAL QUALITY BAR

==================================================

The final application must feel like:

A real commercial hotel ERP demo.

NOT:

- a wireframe

- a UI mockup

- a landing page

- a collection of empty CRUD screens

- a student dashboard

It must be:

- functional

- connected

- populated

- interactive

- responsive

- professional

- client-demo ready

==================================================

71. VERY IMPORTANT IMPLEMENTATION RULE

==================================================

DO NOT create every page independently with duplicated logic.

Create shared services, state and reusable components.

If a feature already exists in another module, reuse it.

For example:

Room status must be the SAME room state used by:

Dashboard

Booking

Front Desk

Room Grid

Housekeeping

Reports

Channel Manager

Guest must be the SAME guest entity used by:

Booking

CRM

Folio

POS Room Charge

Laundry

Reports

Booking must be the SAME booking entity used by:

Reservation

Calendar

Front Desk

Guest Profile

Folio

Reports

Channel Manager

This is extremely important.

==================================================

72. NO BACKEND RULE

==================================================

Again:

NO BACKEND.

NO DATABASE SERVER.

NO API.

NO SUPABASE.

NO FIREBASE.

NO MONGODB.

NO POSTGRESQL.

NO EXPRESS.

NO NODE BACKEND.

NO REAL PAYMENT GATEWAY.

NO REAL OTA API.

Everything should work locally in browser.

Use mock services and local persistence.

==================================================

73. FUTURE BACKEND READY

==================================================

Although no backend is required now, keep the architecture clean enough that later we can replace:

mockBookingService

with:

apiBookingService

without changing the UI components.

Same for:

rooms

guests

payments

POS

inventory

channel manager

reports

==================================================

74. DO NOT ASK QUESTIONS

==================================================

Do not ask me:

"What features do you want?"

"Which color?"

"Should I build backend?"

"Should I add authentication?"

"Should I add API?"

All requirements are already defined.

Make sensible professional decisions wherever something is unspecified.

==================================================

75. DO NOT STOP EARLY

==================================================

Do not stop after:

Dashboard

Sidebar

Booking

Continue until the complete frontend application described above exists.

If implementation needs to be internally broken into phases, do that internally.

Do NOT ask for confirmation between phases.

==================================================

76. FINAL CHECK

==================================================

Before considering the project complete, verify:

✓ Every sidebar route works

✓ No broken routes

✓ No blank pages

✓ No dead buttons

✓ Booking works

✓ Room availability works

✓ Check-in works

✓ Check-out works

✓ Folio works

✓ POS works

✓ KOT works

✓ KDS works

✓ Room charge works

✓ Inventory works

✓ Housekeeping works

✓ Laundry works

✓ Banquet works

✓ Finance works

✓ Night audit works

✓ CRM works

✓ Reports work

✓ Channel manager simulation works

✓ OTA inventory simulation works

✓ Search works

✓ Filters work

✓ Local persistence works

✓ Reset demo works

✓ Print layouts work

✓ Responsive layout works

✓ Role switcher works

✓ Dashboard metrics reflect local state

==================================================

77. MOST IMPORTANT FINAL INSTRUCTION

==================================================

Prioritize FUNCTIONALITY over decorative complexity.

Do not waste implementation budget on:

- unnecessary illustrations

- large images

- fancy 3D effects

- excessive animation

- unnecessary dependencies

- backend

- APIs

- authentication infrastructure

Spend implementation effort on:

- working interactions

- shared state

- realistic data

- booking calculations

- room status

- POS workflow

- KOT

- KDS

- inventory

- folio

- payments

- housekeeping

- OTA simulation

- reports

- print layouts

- responsive UX

Build MAYRA HOTEL ERP as a polished, premium, frontend-only, fully interactive client demonstration.

START BUILDING NOW.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9f6260c8-1056-4ee8-9c73-91a8417d35b6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
