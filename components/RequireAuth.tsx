'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '../lib/supabase-provider'
import { getRedirectForRole } from '../lib/auth'

interface RequireAuthProps {
  allowedRoles: string[]
  children: ReactNode
}

export function RequireAuth({ allowedRoles, children }: RequireAuthProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'unauthorized' | 'authorized'>('loading')
  const [message, setMessage] = useState('Memeriksa akses...')

  useEffect(() => {
    if (!supabase) {
      router.replace('/signin')
      return
    }

    const client = supabase

    async function verify() {
      const { data: sessionData, error: sessionError } = await client.auth.getSession()
      if (sessionError || !sessionData?.session?.user?.id) {
        router.replace('/signin')
        return
      }

      const userId = sessionData.session.user.id
      const { data: profile, error: profileError } = await client
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (profileError || !profile?.role) {
        setMessage('Akun belum dikonfigurasi di sistem. Hubungi administrator.')
        setStatus('unauthorized')
        return
      }

      if (!allowedRoles.includes(profile.role)) {
        router.replace(getRedirectForRole(profile.role))
        return
      }

      setStatus('authorized')
    }

    verify()
  }, [router, supabase, allowedRoles])

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-slate-50 py-12">
        <div className="container">
          <div className="card p-8 text-center">
            <p className="text-slate-700">{message}</p>
          </div>
        </div>
      </main>
    )
  }

  if (status === 'unauthorized') {
    return (
      <main className="min-h-screen bg-slate-50 py-12">
        <div className="container">
          <div className="card p-8 text-center">
            <p className="text-slate-700">{message}</p>
          </div>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
