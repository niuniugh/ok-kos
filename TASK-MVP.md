# TASK-2.md — MVP Implementation (After Boilerplate)

## Overview

This file contains the remaining MVP tasks after the boilerplate (DB + Auth) is complete.
Each member owns a full vertical slice: server functions (backend) + routes/UI (frontend).

**Dependency order:**
```
Member 1 (Owner Profile + Navigation)
    ↓
Member 2 (Property + Rooms)  ←→  Member 3 (Tenants + Payments)
    ↓                                    ↓
                    Member 4 (Dashboard + Reports)
```

Member 1 must complete their profile + navigation tasks before Member 4 can complete the sidebar.  
Members 2 and 3 can work in parallel.  
Member 4 depends on Members 2 and 3 completing their server functions for the dashboard.

---

## Tech Conventions

- **Server functions:** use `createServerFn` from `@tanstack/react-start/server` (see existing `src/modules/auth/serverFn.ts` as reference)
- **Validation:** Zod v4 for all input schemas, colocated in a `schema.ts` next to `serverFn.ts`
- **DB access:** use the Prisma client from `src/lib/prisma.ts`
- **Routes:** file-based via TanStack Router — add files under `src/routes/`
- **UI components:** use existing shadcn/ui components from `src/components/ui/` — do not install new ones without discussion
- **Error handling:** use `parseServerError()` from `@/lib/utils.ts` for displaying server errors in forms
- **Toasts:** use `sonner` (`import { toast } from 'sonner'`)
- **Styling:** Tailwind v4 utility classes only — no inline styles
- **Linting:** run `pnpm lint:fix` before committing — Biome enforces tabs + double quotes

---

## Member 1 — Owner Profile + Navigation

**Domain:** Owner profile frontend, dashboard sidebar/nav layout  
**Depends on:** Boilerplate (DB + Auth done)  
**Difficulty:** Easy to Medium

---

### Task 1.1 — Owner profile page frontend

**Difficulty:** Easy

Profile page backend is already done (Member 1 boilerplate). Now wire the frontend.

- [ ] Wire `src/routes/_dashboard/dashboard/profile/index.tsx` to use `getOwnerFn` for fetching owner data
- [ ] Wire form submit to use `updateOwnerFn` for updating profile
- [ ] Display current owner name, email, and plan badge (`free` / `paid`)
- [ ] Edit form with name and email fields with save button
- [ ] Show success toast on save
- [ ] Test: profile page loads with correct data
- [ ] Test: update name/email works and session syncs correctly

---

### Task 1.2 — Dashboard sidebar navigation

**Difficulty:** Medium

Build the app shell with sidebar navigation.

- [ ] Add a `Sidebar` component using `src/components/ui/sidebar.tsx`
- [ ] Sidebar nav links:
  - Dashboard (`/dashboard`)
  - Properties (`/dashboard/properties`)
  - Tenants (`/dashboard/tenants`)
  - Payments (`/dashboard/payments`)
  - Reports (`/dashboard/reports`)
  - Profile (`/dashboard/profile`) — bottom of sidebar
- [ ] Logout button — bottom of sidebar (already exists, move here)
- [ ] Show owner name, email, and plan badge (`free` / `paid`) in sidebar footer
- [ ] Sidebar collapses to icon-only on mobile (`useIsMobile()`)
- [ ] Main content area renders `<Outlet />`

---

## Member 2 — Property + Room Management

**Domain:** Property CRUD, Room CRUD, freemium enforcement  
**Depends on:** Boilerplate (DB + Auth done)  
**Difficulty:** Medium

---

### Task 2.1 — Property server functions

Create `src/modules/property/serverFn.ts` and `src/modules/property/schema.ts`.

**Difficulty:** Medium

**Zod schemas:**

- [ ] `CreatePropertySchema` — `name` (required), `address` (required)
- [ ] `UpdatePropertySchema` — `name` (optional), `address` (optional)

**Server functions:**

- [ ] `getPropertiesFn` — list all properties for the logged-in owner (use session `id`)
- [ ] `getPropertyFn` — get a single property by `id`, verify it belongs to the session owner
- [ ] `createPropertyFn` — create a property linked to session owner
- [ ] `updatePropertyFn` — update `name` / `address`, verify ownership
- [ ] `deletePropertyFn` — delete property; return error if any room has an active tenant (`409`-equivalent: throw with message)

---

### Task 2.2 — Property pages

**Difficulty:** Medium

**List + create** (`src/routes/_dashboard/properties/index.tsx`):

- [ ] List all properties in a card grid (name, address, room count)
- [ ] "Add Property" button → opens a `Dialog` with the create form
- [ ] On create success: close dialog, refresh list, show toast

**Detail + edit** (`src/routes/_dashboard/properties/$propertyId/index.tsx`):

- [ ] Show property name and address
- [ ] "Edit" button → inline edit or dialog
- [ ] "Delete" button → confirmation `AlertDialog` → call `deletePropertyFn`
- [ ] Show error toast if delete is blocked by active tenants
- [ ] Tabs or section below for rooms list (render the Room components from Task 2.4)

---

### Task 2.3 — Room server functions

Create `src/modules/room/serverFn.ts` and `src/modules/room/schema.ts`.

**Difficulty:** Medium

**Zod schemas:**

- [ ] `CreateRoomSchema` — `propertyId` (UUID), `roomNumber` (required), `rentPrice` (positive integer)
- [ ] `UpdateRoomSchema` — `roomNumber` (optional), `rentPrice` (optional, positive integer)

**Server functions:**

- [ ] `getRoomsFn` — list all rooms for a given `propertyId`, verify property belongs to session owner; support optional `status` filter
- [ ] `getRoomFn` — get a single room by `id`, verify ownership chain
- [ ] `createRoomFn` — create room; enforce freemium limit: count existing rooms for the property, throw if `owner.plan === 'free'` and count `>= 10`
- [ ] `updateRoomFn` — update `roomNumber` / `rentPrice`, verify ownership
- [ ] `deleteRoomFn` — delete room; throw if `room.status === 'occupied'`

---

### Task 2.4 — Room UI components + pages

**Difficulty:** Medium

Rooms list (rendered inside property detail page from Task 2.2):

- [ ] Table with columns: Room Number, Rent Price, Status (`vacant` / `occupied` badge), Actions
- [ ] "Add Room" button → `Dialog` with create form
- [ ] Inline "Edit" and "Delete" actions per row
- [ ] Show freemium limit warning banner when room count reaches 8/10 (free plan)
- [ ] Show upgrade prompt (non-functional for MVP, just a `Dialog` or `Alert` with copy) when limit is hit on create
- [ ] Disable "Add Room" button when limit is reached on free plan

---

## Member 3 — Tenant Management + Payment Tracking

**Domain:** Tenant CRUD, move-out flow, payment logging, payment status updates  
**Depends on:** Boilerplate (DB + Auth done), Task 2.3 (rooms must exist to assign tenants)  
**Difficulty:** Medium  
**Parallel with:** Member 2

---

### Task 3.1 — Tenant server functions

Create `src/modules/tenant/serverFn.ts` and `src/modules/tenant/schema.ts`.

**Difficulty:** Medium

**Zod schemas:**

- [ ] `CreateTenantSchema` — `roomId` (UUID), `name` (required), `phone` (required), `moveInDate` (date string `YYYY-MM-DD`)
- [ ] `UpdateTenantSchema` — `name` (optional), `phone` (optional), `moveInDate` (optional)
- [ ] `MoveOutSchema` — `moveOutDate` (optional date string, defaults to today)

**Server functions:**

- [ ] `getTenantsFn` — list tenants scoped to session owner's properties; support `propertyId` and `status` filters
- [ ] `getTenantFn` — get single tenant by `id`, verify ownership chain
- [ ] `createTenantFn` — assign tenant to room; verify room is `vacant`; set room `status → occupied` in same transaction
- [ ] `updateTenantFn` — update name / phone / moveInDate
- [ ] `moveOutTenantFn` — set tenant `status → inactive`, set `moveOutDate`, set room `status → vacant` in same transaction; throw if tenant is already inactive

---

### Task 3.2 — Tenant pages

**Difficulty:** Medium

**Tenants list** (`src/routes/_dashboard/tenants/index.tsx`):

- [ ] Table with columns: Name, Phone, Room Number, Property, Move-in Date, Status, Actions
- [ ] Filter bar: filter by property (dropdown), filter by status (`active` / `inactive` / all)
- [ ] "Add Tenant" button → `Dialog` with create form (room selector shows only `vacant` rooms)
- [ ] Per-row "Edit" button → `Dialog` with update form
- [ ] Per-row "Move Out" button → `AlertDialog` confirmation → call `moveOutTenantFn`
- [ ] Moved-out tenants shown with `inactive` badge and greyed row — still visible in list

**Tenant detail** (`src/routes/_dashboard/tenants/$tenantId/index.tsx`):

- [ ] Show tenant info (name, phone, room, move-in/out dates, status)
- [ ] Payment history section (render Payment components from Task 3.4)

---

### Task 3.3 — Payment server functions

Create `src/modules/payment/serverFn.ts` and `src/modules/payment/schema.ts`.

**Difficulty:** Medium

**Zod schemas:**

- [ ] `CreatePaymentSchema` — `tenantId` (UUID), `month` (string matching `/^\d{4}-\d{2}$/`), `amountDue` (positive int), `amountPaid` (non-negative int), `status` (`paid` | `unpaid` | `partial`)
- [ ] `UpdatePaymentSchema` — `amountPaid` (optional), `status` (optional)
- [ ] Add Zod `.refine()` to validate status/amount consistency on both schemas:
  - `paid`: `amountPaid >= amountDue`
  - `unpaid`: `amountPaid === 0`
  - `partial`: `amountPaid > 0 && amountPaid < amountDue`

**Server functions:**

- [ ] `getPaymentsFn` — list payments scoped to session owner; support `tenantId`, `month`, `status` filters
- [ ] `getPaymentFn` — get single payment by `id`, verify ownership chain
- [ ] `createPaymentFn` — log a payment; verify tenant belongs to session owner; set `paidAt = now()` if `status === 'paid'`
- [ ] `updatePaymentFn` — update `amountPaid` / `status`; update `paidAt` accordingly

---

### Task 3.4 — Payment UI components + pages

**Difficulty:** Medium

**Payments list** (`src/routes/_dashboard/payments/index.tsx`):

- [ ] Table with columns: Tenant Name, Room, Month, Amount Due, Amount Paid, Status badge, Actions
- [ ] Filter bar: filter by month (month picker), tenant (search/select), status
- [ ] "Log Payment" button → `Dialog` with create form
  - Tenant selector (shows active tenants)
  - Month picker (default: current month)
  - Amount Due (auto-filled from tenant's room `rentPrice`, editable)
  - Amount Paid input
  - Status auto-derived from amounts (show as read-only, computed from inputs)
- [ ] Per-row "Edit" button → `Dialog` to update `amountPaid` and `status`
- [ ] Status badges: green `paid`, yellow `partial`, red `unpaid`

**Payment history** (reusable component, used in Tenant detail page):

- [ ] `src/components/payment-history.tsx` — accepts `tenantId` prop, fetches + displays payments in a table
- [ ] Shows month, amount due, amount paid, status badge, paid date

---

## Member 4 — Dashboard + Reports

**Domain:** Dashboard page, reports summary  
**Depends on:** Boilerplate (DB + Auth done), Members 2 & 3 completing their server functions  
**Difficulty:** Medium to Hard

---

### Task 4.1 — Dashboard summary page

**Difficulty:** Hard

Route: `/dashboard` (`src/routes/_dashboard/dashboard/index.tsx`)

**Server function** (`src/modules/dashboard/serverFn.ts`):

- [ ] `getDashboardSummaryFn` — for a given `propertyId` and current month:
  - Total rooms, occupied rooms, vacant rooms
  - Total rent due this month (sum of `amountDue` for current month payments)
  - Total collected (sum of `amountPaid`)
  - Total outstanding (`amountDue - amountPaid`)
  - Count of unpaid and partial tenants
  - (Reuse/compose `getPropertiesFn` from Member 2 for the property selector)

**UI:**

- [ ] Greeting at the top: "Hello, {owner.name}!" (read from session context)
- [ ] Property selector dropdown (if owner has multiple properties)
- [ ] Stat cards row: Total Rooms, Occupied, Vacant, Monthly Income
- [ ] Income breakdown card: Collected vs Outstanding (use `recharts` — a `BarChart` or `RadialBarChart`)
- [ ] Overdue/unpaid tenants list — table of tenants with unpaid or partial status this month (name, room, amount outstanding)
- [ ] Current month label with previous/next month navigation arrows

---

### Task 4.2 — Reports page

**Difficulty:** Hard

Route: `/dashboard/reports` (`src/routes/_dashboard/reports/index.tsx`)

**Server function** (`src/modules/reports/serverFn.ts`):

- [ ] `getReportSummaryFn` — same logic as `getDashboardSummaryFn` but accepts any `month` parameter (not just current); returns full `payment_breakdown` array per tenant

**UI:**

- [ ] Property selector + month picker (default: current month)
- [ ] Summary stat cards: Total Due, Total Collected, Total Outstanding, Occupancy Rate
- [ ] Payment breakdown table: Tenant Name, Room, Amount Due, Amount Paid, Status badge
- [ ] Totals row at bottom of table
- [ ] "Export CSV" button — generates a CSV client-side from the breakdown data and triggers download (no server needed — use `Blob` + `URL.createObjectURL`)

---

### Task 4.3 — Empty states + error boundaries

**Difficulty:** Easy

- [ ] Create `src/components/empty-state.tsx` — reusable empty state component (icon + heading + subtext + optional CTA button); used across all list pages when there's no data
- [ ] Add empty states to:
  - Properties list (no properties yet → "Add your first property")
  - Rooms list (no rooms → "Add your first room")
  - Tenants list (no tenants → "Add your first tenant")
  - Payments list (no payments → "Log your first payment")
  - Dashboard (no property selected or no data for month)
- [ ] Add a TanStack Router `errorComponent` to the `_dashboard` layout route to catch and display server function errors gracefully (show error message + retry button)

---

## Shared / Cross-cutting

These tasks are done **after all 4 members complete their tasks**:

- [ ] **Seed script** — create `prisma/seed.ts` with sample data (1 owner, 1 property, 5 rooms, 3 active tenants, 3 months of payment records). Add `"prisma": { "seed": "tsx prisma/seed.ts" }` to `package.json`. Run `pnpm db:seed` to populate the database with test data.
- [ ] **Final integration test** — manually test the full flow: register → login → create property → add rooms → add tenants → log payments → view dashboard → view reports

---

## Definition of Done

A task is complete when:

1. Server function works and is tested manually (happy path + at least one error case)
2. UI renders correctly with real data from the server function
3. Empty state is handled (loading, no data, error)
4. `pnpm lint` passes with no errors
5. No TypeScript errors (`pnpm build` or check in IDE)
