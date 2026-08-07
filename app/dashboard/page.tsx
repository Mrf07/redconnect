'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '../../lib/supabase-provider'
import { getRedirectForRole } from '../../lib/auth'

export default function DashboardPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [message, setMessage] = useState('Memeriksa sesi...')

  useEffect(() => {
    if (!supabase) {
      router.replace('/signin')
      return
    }

    const client = supabase

    async function redirectToRole() {
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
        setMessage('Akun belum dikonfigurasi. Hubungi administrator.')
        return
      }

      router.replace(getRedirectForRole(profile.role))
    }

    redirectToRole()
  }, [router, supabase])

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
