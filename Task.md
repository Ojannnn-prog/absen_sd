# Master Implementation Roadmap & Checklist (Task.md)
## Blueprint Replikasi & Pengembangan Ulang: Sistem Absensi QR Code, Gamifikasi, & E-Learning SD

---

> [!IMPORTANT]
> Dokumen ini adalah panduan eksekusi teknis langkah demi langkah untuk membangun atau menduplikasi aplikasi ini dari nol hingga ke production. Setiap fase wajib diuji dan diverifikasi sebelum melanjutkan ke fase berikutnya.

---

## FASE 1: Inisialisasi Proyek & Struktur Dependensi

- [ ] **1.1 Setup Project Next.js 16 (App Router) & TypeScript**
  - [ ] Jalankan perintah inisialisasi: `npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app`
  - [ ] Pastikan struktur direktori menggunakan App Router (`src/app/`).
- [ ] **1.2 Instalasi Core Library & Tools Dependensi**
  - [ ] `npm install @prisma/client prisma lucide-react react-hot-toast qrcode xlsx jspdf jspdf-autotable`
  - [ ] `npm install -D @types/qrcode @types/node typescript`
- [ ] **1.3 Konfigurasi Environment & Styling Dasar**
  - [ ] Setup file `.env` dengan variabel `DATABASE_URL`, `JWT_SECRET`, dan konfigurasi zona waktu default (`Asia/Jakarta`).
  - [ ] Konfigurasi `tailwind.config.ts` dan `src/app/globals.css` dengan token desain modern, efek kaca (*glassmorphism*), dan *custom scrollbar*.

---

## FASE 2: Desain Skema Database & Migrasi Prisma (`prisma/schema.prisma`)

- [ ] **2.1 Definisi Skema ORM Prisma**
  - [ ] Buat model **`Admin`** (id, username, password, name, createdAt).
  - [ ] Buat model **`Teacher`** (id, username, password, name, nip, classGroup, profileImage, avatarUnlocked, avatarConfig, activeTitle, createdAt).
  - [ ] Buat model **`Student`** (id, username, password, name, studentCode/NIS, classGroup, gender, birthPlace, birthDate, points, activeTitle, unlockedTitles, avatarUnlocked, avatarConfig, createdAt, lastActive).
  - [ ] Buat model relasional **`Attendance`** (id, studentId, status, timestamp) dengan referensi `onDelete: Cascade`.
  - [ ] Buat model pembelajaran **`CourseResource`**, **`StudentProgress`**, **`QuizAttempt`**, dan **`Announcement`**.
- [ ] **2.2 Eksekusi Migrasi & Generator Prisma Client**
  - [ ] Jalankan perintah `npx prisma db push` (atau `prisma migrate dev`) untuk membuat tabel di database.
  - [ ] Jalankan `npx prisma generate` untuk mengompilasi tipe TypeScript ORM.
- [ ] **2.3 Seeding Database Awal (`prisma/seed.ts`)**
  - [ ] Buat script *seed* otomatis untuk menambahkan 1 akun Admin default (`admin` / password terenkripsi) dan contoh akun Guru/Siswa Kelas `6A`, `6B`, `6C`.

---

## FASE 3: Sistem Autentikasi & Multi-Role Authorization (RBAC)

- [ ] **3.1 Modul Enkripsi & Kredensial (`src/lib/auth.ts`)**
  - [ ] Buat fungsi utilitas verifikasi dan hashing password yang aman.
  - [ ] Buat utilitas penandatanganan dan verifikasi token JWT (*JSON Web Token*) yang memuat payload `{ id, username, role, classGroup, name }`.
- [ ] **3.2 API Route Authentication (`/api/auth/login` & `/api/auth/logout`)**
  - [ ] Implementasikan endpoint `POST /api/auth/login` yang dapat mendeteksi kredensial Admin, Guru, dan Siswa.
  - [ ] Set token ke cookie HTTPOnly dengan masa aktif sesi yang sesuai dan perlindungan `SameSite=Strict`.
  - [ ] Implementasikan endpoint `POST /api/auth/logout` untuk membersihkan cookie sesi pengguna.
- [ ] **3.3 Route Protection & Redirect Cerdas (`src/app/page.tsx` & Middleware)**
  - [ ] Buat logika *routing default* pada rute akar (`/`) yang otomatis mengalihkan:
    - `admin` -> `/admin`
    - `teacher` -> `/teacher`
    - `student` -> `/student`
  - [ ] Proteksi rute agar pengguna tidak dapat mengakses halaman yang tidak sesuai rolenya.
- [ ] **3.4 Komponen `Navbar.tsx` Multi-Role**
  - [ ] Implementasikan bilah navigasi responsif dengan menu yang dinamis sesuai `role` aktif yang sedang login.

---

## FASE 4: Modul Administrator Sekolah (`/admin`)

- [ ] **4.1 Dasbor Utama Eksekutif (`/admin/page.tsx`)**
  - [ ] Tampilkan kartu statistik kehadiran harian (Hadir, Izin, Alpha).
  - [ ] Implementasikan grafik kehadiran dan daftar Pengumuman Global Sekolah.
- [ ] **4.2 Kelola Data Guru (`/admin/teacher`)**
  - [ ] Buat Server Actions (`actions.ts`) untuk `createTeacher`, `updateTeacher`, `deleteTeacher`, dan reset password.
  - [ ] Implementasikan antarmuka kelola guru beserta penetapan kelas pengampu (`6A`, `6B`, atau `6C`).
- [ ] **4.3 Kelola Data Siswa (`/admin/student`)**
  - [ ] Buat form CRUD Siswa dengan kolom NIS (`studentCode`), Nama, Kelas (`6A`, `6B`, `6C`), Jenis Kelamin, dan Wilayah Tempat Lahir.
  - [ ] **Filter Tab Kelas**: Implementasikan tab penyaringan `Semua Kelas`, `Kelas 6A`, `Kelas 6B`, `Kelas 6C`.
  - [ ] **Bulk Select & Move Class**: Tambahkan checkbox master dan checkbox per siswa untuk memindahkan kelas secara massal dengan satu tombol aksi (`bulkUpdateStudentClass`).
  - [ ] **Generate QR Code KTA**: Integrasikan library `qrcode` untuk membuat KTA bergaya stempel kelas serta unduh gambar QR.
- [ ] **4.4 Kelola Materi Belajar & Kuis (`/admin/resources`)**
  - [ ] Implementasikan CRUD untuk `CourseResource` (Teks, PDF, Video, Link).
  - [ ] Buat antarmuka penyusunan soal kuis interaktif A-D, kunci jawaban, dan poin hadiah.
- [ ] **4.5 Scanner QR Code Admin (`/admin/scanner`)**
  - [ ] Implementasikan pemindai kamera interaktif untuk absensi siswa dengan notifikasi pop-up dan umpan balik suara (*audio beep*).

---

## FASE 5: Modul Guru & Isolasi Kelas Pengampu (`/teacher`)

- [ ] **5.1 Server-Side Class Isolation Enforcement**
  - [ ] Pastikan semua *query* Prisma di `src/app/teacher/actions.ts` menggunakan filter `where: { classGroup: teacher.classGroup }`.
  - [ ] Verifikasi bahwa Guru Kelas 6A tidak mungkin memuat atau mengubah data siswa dari Kelas 6B/6C.
- [ ] **5.2 Dasbor Guru (`/teacher/page.tsx` & `TeacherDashboardClient.tsx`)**
  - [ ] Tampilkan banner kehormatan dengan label "Wali Kelas 6X" dan statistik khusus siswa di kelasnya.
  - [ ] Implementasikan tab navigasi: *Ringkasan Kelas*, *Progres Belajar*, *Avatar Maker*, dan *Profil Guru*.
- [ ] **5.3 Kelola Siswa Kelas Pengampu (`/teacher/student`)**
  - [ ] **Tab Semua Siswa (UX Safety)**: Tampilkan daftar siswa dan rekap kehadiran murni tanpa tombol absensi interaktif agar tidak terjadi salah tekan.
  - [ ] **Tab Belum Absen Hari Ini (Absensi Manual & Cepat)**:
    - Tampilkan hanya siswa yang belum tercatat kehadirannya pada hari berjalan WIB.
    - Sediakan tombol interaktif status **[Hadir]**, **[Izin]**, dan **[Alpha]** per baris siswa.
    - Sediakan tombol cepat **`⚡ Tandai Semua Sisa Sebagai Alpha`** untuk langsung memberi status Alpha pada sisa daftar.
  - [ ] **Tab Progres Belajar Siswa**: Tampilkan kemajuan belajar siswa kelas tersebut yang 100% identik dengan tabel progres di Admin.
- [ ] **5.4 Impor Siswa Excel Khusus Guru (`TeacherImportStudentsModal.tsx`)**
  - [ ] Sediakan unduhan template Excel lokal dan fitur upload file Excel dengan validasi server yang mengunci impor ke kelas guru.
- [ ] **5.5 Profil Guru & Eagle Eye Password Toggle (`TeacherProfileEditor.tsx`)**
  - [ ] Implementasikan pengeditan profil guru, ganti password dengan tombol mata untuk lihat/sembunyikan sandi, dan Avatar Maker Guru.

---

## FASE 6: Sistem Absensi Digital & Reset Otomatis Harian WIB

- [ ] **6.1 Sinkronisasi Zona Waktu WIB (Asia/Jakarta)**
  - [ ] Gunakan fungsi utilitas pembanding tanggal yang dikalibrasi pada zona waktu `"Asia/Jakarta"`.
  - [ ] Pastikan perpindahan hari setelah pukul 00.00 WIB mereset status kehadiran siswa ke daftar "Belum Absen Hari Ini".
- [ ] **6.2 Pewarnaan Badge Konsisten**
  - [ ] Terapkan warna seragam untuk badge absensi di Dasbor Admin, Dasbor Guru, dan Dasbor Siswa:
    - Hadir = Hijau Zamrud (`bg-green-100 text-green-800`)
    - Izin = Kuning Emas (`bg-amber-100 text-amber-800`)
    - Alpha = Merah (`bg-red-100 text-red-800`)

---

## FASE 7: Modul E-Learning & Gamifikasi Siswa (`/student`)

- [ ] **7.1 Kartu Tanda Anggota (KTA) Digital & Scanner Profile**
  - [ ] Tampilkan KTA berstempel KELAS 6A/6B/6C dengan gambar QR Code pribadi yang jernih dan dapat diunduh.
- [ ] **7.2 Portal Belajar & Kuis (`/student/course`)**
  - [ ] Implementasikan tampilan daftar pelajaran berdasarkan tipe (Teks, PDF, Video, Link).
  - [ ] Buat sistem kuis interaktif yang memberikan hadiah poin ketika siswa berhasil menjawab dengan benar.
- [ ] **7.3 Gamifikasi: Toko Avatar & Titel Kehormatan (`StudentShopModal.tsx`)**
  - [ ] Implementasikan penukaran poin belajar dengan *Avatar Pass* dan titel kebanggaan.
- [ ] **7.4 Leaderboard Global & Kelas (`LeaderboardView.tsx`)**
  - [ ] Buat papan peringkat siswa berdasarkan skor poin tertinggi, lengkap dengan filter `Top Global` dan `Top Kelas 6A/6B/6C`.
- [ ] **7.5 Rapor Digital Siswa PDF**
  - [ ] Sediakan fitur bagi siswa untuk mencetak rekapitulasi kehadiran pribadi dalam format dokumen PDF resmi.

---

## FASE 8: Ekspor/Impor Excel & Laporan Bulanan PDF Resmi SDN 231 Sukaasih

- [ ] **8.1 Ekspor & Impor Excel Berkolom Kelas (`xlsx`)**
  - [ ] Pastikan hasil ekspor Excel mencantumkan kolom `"Kelas"` (`6A`, `6B`, `6C`).
  - [ ] Pastikan template impor Excel dapat dibaca dengan akurat oleh server.
- [ ] **8.2 Komponen Reusable `MonthlyReportModal.tsx` (PDF Landscape 9 Kolom)**
  - [ ] Buat modal interaktif dengan selektor **Bulan** (Januari–Desember) dan **Tahun** (2024–2030).
  - [ ] Implementasikan **Live Preview Rekap Kehadiran** seketika (Total Siswa, Hadir, Izin, Alpha, % Rata-rata) di dalam modal.
  - [ ] Integrasikan `jspdf` dan `jspdf-autotable` untuk mencetak dokumen PDF resmi berorientasi **Landscape 9 Kolom**: `No`, `Nama Siswa`, `NIS / Username`, `Kelas`, `Hadir (H)`, `Izin (I)`, `Alpha (A)`, `Rekap (H/I/A)`, dan `Kehadiran (%)`.
- [ ] **8.3 Aturan Penguncian Laporan & Tanda Tangan Formal**
  - [ ] **Akses Admin**: Dapat merekap Semua Kelas atau per kelas spesifik, bertanda tangan **"Administrator Sekolah"**.
  - [ ] **Akses Guru**: Mengunci target laporan hanya pada kelas pengampu, menampilkan notifikasi isolasi di modal, dan bertanda tangan spesifik sesuai kelas (misal: **"Wali Kelas 6B"**).
- [ ] **8.4 Penempatan Tombol Laporan Bulanan di Seluruh Titik Kerja**
  - [ ] Pasang tombol `Report Bulanan (PDF)` di Dasbor Admin, Kelola Siswa Admin, Dasbor Guru, dan Kelola Siswa Guru.

---

## FASE 9: Polish UI/UX, Glassmorphism, & Zero Native Alert

- [ ] **9.1 Komponen Modal Konfirmasi Estetik (`ConfirmModal.tsx`)**
  - [ ] Buat modal konfirmasi modern bergaya kaca (*glassmorphic backdrop blur*, animasi transisi halus, border bergradasi).
  - [ ] **Zero Native Alert Audit**: Hapus 100% penggunaan `window.confirm()` dari seluruh codebase dan ganti dengan `<ConfirmModal />`.
- [ ] **9.2 Responsivitas Mobile-First & Hamburger Menu**
  - [ ] Pastikan tidak ada duplikasi render navigasi pada layar mobile.
  - [ ] Tata ulang Hero Banner pada layar ponsel agar vertikal simetris dan rapi tanpa pergeseran horisontal.
  - [ ] Pasang `overflow-x-auto` pada semua kontainer tabel agar nyaman diklik pada perangkat berlayar kecil.

---

## FASE 10: Pengujian Akhir, Build Production Test, & Deployment

- [ ] **10.1 Audit Type Safety TypeScript (`npx tsc --noEmit`)**
  - [ ] Jalankan pengecekan tipe statis dan pastikan menghasilkan output bersih `0 error`.
- [ ] **10.2 Verifikasi Production Build (`npm run build`)**
  - [ ] Jalankan perintah `npm run build` dan verifikasi bahwa seluruh halaman statis dan dinamis terkompilasi dengan sukses tanpa error maupun warning kritical.
- [ ] **10.3 Pengujian Alur Kerja (End-to-End Walkthrough)**
  - [ ] Uji login dan isolasi data untuk Guru Kelas 6A, 6B, dan 6C.
  - [ ] Uji pencatatan absensi manual, tombol "Tandai Semua Alpha", dan ekspor Laporan Bulanan PDF per kelas maupun Semua Kelas.
- [ ] **10.4 Git Commit & Deployment ke Production (Vercel)**
  - [ ] Commit dan push seluruh histori perubahan ke branch `main` repositori Git.
  - [ ] Verifikasi bahwa automated CI/CD Vercel berhasil menerapkan perubahan ke environment production.
