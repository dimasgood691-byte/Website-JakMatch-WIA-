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

## Tech Stack yang Digunakan

- **Frontend:** Next.js, Tailwind CSS, Framer Motion, dan Lucide Icons.
- **Backend:** Echo Framework, dan GORM (ORM).
- **Database:** PostgreSQL.
- **Autentikasi:** Firebase Auth.

---

## Langkah Instalasi

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek secara local:

### 1. Buat Folder Kosong

Folder name nya bebas, bisa disesuaikan.

### 2. Clone Repository

```bash
git clone [https://github.com/dimasgood691-byte/Website-JakMatch-WIA-.git]
cd Website-JakMatch-WIA-
```

### 3. Buat Database di PostgreSQL

```sql
CREATE DATABASE jakmatch_db;
```

### 4. Run Backend

Buat File bernama .env di folder jakmatch-backend yang berisikan :

- DB_HOST=localhost
- DB_PORT=5432
- DB_USER=postgres
- DB_PASSWORD=disesuaikan dengan password database yang telah dibuat.
- DB_NAME=jakmatch_db
- DB_SSLMODE=disable
- PORT=8080
- JWT_SECRET=menyesuaikan
- FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json
- APP_BASE_URL=http://localhost:3000
- SMTP_HOST=smtp.gmail.com
- SMTP_PORT=465
- SMTP_USERNAME=gmail pengirim
- MTP_PASSWORD=app-password-gmail
- SMTP_FROM="JakMatch <alat-pengirim@gmail.com>"

```bash
cd jakmatch-backend
# Pastikan file .env sudah dikonfigurasi dengan database PostgreSQL lokalmu
go mod tidy
go run cmd/server/main.go
# Backend Run di port 8080
```

### 5. Run Frontend

Buat File bernama .env.local di folder jakmatch-backend yang berisikan :
- NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
- NEXT_PUBLIC_FIREBASE_API_KEY=isi_api_key_firebase_kamu
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jakmatch-xxxx.firebaseapp.com
- NEXT_PUBLIC_FIREBASE_PROJECT_ID=jakmatch-xxxx
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jakmatch-xxxx.firebasestorage.app
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
- NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456

dapetin ini semua dari mana?
```bash
cd jakmatch-frontend
npm install
npm run dev
```

## Progres saat ini

- ✅ Instalasi project (Frontend & Backend).
- ✅ Desain skema database PostgreSQL menggunakan GORM dan migrasi tabel.
- ✅ Implementasi Landing Page, Register Page, Log In Page utama yang interaktif dan responsif.
- ✅ Intregrasi endpoint api register dan login.
- ✅ Intregrasi login Firebase
