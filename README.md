# JakMatch (Jakarta Matching)

JakMatch adalah platform web data-driven yang dirancang untuk membantu warga DKI Jakarta dan pelaku UMKM dalam memilih lokasi huni atau area bisnis secara presisi. Platform ini mengintegrasikan statistik kecamatan, filter wilayah, kalkulator anggaran mandiri, grafik radar komparatif, serta analisis berbasis kecerdasan buatan (_Generative AI_).

## Fitur & Keunggulan (Fungsi & Kelebihan)

### Fungsi Utama (Core Features)

1. **Pencarian & Rekomendasi Wilayah Berbasis Data:** Membantu pengguna memfilter kecamatan di DKI Jakarta berdasarkan preferensi anggaran, wilayah kota, dan kebutuhan gaya hidup.
2. **Kalkulator Anggaran & Profil Pengguna:** Menyediakan opsi profil spesifik untuk mencocokkan biaya sewa dan fasilitas zona secara akurat.
3. **Analisis Komparatif Visual:** Membandingkan berbagai metrik kecamatan (seperti tingkat transportasi, bebas banjir, fasilitas kesehatan, hingga kepadatan pasar) secara visual.
4. **AI-Powered Decision Support:** Memberikan ringkasan naratif otomatis berbasis kecerdasan buatan (_Generative AI_) untuk membantu pengguna mengambil keputusan terbaik.

### Kelebihan Platform (Advantages)

- **Berfokus Lokal:** Memiliki ruang lingkup data yang spesifik dan terfokus secara mendalam pada wilayah DKI Jakarta.
- **Arsitektur Performa Tinggi:** Dibangun menggunakan teknologi modern dengan _backend_ berbasis Golang (Echo) yang dikenal sangat cepat serta _frontend_ Next.js yang responsif.
- **Keamanan & Skalabilitas:** Menggunakan sistem autentikasi modern dan manajemen basis data relasional PostgreSQL dengan struktur ERD yang terstandarisasi.
- **Antarmuka Intuitif & Modern:** Desain antarmuka dirancang bersih, ramah pengguna (_user-friendly_), serta dilengkapi animasi halus yang membuat user nyaman.

### Kelebihan bagi Pengguna (User Benefits)

- **Pengambilan Keputusan yang Efisien & Objektif:** Pengguna tidak perlu bingung membandingkan data biaya sewa dan fasilitas satu per satu secara manual karena seluruh metrik penting DKI Jakarta telah disajikan secara terangkum dan transparan.
- **Personalisasi Sesuai Kebutuhan Nyata:** Setiap rekomendasi dapat disesuaikan dengan profil pengguna.
- **Hemat Waktu & Biaya Riset:** Memangkas waktu survei lapangan yang melelahkan dengan memberikan gambaran awal wilayah yang paling akurat sebelum pengguna memutuskan untuk mengunjungi lokasi secara langsung.

---

## Tim Developer

|    Nama   |                    Peran                     |                     GitHub                     |
|-----------|----------------------------------------------|------------------------------------------------|
| **Dimas** | Project Lead & Backend Developer             | [GitHub](https://github.com/dimasgood691-byte) |
| **Andra** | Frontend Developer                           | [GitHub](https://github.com/ridwanaulandra)    |
| **Azzam** | UI/UX Desainer & Frontend Developer          | [GitHub](https://github.com/Azzamwahyudin1)    |

---


## Tech Stack yang Digunakan

| Kategori | Teknologi | Logo |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) |
| **Backend** | Golang (Echo Framework) | ![Go](https://img.shields.io/badge/Go_Echo-00ADD8?style=for-the-badge&logo=go&logoColor=white) |
| **Database** | PostgreSQL | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) |
| **Autentikasi** | Firebase Auth | ![Firebase](https://img.shields.io/badge/Firebase_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black) |

---

## Langkah Instalasi Project

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek secara local:

### 1. Clone Repository

```bash
git clone https://github.com/dimasgood691-byte/Website-JakMatch-WIA-.git
cd Website-JakMatch-WIA-
```

### 2. Buat Database di PostgreSQL

```sql
CREATE DATABASE jakmatch_db;
```

### 3. Run Backend

Buat File bernama ![Status](https://img.shields.io/badge/.env-yellow?style=flat-square) di folder jakmatch-backend yang berisikan :

- DB_HOST=localhost
- DB_PORT=5432
- DB_USER=postgres
- DB_PASSWORD=sesuaikan_password_postgres_lokal
- DB_NAME=jakmatch_db
- DB_SSLMODE=disable
- PORT=8080
- JWT_SECRET=C1AF6FFBACD1CA49E383E3CA70F6972A005600912721FD835EAAE5CDB0D3E73D

- FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json
- APP_BASE_URL=http://localhost:3000
- SMTP_HOST=smtp.gmail.com
- SMTP_PORT=465
- SMTP_USERNAME=alamat-pengirim@gmail.com
- SMTP_PASSWORD=app-password-gmail
- SMTP_FROM="JakMatch <alamat-pengirim@gmail.com>"

```bash
cd jakmatch-backend
# Pastikan file .env sudah dikonfigurasi dengan database PostgreSQL lokalmu
go mod tidy
go run main.go
# Backend Run di port 8080
```

### 4. Run Frontend

Buat File bernama ![Status](https://img.shields.io/badge/.env.local-yellow?style=flat-square) di folder jakmatch-frontend yang berisikan :

- NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

- NEXT_PUBLIC_FIREBASE_API_KEY=isi_api_key_firebase_kamu
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jakmatch-xxxx.firebaseapp.com
- NEXT_PUBLIC_FIREBASE_PROJECT_ID=jakmatch-xxxx
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jakmatch-xxxx.firebasestorage.app
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
- NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456

```bash
cd jakmatch-frontend
npm install
npm run dev
```

## Progres Saat Ini

- ✅ **Inisialisasi & Arsitektur Proyek:** Setup *Frontend* (Next.js), *Backend* (Golang Echo), dan *Database* (PostgreSQL).
- ✅ **Desain & Migrasi Database (ERD):** Implementasi GORM untuk tabel `users`, `districts`, `user_profiles`, dan `saved_comparisons` dengan dukungan UUID (`pgcrypto`)[cite: 3, 4, 6].
- ✅ **Master Data & Seeder BPS:** Otomatisasi *seeding* profil pengguna serta 42 data kecamatan resmi DKI Jakarta mengacu pada indikator BPS[cite: 7].
- ✅ **Integrasi Web API BPS DKI Jakarta:** Endpoint sinkronisasi real-time (`/api/v1/districts/sync-bps`) untuk menarik dan menormalisasi data statistik wilayah.
- ✅ **Autentikasi & Keamanan:** Integrasi Firebase Auth (Google OAuth) di sisi *backend* & *frontend*, lengkap dengan manajemen sesi JWT 48 jam[cite: 5].
- ✅ **Riwayat Perbandingan & AI Synthesizer:** Pembuatan *endpoint* API untuk menyimpan hasil analisis perbandingan wilayah (`saved_comparisons`) yang siap dihubungkan dengan *Generative AI*[cite: 3, 6].
- ✅ **Antarmuka Pengguna (UI/UX):** Pembuatan *Landing Page*, halaman *Register*, *Login*, dan *Dashboard* yang responsif.
- ✅ **Penyempurnaan Analisis AI:** Pembaruan alur analisis dan endpoint agar hasil analisis lebih terintegrasi dengan data wilayah.
- 🔄 **Pengujian Integrasi:** Verifikasi alur autentikasi, analisis wilayah, komparasi, dan penyimpanan riwayat dari frontend hingga backend.
