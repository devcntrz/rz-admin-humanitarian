# RZ Humanitarian Admin API Documentation

Base URL: `/api`

Semua response mengikuti envelope yang konsisten:

```json
{
  "success": true,
  "data": {},
  "message": "optional",
  "total": 0,
  "error": "optional when success=false"
}
```

Catatan umum:
- Format tanggal: `YYYY-MM-DD`.
- Semua endpoint mendukung CORS dan JSON body kecuali upload file (FormData).
- Query pencarian menggunakan `q` (case-insensitive, ILIKE di Postgres).

## Authentication

### Mobile Google SSO

POST `/api/auth/mobile/google`
- Autentikasi untuk aplikasi mobile menggunakan Google SSO.
- Hanya volunteer yang sudah terdaftar di database yang dapat login.
- Body Request:
```json
{
  "idToken": "ey..." // Google ID token dari mobile app
}
```

Response Sukses (200):
```json
{
  "status": "success",
  "message": "Relawan ditemukan dan diautentikasi.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // JWT token untuk sesi mobile
  "user": {
    "id": "1",
    "nama": "Budi Santoso",
    "email": "budi.santoso@gmail.com"
  }
}
```

Response Error (404):
```json
{
  "status": "error",
  "message": "Email tidak terdaftar sebagai volunteer. Silakan hubungi admin untuk pendaftaran."
}
```

Response Error (401):
```json
{
  "status": "error",
  "message": "Token Google tidak valid"
}
```

### Volunteer Email/Password Login

POST `/api/auth/volunteer/login`
- Autentikasi volunteer menggunakan email dan password.
- Body Request:
```json
{
  "email": "volunteer@example.com",
  "password": "password123"
}
```

Response Sukses (200):
```json
{
  "status": "success",
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // JWT token untuk sesi
  "user": {
    "id": "1",
    "nama": "Budi Santoso",
    "email": "budi.santoso@gmail.com"
  }
}
```

Response Error (400):
```json
{
  "status": "error",
  "message": "Email dan password diperlukan"
}
```

Response Error (404):
```json
{
  "status": "error",
  "message": "Email tidak terdaftar sebagai volunteer"
}
```

Response Error (401):
```json
{
  "status": "error",
  "message": "Password salah"
}
```

### Volunteer Logout

POST `/api/auth/volunteer/logout`
- Logout volunteer (token dihapus di sisi client).
- Headers: `Authorization: Bearer <token>`

Response Sukses (200):
```json
{
  "status": "success",
  "message": "Logout berhasil"
}
```

### Token Validation

GET `/api/auth/volunteer/validate`
- Validasi JWT token volunteer.
- Headers: `Authorization: Bearer <token>`

Response Sukses (200):
```json
{
  "status": "success",
  "message": "Token valid",
  "user": {
    "id": "1",
    "nama": "Budi Santoso",
    "email": "budi.santoso@gmail.com"
  },
  "tokenInfo": {
    "expiresAt": "2025-10-20T10:30:00.000Z",
    "issuedAt": "2025-10-13T10:30:00.000Z"
  }
}
```

Response Error (401):
```json
{
  "status": "error",
  "message": "Token tidak valid atau sudah expired"
}
```

### Change Password

POST `/api/auth/volunteer/change-password`
- Mengubah password volunteer.
- **Tidak memerlukan current password** - autentikasi dilakukan melalui JWT token.
- Headers: `Authorization: Bearer <token>`
- Body Request:
```json
{
  "newPassword": "newPassword123!"
}
```

Response Sukses (200):
```json
{
  "status": "success",
  "message": "Password berhasil diubah"
}
```

Response Error (400):
```json
{
  "status": "error",
  "message": "Password baru tidak memenuhi kriteria keamanan",
  "errors": [
    "Password minimal 8 karakter",
    "Password harus mengandung minimal 1 huruf besar"
  ]
}
```

Response Error (401):
```json
{
  "status": "error",
  "message": "Password lama salah"
}
```

## Options

GET `/api/options`
- Mengembalikan data referensi untuk dropdown.
Response `data`:
```json
{
  "volunteers": [{ "id": 1, "full_name": "..." }],
  "disasterTypes": [{ "id": 1, "name": "..." }],
  "villages": [{ "id": "1101010001", "name": "..." }],
  "provinces": [{ "id": "11", "name": "..." }],
  "regencies": [{ "id": "1101", "name": "...", "province_id": "11" }],
  "districts": [{ "id": "1101010", "name": "...", "regency_id": "1101" }]
}
```

## Volunteers

- GET `/api/volunteers?q=<string>` → list 10 terbaru atau hasil cari
- POST `/api/volunteers`
  - Body: `{ full_name: string, email: string, phone?: string }`
  - Catatan: server akan mengisi `password_hash` default kosong.
- PUT `/api/volunteers`
  - Body: `{ id: number, full_name: string, email: string, phone?: string }`
- DELETE `/api/volunteers?id=<number>`

Response item:
```json
{ "id": 1, "full_name": "...", "email": "...", "phone": "...", "created_at": "ISO" }
```

## Situation Reports

GET `/api/site-reports?q=<string>`
- Mengembalikan ringkasan report + join volunteer, disaster, village.

GET `/api/site-reports/volunteer/:volunteerId`
- Mengembalikan semua situation reports yang dibuat oleh volunteer tertentu.
- Response:
```json
{
  "success": true,
  "data": {
    "volunteer": { "id": 1, "full_name": "Budi Santoso", "email": "budi@example.com" },
    "siteReports": [
      {
        "id": 1,
        "report_date": "2025-10-13",
        "status": "submitted",
        "disaster_name": "Banjir",
        "village_name": "Dago",
        "district_name": "Coblong",
        "regency_name": "Kota Bandung",
        "province_name": "Jawa Barat"
      }
    ],
    "total": 1
  }
}
```

GET `/api/site-reports/:id/details`
- Mengembalikan semua detail situation report dalam satu response.
- Response:
```json
{
  "success": true,
  "data": {
    "siteReport": { /* data utama situation report */ },
    "details": {
      "victims": [{ "id": 1, "name": "Luka Ringan", "count": 15 }],
      "damages": [{ "id": 1, "name": "Rumah Terendam", "count": 50, "unit": "unit" }],
      "refugees": [{ "id": 1, "name": "Aula Kelurahan", "count": 150 }],
      "needs": [{ "id": 1, "name": "Makanan Siap Saji", "count": 300, "unit": "porsi" }]
    },
    "documents": [{ "id": 1, "file_url": "...", "description": "..." }]
  }
}
```

POST `/api/site-reports`
PUT `/api/site-reports` (lihat catatan di bawah)

Skema create/update (semua field opsional kecuali yang disebut):
```json
{
  "volunteer_id": number,
  "disaster_type_id": number,
  "province_id": "string(2)",
  "regency_id": "string(4)",
  "district_id": "string(7)",
  "village_id": "string(10)",
  "full_address": "string",
  "latitude": number,
  "longitude": number,
  "report_date": "YYYY-MM-DD",
  "status": "draft" | "submitted"
}
```

Catatan update: gunakan endpoint `PUT /api/site-reports` dengan body `{ id: number, ...payload }`.

DELETE `/api/site-reports/:id`

### Situation Report Details

Victims
- GET `/api/site-reports/:id/victims`
- POST `/api/site-reports/:id/victims` `{ category: string, count: number, description?: string }`
- PUT `/api/site-reports/:id/victims/:victimId` body sama seperti POST
- DELETE `/api/site-reports/:id/victims/:victimId`

Damages
- GET `/api/site-reports/:id/damages`
- POST `/api/site-reports/:id/damages` `{ infrastructure_type: string, damage_level: string, description?: string }`
- PUT `/api/site-reports/:id/damages/:damageId` body sama
- DELETE `/api/site-reports/:id/damages/:damageId`

Refugees
- GET `/api/site-reports/:id/refugees`
- POST `/api/site-reports/:id/refugees` `{ location: string, count: number, condition_description?: string }`
- PUT `/api/site-reports/:id/refugees/:refugeeId` body sama
- DELETE `/api/site-reports/:id/refugees/:refugeeId`

Needs
- GET `/api/site-reports/:id/needs`
- POST `/api/site-reports/:id/needs` `{ need_item: string, quantity: number, unit: string }`
- PUT `/api/site-reports/:id/needs/:needId` body sama
- DELETE `/api/site-reports/:id/needs/:needId`

Documents
- GET `/api/site-reports/:id/documents`
- POST `/api/site-reports/:id/documents` (FormData) `file: File`, `description?: string`
- PUT `/api/site-reports/:id/documents/:docId` `{ description?: string }`
- DELETE `/api/site-reports/:id/documents/:docId`

## Distribution Reports

Daftar (terkonversi dari tabel `distribution_reports` untuk UI list)
- GET `/api/distributions?q=<string>`
  - Response item ringkasan: 
  ```json
  {
    "id": 1,
    "distribution_date": "YYYY-MM-DD",
    "status": "completed|in_progress|draft",
    "recipient_name": "string (diambil dari event_name untuk kompatibilitas UI lama)",
    "recipient_phone": "string|null",
    "items": "string",
    "quantity": number,
    "notes": "string|null",
    "volunteer_id": number|null,
    "volunteer": "string|null",
    "village": "string|null"
  }
  ```

GET `/api/distributions/volunteer/:volunteerId`
- Mengembalikan semua distribution reports yang dibuat oleh volunteer tertentu.
- Response:
```json
{
  "success": true,
  "data": {
    "volunteer": { "id": 1, "full_name": "Budi Santoso", "email": "budi@example.com" },
    "distributionReports": [
      {
        "id": 1,
        "spk_number": "SPK-001-BND",
        "event_name": "Banjir Bandung Selatan",
        "event_date": "2025-09-11",
        "beneficiary_count": 150,
        "volunteer_count": 10,
        "disaster_name": "Banjir",
        "village_name": "Dago",
        "district_name": "Coblong",
        "regency_name": "Kota Bandung",
        "province_name": "Jawa Barat"
      }
    ],
    "total": 1
  }
}
```

GET `/api/distributions/:id/details`
- Mengembalikan semua detail distribution report dalam satu response.
- Response:
```json
{
  "success": true,
  "data": {
    "distributionReport": { /* data utama distribution report */ },
    "details": {
      "clusters": [
        { "id": 1, "name": "Pangan", "program": "Bantuan Makanan Siap Saji", "count": 200, "unit": "paket" }
      ],
      "partners": [
        { "id": 1, "name": "BPBD Kota Bandung" }
      ]
    },
    "documents": [{ "id": 1, "file_url": "..." }]
  }
}
```

Create/Update (skema tabel `distribution_reports` terbaru):
- POST `/api/distributions`
- PUT `/api/distributions`

Body create/update:
```json
{
  "spk_number": "string",
  "event_name": "string",
  "event_date": "YYYY-MM-DD",
  "disaster_type_id": number,
  "pic_volunteer_id": number,  // alias: volunteer_id
  "full_address": "string",
  "latitude": number,
  "longitude": number,
  "beneficiary_count": number,
  "volunteer_count": number,
  "province_id": "string(2)",
  "regency_id": "string(4)",
  "district_id": "string(7)",
  "village_id": "string(10)",
  "notes": "string"
}
```

DELETE `/api/distributions/:id`

### Distribution Details

Clusters
- GET `/api/distributions/:id/clusters`
- POST `/api/distributions/:id/clusters` `{ cluster_name: string, program_name: string, quantity: number, unit: string }`
- PUT `/api/distributions/:id/clusters/:clusterId` body sama
- DELETE `/api/distributions/:id/clusters/:clusterId`

Partners
- GET `/api/distributions/:id/partners`
- POST `/api/distributions/:id/partners` `{ partner_name: string }`
- PUT `/api/distributions/:id/partners/:partnerId` body sama
- DELETE `/api/distributions/:id/partners/:partnerId`

Documents
- GET `/api/distributions/:id/documents`
- POST `/api/distributions/:id/documents` (FormData) `file: File`
- DELETE `/api/distributions/:id/documents/:docId`

## Master Config

Semua endpoint berikut mendukung pencarian `q` dan filtering hirarkis sesuai wilayah.

### Provinces
- GET `/api/config/provinces?q=<string>`
- POST `/api/config/provinces` `{ id: string(2), name: string }`
- PUT `/api/config/provinces/:id` `{ name: string }`
- DELETE `/api/config/provinces/:id`

### Regencies
- GET `/api/config/regencies?q=<string>&province_id=<string(2)>`
- POST `/api/config/regencies` `{ id: string(4), province_id: string(2), name: string }`
- PUT `/api/config/regencies/:id` `{ name: string, province_id: string(2) }`
- DELETE `/api/config/regencies/:id`

### Districts
- GET `/api/config/districts?q=<string>&regency_id=<string(4)>&province_id=<string(2)>`
- POST `/api/config/districts` `{ id: string(7), regency_id: string(4), name: string }`
- PUT `/api/config/districts/:id` `{ name: string, regency_id: string(4) }`
- DELETE `/api/config/districts/:id`

### Villages
- GET `/api/config/villages?q=<string>&district_id=<string(7)>&regency_id=<string(4)>&province_id=<string(2)>`
- POST `/api/config/villages` `{ id: string(10), district_id: string(7), name: string }`
- PUT `/api/config/villages/:id` `{ name: string, district_id: string(7) }`
- DELETE `/api/config/villages/:id`

### Disaster Types
- GET `/api/config/disaster-types?q=<string>`
- POST `/api/config/disaster-types` `{ name: string }`
- PUT `/api/config/disaster-types/:id` `{ name: string }`
- DELETE `/api/config/disaster-types/:id`

### Admins
- GET `/api/config/admins?q=<string>`
- POST `/api/config/admins` `{ full_name: string, email: string, role: string }`
- PUT `/api/config/admins/:id` `{ full_name: string, email: string, role: string }`
- DELETE `/api/config/admins/:id`

## Upload & FormData
- Untuk upload dokumen, kirim menggunakan `multipart/form-data` (FormData). Header `Content-Type` dibiarkan kosong agar diisi otomatis oleh browser. Library client sudah menanganinya.

## Error Handling
- Untuk error validasi: HTTP `400` dengan `{ success: false, error: "..." }`.
- Untuk not found: HTTP `404`.
- Untuk error server: HTTP `500`.

## CORS
Semua route dibungkus middleware CORS. Mendukung semua origin untuk kompatibilitas mobile app:
- Development: `http://localhost:3000`, `http://localhost:3001`
- Mobile development: `exp://localhost:19000`, `capacitor://localhost`
- React Native: `http://localhost:8081`, `http://localhost:19006`
- Production: Set `ALLOW_ALL_ORIGINS=true` untuk mengizinkan semua origin

---

Dokumentasi ini dihasilkan berdasarkan kode di direktori `app/api` dan klien `lib/api.ts`. Jika ada perubahan skema/route baru, update file ini bersamaan dengan perubahan kode.

