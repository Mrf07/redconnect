'use client'

import { useEffect, useMemo, useState } from 'react'
import { Nav } from '../../components/nav'
import { StatusBadge } from '../../components/status-badge'
import { RequireAuth } from '../../components/RequireAuth'
import { useSupabase } from '../../lib/supabase-provider'
import type { CashAdvanceRequest, UserProfile } from '../../lib/types'

type AdminUser = Pick<UserProfile, 'id' | 'name' | 'email' | 'role'> & { bod_order?: number | null }

type AdminRequestRow = Pick<CashAdvanceRequest, 'id' | 'amount' | 'reason' | 'status' | 'created_at'> & {
  users?: { id: string; name: string }[]
}

export default function AdminPage() {
  const { supabase } = useSupabase()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [requests, setRequests] = useState<AdminRequestRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    const client = supabase

    async function loadData() {
      setLoading(true)
      const [usersResult, requestsResult] = await Promise.all([
        client.from('users').select('id, name, email, role, bod_order'),
        client.from('cash_advance_requests').select('id, amount, reason, status, created_at, users(id, name)'),
      ])
      setLoading(false)

      if (usersResult.error) {
        setError(usersResult.error.message)
      } else {
        setUsers((usersResult.data as AdminUser[] | null) ?? [])
      }
      if (requestsResult.error) {
        setError(requestsResult.error.message)
      } else {
        setRequests((requestsResult.data as AdminRequestRow[] | null) ?? [])
      }
    }

    loadData()
  }, [supabase])

  const filteredUsers = useMemo(() => {
    const search = query.toLowerCase()
    return users.filter((user) =>
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.role.toLowerCase().includes(search),
    )
  }, [users, query])

  const filteredRequests = useMemo(() => {
    const search = query.toLowerCase()
    return requests.filter((item) => {
      const name = item.users?.[0]?.name?.toLowerCase() ?? ''
      return (
        item.reason.toLowerCase().includes(search) ||
        item.status.toLowerCase().includes(search) ||
        name.includes(search) ||
        item.amount.toString().includes(search)
      )
    })
  }, [requests, query])

  const handleRoleChange = async (userId: string, role: string) => {
    if (!supabase) return
    setError(null)
    const { error: updateError } = await supabase.from('users').update({ role }).eq('id', userId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, role: role as UserProfile['role'] } : user)))
  }

  const handleDeleteUser = async (userId: string) => {
    if (!supabase) return
    setError(null)
    const { error: deleteError } = await supabase.from('users').delete().eq('id', userId)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setUsers((current) => current.filter((user) => user.id !== userId))
  }

  return (
    <RequireAuth allowedRoles={['admin']}>
      <main className="min-h-screen bg-slate-50">
        <Nav role="admin" />
        <div className="container py-10 grid gap-8">
          <section className="card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-slate-500">Halaman Admin</p>
                <h1 className="text-2xl font-semibold text-slate-900">Kelola Pengguna dan Data</h1>
              </div>
              <button className="btn btn-primary" type="button">
                Tambah Akun
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 text-slate-900">
                  <tr>
                    <th className="py-3 px-2">Nama</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Role</th>
                    <th className="py-3 px-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-6 px-2 text-center text-slate-500">
                        Memuat pengguna...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 px-2 text-center text-slate-500">
                        Tidak ada pengguna.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-200">
                        <td className="py-3 px-2">{user.name}</td>
                        <td className="py-3 px-2">{user.email}</td>
                        <td className="py-3 px-2">
                          <select
                            className="select max-w-[180px]"
                            value={user.role}
                            onChange={(event) => handleRoleChange(user.id, event.target.value)}
                          >
                            <option value="karyawan">Karyawan</option>
                            <option value="bod">BOD</option>
                            <option value="finance">Finance</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-2 flex flex-wrap gap-2">
                          <button className="btn btn-danger" onClick={() => handleDeleteUser(user.id)}>
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-slate-500">Data Pengajuan</p>
                <h2 className="text-xl font-semibold text-slate-900">Semua Pengajuan</h2>
              </div>
              <input
                type="search"
                className="input max-w-sm"
                placeholder="Cari nama, nominal, atau status"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 text-slate-900">
                  <tr>
                    <th className="py-3 px-2">Tanggal</th>
                    <th className="py-3 px-2">Nama</th>
                    <th className="py-3 px-2">Nominal</th>
                    <th className="py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-6 px-2 text-center text-slate-500">
                        Memuat pengajuan...
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 px-2 text-center text-slate-500">
                        Tidak ada pengajuan.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((item) => (
                      <tr key={item.id} className="border-b border-slate-200">
                        <td className="py-3 px-2">{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="py-3 px-2">{item.users?.[0]?.name ?? '-'}</td>
                        <td className="py-3 px-2">Rp {item.amount.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-2">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          </section>
        </div>
      </main>
    </RequireAuth>
  )
}
