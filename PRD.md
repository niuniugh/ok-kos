# PRD: OK-Kos — Financial Reports for Small Boarding Houses

## 1. Product Overview

OK-Kos is a lightweight SaaS web app for small boarding house (kos-kosan) owners in Indonesia to manage tenants, track monthly rent payments, and view simple financial reports — replacing manual Excel/WhatsApp workflows.

**Target users:** Individual kos-kosan owners with 5–30 rooms  
**Business model:** Freemium (free up to 10 rooms per property, paid plan for more)

---

## 2. Background Problems + Solutions

| Problem | Solution |
|---|---|
| Owners track tenants and payments in Excel or paper | Digital tenant & payment management with a clean dashboard |
| No visibility into which tenants are late or have unpaid bills | Payment status per tenant with overdue alerts |
| Manual monthly billing with no history | Manual payment logging per month + payment history per tenant |
| No summary of monthly income | Simple financial report: collected vs. outstanding per month |

---

## 3. Features

### 3a. MVP

- **Auth** — Register / login (email + password), encrypted cookie session, logout
- **Property management** — Create, edit, view, and delete a property profile (name, address)
- **Room management** — Add/edit/delete rooms with room number and monthly rent price, scoped to a property
- **Tenant management** — Assign a tenant to a room (name, phone, move-in date); move-out sets status to `inactive` (soft delete — history is retained)
- **Payment tracking** — Log monthly payments per tenant (`paid` / `unpaid` / `partial`); partial payments track both `amount_due` and `amount_paid`
- **Dashboard** — Summary of total rooms, occupied rooms, monthly income collected vs. outstanding
- **Freemium enforcement** — Free plan limited to 10 rooms per property; server returns `403` with `{ error: "room_limit_reached" }` at limit

### 3b. Nice to Have

- Monthly bill auto-generation (system creates unpaid records at the start of each month)
- Overdue notifications (in-app badge)
- Export financial report to CSV

### 3c. Plan to Have

- Tenant self-service portal (tenants can view their own payment history)
- WhatsApp notification integration for payment reminders
- Online payment link (Midtrans/Xendit integration)
- Mobile-responsive PWA

---

## 4. User Stories

| # | As a... | I want to... | So that... |
|---|---|---|---|
| 1 | Owner | Register and log in securely | My data is private |
| 2 | Owner | Add and edit my property profile | I can set up and update my kos info |
| 3 | Owner | Add and manage rooms under my property | I can reflect my actual room layout |
| 4 | Owner | Add a tenant to a room | I know who is staying where |
| 5 | Owner | Log a payment for a tenant | I can track who has paid this month |
| 6 | Owner | Mark a payment as unpaid or partial | I know who still owes money |
| 7 | Owner | See a dashboard of this month's income | I know my financial position at a glance |
| 8 | Owner | View payment history per tenant | I can resolve disputes or check records |
| 9 | Owner | Mark a tenant as moved out | My active records stay accurate while history is preserved |
| 10 | Owner | Be notified when I hit the free room limit | I understand my plan and can upgrade if needed |

---

## 5. Data Model

### Owner

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | string | Unique; valid email format |
| `password_hash` | string | Bcrypt hash; min 8 chars on input |
| `plan` | enum | `free` \| `paid`; default `free` |
| `created_at` | timestamp | |

### Property

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `owner_id` | UUID | FK → Owner |
| `name` | string | Required |
| `address` | string | Required |
| `created_at` | timestamp | |

### Room

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `property_id` | UUID | FK → Property |
| `room_number` | string | e.g. "A1", "101" |
| `rent_price` | integer | Monthly rent in IDR |
| `status` | enum | `vacant` \| `occupied` |
| `created_at` | timestamp | |

### Tenant

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `room_id` | UUID | FK → Room |
| `name` | string | Required |
| `phone` | string | Required; free text, no format enforced |
| `move_in_date` | date | Required; format `YYYY-MM-DD` |
| `move_out_date` | date | Null if still active; set on move-out |
| `status` | enum | `active` \| `inactive` |
| `created_at` | timestamp | |

### Payment

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | FK → Tenant |
| `month` | string | Format: `YYYY-MM` |
| `amount_due` | integer | In IDR; copied from room's `rent_price` at time of logging |
| `amount_paid` | integer | Actual amount received; `0` if unpaid |
| `status` | enum | `paid` \| `unpaid` \| `partial` |
| `paid_at` | timestamp | Null if unpaid |
| `created_at` | timestamp | |

---

## 6. Data Model Rules

- **Tenant move-out** is a soft delete: `status` → `inactive`, `move_out_date` set to today; all payment records retained.
- **Room deletion** is blocked if `status = occupied` (active tenant assigned). Owner must move out the tenant first. Returns `409 Conflict`.
- **Property deletion** is blocked if any room has an active tenant. Once unblocked, hard-deletes all rooms (all tenants must already be inactive). Returns `409 Conflict` if active tenants exist.
- **Payments** are never hard-deleted to preserve financial history.
- **Freemium limit**: enforced server-side on `POST /api/v1/properties/:propertyId/rooms` — returns `403` with `{ error: "room_limit_reached" }` when free plan property has 10 or more rooms.
- **Partial payment**: `amount_paid < amount_due` and `amount_paid > 0`. Status `paid` requires `amount_paid >= amount_due`.

---

## 7. Auth & Security

- **Session** — encrypted `httpOnly` cookie; 30-day expiry; stores `{ id, email, plan }`
- **Password** — hashed with bcrypt before storage; minimum 8 characters enforced at input
- **Auth guard** — all dashboard routes check for a valid session server-side; redirect to `/login` if missing
- **Logout** — clears the session cookie server-side
- **Tenant portal** (Plan to Have) — will require a separate auth context; not shared with owner session

---

## 8. API Conventions

### Versioning

All endpoints are prefixed with `/api/v1/`.

### Authentication

All endpoints require a valid session cookie unless marked **[public]**. Requests without a valid session return `401`.

### Pagination

All list endpoints support:

| Query param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number (1-indexed) |
| `limit` | integer | `20` | Items per page (max `100`) |

Response envelope for lists:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 84
  }
}
```

### Standard Error Format

All error responses follow:

```json
{
  "error": "snake_case_error_code",
  "message": "Human-readable explanation"
}
```

Common error codes:

| Code | HTTP Status | Meaning |
|---|---|---|
| `unauthorized` | 401 | No valid session |
| `forbidden` | 403 | Session valid but action not allowed |
| `room_limit_reached` | 403 | Free plan room cap hit |
| `not_found` | 404 | Resource does not exist |
| `conflict` | 409 | Action blocked by current state |
| `validation_error` | 422 | Invalid or missing request fields |

---

## 9. API Endpoints

### Auth

#### `POST /api/v1/auth/register` [public]

Register a new owner account. Session cookie is set immediately on success — no verification step.

**Request body:**

```json
{
  "email": "owner@example.com",
  "password": "min8chars"
}
```

**Response `201`:**

```json
{
  "id": "uuid",
  "email": "owner@example.com",
  "plan": "free",
  "created_at": "2026-01-01T00:00:00Z"
}
```

**Response `409`:** `{ "error": "conflict", "message": "Email is already registered." }`

---

#### `POST /api/v1/auth/login` [public]

Authenticate and set session cookie.

**Request body:**

```json
{
  "email": "owner@example.com",
  "password": "min8chars"
}
```

**Response `200`:**

```json
{
  "id": "uuid",
  "email": "owner@example.com",
  "plan": "free"
}
```

**Response `401`:** `{ "error": "unauthorized", "message": "Invalid email or password." }`

---

#### `GET /api/v1/auth/me`

Get current logged-in owner.

**Response `200`:**

```json
{
  "id": "uuid",
  "email": "owner@example.com",
  "plan": "free",
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

#### `POST /api/v1/auth/logout`

Clear the session cookie.

**Response `204`:** No content.

---

### Properties

#### `GET /api/v1/properties`

List all properties for the logged-in owner.

**Query params:** `page`, `limit`

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Kos Melati",
      "address": "Jl. Mawar No. 5",
      "room_count": 8,  // computed field, not stored on property
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

---

#### `POST /api/v1/properties`

Create a new property.

**Request body:**

```json
{
  "name": "Kos Melati",
  "address": "Jl. Mawar No. 5"
}
```

**Response `201`:**

```json
{
  "id": "uuid",
  "name": "Kos Melati",
  "address": "Jl. Mawar No. 5",
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

#### `GET /api/v1/properties/:id`

Get a single property.

**Response `200`:** Single property object (same shape as list item).  
**Response `404`:** `{ "error": "not_found", "message": "Property not found." }`

---

#### `PATCH /api/v1/properties/:id`

Update property details. All fields optional.

**Request body:**

```json
{
  "name": "Kos Melati Baru",
  "address": "Jl. Mawar No. 10"
}
```

**Response `200`:** Updated property object.

---

#### `DELETE /api/v1/properties/:id`

Delete a property. Blocked if any room has an active tenant.

**Response `204`:** No content (success).  
**Response `409`:** `{ "error": "conflict", "message": "Cannot delete property with active tenants." }`

---

### Rooms

#### `GET /api/v1/properties/:propertyId/rooms`

List all rooms under a property.

**Query params:** `page`, `limit`, `status` (`vacant` | `occupied`)

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "property_id": "uuid",
      "room_number": "A1",
      "rent_price": 1500000,
      "status": "occupied",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 8 }
}
```

---

#### `POST /api/v1/properties/:propertyId/rooms`

Create a new room. Enforces freemium limit (max 10 rooms on free plan).

**Request body:**

```json
{
  "room_number": "A1",
  "rent_price": 1500000
}
```

**Response `201`:** Created room object.  
**Response `403`:** `{ "error": "room_limit_reached", "message": "Free plan allows up to 10 rooms. Upgrade to add more." }`

---

#### `GET /api/v1/rooms/:id`

Get a single room.

**Response `200`:** Single room object.  
**Response `404`:** `{ "error": "not_found", "message": "Room not found." }`

---

#### `PATCH /api/v1/rooms/:id`

Update room details. All fields optional.

**Request body:**

```json
{
  "room_number": "B2",
  "rent_price": 1800000
}
```

**Response `200`:** Updated room object.

---

#### `DELETE /api/v1/rooms/:id`

Delete a room. Blocked if an active tenant is assigned.

**Response `204`:** No content.  
**Response `409`:** `{ "error": "conflict", "message": "Cannot delete a room with an active tenant. Move out the tenant first." }`

---

### Tenants

#### `GET /api/v1/tenants`

List tenants. Scoped to the logged-in owner's properties.

**Query params:** `page`, `limit`, `propertyId`, `status` (`active` | `inactive`)

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "room_id": "uuid",
      "room_number": "A1",
      "name": "Budi Santoso",
      "phone": "08123456789",
      "move_in_date": "2025-06-01",
      "move_out_date": null,
      "status": "active",
      "created_at": "2025-06-01T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 6 }
}
```

---

#### `POST /api/v1/tenants`

Add a tenant and assign to a room. Room must be `vacant`.

**Request body:**

```json
{
  "room_id": "uuid",
  "name": "Budi Santoso",
  "phone": "08123456789",
  "move_in_date": "2025-06-01"
}
```

**Response `201`:** Created tenant object.  
**Response `409`:** `{ "error": "conflict", "message": "Room is already occupied." }`

---

#### `GET /api/v1/tenants/:id`

Get a single tenant.

**Response `200`:** Single tenant object.  
**Response `404`:** `{ "error": "not_found", "message": "Tenant not found." }`

---

#### `PATCH /api/v1/tenants/:id`

Update tenant info. All fields optional.

**Request body:**

```json
{
  "name": "Budi S.",
  "phone": "08199999999"
}
```

**Response `200`:** Updated tenant object.

---

#### `PATCH /api/v1/tenants/:id/move-out`

Mark tenant as moved out. Sets `status → inactive`, records `move_out_date`. Room status becomes `vacant`.

**Request body:**

```json
{
  "move_out_date": "2026-03-15"
}
```

> `move_out_date` defaults to today if omitted.

**Response `200`:**

```json
{
  "id": "uuid",
  "status": "inactive",
  "move_out_date": "2026-03-15"
}
```

**Response `409`:** `{ "error": "conflict", "message": "Tenant is already inactive." }`

---

### Payments

#### `GET /api/v1/payments`

List payment records. Scoped to the logged-in owner.

**Query params:** `page`, `limit`, `tenantId`, `month` (format: `YYYY-MM`), `status` (`paid` | `unpaid` | `partial`)

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "tenant_name": "Budi Santoso",
      "month": "2026-03",
      "amount_due": 1500000,
      "amount_paid": 1500000,
      "status": "paid",
      "paid_at": "2026-03-05T10:00:00Z",
      "created_at": "2026-03-01T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 12 }
}
```

---

#### `POST /api/v1/payments`

Log a new payment record.

**Request body:**

```json
{
  "tenant_id": "uuid",
  "month": "2026-03",
  "amount_due": 1500000,
  "amount_paid": 1000000,
  "status": "partial"
}
```

> `status` must be consistent with amounts: `paid` requires `amount_paid >= amount_due`; `unpaid` requires `amount_paid = 0`; `partial` requires `0 < amount_paid < amount_due`.

**Response `201`:** Created payment object.  
**Response `422`:** `{ "error": "validation_error", "message": "amount_paid is inconsistent with status." }`

---

#### `GET /api/v1/payments/:id`

Get a single payment record.

**Response `200`:** Single payment object.  
**Response `404`:** `{ "error": "not_found", "message": "Payment not found." }`

---

#### `PATCH /api/v1/payments/:id`

Update payment status or amount.

**Request body:**

```json
{
  "amount_paid": 1500000,
  "status": "paid"
}
```

**Response `200`:** Updated payment object.  
**Response `422`:** `{ "error": "validation_error", "message": "amount_paid is inconsistent with status." }`

---

### Reports

#### `GET /api/v1/reports/summary`

Monthly income summary for a property.

**Query params:**

| Param | Required | Description |
|---|---|---|
| `propertyId` | Yes | Which property to report on |
| `month` | Yes | Format: `YYYY-MM` |

**Response `200`:**

```json
{
  "property_id": "uuid",
  "property_name": "Kos Melati",
  "month": "2026-03",
  "total_rooms": 8,
  "occupied_rooms": 6,
  "vacant_rooms": 2,
  "total_due": 9000000,
  "total_collected": 7500000,
  "total_outstanding": 1500000,
  "payment_breakdown": [
    {
      "tenant_id": "uuid",
      "tenant_name": "Budi Santoso",
      "room_number": "A1",
      "amount_due": 1500000,
      "amount_paid": 1500000,
      "status": "paid"
    }
  ]
}
```

> Satisfies User Story #7 (payment history per tenant) and User Story #8 (dashboard) in a single report call.
