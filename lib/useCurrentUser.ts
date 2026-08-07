'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from './supabase-provider'
import type { UserProfile } from './types'

export function useCurrentUser() {
  const { supabase } = useSupabase()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setError('Supabase tidak tersedia.')
      setLoading(false)
      return
    }

    const client = supabase

    async function loadProfile() {
      const { data: sessionData, error: sessionError } = await client.auth.getSession()
      if (sessionError || !sessionData?.session?.user?.id) {
        setError('Tidak ada sesi yang valid. Silakan login ulang.')
        setLoading(false)
        return
      }

      const userId = sessionData.session.user.id
      const { data: profileData, error: profileError } = await client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError || !profileData) {
        setError(profileError?.message ?? 'Profil pengguna tidak ditemukan.')
      } else {
        setProfile(profileData)
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  return { profile, loading, error }
}
