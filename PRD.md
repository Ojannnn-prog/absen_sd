# Product Requirements Document (PRD)
## Sistem Absensi QR Code, Gamifikasi, & E-Learning SD (Studi Kasus: SDN 231 Sukaasih)

---

## 1. Ringkasan Eksekutif & Visi Produk

### 1.1 Latar Belakang
Sekolah Dasar (SD) memerlukan sistem pendataan absensi harian yang efisien, akurat, dan transparan, sekaligus mampu memotivasi peserta didik dalam mengikuti kegiatan pembelajaran. Metode absensi manual konvensional seringkali memakan waktu, rawan ketidakakuratan, dan tidak memberikan integrasi langsung dengan rekam jejak akademik maupun perkembangan belajar siswa.

### 1.2 Visi Produk
**Sistem Absensi QR Code, Gamifikasi, & Portal Belajar Digital SD** adalah platform web modern berkinerja tinggi yang memadukan tiga pilar utama:
1. **Absensi Digital Cepat (QR Code Scanner) & Absensi Manual Wali Kelas (Hadir/Izin/Alpha)**.
2. **Sistem Gamifikasi & Penghargaan (Poin Belajar, Toko Avatar, Titel Kehormatan, dan Leaderboard)** untuk mendongkrak motivasi siswa.
3. **Portal E-Learning Interaktif (Materi Pembelajaran & Kuis Otomatis)** yang memungkinkan guru memantau progres belajar siswa secara *real-time*.

### 1.3 Tujuan & Target Pengguna
- **Administrator Sekolah (`admin`)**: Memegang hak akses penuh (Super Admin) untuk mengelola seluruh data Sekolah, Guru, Siswa, Kelas (6A, 6B, 6C), Materi, Kuis, Pengumuman, dan Laporan Resmi Keseluruhan.
- **Guru / Wali Kelas (`teacher`)**: Memiliki hak akses khusus terisolasi hanya pada siswa di kelas pengampunya (`classGroup: "A" | "B" | "C"`). Guru bertugas memantau kehadiran, melakukan absensi manual/cepat, memantau progres belajar siswa, dan mencetak laporan resmi kelasnya.
- **Siswa (`student`)**: Mengakses platform untuk mengunduh/melihat Kartu Tanda Anggota (KTA) digital bermotif QR Code, mengecek kehadiran, mempelajari materi pelajaran, mengerjakan kuis untuk mendapatkan poin, serta mengustomisasi avatar dan titel kebanggaan di Leaderboard.

---

## 2. Arsitektur Sistem & Spesifikasi Teknologi

### 2.1 Technology Stack
| Layer | Teknologi / Library | Deskripsi & Fungsi Utama |
| :--- | :--- | :--- |
| **Framework Utama** | Next.js 16 (App Router) + React 19 | Server-Side Rendering (SSR), Server Actions, App Router untuk performa dan keamanan tinggi. |
| **Bahasa Pemrograman** | TypeScript | Type safety end-to-end dari database hingga komponen UI. |
| **Styling & Desain System** | Tailwind CSS + Modern CSS Variables | Desain UI bergaya *Vibrant Glassmorphism*, dark/light harmonis, dan animasi halus. |
| **ORM & Database** | Prisma ORM v6 / v7 | Manajemen skema relasional, migrasi tipe data, dan query cepat ke database (PostgreSQL / MySQL / SQLite). |
| **Autentikasi & Sesi** | Custom JWT Cookie (HttpOnly) | Autentikasi aman berbasis sesi berenkripsi tanpa pihak ketiga, dengan Role-Based Access Control (RBAC). |
| **Ekspor & Impor Data** | `xlsx` + `jspdf` + `jspdf-autotable` | Pembuatan laporan Excel lokal & cetak dokumen resmi PDF bersertifikasi format sekolah langsung di browser. |
| **QR Code Generator** | `qrcode` (Canvas / DataURL) | Pembuatan kode QR unik per siswa berdasarkan Nomor Induk Siswa (NIS) / Username. |
| **Ikonografi & UI Helper** | `lucide-react` + `react-hot-toast` | Ikon modern, seragam, serta umpan balik notifikasi interaktif yang responsif. |

### 2.2 Desain Sistem Isolasi Kelas (Class Isolation Model)
Sistem menggunakan struktur **6A, 6B, dan 6C** sebagai model pengampuan:
- Setiap akun **Guru (`Teacher`)** memiliki kolom `classGroup` (`"A"`, `"B"`, atau `"C"`).
- Setiap akun **Siswa (`Student`)** memiliki kolom `classGroup` (`"A"`, `"B"`, atau `"C"`).
- **Aturan Keamanan (Server-Side Isolation)**: Seluruh *query* database dan Server Action untuk peran `teacher` diwajibkan memuat filter `where: { classGroup: teacher.classGroup }`. Guru Kelas 6A tidak dapat melihat, mengedit, memindahkan, ataupun mencetak laporan absensi siswa dari Kelas 6B maupun 6C.

---

## 3. Spesifikasi Fitur & Requirement Modul

### 3.1 Modul Autentikasi & Manajemen Akun (RBAC)
- **3.1.1 Multi-Role Login (`/login`)**: Satu pintu masuk otentikasi yang mengenali peran `admin`, `teacher`, dan `student` secara otomatis berdasarkan kredensial.
- **3.1.2 Keamanan Password & Kredensial**:
  - Semua password disimpan secara terenkripsi (hashing).
  - Admin membuatkan akun untuk Guru dan Siswa (tidak ada pendaftaran mandiri oleh Guru/Siswa untuk menjamin keamanan instansi).
- **3.1.3 Fitur Eagle Eye (Toggle Lihat Password)**: Terdapat tombol mata (*eye icon*) pada form ubah password agar pengguna dapat memvalidasi ketikan sebelum menyimpan.

---

### 3.2 Modul Administrator Sekolah (`/admin`)
- **3.2.1 Dasbor Eksekutif Admin**:
  - Statistik kehadiran harian secara keseluruhan (Hadir, Izin, Alpha).
  - Grafik tren absensi bulanan interaktif.
  - Manajemen Pengumuman Global (`Announcement`) yang tampil di dasbor seluruh pengguna.
- **3.2.2 Kelola Data Guru (`/admin/teacher`)**:
  - Pembuatan akun Guru baru, penetapan NIP, username, password, dan penugasan sebagai Wali Kelas (`6A`, `6B`, atau `6C`).
  - Edit data guru dan reset password guru.
- **3.2.3 Kelola Data Siswa (`/admin/student`)**:
  - CRUD Siswa lengkap: Nama, NIS, Username, Jenis Kelamin (L/P), Tempat/Tanggal Lahir, dan Kelas (`6A`, `6B`, `6C`).
  - **Filter Kelas Tab**: Filter cepat berdasarkan tab (Semua Kelas, Kelas 6A, Kelas 6B, Kelas 6C).
  - **Bulk Select & Bulk Move Class**: Fitur ceklis semua/sebagian siswa untuk memindahkan kelas siswa secara massal dalam satu klik.
  - **Generate & Unduh QR Code**: Cetak otomatis KTA dan unduh QR Code per siswa.
  - **Impor & Ekspor Excel**: Form impor siswa massal menggunakan template Excel, serta ekspor data siswa berkolom Kelas (`6A/6B/6C`).
- **3.2.4 Kelola Materi Belajar & Kuis (`/admin/resources`)**:
  - Unggah dan kelola materi pelajaran (Teks, Dokumen PDF, Video, Tautan).
  - Pembuatan Kuis Interaktif (pilihan ganda A–D, penentuan kunci jawaban, dan alokasi hadiah poin belajar).
- **3.2.5 Scanner Absensi Admin (`/admin/scanner`)**:
  - Pemindai kamera web untuk membaca QR Code siswa, mencatat status "Hadir" seketika dengan efek suara keberhasilan dan modal pop-up estetik.

---

### 3.3 Modul Guru / Wali Kelas (`/teacher`)
- **3.3.1 Dasbor Guru Terisolasi (`/teacher`)**:
  - Menampilkan lencana kebanggaan wali kelas (misal: **"Wali Kelas 6B"**).
  - Ringkasan statistik harian khusus siswa di kelasnya: Total Siswa, Hadir Hari Ini, Izin Hari Ini, dan Alpha/Belum Absen.
  - Tab navigasi terintegrasi: *Ringkasan Kelas*, *Progres Belajar*, *Avatar Maker Guru*, dan *Profil Guru*.
- **3.3.2 Kelola Siswa Kelas Pengampu (`/teacher/student`)**:
  - **Tab Semua Siswa (Rekapitulasi Murni)**: Daftar seluruh siswa di kelasnya dengan riwayat kehadiran. Kolom absensi interaktif disembunyikan di tab ini agar aman dari salah tekan (*UX Safety*).
  - **Tab Belum Absen Hari Ini (Pencatatan Absensi Manual & Cepat)**:
    - Menampilkan siswa yang belum mencatatkan absensi pada hari berjalan (berdasarkan zona waktu WIB / Asia/Jakarta, otomatis reset setelah jam 12 malam).
    - **Kolom Absensi Interaktif**: Tombol cepat untuk mencatat **[Hadir] (Hijau)**, **[Izin] (Kuning Emas)**, atau **[Alpha] (Merah)** per siswa.
    - **Tombol Cepat `⚡ Tandai Semua Sisa Sebagai Alpha`**: Satu klik untuk memberikan status Alpha pada seluruh siswa yang tersisa di daftar belum absen.
  - **Tab Progres Belajar Siswa**: Tabel kemajuan belajar (materi yang diselesaikan, skor kuis, lencana Lulus/Belum) yang 100% identik dengan tampilan Admin.
- **3.3.3 Fitur Impor/Ekspor Excel Khusus Guru**:
  - Guru dapat mengunduh format Excel siswa kelasnya, mengedit secara lokal, lalu mengimpornya kembali ke server.
  - Validasi server otomatis memastikan siswa yang diimpor tetap masuk ke kelas pengampu guru tersebut.
- **3.3.4 Profil Guru & Avatar Maker (`TeacherProfileEditor.tsx`)**:
  - Guru dapat mengubah nama, NIP, serta kata sandinya sendiri (dilengkapi fitur *Eagle Eye*).
  - Guru dapat mendesain avatar digital profesionalnya sendiri.

---

### 3.4 Modul Siswa (`/student`)
- **3.4.1 KTA Digital & Scanner Identity (`/student`)**:
  - Menampilkan Kartu Tanda Anggota (KTA) digital eksklusif berstempel kelas (misal: `KELAS 6B`) beserta QR Code pribadi.
  - Siswa dapat melihat statistik kehadiran pribadinya dan rekapitulasi poin gamifikasi.
- **3.4.2 Portal E-Learning & Kuis Interaktif (`/student/course`)**:
  - Akses materi pelajaran digital.
  - Pengerjaan kuis interaktif berpoin yang otomatis dicatat dalam progres belajar kelas.
- **3.4.3 Gamifikasi: Toko Avatar & Titel Kehormatan**:
  - Siswa dapat menukarkan poin yang diperoleh dari absensi dan kuis untuk membeli **Avatar Pass** dan **Titel Kehormatan** (misal: *Sang Jagoan*, *Bintang Kelas*).
- **3.4.4 Leaderboard (Global & Per Kelas)**:
  - Papan peringkat bergengsi yang menampilkan Top Global Siswa di sekolah serta Top Siswa per Kelas (`6A`, `6B`, `6C`).

---

### 3.5 Modul Laporan Resmi Bulanan (PDF Engine)
- **3.5.1 Komponen Reusable `MonthlyReportModal.tsx`**:
  - **Selektor Periode**: Dropdown untuk memilih **Bulan** (Januari–Desember) dan **Tahun** (2024–2030).
  - **Live Preview Rekap Kehadiran**: Menampilkan statistik rekap langsung di dalam modal (Total Siswa, Hadir (H), Izin (I), Alpha (A), dan Rata-rata Kehadiran %).
- **3.5.2 Standar Laporan Resmi SDN 231 Sukaasih (Landscape - 9 Kolom)**:
  - Dokumen PDF dicetak secara resmi dengan kop judul sekolah dan orientasi *Landscape*.
  - 9 Kolom Tabel: `No`, `Nama Siswa`, `NIS / Username`, `Kelas`, `Hadir (H)`, `Izin (I)`, `Alpha (A)`, `Rekap (H/I/A)`, dan `Kehadiran (%)`.
- **3.5.3 Tanda Tangan Formal & Penguncian Hak Akses**:
  - Cetak oleh **Admin**: Bisa mencetak Laporan Semua Kelas maupun per Kelas, dengan tanda tangan **"Administrator Sekolah"**.
  - Cetak oleh **Guru**: Mengunci target laporan hanya untuk kelas pengampu, disertai keterangan keamanan pada modal, dan menandatangani dokumen dengan jabatan resmi (misal: **"Wali Kelas 6B"**).

---

## 4. Desain Antarmuka & UX Safety (Non-Functional Requirements)

### 4.1 Estetika Visual (Vibrant Glassmorphism)
- Palet warna cerah, kontras tinggi, elegan, dan profesional.
- Efek kaca berembun (`backdrop-blur-2xl`), border tipis bergradasi, dan animasi masuk yang halus (`zoom-in-95`, `fade-in`).
- Indikator warna absensi konsisten di seluruh aplikasi:
  - **Hadir**: Hijau zamrud (`bg-green-100 text-green-800 border-green-300`).
  - **Izin**: Kuning emas (`bg-amber-100 text-amber-800 border-amber-300`).
  - **Alpha**: Merah mawar (`bg-red-100 text-red-800 border-red-300`).

### 4.2 UX Safety & Zero Native Alert
- **Konfirmasi Transaksi Kritis**: Seluruh aksi penghapusan data, perubahan kelas massal, impor data, atau pencatatan Alpha massal **dilarang menggunakan `window.confirm()`**.
- Semua konfirmasi wajib menggunakan komponen modal kustom `ConfirmModal.tsx` yang bergaya *glassmorphism* agar antarmuka terasa premium dan modern.

### 4.3 Responsivitas Mobile-First
- Tampilan dioptimalkan penuh untuk smartphone, tablet, maupun desktop laptop.
- Header dan banner tidak mengalami pergeseran horisontal (*no overflow-x*), serta tabel dilindungi dengan container geser sentuh (`custom-scrollbar`).

---

## 5. Skema Database Relasional (Prisma Schema Reference)

```prisma
datasource db {
  provider = "postgresql" // Dapat disesuaikan dengan PostgreSQL / MySQL / SQLite
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Admin {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String
  name      String   @default("Administrator")
  createdAt DateTime @default(now())
}

model Teacher {
  id             String   @id @default(cuid())
  username       String   @unique
  password       String
  name           String   @default("Guru")
  nip            String?  // Nomor Induk Pegawai
  classGroup     String   @default("A") // "A", "B", "C"
  profileImage   String?
  avatarUnlocked Boolean  @default(true)
  avatarConfig   String?
  activeTitle    String?
  createdAt      DateTime @default(now())
}

model Student {
  id              String            @id @default(cuid())
  username        String            @unique
  password        String
  name            String
  studentCode     String            @unique // NIS
  classGroup      String            @default("A") // "A", "B", "C"
  gender          String            @default("L") // "L" atau "P"
  birthPlace      String?
  birthDate       DateTime?
  profileImage    String?
  points          Int               @default(0)
  activeTitle     String?
  unlockedTitles  String[]          @default([])
  avatarUnlocked  Boolean           @default(false)
  avatarConfig    String?
  attendances     Attendance[]
  studentProgress StudentProgress[]
  quizAttempts    QuizAttempt[]
  createdAt       DateTime          @default(now())
  lastActive      DateTime?
}

model Attendance {
  id        String   @id @default(cuid())
  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  status    String   // "Hadir", "Izin", "Absen" / "Alpha"
  timestamp DateTime @default(now()) // Stempel waktu Asia/Jakarta (WIB)
}

model CourseResource {
  id              String            @id @default(cuid())
  title           String
  description     String?
  type            String            // "TEXT", "PDF", "VIDEO", "LINK"
  content         String
  fileUrl         String?
  quizConfig      String?           // JSON soal kuis & kunci jawaban
  createdAt       DateTime          @default(now())
  studentProgress StudentProgress[]
  quizAttempts    QuizAttempt[]
}

model StudentProgress {
  id          String         @id @default(cuid())
  studentId   String
  student     Student        @relation(fields: [studentId], references: [id], onDelete: Cascade)
  resourceId  String
  resource    CourseResource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  completed   Boolean        @default(false)
  completedAt DateTime       @default(now())
}

model QuizAttempt {
  id         String         @id @default(cuid())
  studentId  String
  student    Student        @relation(fields: [studentId], references: [id], onDelete: Cascade)
  resourceId String
  resource   CourseResource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  score      Int
  passed     Boolean
  createdAt  DateTime       @default(now())
}

model Announcement {
  id        String   @id @default(cuid())
  title     String
  content   String
  createdAt DateTime @default(now())
}
```

---

## 6. Standar Kualitas & Kriteria Penerimaan (Acceptance Criteria)
1. **Zero Error TypeScript & Build**: Aplikasi wajib dapat di-build untuk production (`npm run build`) dengan kesuksesan 100% dan bebas dari error tipe statis (`npx tsc --noEmit`).
2. **Keamanan Isolasi Kelas 100%**: Pengujian login dengan akun Guru Kelas 6A wajib tidak memunculkan atau memberi izin ubah pada siswa dari Kelas 6B maupun 6C, di antarmuka web, API, maupun berkas ekspor.
3. **Pencatatan Absensi Akurat**: Status absensi yang tercatat harus merefleksikan tanggal hari berjalan WIB (Asia/Jakarta) dan mereset secara otomatis pada pukul 00.00 WIB untuk hari berikutnya.
4. **Validasi Cetak PDF**: Hasil cetak laporan bulanan PDF wajib mencantumkan judul resmi sekolah, orientasi Landscape 9 kolom, statistik yang akurat, serta tanda tangan resmi yang sesuai dengan peran pengampu.
