# Sitrep API — Additional Fields & Timezone (Mobile Knowledge)

> Source: `rz-admin-humanitarian`  
> Timezone policy: **Asia/Jakarta (WIB, UTC+7)**  
> Scope: additional fields only (beyond existing sitrep payload)

---

## 1. New Sitrep Fields (summary)

| Field | Type | Required | Description |
|---|---|---|---|
| `incident_at` | `string` | no | Incident datetime |
| `chronology` | `string` | no | Kronologi kejadian |
| `disaster_status` | `string` | no | Status bencana |
| `latest_condition` | `string` | no | Kondisi mutakhir |
| `field_coordinator_id` | `number` | no | FK to field coordinators |
| `information_source` | `string` | no | Sumber informasi |

### Related response-only fields

| Field | Type | Description |
|---|---|---|
| `incident_at_local` | `string` | Jakarta local for forms: `YYYY-MM-DDTHH:mm` |
| `incident_at_display` | `string` | Jakarta display: `YYYY-MM-DD HH:mm` |
| `field_coordinator_name` | `string` | Coordinator full name |
| `field_coordinator_phone` | `string` | Coordinator phone |

---

## 2. Timezone rules for `incident_at` (important)

Server stores `incident_at` as `timestamptz` (UTC).

### What mobile should send

| Format | Example | How server treats it |
|---|---|---|
| Naive (recommended for form UI) | `2026-08-05T14:30` | **Asia/Jakarta** |
| Naive with seconds | `2026-08-05T14:30:00` | **Asia/Jakarta** |
| With space | `2026-08-05 14:30:00` | **Asia/Jakarta** |
| With offset | `2026-08-05T14:30:00+07:00` | kept as-is |
| UTC / Z | `2026-08-05T07:30:00Z` | kept as-is |
| Date only | `2026-08-05` | Jakarta `00:00` |

### Example

User picks **05 Aug 2026, 14:30 WIB**:

```json
{ "incident_at": "2026-08-05T14:30" }
```

Stored as UTC: `2026-08-05T07:30:00.000Z`  
Returned for form: `incident_at_local = "2026-08-05T14:30"`

### Mobile guidance

1. Collect date/time as local Indonesia time (WIB).
2. Send naive `YYYY-MM-DDTHH:mm` (no need to convert to UTC).
3. For edit forms, prefer `incident_at_local` (not raw UTC `incident_at`).
4. For list/display, use `incident_at` / `incident_at_display` (already Jakarta-formatted).

---

## 3. `POST /api/site-reports` — Create

### Additional request body fields

```json
{
  "incident_at": "2026-08-05T14:30",
  "chronology": "Hujan deras sejak pagi, sungai meluap...",
  "disaster_status": "Siaga",
  "latest_condition": "Air mulai surut di beberapa titik",
  "field_coordinator_id": 3,
  "information_source": "BPBD Kab. Bandung / warga setempat"
}
```

### Full create example (existing + new)

```json
{
  "volunteer_id": 12,
  "disaster_type_id": 1,
  "village_id": "3204281001",
  "province_id": "32",
  "regency_id": "3204",
  "district_id": "3204281",
  "report_date": "2026-08-05",
  "status": "draft",
  "subject": "Banjir Cileunyi",
  "full_address": "Jl. ...",
  "latitude": -6.9395,
  "longitude": 107.7240,

  "incident_at": "2026-08-05T14:30",
  "chronology": "...",
  "disaster_status": "Siaga",
  "latest_condition": "...",
  "field_coordinator_id": 3,
  "information_source": "..."
}
```

### Additional response `data` fields

```json
{
  "success": true,
  "data": {
    "id": 140,
    "incident_at": "2026-08-05T07:30:00.000Z",
    "chronology": "...",
    "disaster_status": "Siaga",
    "latest_condition": "...",
    "field_coordinator_id": 3,
    "information_source": "...",
    "created_at": "..."
  },
  "message": "Situation report created successfully"
}
```

> Note: create response returns raw UTC `incident_at`. For form refill, call GET detail and use `incident_at_local`.

---

## 4. `PUT /api/site-reports/[id]` — Update

Same additional body fields as create:

```json
{
  "incident_at": "2026-08-05T14:30",
  "chronology": "...",
  "disaster_status": "...",
  "latest_condition": "...",
  "field_coordinator_id": 3,
  "information_source": "..."
}
```

Also supported: `PUT /api/site-reports` with `id` in body (same fields).

---

## 5. `GET /api/site-reports/[id]` — Detail

### Additional / useful response fields

```json
{
  "success": true,
  "data": {
    "id": 140,
    "subject": "Banjir Cileunyi",
    "report_date": "2026-08-05",

    "incident_at": "2026-08-05T07:30:00.000Z",
    "incident_at_local": "2026-08-05T14:30",
    "incident_at_display": "2026-08-05 14:30",

    "chronology": "...",
    "disaster_status": "Siaga",
    "latest_condition": "...",
    "information_source": "...",

    "field_coordinator_id": 3,
    "field_coordinator_name": "Budi Santoso",
    "field_coordinator_phone": "0812xxxxxxx"
  }
}
```

### Mobile mapping suggestion

| UI | Use field |
|---|---|
| Date picker | split `incident_at_local` → date part |
| Time picker | split `incident_at_local` → time part |
| Display text | `incident_at_display` |
| Coordinator dropdown | `field_coordinator_id` |
| Coordinator label | `field_coordinator_name` / phone |

---

## 6. `GET /api/site-reports/[id]/details` — Detail + children

Used by mobile for full sitrep (victims/damages/refugees/needs/documents).

### Additional `data.siteReport` fields

```json
{
  "success": true,
  "data": {
    "siteReport": {
      "chronology": "...",
      "disaster_status": "...",
      "latest_condition": "...",
      "information_source": "...",
      "field_coordinator_id": 3,
      "field_coordinator_name": "Budi Santoso",
      "field_coordinator_phone": "0812xxxxxxx",
      "incident_at_local": "2026-08-05T14:30",
      "incident_at_display": "2026-08-05 14:30"
    },
    "details": { "victims": [], "damages": [], "refugees": [], "needs": [] },
    "documents": []
  }
}
```

---

## 7. `GET /api/site-reports/volunteer/[volunteerId]` — Mobile list

### Additional fields per item in `data.siteReports[]`

```json
{
  "success": true,
  "data": {
    "volunteer": { "id": 12, "full_name": "...", "email": "..." },
    "siteReports": [
      {
        "id": 140,
        "report_date": "2026-08-05",
        "status": "draft",
        "subject": "Banjir Cileunyi",

        "incident_at": "2026-08-05 14:30",
        "incident_at_local": "2026-08-05T14:30",
        "chronology": "...",
        "disaster_status": "Siaga",
        "latest_condition": "...",
        "information_source": "...",
        "field_coordinator_id": 3,
        "field_coordinator_name": "Budi Santoso",
        "field_coordinator_phone": "0812xxxxxxx"
      }
    ],
    "pagination": { "totalItems": 1, "totalPages": 1, "currentPage": 1, "pageSize": 5 }
  }
}
```

---

## 8. `GET /api/site-reports` — Admin/general list

### Additional list fields

- `incident_at` → Jakarta `YYYY-MM-DD HH:mm`
- `disaster_status`
- `field_coordinator_id`
- `field_coordinator` (name)

> List endpoint does **not** return full `chronology` / `latest_condition` / `information_source` (use detail endpoints).

---

## 9. Field Coordinators master data

### Option A — via options (recommended for mobile bootstrap)

`GET /api/options`

Additional response key:

```json
{
  "success": true,
  "data": {
    "volunteers": [],
    "disasterTypes": [],
    "provinces": [],
    "regencies": [],
    "districts": [],
    "villages": [],
    "fieldCoordinators": [
      {
        "id": 3,
        "full_name": "Budi Santoso",
        "phone_number": "0812xxxxxxx"
      }
    ]
  }
}
```

### Option B — dedicated endpoint

`GET /api/config/field-coordinators`

```json
{
  "success": true,
  "data": [
    { "id": 3, "full_name": "Budi Santoso", "phone": "0812xxxxxxx" }
  ],
  "total": 1
}
```

> Note naming difference:
> - `/api/options` → `phone_number`
> - `/api/config/field-coordinators` → `phone`

---

## 10. Mobile implementation checklist

- [ ] Add form fields: waktu kejadian, kronologi, status bencana, kondisi mutakhir, koordinator lapangan, sumber informasi
- [ ] Load coordinators from `data.fieldCoordinators` (`GET /api/options`)
- [ ] On create/update, send the 6 new fields
- [ ] On edit load, bind time from `incident_at_local`
- [ ] Do **not** manually convert naive local time to UTC before send
- [ ] List cards can show `incident_at` + `disaster_status` + coordinator name
- [ ] Keep existing victims/damages/refugees/needs/documents APIs unchanged

---

## 11. Quick TypeScript models (optional)

```ts
type SitrepAdditionalWrite = {
  incident_at?: string | null          // "YYYY-MM-DDTHH:mm" (WIB) or ISO with offset
  chronology?: string | null
  disaster_status?: string | null
  latest_condition?: string | null
  field_coordinator_id?: number | null
  information_source?: string | null
}

type SitrepAdditionalRead = SitrepAdditionalWrite & {
  incident_at_local?: string | null    // "YYYY-MM-DDTHH:mm" Jakarta
  incident_at_display?: string | null  // "YYYY-MM-DD HH:mm" Jakarta
  field_coordinator_name?: string | null
  field_coordinator_phone?: string | null
}

type FieldCoordinatorOption = {
  id: number
  full_name: string
  phone_number?: string | null // from /api/options
  phone?: string | null        // from /api/config/field-coordinators
}
```
