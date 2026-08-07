'use client'

import { useEffect, useMemo, useState } from 'react'
import { Nav } from '../../../components/nav'
import { StatusBadge } from '../../../components/status-badge'
import { RequireAuth } from '../../../components/RequireAuth'
import { useSupabase } from '../../../lib/supabase-provider'
import { useCurrentUser } from '../../../lib/useCurrentUser'

type FinanceRequestRow = {
  id: string
  amount: number
  reason: string
  status: string
  created_at: string
  users?: { id: string; name: string }[]
}

export default function FinanceDashboard() {
  const { supabase } = useSupabase()
  const { profile } = useCurrentUser()
  const [requests, setRequests] = useState<FinanceRequestRow[]>([])
  const [selectedStatus, setSelectedStatus] = useState<Record<string, string>>({})
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase || !profile?.id) return
    const client = supabase

    async function loadRequests() {
      setLoading(true)
      const { data, error: fetchError } = await client
        .from('cash_advance_requests')
        .select('id, amount, reason, status, created_at, users(id, name)')
        .in('status', ['lolos_finance', 'diproses'])

      setLoading(false)
      if (fetchError) {
        setError(fetchError.message)
      } else {
        setRequests((data as FinanceRequestRow[] | null) ?? [])
      }
    }

    loadRequests()
  }, [supabase, profile?.id])

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

  const handleFinanceAction = async (requestId: string) => {
    if (!supabase || !profile?.id) return
    const client = supabase
    const status = selectedStatus[requestId] || 'proses'
    setError(null)

    const { error: actionError } = await client.from('finance_actions').insert({
      request_id: requestId,
      finance_user_id: profile.id,
      status,
    })

    if (actionError) {
      setError(actionError.message)
      return
    }

    const { data } = await client
      .from('cash_advance_requests')
      .select('id, amount, reason, status, created_at, users(id, name)')
      .in('status', ['lolos_finance', 'diproses'])

    setRequests((data as FinanceRequestRow[] | null) ?? [])
  }

  return (
    <RequireAuth allowedRoles={['finance', 'admin']}>
      <main className="min-h-screen bg-slate-50">
        <Nav role="finance" />
        <div className="container py-10">
          <section className="card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-slate-500">Dashboard Finance</p>
                <h1 className="text-2xl font-semibold text-slate-900">Ringkasan Pengajuan yang Lolos BOD</h1>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-slate-600">Setiap tindakan finance akan merekam aktivitas dan melanjutkan status request.</p>
            </div>
          </section>

          <section className="card p-6 mt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-slate-500">Pengajuan Finance</p>
                <h2 className="text-xl font-semibold text-slate-900">Kelola Status Cash Advance</h2>
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
                    <th className="py-3 px-2">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-6 px-2 text-center text-slate-500">
                        Memuat data...
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 px-2 text-center text-slate-500">
                        Tidak ada request untuk dikelola.
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
                        <td className="py-3 px-2 flex flex-wrap gap-2">
                          <select
                            className="select w-full max-w-[180px]"
                            value={selectedStatus[item.id] ?? 'proses'}
                            onChange={(event) =>
                              setSelectedStatus((current) => ({ ...current, [item.id]: event.target.value }))
                            }
                          >
                            <option value="proses">Proses</option>
                            <option value="ditolak">Ditolak</option>
                            <option value="selesai">Selesai</option>
                          </select>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleFinanceAction(item.id)}
                          >
                            Simpan
                          </button>
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
