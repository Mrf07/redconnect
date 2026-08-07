'use client'

import { useEffect, useMemo, useState } from 'react'
import { Nav } from '../../../components/nav'
import { StatusBadge } from '../../../components/status-badge'
import { RequireAuth } from '../../../components/RequireAuth'
import { useSupabase } from '../../../lib/supabase-provider'
import { useCurrentUser } from '../../../lib/useCurrentUser'

interface BodApprovalItem {
  id: string
  decision: string
  request_id: string
  cash_advance_requests?: {
    id: string
    amount: number
    reason: string
    status: string
    created_at: string
    users?: {
      id: string
      name: string
    }[]
  }[]
}

export default function BodDashboard() {
  const { supabase } = useSupabase()
  const { profile } = useCurrentUser()
  const [approvals, setApprovals] = useState<BodApprovalItem[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase || !profile?.id) return
    const client = supabase
    const userId = profile.id

    async function loadApprovals() {
      setLoading(true)
      const { data, error: fetchError } = await client
        .from('approvals')
        .select('id, decision, request_id, cash_advance_requests(id, amount, reason, status, created_at, users(id, name))')
        .eq('bod_user_id', userId)

      setLoading(false)
      if (fetchError) {
        setError(fetchError.message)
      } else {
        setApprovals(data ?? [])
      }
    }

    loadApprovals()
  }, [supabase, profile?.id])

  const filteredApprovals = useMemo(() => {
    const search = query.toLowerCase()
    return approvals.filter((approval) => {
      const request = approval.cash_advance_requests?.[0]
      const name = request?.users?.[0]?.name?.toLowerCase() ?? ''
      return (
        (request?.reason ?? '').toLowerCase().includes(search) ||
        (request?.status ?? '').toLowerCase().includes(search) ||
        name.includes(search) ||
        (request?.amount !== undefined ? request.amount.toString().includes(search) : false)
      )
    })
  }, [approvals, query])

  const handleDecision = async (approvalId: string, decision: 'approved' | 'rejected') => {
    if (!supabase) return
    const client = supabase
    setError(null)
    const { error: updateError } = await client
      .from('approvals')
      .update({ decision, decided_at: new Date().toISOString() })
      .eq('id', approvalId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setApprovals((current) =>
      current.map((item) => (item.id === approvalId ? { ...item, decision } : item)),
    )
  }

  return (
    <RequireAuth allowedRoles={['bod', 'admin']}>
      <main className="min-h-screen bg-slate-50">
        <Nav role="bod" />
        <div className="container py-10">
          <section className="card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-slate-500">Dashboard BOD</p>
                <h1 className="text-2xl font-semibold text-slate-900">Tinjau dan Setujui Pengajuan</h1>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-slate-600">Gunakan halaman ini untuk memproses persetujuan bod Anda.</p>
            </div>
          </section>

          <section className="card p-6 mt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-slate-500">Daftar Approvals</p>
                <h2 className="text-xl font-semibold text-slate-900">Pengajuan Terikat pada Anda</h2>
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
                    <th className="py-3 px-2">Keputusan</th>
                    <th className="py-3 px-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-6 px-2 text-center text-slate-500">
                        Memuat data...
                      </td>
                    </tr>
                  ) : filteredApprovals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 px-2 text-center text-slate-500">
                        Tidak ada approval untuk ditampilkan.
                      </td>
                    </tr>
                  ) : (
                    filteredApprovals.map((approval) => {
                      const request = approval.cash_advance_requests?.[0]
                      return (
                        <tr key={approval.id} className="border-b border-slate-200">
                          <td className="py-3 px-2">
                            {request?.created_at ? new Date(request.created_at).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="py-3 px-2">{request?.users?.[0]?.name ?? '-'}</td>
                          <td className="py-3 px-2">Rp {request?.amount?.toLocaleString('id-ID') ?? '-'}</td>
                          <td className="py-3 px-2">
                            <StatusBadge status={request?.status ?? 'pending'} />
                          </td>
                          <td className="py-3 px-2">{approval.decision}</td>
                          <td className="py-3 px-2 flex flex-wrap gap-2">
                            <button
                              className="btn btn-primary"
                              disabled={approval.decision !== 'pending'}
                              onClick={() => handleDecision(approval.id, 'approved')}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger"
                              disabled={approval.decision !== 'pending'}
                              onClick={() => handleDecision(approval.id, 'rejected')}
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      )
                    })
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
