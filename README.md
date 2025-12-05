# Absensi PU Web App

Aplikasi web untuk manajemen absensi yang dirancang untuk kebutuhan "Pekerjaan Umum" (PU), dengan fitur pencatatan absensi, manajemen pengguna, dan analitik.

## Fitur

*   **Autentikasi Pengguna**: Login, Lupa Kata Sandi, dan Atur Ulang Kata Sandi.
*   **Pencatatan Absensi**: Mendukung pencatatan absensi dengan lokasi geografis (Geolocation API) dan integrasi kamera untuk verifikasi.
*   **Dasbor Admin**: Panel administrasi untuk mengelola pengguna, melihat statistik absensi, dan analitik.
*   **Desain Responsif**: Antarmuka pengguna yang adaptif untuk berbagai ukuran perangkat.
*   **Theme Switching**: Dukungan untuk beralih antara tema terang dan gelap.

## Teknologi yang Digunakan

Proyek ini dibangun dengan tumpukan teknologi modern untuk kinerja dan skalabilitas:

*   **Next.js**: Framework React untuk aplikasi web yang powerful dan cepat.
*   **React.js**: Library JavaScript untuk membangun antarmuka pengguna yang interaktif.
*   **TypeScript**: Bahasa pemrograman yang menambahkan penulisan statis ke JavaScript.
*   **Tailwind CSS**: Framework CSS utility-first untuk desain yang cepat dan responsif.
*   **Radix UI**: Komponen UI tanpa gaya dan dapat diakses untuk membangun sistem desain berkualitas tinggi.
*   **Supabase**: Backend-as-a-Service (BaaS) sumber terbuka untuk autentikasi dan database real-time.
*   **Zod**: Skema deklarasi dan validasi untuk TypeScript.
*   **React Hook Form**: Solusi performa tinggi, fleksibel, dan ekstensibel untuk validasi formulir.
*   **Geolocation API**: Untuk mendapatkan data lokasi pengguna saat absensi.
*   **Camera API**: Untuk mengambil foto sebagai bagian dari proses absensi.

## Instalasi

Ikuti langkah-langkah di bawah ini untuk menyiapkan dan menjalankan proyek secara lokal:

### 1. Klon Repositori

```bash
git clone https://github.com/your-username/absensi-pu-web-app.git
cd absensi-pu-web-app
```

### 2. Instal Dependensi

Gunakan pnpm, npm, atau yarn untuk menginstal dependensi proyek.

```bash
pnpm install
# atau
npm install
# atau
yarn install
```

### 3. Konfigurasi Variabel Lingkungan

Buat file `.env.local` di root proyek dan tambahkan variabel lingkungan Supabase Anda:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Ganti `your_supabase_project_url` dan `your_supabase_anon_key` dengan kredensial proyek Supabase Anda.

### 4. Jalankan Aplikasi

#### Mode Pengembangan

```bash
pnpm dev
# atau
npm run dev
# atau
yarn dev
```

Aplikasi akan berjalan di `http://localhost:3000`.

#### Mode Produksi

Untuk membangun dan menjalankan aplikasi dalam mode produksi:

```bash
pnpm build
# atau
npm run build
# atau
yarn build

pnpm start
# atau
npm run start
# atau
yarn start
```

## Struktur Proyek

*   `app/`: Berisi halaman aplikasi dan rute API (Next.js App Router).
    *   `app/admin/`: Halaman dan fitur terkait administrasi (manajemen pengguna, analitik).
    *   `app/api/`: Rute API untuk penanganan data (pengguna, absensi, webhook).
    *   `app/attendance/`: Halaman untuk pencatatan dan riwayat absensi.
    *   `app/forgot-password/`, `app/reset-password/`: Halaman untuk alur reset kata sandi.
*   `components/`: Komponen UI yang dapat digunakan kembali, termasuk komponen khusus seperti `attendance-card`, `camera-modal`, `user-management`, dan `ui` (komponen dari Radix UI/shadcn/ui).
*   `context/`: Konteks React global, misalnya `auth-context.tsx` untuk status autentikasi.
*   `hooks/`: Custom React hooks, seperti `use-mobile` dan `use-toast`.
*   `lib/`: Fungsi dan utilitas helper, termasuk `supabaseClient.ts` untuk interaksi Supabase dan `geolocation.ts`.
*   `public/`: Aset statis seperti gambar dan ikon.
*   `styles/`: Berisi file CSS global, misalnya `globals.css`.

## Kontribusi

Kontribusi disambut baik! Jika Anda ingin berkontribusi, silakan fork repositori ini dan buat Pull Request dengan perubahan Anda.

## Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT. Lihat file `LICENSE` untuk detail lebih lanjut.
