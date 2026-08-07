import { SupabaseClient } from '@supabase/supabase-js'

export type AppRole = 'karyawan' | 'bod' | 'finance' | 'admin'

export function getRedirectForRole(role: AppRole | null) {
  switch (role) {
    case 'karyawan':
      return '/dashboard/karyawan'
    case 'bod':
      return '/dashboard/bod'
    case 'finance':
      return '/dashboard/finance'
    case 'admin':
      return '/admin'
    default:
      return '/signin'
  }
}

export async function getUserRoleFromProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return { role: null, error: error?.message ?? 'User profile not found' }
  }

  return { role: data.role as AppRole, error: null }
}
