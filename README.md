# Cash Advance Internal

Aplikasi internal untuk pencatatan pengajuan cash advance dengan role-based access.

## Teknologi
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth + Storage)
- PWA ready

## Pengaturan
1. Copy `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dari Supabase project ke `.env.local`.
2. Jalankan `npm install` untuk menginstal dependensi.
3. Jalankan `npm run dev` untuk memulai mode development.

## Supabase SQL
Gunakan `sql/schema.sql` di Supabase SQL editor untuk membuat tabel, trigger, dan policy.

## Role dan Akses
- `karyawan`: Ajukan, lihat, edit/hapus permintaan sendiri selama `pending`
- `bod`: Ajukan sendiri, lihat semua request, update approval sendiri
- `finance`: Lihat request yang lolos BOD, kelola status finance
- `admin`: Kelola semua data dan user di halaman `/admin`
