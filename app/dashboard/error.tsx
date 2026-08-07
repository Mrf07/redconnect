'use client'

import { useEffect } from 'react'

export default function ErrorDashboard({ error }: { error: Error }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="container">
        <div className="card p-8">
          <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
          <p className="mt-2 text-slate-600">{error.message}</p>
        </div>
      </div>
    </main>
  )
}
