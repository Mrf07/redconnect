'use client'

import type { ReactNode } from 'react'
import { SupabaseProvider } from '../lib/supabase-provider'
import { ServiceWorkerRegister } from './components/sw-register'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SupabaseProvider>
      {children}
      <ServiceWorkerRegister />
    </SupabaseProvider>
  )
}
