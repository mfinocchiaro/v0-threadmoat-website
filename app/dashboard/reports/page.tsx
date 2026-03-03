import { auth } from '@/auth'
import { sql } from '@/lib/db'
import { PremiumGate } from '@/components/dashboard/premium-gate'
import { ReportsContent } from './content'

async function checkPremium(userId: string, email: string): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
  if (adminEmails.includes(email)) return true
  try {
    const rows = await sql`SELECT is_admin FROM profiles WHERE id = ${userId}`
    if ((rows[0] as { is_admin?: boolean } | undefined)?.is_admin === true) return true
  } catch { /* DB unavailable */ }
  return false
}

export default async function ReportsPage() {
  const session = await auth()
  const isPremium = await checkPremium(session?.user?.id ?? '', session?.user?.email ?? '')

  return (
    <PremiumGate
      isPremium={isPremium}
      featureName="Report Generator"
      description="Search companies and generate detailed IC-memo style investment reports with score breakdowns, strengths, and weaknesses."
    >
      <ReportsContent />
    </PremiumGate>
  )
}
