# Manual Test Checklist

Test the entire app manually before merging. Run `pnpm dev` and go through each section.

---

## 1. Auth — Register

- [X] 1.1 Visit `/register` — form renders with name, email, password fields
- [X] 1.2 Submit empty form — inline field errors appear
- [X] 1.3 Submit with invalid email format — field error on email
- [X] 1.4 Register with valid name, email, password — redirects to `/login` with success toast
- [X] 1.5 Register again with the same email — toast error "Email already registered"
- [X] 1.6 "Already have an account?" link navigates to `/login`

---

## 2. Auth — Login

- [X] 2.1 Visit `/login` — form renders with email, password fields
- [X] 2.2 Submit empty form — inline field errors appear
- [X] 2.3 Submit with wrong password — toast error "Invalid email or password"
- [X] 2.4 Submit with unregistered email — toast error "Invalid email or password"
- [X] 2.5 Login with correct credentials — redirects to `/dashboard`
- [X] 2.6 "Don't have an account?" link navigates to `/register`

---

## 3. Auth — Guard

- [X] 3.1 Visit `/dashboard` while logged out — redirects to `/login`
- [X] 3.2 Visit `/dashboard/properties` while logged out — redirects to `/login`
- [X] 3.3 After login, visit `/login` or `/register` — should redirect to `/dashboard`

---

## 4. Auth — Logout

- [X] 4.1 Logout from any dashboard page — redirects to `/login`
- [X] 4.2 After logout, visiting `/dashboard` redirects to `/login`

---

## 5. Dashboard Page

- [X] 5.1 Visit `/dashboard` — greeting shows "Hello, {your name}!"
- [X] 5.2 PropertySelector dropdown shows your properties
- [ ] 5.3 Selecting a different property updates the stats
- [ ] 5.4 MonthNavigator left arrow goes to previous month, right arrow to next
- [ ] 5.5 StatCards show: Total Rooms, Occupied, Vacant, Monthly Income
- [ ] 5.6 Income Breakdown chart renders with Collected and Outstanding bars
- [ ] 5.7 Overdue Tenants table shows tenants with unpaid/partial status for that month
- [ ] 5.8 If no overdue tenants — "No overdue tenants this month." message appears
- [ ] 5.9 New account with no properties — EmptyState shows with link to Properties page

---

## 6. Properties — List

- [ ] 6.1 Visit `/dashboard/properties` — page loads with "Properties" heading
- [ ] 6.2 With no properties — EmptyState with Building2 icon and "Add Property" button appears
- [ ] 6.3 Click "Add Property" — dialog opens with name and address fields
- [ ] 6.4 Submit empty form in dialog — toast error appears
- [ ] 6.5 Create property with valid name and address — property card appears in grid
- [ ] 6.6 Multiple properties — all show as cards with room count badge
- [ ] 6.7 Click a property card — navigates to `/dashboard/properties/{id}`

---

## 7. Properties — Detail & Rooms

- [ ] 7.1 Visit a property detail page — shows property name, address, back button
- [ ] 7.2 Edit button opens dialog with pre-filled name and address
- [ ] 7.3 Save edited name/address — property header updates
- [ ] 7.4 Rooms section shows "No rooms yet" EmptyState with DoorOpen icon when empty
- [ ] 7.5 Click "Add Room" — dialog opens with room number and rent price fields
- [ ] 7.6 Submit empty room form — toast error appears
- [ ] 7.7 Create room with valid number and price — room appears in table as "Vacant"
- [ ] 7.8 Edit room — dialog opens, update number/price, saves successfully
- [ ] 7.9 Free plan: create 10 rooms — 11th attempt shows upgrade prompt dialog
- [ ] 7.10 Free plan: at 8+ rooms — yellow warning banner appears
- [ ] 7.11 Free plan: at 10 rooms — red warning banner, Add Room button disabled
- [ ] 7.12 Delete a vacant room — room disappears from table with success toast
- [ ] 7.13 Delete button on property — confirmation dialog appears
- [ ] 7.14 Delete property with no active tenants — navigates back to properties list
- [ ] 7.15 Delete property with active tenants — error toast "Cannot delete property"

---

## 8. Profile Page

- [ ] 8.1 Visit `/dashboard/profile` — shows current name, email, plan badge, member since date
- [ ] 8.2 Edit name — saves successfully, name updates in page
- [ ] 8.3 Edit email to one already used by another account — toast error "Email already in use"
- [ ] 8.4 Submit with empty name — field error appears inline
- [ ] 8.5 Input fields use dark theme (zinc colors, not white/gray-50)

---

## 9. Reports Page

- [ ] 9.1 Visit `/dashboard/reports` — page loads with PropertySelector and MonthPicker
- [ ] 9.2 No property selected — EmptyState appears
- [ ] 9.3 Select a property and month — StatCards show Total Due, Collected, Outstanding, Occupancy Rate
- [ ] 9.4 PaymentBreakdownTable shows per-tenant rows with due/paid/outstanding/status columns
- [ ] 9.5 TableFooter shows totals row
- [ ] 9.6 "Export CSV" button downloads a `.csv` file with payment data
- [ ] 9.7 MonthPicker shows last 12 months as options
- [ ] 9.8 Switching month updates all stats and table

---

## 10. Error Handling

- [ ] 10.1 Dashboard errorComponent shows with "Try again" button on server error
- [ ] 10.2 "Try again" button refreshes the route data
- [ ] 10.3 Navigating to a non-existent property ID — shows error

---

## 11. Waiting on Member 3

- [ ] 11.1 Tenants list with no tenants — EmptyState with Users icon *(pending)*
- [ ] 11.2 Payments list with no payments — EmptyState with Receipt icon *(pending)*
