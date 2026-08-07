'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '../../lib/supabase-provider'

export default function SignOutPage() {
  const router = useRouter()
  const { supabase } = useSupabase()

  useEffect(() => {
    async function signOut() {
      if (supabase) {
        await supabase.auth.signOut()
      }
      router.replace('/signin')
    }

    signOut()
  }, [router, supabase])

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="container">
        <div className="card p-8 text-center">
          <p className="text-slate-700">Sedang keluar...</p>
        </div>
      </div>
    </main>
  )
}
