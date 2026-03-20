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

- [ ] `getOwnerPropertiesFn()` — returns `Array<{ id, name }>`
- [ ] `getDashboardSummaryFn()` — queries room counts, payment totals, overdue tenants
- [ ] Return type: `{ owner, property, hasProperties, month, stats, overdueTenants }`

## 5. Build dashboard page UI (src/routes/_dashboard/dashboard/index.tsx)

- [ ] Greeting: "Hello, {owner.name}!"
- [ ] Controls: PropertySelector (Select) + MonthNavigator (prev/next arrows)
- [ ] StatCards row: Total Rooms, Occupied, Vacant, Monthly Income
- [ ] IncomeBreakdownChart (ChartContainer + BarChart): Collected vs Outstanding
- [ ] OverdueTenantsTable: Tenant, Room, Due, Paid, Outstanding, Status
- [ ] EmptyState when no properties
- [ ] Loading states with Skeleton

## 6. Create reports schema (src/modules/reports/schema.ts)

- [ ] `ReportSummaryInputSchema` — `propertyId` (required UUID), `month` (YYYY-MM format)

## 7. Create reports server function (src/modules/reports/serverFn.ts)

- [ ] `getReportSummaryFn()` — queries room counts, full payment breakdown, occupancy rate
- [ ] Return type: `{ property, month, stats, breakdown }`

## 8. Build reports page UI (src/routes/_dashboard/dashboard/reports/index.tsx)

- [ ] PropertySelector (Select) + MonthPicker (Select with last 12 months)
- [ ] StatCards row: Total Due, Total Collected, Total Outstanding, Occupancy Rate
- [ ] PaymentBreakdownTable (Table with TableFooter for totals)
- [ ] ExportCSVButton (client-side Blob download)
- [ ] EmptyState when no property selected

## 9. Add errorComponent to _dashboard layout (src/routes/_dashboard.tsx)

- [ ] Add `errorComponent` to route config
- [ ] Shows error message + "Try again" button
- [ ] Uses AlertCircle icon from lucide-react

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
