export type UserRole = 'karyawan' | 'bod' | 'finance' | 'admin'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  bod_order: number | null
}

export interface CashAdvanceRequest {
  id: string
  user_id: string
  amount: number
  reason: string
  status: 'pending' | 'ditolak' | 'lolos_finance' | 'diproses' | 'selesai'
  pdf_url?: string | null
  created_at: string
  updated_at: string
  users?: {
    id: string
    name: string
    email: string
  }
}

export interface ApprovalRecord {
  id: string
  request_id: string
  bod_user_id: string
  decision: 'pending' | 'approved' | 'rejected'
  decided_at: string | null
}

export interface FinanceAction {
  id: string
  request_id: string
  finance_user_id: string
  status: 'proses' | 'ditolak' | 'pending' | 'selesai'
  notes?: string | null
  processed_at: string
}
