import { auth } from '@/auth'
import { sql } from '@/lib/db'
import { getUserSubscription } from '@/lib/subscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ManageSubscriptionButton } from '@/components/checkout/manage-subscription-button'
import { ProfileForm } from './profile-form'

export default async function SettingsPage() {
  const session = await auth()
  const user = session?.user

  let profile: { full_name?: string; company?: string; title?: string; profile_type?: string } | undefined
  try {
    const rows = await sql`SELECT full_name, company, title, profile_type FROM profiles WHERE id = ${user?.id}`
    profile = rows[0] as typeof profile
  } catch {
    // DB unavailable
  }

  const subscription = await getUserSubscription(user?.id ?? '')

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account and subscription settings.
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Set your role so the dashboard tailors your view</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialProfile={profile} />
        </CardContent>
      </Card>

      {/* Account Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">User ID</p>
            <p className="font-mono text-sm">{user?.id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Card */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your ThreadMoat Pro subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{subscription.status}</p>
            </div>
            {subscription.currentPeriodEnd && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Renews</p>
                <p className="font-medium">
                  {subscription.currentPeriodEnd.toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          <ManageSubscriptionButton />
        </CardContent>
      </Card>
    </div>
  )
}
