# Product Requirements Document (PRD)
## Rumah Zakat Humanitarian Admin

**Versi:** 1.0  
**Tanggal:** 2025  
**Status:** Production

---

## 1. Executive Summary

### 1.1 Deskripsi Produk
Rumah Zakat Humanitarian Admin adalah aplikasi web berbasis Next.js yang digunakan untuk mengelola data humanitarian, termasuk laporan situasi bencana (Situation Reports), laporan distribusi bantuan (Distribution Reports), manajemen relawan (Volunteers), dan konfigurasi master data wilayah administratif Indonesia.

### 1.2 Tujuan
- Memudahkan admin dalam mengelola data humanitarian secara terpusat
- Menyediakan dashboard untuk monitoring aktivitas relawan dan laporan
- Menyediakan API yang dapat digunakan oleh aplikasi mobile untuk input data di lapangan
- Mengelola master data wilayah administratif Indonesia (Provinsi, Kabupaten/Kota, Kecamatan, Desa)

### 1.3 Target Pengguna
- **Super Admin**: Admin dengan akses penuh ke semua fitur
- **Regional Admin**: Admin dengan akses terbatas sesuai wilayah
- **Staff**: Staff operasional yang mengelola data harian

---

## 2. Fitur Utama

### 2.1 Authentication & Authorization

#### 2.1.1 Login Page (`/login`)
**Deskripsi:** Halaman login untuk admin menggunakan Google SSO

**Fitur:**
- Login menggunakan Google OAuth
- Validasi email admin melalui tabel `admins`
- Redirect ke dashboard setelah login berhasil
- Menampilkan pesan error jika email tidak terdaftar
- Loading state saat proses autentikasi

**Validasi:**
- Email harus terdaftar di tabel `admins`
- Session management menggunakan NextAuth.js

**Acceptance Criteria:**
- [ ] Admin dapat login menggunakan akun Google yang terdaftar
- [ ] Admin dengan email tidak terdaftar tidak dapat login
- [ ] Session tersimpan setelah login berhasil
- [ ] Redirect ke `/admin` setelah login

---

### 2.2 Dashboard (`/admin`)

#### 2.2.1 Dashboard Overview
**Deskripsi:** Halaman utama yang menampilkan ringkasan statistik

**Fitur:**
- Card statistik jumlah Volunteers
- Card statistik jumlah Situation Reports
- Card statistik jumlah Distribution Reports
- Layout responsif untuk desktop dan mobile

**Data yang Ditampilkan:**
- Total Volunteers (dari tabel `volunteers`)
- Total Situation Reports (dari tabel `site_reports`)
- Total Distribution Reports (dari tabel `distribution_reports`)

**Acceptance Criteria:**
- [ ] Menampilkan jumlah total volunteers
- [ ] Menampilkan jumlah total situation reports
- [ ] Menampilkan jumlah total distribution reports
- [ ] Data di-update secara real-time
- [ ] Layout responsif untuk berbagai ukuran layar

---

### 2.3 Volunteers Management (`/admin/volunteers`)

#### 2.3.1 Daftar Volunteers
**Deskripsi:** Halaman untuk melihat, menambah, mengedit, dan menghapus data volunteers

**Fitur:**
- Tabel daftar volunteers dengan kolom:
  - ID
  - Nama Lengkap
  - Email
  - No. Telepon
  - Tanggal Daftar
  - Aksi (Edit, Delete)
- Pencarian berdasarkan nama, email, atau telepon
- Pagination (10 items per page)
- Tombol "Tambah Volunteer"
- Export data ke Excel (opsional)

**Validasi:**
- Nama lengkap wajib diisi
- Email wajib diisi dan harus unik
- Password wajib diisi saat create, opsional saat update
- Format email harus valid

**Acceptance Criteria:**
- [ ] Menampilkan daftar volunteers dengan pagination
- [ ] Pencarian berfungsi dengan case-insensitive
- [ ] Dapat menambah volunteer baru
- [ ] Dapat mengedit data volunteer
- [ ] Dapat menghapus volunteer dengan konfirmasi
- [ ] Password tidak wajib diisi saat edit (jika tidak ingin diubah)
- [ ] Validasi form berfungsi dengan baik

#### 2.3.2 Form Create/Edit Volunteer
**Deskripsi:** Modal form untuk menambah atau mengedit volunteer

**Field:**
- Nama Lengkap (required)
- Email (required, unique)
- No. Telepon (optional)
- Password (required saat create, optional saat edit)

**Validasi:**
- Semua field required harus diisi
- Email harus unik
- Password minimal 8 karakter (jika diisi)

**Acceptance Criteria:**
- [ ] Form dapat digunakan untuk create dan edit
- [ ] Validasi client-side berfungsi
- [ ] Password dapat di-toggle visibility
- [ ] Pesan error ditampilkan jika validasi gagal
- [ ] Success toast ditampilkan setelah save berhasil

---

### 2.4 Situation Reports Management (`/admin/site-reports`)

#### 2.4.1 Daftar Situation Reports
**Deskripsi:** Halaman untuk melihat, menambah, mengedit, dan menghapus situation reports

**Fitur:**
- Tabel daftar situation reports dengan kolom:
  - ID
  - Subjek
  - Tanggal Laporan
  - Status (draft/submitted)
  - Volunteer
  - Jenis Bencana
  - Desa, Kecamatan, Kab/Kota, Provinsi
  - Aksi (View, Edit, Delete)
- Pencarian berdasarkan ID, volunteer, bencana, atau desa
- Filter berdasarkan volunteer (dropdown)
- Pagination (10 items per page)
- Tombol "Tambah Situation Report"
- Export data ke Excel
- Status badge dengan warna berbeda (draft: kuning, submitted: hijau)

**Validasi:**
- Tanggal laporan wajib diisi
- Status harus draft atau submitted

**Acceptance Criteria:**
- [ ] Menampilkan daftar situation reports dengan pagination
- [ ] Pencarian berfungsi dengan baik
- [ ] Filter volunteer berfungsi
- [ ] Dapat menambah situation report baru
- [ ] Dapat mengedit situation report
- [ ] Dapat menghapus situation report dengan konfirmasi
- [ ] Dapat melihat detail situation report
- [ ] Export Excel berfungsi

#### 2.4.2 Form Create/Edit Situation Report
**Deskripsi:** Modal form untuk menambah atau mengedit situation report

**Field:**
- Subjek Laporan (optional)
- Volunteer (dropdown, optional)
- Jenis Bencana (dropdown, optional)
- Provinsi (dropdown, required untuk cascading)
- Kabupaten/Kota (dropdown, disabled jika provinsi belum dipilih)
- Kecamatan (dropdown, disabled jika kabupaten belum dipilih)
- Desa (dropdown, disabled jika kecamatan belum dipilih)
- Alamat Lengkap (optional)
- Latitude (number, optional)
- Longitude (number, optional)
- Tanggal Laporan (date, required)
- Status (draft/submitted, required)

**Cascading Dropdown:**
- Provinsi → Kabupaten/Kota → Kecamatan → Desa
- Setiap level bergantung pada level sebelumnya

**Acceptance Criteria:**
- [ ] Cascading dropdown berfungsi dengan baik
- [ ] Form dapat digunakan untuk create dan edit
- [ ] Validasi berfungsi
- [ ] Data tersimpan dengan benar

#### 2.4.3 Detail Situation Report (`/admin/site-reports/[id]`)
**Deskripsi:** Halaman detail untuk melihat informasi lengkap situation report

**Fitur:**
- Informasi Utama:
  - Subjek Laporan
  - Volunteer (nama dan email)
  - Jenis Bencana
  - Tanggal Laporan
  - Status
  - Lokasi (Provinsi, Kab/Kota, Kecamatan, Desa, Alamat Lengkap)
  - Koordinat (Latitude, Longitude) dengan preview peta
- Tab Details:
  - **Victims**: Daftar korban dengan kategori dan jumlah
  - **Damages**: Daftar kerusakan infrastruktur
  - **Refugees**: Daftar pengungsi dengan lokasi
  - **Needs**: Daftar kebutuhan bantuan
  - **Documents**: Daftar dokumen/foto yang diupload
- Tombol kembali ke daftar
- Map preview menggunakan koordinat (jika tersedia)

**Acceptance Criteria:**
- [ ] Menampilkan semua informasi situation report
- [ ] Tab details dapat diakses dan berfungsi
- [ ] Map preview menampilkan lokasi jika koordinat tersedia
- [ ] Dapat menambah, mengedit, menghapus detail di setiap tab
- [ ] Upload dokumen berfungsi

---

### 2.5 Distribution Reports Management (`/admin/distributions`)

#### 2.5.1 Daftar Distribution Reports
**Deskripsi:** Halaman untuk melihat, menambah, mengedit, dan menghapus distribution reports

**Fitur:**
- Tabel daftar distribution reports dengan kolom:
  - ID
  - Tanggal Distribusi
  - Status (completed/in_progress/draft)
  - Penerima (nama dan telepon)
  - Items (barang yang didistribusikan)
  - Quantity
  - Volunteer
  - Desa, Kecamatan, Kab/Kota, Provinsi
  - Aksi (View, Edit, Delete)
- Pencarian berdasarkan ID, recipient, items, volunteer, atau village
- Filter berdasarkan volunteer (dropdown)
- Pagination (10 items per page)
- Tombol "Tambah Distribution"
- Export data ke Excel
- Status badge dengan warna berbeda:
  - completed: hijau
  - in_progress: biru
  - draft: kuning

**Validasi:**
- Nama kegiatan wajib diisi
- Tanggal kegiatan wajib diisi

**Acceptance Criteria:**
- [ ] Menampilkan daftar distribution reports dengan pagination
- [ ] Pencarian berfungsi dengan baik
- [ ] Filter volunteer berfungsi
- [ ] Dapat menambah distribution report baru
- [ ] Dapat mengedit distribution report
- [ ] Dapat menghapus distribution report dengan konfirmasi
- [ ] Dapat melihat detail distribution report
- [ ] Export Excel berfungsi

#### 2.5.2 Form Create/Edit Distribution Report
**Deskripsi:** Modal form untuk menambah atau mengedit distribution report

**Field:**
- No. SPK (optional)
- Nama Kegiatan (required)
- Tanggal Kegiatan (date, required)
- Jenis Bencana (dropdown, optional)
- Volunteer PIC (dropdown, optional)
- Alamat Lengkap (optional)
- Latitude (number, optional)
- Longitude (number, optional)
- Provinsi (dropdown, required untuk cascading)
- Kabupaten/Kota (dropdown, disabled jika provinsi belum dipilih)
- Kecamatan (dropdown, disabled jika kabupaten belum dipilih)
- Desa (dropdown, disabled jika kecamatan belum dipilih)
- Jumlah Penerima Manfaat (number, optional)
- Jumlah Relawan (number, optional)
- Catatan (textarea, optional)

**Cascading Dropdown:**
- Provinsi → Kabupaten/Kota → Kecamatan → Desa

**Acceptance Criteria:**
- [ ] Cascading dropdown berfungsi dengan baik
- [ ] Form dapat digunakan untuk create dan edit
- [ ] Validasi berfungsi
- [ ] Data tersimpan dengan benar

#### 2.5.3 Detail Distribution Report (`/admin/distributions/[id]`)
**Deskripsi:** Halaman detail untuk melihat informasi lengkap distribution report

**Fitur:**
- Informasi Utama:
  - No. SPK
  - Nama Kegiatan
  - Tanggal Kegiatan
  - Volunteer PIC (nama dan email)
  - Jenis Bencana
  - Lokasi (Provinsi, Kab/Kota, Kecamatan, Desa, Alamat Lengkap)
  - Koordinat (Latitude, Longitude) dengan preview peta
  - Jumlah Penerima Manfaat
  - Jumlah Relawan
  - Catatan
- Tab Details:
  - **Clusters**: Daftar cluster bantuan (nama cluster, program, quantity, unit)
  - **Partners**: Daftar mitra yang terlibat
  - **Documents**: Daftar dokumen yang diupload
- Tombol kembali ke daftar
- Map preview menggunakan koordinat (jika tersedia)

**Acceptance Criteria:**
- [ ] Menampilkan semua informasi distribution report
- [ ] Tab details dapat diakses dan berfungsi
- [ ] Map preview menampilkan lokasi jika koordinat tersedia
- [ ] Dapat menambah, mengedit, menghapus detail di setiap tab
- [ ] Upload dokumen berfungsi

---

### 2.6 Master Config Management

#### 2.6.1 Provinces (`/admin/config/provinces`)
**Deskripsi:** Halaman untuk mengelola data provinsi

**Fitur:**
- Tabel daftar provinsi dengan kolom:
  - Kode (ID 2 digit)
  - Nama
  - Aksi (Edit, Delete)
- Pencarian berdasarkan kode atau nama
- Pagination (10 items per page)
- Tombol "Tambah Provinsi"
- Modal form untuk create/edit

**Field Form:**
- Kode (string, 2 karakter, required)
- Nama (string, required)

**Validasi:**
- Kode harus unik dan 2 karakter
- Nama wajib diisi

**Acceptance Criteria:**
- [ ] Menampilkan daftar provinsi dengan pagination
- [ ] Pencarian berfungsi
- [ ] Dapat menambah provinsi baru
- [ ] Dapat mengedit provinsi
- [ ] Dapat menghapus provinsi dengan konfirmasi
- [ ] Validasi kode unik berfungsi

#### 2.6.2 Regencies (`/admin/config/regencies`)
**Deskripsi:** Halaman untuk mengelola data kabupaten/kota

**Fitur:**
- Tabel daftar kabupaten/kota dengan kolom:
  - Kode (ID 4 digit)
  - Nama
  - Provinsi
  - Aksi (Edit, Delete)
- Pencarian berdasarkan kode, nama, atau provinsi
- Filter berdasarkan provinsi (opsional)
- Pagination (10 items per page)
- Tombol "Tambah Kabupaten/Kota"
- Modal form untuk create/edit

**Field Form:**
- Kode (string, 4 karakter, required)
- Provinsi (dropdown, required)
- Nama (string, required)

**Validasi:**
- Kode harus unik dan 4 karakter
- Provinsi wajib dipilih
- Nama wajib diisi

**Acceptance Criteria:**
- [ ] Menampilkan daftar kabupaten/kota dengan pagination
- [ ] Pencarian dan filter berfungsi
- [ ] Dapat menambah kabupaten/kota baru
- [ ] Dapat mengedit kabupaten/kota
- [ ] Dapat menghapus kabupaten/kota dengan konfirmasi
- [ ] Dropdown provinsi terisi dengan benar

#### 2.6.3 Districts (`/admin/config/districts`)
**Deskripsi:** Halaman untuk mengelola data kecamatan

**Fitur:**
- Tabel daftar kecamatan dengan kolom:
  - Kode (ID 7 digit)
  - Nama
  - Kabupaten/Kota
  - Provinsi
  - Aksi (Edit, Delete)
- Pencarian berdasarkan kode, nama, kabupaten/kota, atau provinsi
- Filter berdasarkan provinsi dan kabupaten/kota (opsional)
- Pagination (10 items per page)
- Tombol "Tambah Kecamatan"
- Modal form untuk create/edit

**Field Form:**
- Kode (string, 7 karakter, required)
- Kabupaten/Kota (dropdown, required)
- Nama (string, required)

**Validasi:**
- Kode harus unik dan 7 karakter
- Kabupaten/Kota wajib dipilih
- Nama wajib diisi

**Acceptance Criteria:**
- [ ] Menampilkan daftar kecamatan dengan pagination
- [ ] Pencarian dan filter berfungsi
- [ ] Dapat menambah kecamatan baru
- [ ] Dapat mengedit kecamatan
- [ ] Dapat menghapus kecamatan dengan konfirmasi
- [ ] Dropdown kabupaten/kota terisi dengan benar

#### 2.6.4 Villages (`/admin/config/villages`)
**Deskripsi:** Halaman untuk mengelola data desa

**Fitur:**
- Tabel daftar desa dengan kolom:
  - Kode (ID 10 digit)
  - Nama
  - Kecamatan
  - Kabupaten/Kota
  - Provinsi
  - Aksi (Edit, Delete)
- Pencarian berdasarkan kode, nama, kecamatan, kabupaten/kota, atau provinsi
- Filter berdasarkan provinsi, kabupaten/kota, dan kecamatan (opsional)
- Pagination (10 items per page)
- Tombol "Tambah Desa"
- Modal form untuk create/edit

**Field Form:**
- Kode (string, 10 karakter, required)
- Kecamatan (dropdown, required)
- Nama (string, required)

**Validasi:**
- Kode harus unik dan 10 karakter
- Kecamatan wajib dipilih
- Nama wajib diisi

**Acceptance Criteria:**
- [ ] Menampilkan daftar desa dengan pagination
- [ ] Pencarian dan filter berfungsi
- [ ] Dapat menambah desa baru
- [ ] Dapat mengedit desa
- [ ] Dapat menghapus desa dengan konfirmasi
- [ ] Dropdown kecamatan terisi dengan benar

#### 2.6.5 Disaster Types (`/admin/config/disaster-types`)
**Deskripsi:** Halaman untuk mengelola jenis bencana

**Fitur:**
- Tabel daftar jenis bencana dengan kolom:
  - ID
  - Nama
  - Aksi (Edit, Delete)
- Pencarian berdasarkan nama
- Pagination (10 items per page)
- Tombol "Tambah Jenis Bencana"
- Modal form untuk create/edit

**Field Form:**
- Nama (string, required)

**Validasi:**
- Nama wajib diisi
- Nama harus unik

**Acceptance Criteria:**
- [ ] Menampilkan daftar jenis bencana dengan pagination
- [ ] Pencarian berfungsi
- [ ] Dapat menambah jenis bencana baru
- [ ] Dapat mengedit jenis bencana
- [ ] Dapat menghapus jenis bencana dengan konfirmasi

#### 2.6.6 Admins (`/admin/config/admins`)
**Deskripsi:** Halaman untuk mengelola data admin

**Fitur:**
- Form tambah admin di bagian atas
- Tabel daftar admin dengan kolom:
  - ID
  - Nama Lengkap
  - Email
  - Role (super_admin/regional_admin/staff)
  - Tanggal Dibuat
  - Aksi (Edit, Delete)
- Pencarian berdasarkan nama, email, atau role
- Pagination (10 items per page)

**Field Form:**
- Nama Lengkap (string, required)
- Email (string, required, unique)
- Role (dropdown: super_admin/regional_admin/staff, required)

**Validasi:**
- Nama lengkap wajib diisi
- Email wajib diisi dan harus unik
- Role wajib dipilih

**Acceptance Criteria:**
- [ ] Menampilkan daftar admin dengan pagination
- [ ] Pencarian berfungsi
- [ ] Dapat menambah admin baru
- [ ] Dapat mengedit admin
- [ ] Dapat menghapus admin dengan konfirmasi
- [ ] Validasi email unik berfungsi

---

## 3. API Endpoints

### 3.1 Authentication APIs

#### 3.1.1 Mobile Google SSO
- **Endpoint:** `POST /api/auth/mobile/google`
- **Deskripsi:** Autentikasi untuk aplikasi mobile menggunakan Google SSO
- **Request Body:**
  ```json
  {
    "idToken": "ey..."
  }
  ```
- **Response:** JWT token dan data user

#### 3.1.2 Volunteer Email/Password Login
- **Endpoint:** `POST /api/auth/volunteer/login`
- **Deskripsi:** Login volunteer menggunakan email dan password
- **Request Body:**
  ```json
  {
    "email": "volunteer@example.com",
    "password": "password123"
  }
  ```
- **Response:** JWT token dan data user

#### 3.1.3 Token Validation
- **Endpoint:** `GET /api/auth/volunteer/validate`
- **Deskripsi:** Validasi JWT token volunteer
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Data user dan informasi token

#### 3.1.4 Change Password
- **Endpoint:** `POST /api/auth/volunteer/change-password`
- **Deskripsi:** Mengubah password volunteer
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "newPassword": "newPassword123!"
  }
  ```

### 3.2 Volunteers APIs
- `GET /api/volunteers?q=<string>` - List volunteers dengan pencarian
- `POST /api/volunteers` - Create volunteer
- `PUT /api/volunteers` - Update volunteer
- `DELETE /api/volunteers?id=<number>` - Delete volunteer

### 3.3 Situation Reports APIs
- `GET /api/site-reports?q=<string>` - List situation reports
- `GET /api/site-reports/volunteer/:volunteerId` - List situation reports by volunteer
- `GET /api/site-reports/:id/details` - Detail situation report lengkap
- `POST /api/site-reports` - Create situation report
- `PUT /api/site-reports` - Update situation report
- `DELETE /api/site-reports/:id` - Delete situation report

**Sub-resources:**
- Victims: `GET/POST/PUT/DELETE /api/site-reports/:id/victims`
- Damages: `GET/POST/PUT/DELETE /api/site-reports/:id/damages`
- Refugees: `GET/POST/PUT/DELETE /api/site-reports/:id/refugees`
- Needs: `GET/POST/PUT/DELETE /api/site-reports/:id/needs`
- Documents: `GET/POST/PUT/DELETE /api/site-reports/:id/documents`

### 3.4 Distribution Reports APIs
- `GET /api/distributions?q=<string>` - List distribution reports
- `GET /api/distributions/volunteer/:volunteerId` - List distribution reports by volunteer
- `GET /api/distributions/:id/details` - Detail distribution report lengkap
- `POST /api/distributions` - Create distribution report
- `PUT /api/distributions` - Update distribution report
- `DELETE /api/distributions/:id` - Delete distribution report

**Sub-resources:**
- Clusters: `GET/POST/PUT/DELETE /api/distributions/:id/clusters`
- Partners: `GET/POST/PUT/DELETE /api/distributions/:id/partners`
- Documents: `GET/POST/DELETE /api/distributions/:id/documents`

### 3.5 Master Config APIs
- **Provinces:** `GET/POST/PUT/DELETE /api/config/provinces`
- **Regencies:** `GET/POST/PUT/DELETE /api/config/regencies`
- **Districts:** `GET/POST/PUT/DELETE /api/config/districts`
- **Villages:** `GET/POST/PUT/DELETE /api/config/villages`
- **Disaster Types:** `GET/POST/PUT/DELETE /api/config/disaster-types`
- **Admins:** `GET/POST/PUT/DELETE /api/config/admins`

### 3.6 Options API
- **Endpoint:** `GET /api/options`
- **Deskripsi:** Mengembalikan data referensi untuk dropdown
- **Response:** Data volunteers, disaster types, villages, provinces, regencies, districts

---

## 4. Technical Requirements

### 4.1 Technology Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **Authentication:** NextAuth.js (Google OAuth)
- **Styling:** Tailwind CSS
- **UI Components:** Custom components dengan shadcn/ui pattern
- **State Management:** React Hooks (useState, useEffect)
- **API Client:** Custom API client dengan fetch
- **File Upload:** FormData untuk multipart/form-data

### 4.2 Database Schema
- `admins` - Data admin
- `volunteers` - Data relawan
- `disaster_types` - Jenis bencana
- `provinces` - Provinsi
- `regencies` - Kabupaten/Kota
- `districts` - Kecamatan
- `villages` - Desa
- `site_reports` - Laporan situasi bencana
- `site_report_victims` - Korban dalam situation report
- `site_report_damages` - Kerusakan dalam situation report
- `site_report_refugees` - Pengungsi dalam situation report
- `site_report_needs` - Kebutuhan dalam situation report
- `site_report_documents` - Dokumen situation report
- `distribution_reports` - Laporan distribusi
- `distribution_clusters` - Cluster distribusi
- `distribution_partners` - Mitra distribusi
- `distribution_documents` - Dokumen distribusi

### 4.3 Security Requirements
- Autentikasi menggunakan NextAuth.js dengan Google OAuth
- Validasi email admin sebelum login
- JWT token untuk autentikasi mobile app
- Password hashing menggunakan bcrypt
- CORS configuration untuk mobile app
- Input validation di client dan server
- SQL injection prevention menggunakan parameterized queries

### 4.4 Performance Requirements
- Pagination untuk semua list data (10 items per page)
- Lazy loading untuk map components
- Optimized database queries dengan indexing
- Caching untuk master data yang jarang berubah

### 4.5 Responsive Design
- Desktop-first design dengan breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- Sidebar collapsible di mobile
- Table horizontal scroll di mobile
- Modal responsive untuk berbagai ukuran layar

---

## 5. User Experience (UX) Requirements

### 5.1 Navigation
- Sidebar navigation dengan menu:
  - Dashboard
  - Volunteers
  - Situation Reports
  - Distribution Reports
  - Master Config (expandable)
    - Provinces
    - Regencies
    - Districts
    - Villages
    - Disaster Types
    - Admins
- Active state untuk menu yang sedang dibuka
- Loading indicator saat navigasi
- Mobile menu dengan hamburger button

### 5.2 Form Experience
- Modal form untuk create/edit
- Validasi real-time
- Error messages yang jelas
- Success toast notification
- Loading state saat submit
- Auto-close modal setelah success

### 5.3 Table Experience
- Sortable columns (jika diperlukan)
- Search dengan debounce
- Filter dengan dropdown
- Pagination dengan info total items
- Empty state message
- Loading skeleton

### 5.4 Error Handling
- Toast notification untuk error
- Error messages yang user-friendly
- Retry mechanism untuk failed requests
- 404 page untuk route tidak ditemukan

---

## 6. Non-Functional Requirements

### 6.1 Accessibility
- Semantic HTML
- ARIA labels untuk form elements
- Keyboard navigation support
- Screen reader friendly

### 6.2 Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### 6.3 Internationalization
- Bahasa Indonesia sebagai bahasa utama
- Format tanggal Indonesia (DD-MM-YYYY)
- Format angka Indonesia

---

## 7. Future Enhancements

### 7.1 Planned Features
- [ ] Role-based access control (RBAC) lebih granular
- [ ] Export PDF untuk reports
- [ ] Dashboard dengan charts dan analytics
- [ ] Notifikasi real-time untuk laporan baru
- [ ] Bulk operations (bulk delete, bulk update)
- [ ] Advanced filtering dengan multiple criteria
- [ ] Audit log untuk tracking perubahan data
- [ ] Backup dan restore data
- [ ] Integration dengan sistem eksternal

### 7.2 Mobile App Integration
- API sudah tersedia untuk mobile app
- Dokumentasi API lengkap di `API_DOCUMENTATION.md`
- Contoh implementasi di folder `mobile-examples`

---

## 8. Testing Requirements

### 8.1 Unit Testing
- Test untuk utility functions
- Test untuk API client functions
- Test untuk form validations

### 8.2 Integration Testing
- Test untuk API endpoints
- Test untuk database operations
- Test untuk authentication flow

### 8.3 E2E Testing
- Test untuk user flows utama
- Test untuk CRUD operations
- Test untuk form submissions

---

## 9. Deployment

### 9.1 Environment Variables
- Database connection string
- NextAuth secret
- Google OAuth credentials
- CORS allowed origins

### 9.2 Deployment Platform
- Vercel (production)
- Automatic deployment dari GitHub
- Environment variables di Vercel dashboard

---

## 10. Documentation

### 10.1 Code Documentation
- README.md dengan setup instructions
- API_DOCUMENTATION.md dengan detail API endpoints
- POSTMAN_SETUP.md untuk API testing
- Inline comments untuk complex logic

### 10.2 User Documentation
- User manual (jika diperlukan)
- Video tutorial (opsional)

---

## 11. Maintenance

### 11.1 Monitoring
- Error logging
- Performance monitoring
- User activity tracking

### 11.2 Updates
- Regular security updates
- Feature updates berdasarkan feedback
- Bug fixes

---

## Appendix A: Glossary

- **Situation Report**: Laporan situasi bencana yang dibuat oleh volunteer di lapangan
- **Distribution Report**: Laporan distribusi bantuan kepada korban bencana
- **Volunteer**: Relawan yang membuat laporan di lapangan
- **Admin**: Pengguna yang mengelola data melalui web admin
- **Master Config**: Data referensi/master seperti wilayah administratif dan jenis bencana

---

## Appendix B: Change Log

### Version 1.0 (Current)
- Initial release dengan semua fitur utama
- Authentication dengan Google SSO
- CRUD untuk semua entitas
- Master config management
- API untuk mobile app integration

---

**Dokumen ini akan di-update sesuai dengan perkembangan aplikasi.**

