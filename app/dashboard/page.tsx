import { auth } from "@/auth"
import { sql } from "@/lib/db"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export default async function DashboardPage() {
  const session = await auth()
  let profileType: string | undefined
  let isAdmin = false

  if (session?.user?.id) {
    try {
      const rows = await sql`SELECT profile_type, is_admin FROM profiles WHERE id = ${session.user.id}`
      const row = rows[0] as { profile_type?: string; is_admin?: boolean } | undefined
      profileType = row?.profile_type
      isAdmin = row?.is_admin === true
    } catch {
      // DB unavailable — proceed with default view
    }
  }

  // Also check ADMIN_EMAILS env var (supports Gmail +alias matching)
  if (!isAdmin && session?.user?.email) {
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim())
      .filter(Boolean)
    const email = session.user.email
    const baseEmail = email.replace(/\+[^@]*@/, '@')
    isAdmin = adminEmails.includes(email) || adminEmails.includes(baseEmail)
  }

  return <DashboardClient profileType={profileType} isAdmin={isAdmin} />
}
