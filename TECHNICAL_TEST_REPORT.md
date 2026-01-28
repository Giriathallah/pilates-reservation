# Diro Pilates Reservation App - Technical Test Submission

**Nama**: [Nama Anda]
**Posisi**: Website Developer
**Stack**: Next.js (TypeScript) + Golang (Fiber)

---

## 1. Project Description
**Diro Pilates Reservation App** adalah platform reservasi sesi pilates berbasis web yang dirancang untuk memberikan pengalaman booking yang seamless, cepat, dan premium. 

Aplikasi ini mengatasi masalah umum dalam sistem reservasi:
1.  **Double Booking**: Menggunakan validasi kapasitas di backend untuk mencegah pemesanan slot yang sudah penuh.
2.  **Payment Reliability**: Mengintegrasikan **Midtrans Gateway** dengan mekanisme *Proactive Status Sync*, memastikan status pembayaran user tetap terupdate meskipun webhook gagal mencapai server (sangat berguna di env development/localhost).
3.  **User Experience**: Menggunakan *Step-by-Step Wizard* untuk memilih Tanggal, Waktu, dan Studio, serta Dashboard yang informatif untuk memantau jadwal latihan.

## 2. Technology Stack

### Frontend
-   **Framework**: Next.js 14 (App Router)
-   **Language**: TypeScript
-   **Styling**: TailwindCSS (Custom Design System with Variables)
-   **State Management**: React Context (Auth)
-   **Icons**: Material Symbols Outlined
-   **HTTP Client**: Axios

### Backend
-   **Language**: Golang (Go 1.22)
-   **Framework**: Fiber (Fast HTTP Web Framework)
-   **Database**: PostgreSQL
-   **ORM**: GORM
-   **Payment**: Midtrans Snap API (Go SDK)
-   **Authentication**: JWT (JSON Web Tokens)

---

## 3. Implemented Features

### A. User Features (Client Side)
1.  **Interactive Booking Wizard**:
    -   **Date Selection**: Grid kalender untuk memilih tanggal.
    -   **Time Selection**: Slot waktu dinamis berdasarkan tanggal yang dipilih.
    -   **Studio Selection**: Menampilkan ketersediaan studio (Court A, Court B) beserta harga.
2.  **Seamless Payment**:
    -   Integrasi langsung dengan **Midtrans Snap Popup**.
    -   Mendukung transfer bank, QRIS, dan E-Wallet.
    -   Halaman "Verifying Payment" yang otomatis mengecek status transaksi tanpa perlu refresh manual.
3.  **Premium User Dashboard**:
    -   **Stats Row**: Ringkasan "Total Workouts" dan "This Month".
    -   **Next Session Hero**: Kartu visual besar yang menampilkan jadwal terdekat.
    -   **Smart Tabs**: Memisahkan booking status *Pending/Unpaid*, *Upcoming*, dan *History*.
    -   **Motivational Widgets**: Kalender mini visualisasi konsistensi latihan.

### B. Admin Features (Management)
1.  **Actionable Dashboard**:
    -   **Real-time Metrics**: Revenue hari ini, sesi aktif, dan booking pending.
    -   **Today's Agenda**: Daftar kronologis semua jadwal hari ini (siapa yang booking, slot mana yang kosong).
2.  **Quick Actions**:
    -   **Manual Booking**: Fitur khusus Admin untuk membuat reservasi "Walk-in" (pembayaran tunai di tempat) tanpa lewat payment gateway.
3.  **Resource Management (CRUD)**:
    -   Kelola Courts (Harga, Nama).
    -   Kelola Schedules (Generate slot massal).
    -   Kelola Reservations (Cancel paksa, lihat detail).

### C. Technical Highlights (Bonus Points)
1.  **Proactive Payment Check**:
    -   Backend tidak hanya menunggu Webhook. Saat user membuka dashboard, sistem secara aktif menembak API Midtrans untuk sinkronisasi status transaksi yang pending. Ini meningkatkan reliabilitas drastis.
2.  **Capacity Locking**:
    -   Sistem mengecek `current_bookings >= capacity` sebelum membuat transaksi baru untuk mencegah race conditon sederhana.
3.  **Verbose Logging**:
    -   Sistem mencatat detail payload webhook untuk kemudahan debugging.

---

## 4. Usage Flow (Cara Penggunaan)

### Skenario 1: User Melakukan Reservasi
1.  **Login/Register**: User masuk ke aplikasi.
2.  **Mulai Booking**: Klik tombol "Book a Session" di dashboard.
3.  **Pilih Slot**:
    -   Pilih Tanggal -> Pilih Jam (misal 10:00) -> Pilih Studio (misal Court A).
4.  **Konfirmasi & Bayar**:
    -   Review ringkasan pesanan.
    -   Klik "Pay Now" -> Muncul Popup Midtrans.
    -   Selesaikan pembayaran (Simulasi via Sandbox).
5.  **Verifikasi**:
    -   Setelah bayar, user diarahkan ke halaman Success.
    -   Sistem otomatis sinkronisasi status menjadi "Paid".
6.  **Selesai**: Jadwal muncul di Dashboard User pada tab "Upcoming" dan kartu "Next Class".

### Skenario 2: Admin Mengelola Studio
1.  **Login Admin**: Masuk dengan akun role admin.
2.  **Cek Dashboard**:
    -   Melihat total pendapatan hari ini.
    -   Melihat Agenda: Slot jam 10:00 Court A sudah terisi oleh User tadi (Warna Biru).
3.  **Manual Booking (Walk-in)**:
    -   Ada customer datang langsung (offline).
    -   Admin klik "Manual Booking".
    -   Pilih slot tersedia -> Masukkan email customer.
    -   Booking terbentuk dengan status "Paid" (Cash) tanpa perlu Midtrans.

---

## 5. Cara Menjalankan (Local Development)

### Prerequisites
-   Go 1.22+
-   Node.js 18+
-   Docker (Optional, untuk PostgreSQL)

### Langkah-langkah
1.  **Database**:
    Pastikan PostgreSQL berjalan dan buat database `pilates_db`.
    Atur `.env` file di folder `backend`.

2.  **Backend**:
    ```bash
    cd backend
    go mod tidy
    go run main.go
    ```
    *Server akan berjalan di localhost:8000*

3.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    *Aplikasi bisa diakses di localhost:3000*

4.  **Akun Demo**:
    -   User: `user@example.com` / `password`
    -   Admin: `admin@example.com` / `password`
