export interface RegisterData {
  fullName: string
  email: string
  password: string
  company: string
  title: string
  profileType: 'startup_founder' | 'vc_investor' | 'oem_enterprise' | 'isv_platform'
  phone?: string
  linkedinUrl?: string
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+'
  inviteCode?: string
}

export const PASSWORD_RULES = {
  minLength: { test: (p: string) => p.length >= 8,          label: 'At least 8 characters' },
  uppercase: { test: (p: string) => /[A-Z]/.test(p),        label: 'One uppercase letter' },
  lowercase: { test: (p: string) => /[a-z]/.test(p),        label: 'One lowercase letter' },
  number:    { test: (p: string) => /[0-9]/.test(p),        label: 'One number' },
  special:   { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
}
