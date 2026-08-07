'use client'

import { useEffect, useMemo, useState } from 'react'
import { Nav } from '../../../components/nav'
import { StatusBadge } from '../../../components/status-badge'
import { RequireAuth } from '../../../components/RequireAuth'
import { useSupabase } from '../../../lib/supabase-provider'
import { useCurrentUser } from '../../../lib/useCurrentUser'

interface RequestForm {
  amount: number
  reason: string
}

interface RequestItem {
  id: string
  amount: number
  reason: string
  status: string
  created_at: string
}

export default function KaryawanDashboard() {
  const { supabase } = useSupabase()
  const { profile, loading: loadingProfile } = useCurrentUser()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<RequestForm>({ amount: 0, reason: '' })
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<RequestForm>({ amount: 0, reason: '' })
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const search = query.toLowerCase()
      return (
        item.reason.toLowerCase().includes(search) ||
        item.status.toLowerCase().includes(search) ||
        item.amount.toString().includes(search)
      )
    })
  }, [requests, query])

  useEffect(() => {
    if (!supabase || !profile?.id) return
    const client = supabase
    const userId = profile.id

    async function loadRequests() {
      const { data, error: fetchError } = await client
        .from('cash_advance_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setRequests(data ?? [])
      }
    }

    loadRequests()
  }, [supabase, profile?.id])

  const startEdit = (item: RequestItem) => {
    setEditingRequestId(item.id)
    setEditForm({ amount: item.amount, reason: item.reason })
    setError(null)
  }

  const cancelEdit = () => {
    setEditingRequestId(null)
    setEditForm({ amount: 0, reason: '' })
  }

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || !profile?.id || !editingRequestId) return
    const client = supabase
    setActionLoading(editingRequestId)
    setError(null)

    const { error: updateError } = await client
      .from('cash_advance_requests')
      .update({ amount: editForm.amount, reason: editForm.reason })
      .eq('id', editingRequestId)
      .eq('user_id', profile.id)
      .eq('status', 'pending')

    setActionLoading(null)
    if (updateError) {
      setError(updateError.message)
      return
    }

    setRequests((current) =>
      current.map((request) =>
        request.id === editingRequestId
          ? { ...request, amount: editForm.amount, reason: editForm.reason }
          : request,
      ),
    )

    cancelEdit()
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!supabase || !profile?.id) return
    const client = supabase
    setActionLoading(requestId)
    setError(null)

    const { error: deleteError } = await client
      .from('cash_advance_requests')
      .delete()
      .eq('id', requestId)
      .eq('user_id', profile.id)
      .eq('status', 'pending')

    setActionLoading(null)
    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setRequests((current) => current.filter((item) => item.id !== requestId))
    if (editingRequestId === requestId) {
      cancelEdit()
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || !profile?.id) return
    const client = supabase
    const userId = profile.id
    setSaving(true)
    setError(null)

    const { error: insertError } = await client.from('cash_advance_requests').insert({
      user_id: userId,
      amount: form.amount,
      reason: form.reason,
    })

    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }

    setForm({ amount: 0, reason: '' })
    const { data } = await supabase
      .from('cash_advance_requests')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    setRequests(data ?? [])
  }

  return (
    <RequireAuth allowedRoles={['karyawan', 'admin']}>
      <main className="min-h-screen bg-slate-50">
        <Nav role="karyawan" />
        <div className="container py-10">
          <section className="card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-slate-500">Dashboard Karyawan</p>
                <h1 className="text-2xl font-semibold text-slate-900">Ajukan Cash Advance Baru</h1>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span>Nominal</span>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) }))}
                    className="input"
                    placeholder="Masukkan nominal"
                    required
                    min={1}
                  />
                </label>
                <label className="grid gap-2">
                  <span>Alasan</span>
                  <textarea
                    value={form.reason}
                    onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
                    className="textarea"
                    rows={4}
                    placeholder="Jelaskan kebutuhan dana"
                    required
                  />
                </label>
              </div>
              <button className="btn btn-primary w-full sm:w-auto" disabled={saving || loadingProfile}>
                {saving ? 'Mengirim...' : 'Ajukan Permintaan'}
              </button>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </form>
          </section>

          {editingRequestId ? (
            <section className="card p-6 mt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-slate-500">Edit Pengajuan</p>
                  <h2 className="text-xl font-semibold text-slate-900">Perbarui request pending</h2>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="mt-6 grid gap-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span>Nominal</span>
                    <input
                      type="number"
                      value={editForm.amount}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, amount: Number(event.target.value) }))}
                      className="input"
                      placeholder="Masukkan nominal"
                      required
                      min={1}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span>Alasan</span>
                    <textarea
                      value={editForm.reason}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, reason: event.target.value }))}
                      className="textarea"
                      rows={4}
                      placeholder="Perbarui alasan pengajuan"
                      required
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button className="btn btn-primary" disabled={actionLoading !== null}>
                    {actionLoading === editingRequestId ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={cancelEdit} disabled={actionLoading !== null}>
                    Batal
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <section className="card p-6 mt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-slate-500">Riwayat Pengajuan</p>
                <h2 className="text-xl font-semibold text-slate-900">Permintaan Anda</h2>
              </div>
              <input
                type="search"
                className="input max-w-sm"
                placeholder="Cari nominal, alasan, atau status"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 text-slate-900">
                  <tr>
                    <th className="py-3 px-2">Tanggal</th>
                    <th className="py-3 px-2">Nominal</th>
                    <th className="py-3 px-2">Alasan</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((item) => (
                    <tr key={item.id} className="border-b border-slate-200">
                      <td className="py-3 px-2">{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="py-3 px-2">Rp {item.amount.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-2">{item.reason}</td>
                      <td className="py-3 px-2">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3 px-2 flex flex-wrap gap-2">
                        {item.status === 'pending' ? (
                          <>
                            <button
                              className="btn btn-secondary"
                              disabled={actionLoading !== null}
                              onClick={() => startEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger"
                              disabled={actionLoading === item.id}
                              onClick={() => handleDeleteRequest(item.id)}
                            >
                              {actionLoading === item.id ? 'Menghapus...' : 'Hapus'}
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-500">Tidak tersedia</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </RequireAuth>
  )
}
