-- =======================================================================
-- Bagian 1: Data Definition Language (DDL)
-- Membuat semua struktur tabel, relasi, dan indeks.
-- =======================================================================

-- Menghapus tabel jika sudah ada untuk eksekusi ulang (opsional, hati-hati di production)
DROP TABLE IF EXISTS
    dr_documentations, dr_partners, dr_clusters, distribution_reports,
    sr_documentations, sr_urgent_needs, sr_refugee_infos, sr_infrastructure_damages, sr_victim_counts, site_reports,
    admins, volunteers, disaster_types,
    villages, districts, regencies, provinces CASCADE;

-- I. TABEL WILAYAH (NORMALISASI LOKASI)
CREATE TABLE provinces ( id CHAR(2) PRIMARY KEY, name VARCHAR(255) NOT NULL );
CREATE TABLE regencies ( id CHAR(4) PRIMARY KEY, province_id CHAR(2) NOT NULL REFERENCES provinces(id) ON DELETE RESTRICT, name VARCHAR(255) NOT NULL );
CREATE TABLE districts ( id CHAR(7) PRIMARY KEY, regency_id CHAR(4) NOT NULL REFERENCES regencies(id) ON DELETE RESTRICT, name VARCHAR(255) NOT NULL );
CREATE TABLE villages ( id CHAR(10) PRIMARY KEY, district_id CHAR(7) NOT NULL REFERENCES districts(id) ON DELETE RESTRICT, name VARCHAR(255) NOT NULL );

-- II. TABEL MASTER / KONFIGURASI
CREATE TABLE disaster_types ( id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE NOT NULL );

-- III. TABEL PENGGUNA (ADMINS & VOLUNTEERS)
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'regional_admin', 'staff')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE volunteers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- IV. MODUL SITUATION REPORT (SITREP) -- STRUKTUR LENGKAP
CREATE TABLE site_reports (
    id BIGSERIAL PRIMARY KEY,
    volunteer_id INTEGER REFERENCES volunteers(id) ON DELETE SET NULL,
    disaster_type_id INTEGER REFERENCES disaster_types(id) ON DELETE RESTRICT,
    village_id CHAR(10) REFERENCES villages(id) ON DELETE RESTRICT,
    full_address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    report_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sr_victim_counts (
    id BIGSERIAL PRIMARY KEY,
    site_report_id BIGINT NOT NULL REFERENCES site_reports(id) ON DELETE CASCADE,
    victim_type VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL
);

CREATE TABLE sr_infrastructure_damages (
    id BIGSERIAL PRIMARY KEY,
    site_report_id BIGINT NOT NULL REFERENCES site_reports(id) ON DELETE CASCADE,
    damage_type VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit VARCHAR(50) NOT NULL
);

CREATE TABLE sr_refugee_infos (
    id BIGSERIAL PRIMARY KEY,
    site_report_id BIGINT NOT NULL REFERENCES site_reports(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    number_of_refugees INTEGER NOT NULL
);

CREATE TABLE sr_urgent_needs (
    id BIGSERIAL PRIMARY KEY,
    site_report_id BIGINT NOT NULL REFERENCES site_reports(id) ON DELETE CASCADE,
    need_item VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit VARCHAR(50) NOT NULL
);

CREATE TABLE sr_documentations (
    id BIGSERIAL PRIMARY KEY,
    site_report_id BIGINT NOT NULL REFERENCES site_reports(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    description TEXT
);

-- V. MODUL DISTRIBUTION REPORT (DISTREP)
CREATE TABLE distribution_reports (
    id BIGSERIAL PRIMARY KEY,
    spk_number VARCHAR(50) UNIQUE,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    disaster_type_id INTEGER REFERENCES disaster_types(id) ON DELETE RESTRICT,
    pic_volunteer_id INTEGER REFERENCES volunteers(id) ON DELETE SET NULL,
    village_id CHAR(10) REFERENCES villages(id) ON DELETE RESTRICT,
    full_address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    beneficiary_count INTEGER,
    volunteer_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dr_clusters ( id BIGSERIAL PRIMARY KEY, distribution_report_id BIGINT NOT NULL REFERENCES distribution_reports(id) ON DELETE CASCADE, cluster_name VARCHAR(150) NOT NULL, program_name VARCHAR(255) NOT NULL, quantity INTEGER NOT NULL, unit VARCHAR(50) NOT NULL );
CREATE TABLE dr_partners ( id BIGSERIAL PRIMARY KEY, distribution_report_id BIGINT NOT NULL REFERENCES distribution_reports(id) ON DELETE CASCADE, partner_name VARCHAR(255) NOT NULL );
CREATE TABLE dr_documentations ( id BIGSERIAL PRIMARY KEY, distribution_report_id BIGINT NOT NULL REFERENCES distribution_reports(id) ON DELETE CASCADE, file_url TEXT NOT NULL );

-- VI. STRATEGI PENGINDEKSAN (INDEXING) -- LENGKAP
CREATE INDEX ON regencies (province_id);
CREATE INDEX ON districts (regency_id);
CREATE INDEX ON villages (district_id);
CREATE INDEX ON site_reports (volunteer_id); CREATE INDEX ON site_reports (disaster_type_id); CREATE INDEX ON site_reports (village_id); CREATE INDEX ON site_reports (report_date); CREATE INDEX ON site_reports (status);
CREATE INDEX ON sr_victim_counts (site_report_id); CREATE INDEX ON sr_infrastructure_damages (site_report_id); CREATE INDEX ON sr_refugee_infos (site_report_id); CREATE INDEX ON sr_urgent_needs (site_report_id); CREATE INDEX ON sr_documentations (site_report_id);
CREATE INDEX ON distribution_reports (pic_volunteer_id); CREATE INDEX ON distribution_reports (disaster_type_id); CREATE INDEX ON distribution_reports (village_id); CREATE INDEX ON distribution_reports (event_date);
CREATE INDEX ON dr_clusters (distribution_report_id); CREATE INDEX ON dr_partners (distribution_report_id); CREATE INDEX ON dr_documentations (distribution_report_id);


-- =======================================================================
-- Bagian 2: Data Manipulation Language (DML)
-- Mengisi tabel dengan data contoh yang lengkap.
-- =======================================================================

-- Mengisi tabel master wilayah
INSERT INTO provinces (id, name) VALUES ('11', 'ACEH'), ('32', 'JAWA BARAT'), ('33', 'JAWA TENGAH'), ('51', 'BALI'), ('91', 'PAPUA BARAT');
INSERT INTO regencies (id, province_id, name) VALUES ('1105', '11', 'KAB. ACEH BARAT'), ('3273', '32', 'KOTA BANDUNG'), ('3374', '33', 'KOTA SEMARANG'), ('5103', '51', 'KAB. BADUNG'), ('9101', '91', 'KAB. FAKFAK');
INSERT INTO districts (id, regency_id, name) VALUES ('110507', '1105', 'ARONGAN LAMBALEK'), ('327307', '3273', 'COBLONG'), ('337401', '3374', 'SEMARANG TENGAH'), ('510301', '5103', 'KUTA'), ('910101', '9101', 'FAKFAK');
INSERT INTO villages (id, district_id, name) VALUES ('1105072018', '110507', 'ALUE BAGOK'), ('3273071004', '327307', 'DAGO'), ('3374011001', '337401', 'GABAHAN'), ('5103011001', '510301', 'KUTA'), ('9101011001', '910101', 'FAKFAK UTARA');

-- Mengisi tabel master jenis bencana
INSERT INTO disaster_types (name) VALUES ('Banjir'), ('Gempa Bumi'), ('Tsunami'), ('Gunung Meletus'), ('Tanah Longsor');

-- Mengisi tabel pengguna (Admin & Relawan)
INSERT INTO admins (full_name, email, password_hash, role) VALUES ('Admin Utama', 'superadmin@domain.com', 'hash_superadmin', 'super_admin'), ('Dewi Anggraini', 'dewi.jabar@domain.com', 'hash_dewi', 'regional_admin'), ('Ahmad Zulkifli', 'ahmad.aceh@domain.com', 'hash_ahmad', 'regional_admin'), ('Rina Hartati', 'rina.staff@domain.com', 'hash_rina', 'staff'), ('Surya Pratama', 'surya.staff@domain.com', 'hash_surya', 'staff');
INSERT INTO volunteers (full_name, email, phone_number, password_hash) VALUES ('Budi Santoso', 'budi.s@example.com', '081234567890', 'hash_budi'), ('Citra Lestari', 'citra.l@example.com', '081234567891', 'hash_citra'), ('Doni Firmansyah', 'doni.f@example.com', '081234567892', 'hash_doni'), ('Eka Putri', 'eka.p@example.com', '081234567893', 'hash_eka'), ('Fajar Nugraha', 'fajar.n@example.com', '081234567894', 'hash_fajar');

-- Mengisi tabel Situation Reports (SitRep)
INSERT INTO site_reports (id, volunteer_id, disaster_type_id, village_id, full_address, latitude, longitude, report_date, status) VALUES
(1, 1, 1, '3273071004', 'Jl. Dago Asri No. 12', -6.879, 107.615, '2025-09-10', 'submitted'),
(2, 2, 2, '1105072018', 'Gampong Alue Bagok', 4.354, 96.031, '2025-09-15', 'submitted'),
(3, 3, 5, '3273071004', 'Area Tebing Dago Pakar', -6.861, 107.622, '2025-09-20', 'draft'),
(4, 1, 3, '1105072018', 'Pesisir Pantai Arongan', 4.340, 96.020, '2025-10-01', 'submitted'),
(5, 4, 4, '3374011001', 'Radius 5km dari Gunung Merapi', -7.541, 110.445, '2025-10-05', 'submitted');

-- == MENGISI DETAIL SITREP SECARA LENGKAP ==
-- Untuk Laporan ID 1 (Banjir Dago)
INSERT INTO sr_victim_counts (site_report_id, victim_type, quantity) VALUES (1, 'Luka Ringan', 15), (1, 'Mengungsi', 150);
INSERT INTO sr_infrastructure_damages (site_report_id, damage_type, quantity, unit) VALUES (1, 'Rumah Terendam', 50, 'unit');
INSERT INTO sr_refugee_infos (site_report_id, location_name, number_of_refugees) VALUES (1, 'Aula Kelurahan Dago', 150);
INSERT INTO sr_urgent_needs (site_report_id, need_item, quantity, unit) VALUES (1, 'Makanan Siap Saji', 300, 'porsi'), (1, 'Selimut', 150, 'pcs');
INSERT INTO sr_documentations (site_report_id, file_url, description) VALUES (1, 'https://images.pexels.com/photos/1467475/pexels-photo-1467475.jpeg', 'Kondisi genangan air di pemukiman warga.');

-- Untuk Laporan ID 2 (Gempa Aceh Barat)
INSERT INTO sr_victim_counts (site_report_id, victim_type, quantity) VALUES (2, 'Meninggal Dunia', 2), (2, 'Luka Berat', 5), (2, 'Hilang', 1);
INSERT INTO sr_infrastructure_damages (site_report_id, damage_type, quantity, unit) VALUES (2, 'Rumah Rusak Berat', 10, 'unit'), (2, 'Jembatan Putus', 1, 'unit');
INSERT INTO sr_urgent_needs(site_report_id, need_item, quantity, unit) VALUES (2, 'Tenda Pleton', 5, 'unit');
INSERT INTO sr_documentations (site_report_id, file_url, description) VALUES (2, 'https://images.pexels.com/photos/1652011/pexels-photo-1652011.jpeg', 'Kerusakan bangunan akibat guncangan gempa.');

-- Untuk Laporan ID 4 (Tsunami Aceh Barat)
INSERT INTO sr_victim_counts (site_report_id, victim_type, quantity) VALUES (4, 'Mengungsi', 500);
INSERT INTO sr_refugee_infos (site_report_id, location_name, number_of_refugees) VALUES (4, 'Masjid Raya Arongan', 350), (4, 'Lapangan Bola Desa', 150);
INSERT INTO sr_urgent_needs (site_report_id, need_item, quantity, unit) VALUES (4, 'Air Bersih', 1000, 'liter');
INSERT INTO sr_documentations (site_report_id, file_url, description) VALUES (4, 'https://images.pexels.com/photos/9572535/pexels-photo-9572535.jpeg', 'Situasi pesisir pasca-tsunami.');

-- Untuk Laporan ID 5 (Gunung Meletus)
INSERT INTO sr_infrastructure_damages (site_report_id, damage_type, quantity, unit) VALUES (5, 'Lahan Pertanian Terdampak Abu', 5, 'hektar');
INSERT INTO sr_urgent_needs (site_report_id, need_item, quantity, unit) VALUES (5, 'Masker N95', 2000, 'pcs');

-- Mengisi tabel Distribution Reports (DistRep)
INSERT INTO distribution_reports (id, spk_number, event_name, event_date, disaster_type_id, pic_volunteer_id, village_id, full_address, beneficiary_count, volunteer_count) VALUES (1, 'SPK-001-BND', 'Banjir Bandung Selatan', '2025-09-11', 1, 2, '3273071004', 'Posko Pengungsian Dago', 150, 10), (2, 'SPK-002-ACEH', 'Gempa Aceh Barat', '2025-09-16', 2, 1, '1105072018', 'Posko Utama Alue Bagok', 75, 15), (3, 'SPK-003-TSM-ACH', 'Bantuan Tsunami Aceh', '2025-10-02', 3, 5, '1105072018', 'Distribusi Pesisir Arongan', 500, 25), (4, 'SPK-004-LNG-BND', 'Bantuan Logistik Longsor', '2025-09-22', 5, 3, '3273071004', 'Distribusi area Dago Pakar', 40, 8), (5, 'SPK-005-MRP', 'Distribusi Masker Merapi', '2025-10-06', 4, 4, '3374011001', 'Posko Gabahan', 1200, 30);

-- Mengisi detail untuk DistRep (Clusters, Partners, Dokumentasi)
INSERT INTO dr_clusters (distribution_report_id, cluster_name, program_name, quantity, unit) VALUES (1, 'Pangan', 'Bantuan Makanan Siap Saji', 200, 'paket'), (1, 'Sandang', 'Bantuan Selimut', 150, 'pcs'), (2, 'Kesehatan', 'Layanan Medis Darurat', 1, 'posko'), (2, 'Pangan', 'Beras dan Mie Instan', 500, 'kg'), (3, 'Hunian', 'Bantuan Tenda Keluarga', 100, 'unit'), (5, 'Kesehatan', 'Distribusi Masker N95', 5000, 'pcs');
INSERT INTO dr_partners (distribution_report_id, partner_name) VALUES (1, 'BPBD Kota Bandung'), (1, 'ACT'), (2, 'BNPB'), (3, 'BUMN Peduli'), (3, 'BPBD Kab. Aceh Barat'), (5, 'Dinas Kesehatan Jateng');
INSERT INTO dr_documentations (distribution_report_id, file_url) VALUES (1, 'https://images.pexels.com/photos/6591436/pexels-photo-6591436.jpeg'), (1, 'https://images.pexels.com/photos/1569013/pexels-photo-1569013.jpeg'), (2, 'https://images.pexels.com/photos/6591157/pexels-photo-6591157.jpeg'), (3, 'https://images.pexels.com/photos/9572533/pexels-photo-9572533.jpeg'), (4, 'https://images.pexels.com/photos/10901550/pexels-photo-10901550.jpeg'), (5, 'https://images.pexels.com/photos/3993244/pexels-photo-3993244.jpeg');

-- Mengatur ulang urutan sequence setelah insert manual (best practice)
SELECT setval('site_reports_id_seq', (SELECT MAX(id) FROM site_reports));
SELECT setval('distribution_reports_id_seq', (SELECT MAX(id) FROM distribution_reports));
