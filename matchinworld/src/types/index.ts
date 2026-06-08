export type UserRole = 'client' | 'specialist' | 'admin'
export type Locale = 'ar' | 'en'
export type BookingStatus = 'pending_payment' | 'confirmed' | 'completed' | 'cancelled'
export type PaymentMethod = 'vodafone_cash' | 'instapay'
export type KYCStatus = 'pending' | 'approved' | 'rejected'
export type WithdrawalStatus = 'pending' | 'completed' | 'rejected'

export interface User {
  id: string
  email: string
  role: UserRole
  name: string
  avatar_url?: string
  created_at: string
}

export interface Specialist {
  id: string
  name: string
  avatar_url?: string
  specializations: string[]
  price_per_hour: number
  session_durations: number[]
  bio: string
  rating: number
  total_sessions: number
  reputation_score: number
  kyc_status: KYCStatus
  is_active: boolean
}

export interface Booking {
  id: string
  client_id: string
  specialist_id: string
  scheduled_at: string
  duration_minutes: number
  status: BookingStatus
  amount_client: number
  amount_specialist: number
  platform_fee: number
  daily_room_url?: string
}