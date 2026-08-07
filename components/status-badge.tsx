'use client'

interface StatusBadgeProps {
  status: string
}

const labels: Record<string, { text: string; className: string }> = {
  pending: { text: 'Pending', className: 'badge badge-pending' },
  ditolak: { text: 'Ditolak', className: 'badge badge-ditolak' },
  lolos_finance: { text: 'Lolos Finance', className: 'badge badge-approved' },
  diproses: { text: 'Diproses', className: 'badge badge-diproses' },
  selesai: { text: 'Selesai', className: 'badge badge-selesai' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const badge = labels[status] || { text: status, className: 'badge badge-secondary' }
  return <span className={badge.className}>{badge.text}</span>
}
