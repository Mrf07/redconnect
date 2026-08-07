import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Cash Advance Internal',
  description: 'Aplikasi internal untuk pengajuan cash advance dan approval.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
