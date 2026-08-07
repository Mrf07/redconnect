import Link from 'next/link'

const roles = [
  { label: 'Karyawan', href: '/dashboard/karyawan' },
  { label: 'BOD', href: '/dashboard/bod' },
  { label: 'Finance', href: '/dashboard/finance' },
  { label: 'Admin', href: '/admin' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="container">
        <section className="card p-8">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Cash Advance Internal</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">
                Pengajuan cash advance untuk internal kantor
              </h1>
              <p className="mt-4 max-w-2xl text-slate-600">
                Sistem sederhana untuk mengajukan, menyetujui, dan memproses permintaan cash advance dengan role-based access.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {roles.map((item) => (
                <Link key={item.label} href={item.href} className="btn btn-primary justify-center">
                  {item.label} Dashboard
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
