# TASK.md — OK-KOS MVP

## Overview

Each member owns a full vertical slice: server functions (backend) + routes/UI (frontend).

**Dependency order:**
```
Member 1 (DB + Auth)
    ↓
Member 2 (Property + Rooms)  ←→  Member 3 (Tenants + Payments)
    ↓                                    ↓
                    Member 4 (Dashboard + Reports)
```

Member 1 must complete their DB migration tasks before Members 2, 3, and 4 can start.  
Members 2 and 3 can work in parallel once Member 1 is done.  
Member 4 can start building UI shells early but needs all other members' server functions to wire up data.

---

## Tech Conventions

- **Server functions:** use `createServerFn` from `@tanstack/react-start/server` (see existing `src/modules/auth/serverFn.ts` as reference)
- **Validation:** Zod v4 for all input schemas, colocated in a `schema.ts` next to `serverFn.ts`
- **DB access:** use the Prisma client from `src/lib/prisma.ts`
- **Routes:** file-based via TanStack Router — add files under `src/routes/`
- **UI components:** use existing shadcn/ui components from `src/components/ui/` — do not install new ones without discussion
- **Error handling:** use `parseServerError()` from `src/lib/utils.ts` for displaying server errors in forms
- **Toasts:** use `sonner` (`import { toast } from 'sonner'`)
- **Styling:** Tailwind v4 utility classes only — no inline styles
- **Linting:** run `pnpm lint:fix` before committing — Biome enforces tabs + double quotes

---

## Member 1 — DB Migration + Auth Update

**Domain:** Schema foundation, Owner model, updated auth flow  
**Depends on:** Nothing — start immediately  
**Others depend on:** Everyone waits for Task 1.1 before writing any DB code

---

### Task 1.1 — Apply full Prisma schema migration

**Why first:** All other members need the correct DB tables to exist before writing any server functions.

- [ ] Copy the schema from `schema.md` into `prisma/schema.prisma` (replace the existing `User` model entirely)
- [ ] Run `pnpm db:migrate` and name the migration `replace_user_with_full_schema`
- [ ] Verify all 5 tables are created: `owners`, `properties`, `rooms`, `tenants`, `payments`
- [ ] Verify all 4 enums are created: `PlanType`, `RoomStatus`, `TenantStatus`, `PaymentStatus`
- [ ] Confirm `generated/prisma` client is regenerated and reflects the new models
- [ ] Commit: `chore: apply full KosManager schema migration`

---

### Task 1.2 — Update auth server functions to use Owner model

The boilerplate uses a `User` model with a `password` field. The new schema uses `Owner` with `passwordHash`, `name` (required), and `plan`. Auth server functions must be updated.

- [ ] Update `src/modules/auth/serverFn.ts`:
  - `registerFn`: change `prisma.user` → `prisma.owner`, `password` → `passwordHash`, save `name` field, add `plan: 'free'` default, store `{ id, email, name, plan }` in session
  - `loginFn`: change `prisma.user` → `prisma.owner`, `password` → `passwordHash`, add `name` to session data
  - Session data: store `{ id, email, name, plan }`
- [ ] Update `src/modules/auth/schema.ts`:
  - `RegisterSchema`: already has `name` field — no change needed
  - `LoginSchema`: no change needed
- [ ] Update `src/routes/register.tsx`: already has `name` input field — no change needed
- [ ] Test: register a new account → confirm `owners` table has the new row with `name`, `email`, `passwordHash`, `plan`
- [ ] Test: login → confirm session cookie is set with `{ id, email, name, plan }` and redirect to `/dashboard` works
- [ ] Commit: `fix: update auth to use Owner model with name field`

---

### Task 1.3 — Owner profile backend

**Zod schema** (`src/modules/owner/schema.ts`):

- [x] `UpdateOwnerSchema` — `name` (optional), `email` (optional, valid email format)

**Server functions** (`src/modules/owner/serverFn.ts`):

- [x] `getOwnerFn` — reads the current owner from DB using session `id`
- [x] `updateOwnerFn` — updates `name` and `email`, verifies email uniqueness, syncs session (password change is out of MVP scope)

**Route + UI** (delegated to **Member 4 — Task 4.1**):

Member 4 must build the profile page UI at `src/routes/_dashboard/dashboard/profile/index.tsx` using these backend functions:

- [ ] Profile page displays current owner name, email, and plan badge (`free` / `paid`)
- [ ] Edit form with name and email fields with save button
- [ ] Show success toast on save
- [ ] Add "Profile" link to the dashboard sidebar nav

---