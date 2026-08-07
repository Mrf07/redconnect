'use client'

import Link from 'next/link'

interface NavProps {
  role: string | null
}

const pages = {
  karyawan: [
    { label: 'Dashboard', href: '/dashboard/karyawan' },
  ],
  bod: [
    { label: 'Dashboard', href: '/dashboard/bod' },
  ],
  finance: [
    { label: 'Dashboard', href: '/dashboard/finance' },
  ],
  admin: [
    { label: 'Admin', href: '/admin' },
  ],
}

export function Nav({ role }: NavProps) {
  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <div>
          <Link href="/" className="text-lg font-semibold text-slate-900">
            RedConnect
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {role && pages[role as keyof typeof pages]?.map((item) => (
            <Link key={item.href} href={item.href} className="btn btn-ghost">
              {item.label}
            </Link>
          ))}
          <Link href="/signout" className="btn btn-secondary">
            Keluar
          </Link>
        </div>
      </div>
    </nav>
  )
}
