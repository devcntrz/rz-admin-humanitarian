# Setup Postman Collection untuk RZ Humanitarian Admin API

## File yang Tersedia

1. **RZ-Humanitarian-Admin.postman_collection.json** - Collection utama dengan semua endpoint API
2. **RZ-Humanitarian-Admin.postman_environment.json** - Environment variables untuk development dan production

## Cara Import ke Postman

### 1. Import Collection
1. Buka Postman
2. Klik **Import** di pojok kiri atas
3. Pilih file `RZ-Humanitarian-Admin.postman_collection.json`
4. Klik **Import**

### 2. Import Environment
1. Klik **Import** lagi
2. Pilih file `RZ-Humanitarian-Admin.postman_environment.json`
3. Klik **Import**
4. Pilih environment "RZ Humanitarian Admin Environment" di dropdown environment

## Konfigurasi Environment

### Variables yang Tersedia:
- `base_url`: URL dasar API (default: http://localhost:3000/api)
- `jwt_token`: Token JWT untuk authentication (akan diisi otomatis setelah login)
- `production_url`: URL production (https://rz-humanitarian-admin.vercel.app/api)
- `volunteer_email`: Email volunteer untuk testing
- `volunteer_password`: Password volunteer untuk testing

### Mengubah Environment:
1. Klik dropdown environment di pojok kanan atas
2. Pilih "RZ Humanitarian Admin Environment"
3. Klik ikon mata untuk melihat/edit variables

## Cara Menggunakan

### 1. Authentication
1. Jalankan request **"Volunteer Login"** di folder Authentication
2. Token JWT akan otomatis tersimpan di variable `jwt_token`
3. Semua request yang memerlukan authentication akan menggunakan token ini

### 2. Testing Endpoints
1. **Options**: Mulai dengan "Get All Options" untuk mendapatkan data referensi
2. **Volunteers**: Test CRUD operations untuk volunteers
3. **Site Reports**: Test site reports dan detail-detailnya
4. **Distribution Reports**: Test distribution reports
5. **Master Config**: Test konfigurasi master data

### 3. Upload File
Untuk endpoint yang memerlukan upload file (seperti documents):
1. Pilih tab **Body**
2. Pilih **form-data**
3. Tambahkan key "file" dengan type "File"
4. Pilih file yang ingin diupload

## Struktur Collection

```
RZ Humanitarian Admin API
├── Authentication
│   ├── Mobile Google SSO
│   ├── Volunteer Login (auto-save token)
│   ├── Volunteer Logout
│   ├── Validate Token
│   └── Change Password
├── Options
│   └── Get All Options
├── Volunteers
│   ├── Get Volunteers
│   ├── Create Volunteer
│   ├── Update Volunteer
│   └── Delete Volunteer
├── Site Reports
│   ├── Get Site Reports
│   ├── Get Site Reports by Volunteer
│   ├── Get Site Report Details
│   ├── Create Site Report
│   ├── Update Site Report
│   └── Delete Site Report
├── Site Report Details
│   ├── Victims (GET, POST, PUT, DELETE)
│   ├── Damages (GET, POST, PUT, DELETE)
│   ├── Refugees (GET, POST, PUT, DELETE)
│   ├── Needs (GET, POST, PUT, DELETE)
│   └── Documents (GET, POST, PUT, DELETE)
├── Distribution Reports
│   ├── Get Distributions
│   ├── Get Distributions by Volunteer
│   ├── Get Distribution Details
│   ├── Create Distribution
│   ├── Update Distribution
│   └── Delete Distribution
└── Master Config
    ├── Provinces (GET, POST, PUT, DELETE)
    ├── Disaster Types (GET, POST, PUT, DELETE)
    └── Admins (GET, POST, PUT, DELETE)
```

## Tips Penggunaan

### 1. Pre-request Scripts
Collection sudah dilengkapi dengan pre-request scripts untuk:
- Auto-save JWT token setelah login
- Set authorization headers otomatis

### 2. Test Scripts
Beberapa request memiliki test scripts untuk:
- Validasi response format
- Auto-extract data dari response
- Set variables untuk request berikutnya

### 3. Environment Switching
Untuk beralih antara development dan production:
1. Edit variable `base_url` di environment
2. Atau buat environment terpisah untuk production

### 4. Error Handling
Semua endpoint mengikuti format response yang konsisten:
```json
{
  "success": true/false,
  "data": {},
  "message": "optional",
  "error": "optional when success=false"
}
```

## Troubleshooting

### 1. CORS Error
Pastikan server API sudah running dan CORS sudah dikonfigurasi dengan benar.

### 2. Authentication Error
- Pastikan sudah login terlebih dahulu
- Check apakah token JWT masih valid
- Gunakan "Validate Token" untuk mengecek status token

### 3. 404 Error
- Pastikan endpoint URL benar
- Check apakah server API sedang running
- Verify base_url di environment

### 4. 500 Error
- Check server logs
- Verify request body format
- Pastikan semua required fields terisi

## Development vs Production

### Development (localhost:3000)
- Gunakan `base_url`: `http://localhost:3000/api`
- Pastikan server development sudah running

### Production (Vercel)
- Gunakan `base_url`: `https://rz-humanitarian-admin.vercel.app/api`
- Pastikan deployment sudah berhasil
- Check CORS configuration untuk production domain

## Support

Jika ada masalah dengan collection ini:
1. Check dokumentasi API di `API_DOCUMENTATION.md`
2. Verify endpoint implementation di folder `app/api`
3. Check server logs untuk error details

