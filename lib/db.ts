import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

export type ProfileType = 'startup_founder' | 'vc_pe_investor' | 'oem_enterprise' | 'isv_platform'

export interface User {
  id: string
  email: string
  password_hash: string
  company_name: string | null
  title: string | null
  phone: string | null
  profile_type: ProfileType
  is_admin: boolean
  created_at: Date
  updated_at: Date
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: Date
  created_at: Date
}

export const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  startup_founder: 'Startup / Founder',
  vc_pe_investor: 'VC / PE / Investor',
  oem_enterprise: 'OEM / Enterprise',
  isv_platform: 'ISV / Platform',
}
