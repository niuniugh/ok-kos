# Task 4 — Dashboard + Reports + Empty States

Member 4 implementation todos on `feature/dashboard-reports-empty-states`.

## 1. Create shared auth helper (src/modules/auth/helpers.ts)

- [x] `getAuthenticatedOwnerId()` — returns session owner ID or throws "Unauthorized"
- [x] `getAuthenticatedOwner()` — returns `{ id, name, email, plan }` or throws
- [x] `verifyPropertyOwnership(ownerId, propertyId)` — confirms property belongs to owner

## 2. Create EmptyState component (src/components/empty-state.tsx)

- [x] Props-driven wrapper around `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`
- [x] Support `icon: LucideIcon`, `title`, `description`, `actionLabel?`, `onAction?()`, `actionHref?`

## 3. Create dashboard schema (src/modules/dashboard/schema.ts)

- [x] `DashboardSummaryInputSchema` — `propertyId` (optional UUID), `month` (YYYY-MM format)

## 4. Create dashboard server functions (src/modules/dashboard/serverFn.ts)

- [x] `getOwnerPropertiesFn()` — returns `Array<{ id, name }>`
- [x] `getDashboardSummaryFn()` — queries room counts, payment totals, overdue tenants
- [x] Return type: `{ owner, property, hasProperties, month, stats, overdueTenants }`

## 5. Build dashboard page UI (src/routes/_dashboard/dashboard/index.tsx)

- [x] Greeting: "Hello, {owner.name}!"
- [x] Controls: PropertySelector (Select) + MonthNavigator (prev/next arrows)
- [x] StatCards row: Total Rooms, Occupied, Vacant, Monthly Income
- [x] IncomeBreakdownChart (ChartContainer + BarChart): Collected vs Outstanding
- [x] OverdueTenantsTable: Tenant, Room, Due, Paid, Outstanding, Status
- [x] EmptyState when no properties
- [x] Loading states with Skeleton

## 6. Create reports schema (src/modules/reports/schema.ts)

- [x] `ReportSummaryInputSchema` — `propertyId` (required UUID), `month` (YYYY-MM format)

## 7. Create reports server function (src/modules/reports/serverFn.ts)

- [x] `getReportSummaryFn()` — queries room counts, full payment breakdown, occupancy rate
- [x] Return type: `{ property, month, stats, breakdown }`

## 8. Build reports page UI (src/routes/_dashboard/dashboard/reports/index.tsx)

- [x] PropertySelector (Select) + MonthPicker (Select with last 12 months)
- [x] StatCards row: Total Due, Total Collected, Total Outstanding, Occupancy Rate
- [x] PaymentBreakdownTable (Table with TableFooter for totals)
- [x] ExportCSVButton (client-side Blob download)
- [x] EmptyState when no property selected

## 9. Add errorComponent to _dashboard layout (src/routes/_dashboard.tsx)

- [x] Add `errorComponent` to route config
- [x] Shows error message + "Try again" button
- [x] Uses AlertCircle icon from lucide-react

## 10. Add empty states to other list pages

- [ ] Properties: Building2 icon, "No properties yet"
- [ ] Rooms: DoorOpen icon, "No rooms yet"
- [ ] Tenants: Users icon, "No tenants yet"
- [ ] Payments: Receipt icon, "No payments yet"

(After Members 2 & 3 create their pages)

## 11. Run lint and verify

- [ ] `pnpm lint:fix` passes
- [ ] No TypeScript errors
- [ ] `pnpm dev` starts without errors
