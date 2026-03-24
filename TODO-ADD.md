# Additional Minor Issues — Code Review (Member 1 & 2)

Found after merging main into `feature/dashboard-reports-empty-states`.

---

## Critical

### 1. ~~Missing Sidebar — `src/routes/_dashboard.tsx`~~ ✅
- Sidebar/layout was already complete with errorComponent, pendingComponent, and auth guard
- Non-issue

---

## Medium

### 2. ~~Brittle error string matching~~ ✅
- `$propertyId/index.tsx` — now checks `"FREE_PLAN_LIMIT_REACHED"` (stable error code)
- `room/serverFn.ts` — throws `"FREE_PLAN_LIMIT_REACHED"` instead of long sentence

### 3. ~~Shared auth helpers unused by Member 2~~ ✅
- `property/serverFn.ts` — `updatePropertyFn` and `deletePropertyFn` now use `verifyPropertyOwnership()`
- `room/serverFn.ts` — `getRoomsFn` and `createRoomFn` now use `verifyPropertyOwnership()`

---

## Low

### 4. ~~Inconsistent error handling in properties list~~ ✅
- `properties/index.tsx` — `onError` now uses `parseServerError(error)` instead of `error.message`

### 5. ~~Inconsistent Tailwind classes in profile page~~ ✅
- `profile/index.tsx` — replaced `gray-*` light-mode classes with `zinc-*` dark-mode equivalents

### 6. ~~Duplicate ownership checks in room server functions~~ ✅
- Fixed as part of Issue 3

---

## Waiting on Member 3

- [ ] Tenants empty state — `Users` icon, "No tenants yet"
- [ ] Payments empty state — `Receipt` icon, "No payments yet"
