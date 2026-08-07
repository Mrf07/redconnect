'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSupabase } from '../../lib/supabase-provider'

export default function SignInPage() {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return

    const session = supabase.auth.getSession()
    session.then((res) => {
      if (res.data.session) {
        router.push('/')
      }
    })
  }, [router, supabase])

  if (!supabase) {
    return (
      <main className="min-h-screen bg-slate-50 py-12">
        <div className="container">
          <div className="card p-8">
            <h1 className="text-2xl font-semibold">Supabase belum dikonfigurasi</h1>
            <p className="mt-2 text-slate-600">Silakan set environment variable Supabase terlebih dahulu.</p>
          </div>
        </div>
      </main>
    )
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    if (!supabase) {
      setLoading(false)
      setError('Supabase tidak tersedia. Coba lagi nanti.')
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)
    if (signInError) {
      setError(signInError.message)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="container">
        <div className="card p-8">
          <h1 className="text-2xl font-semibold">Masuk</h1>
          <p className="mt-2 text-slate-600">Gunakan email dan password untuk masuk ke aplikasi.</p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input"
                required
              />
            </label>

            <label className="grid gap-2">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input"
                required
              />
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
