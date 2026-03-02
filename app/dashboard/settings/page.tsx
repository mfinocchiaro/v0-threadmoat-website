import { createClient } from "@/lib/supabase/server"
import { getUserSubscription } from "@/lib/subscription"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ManageSubscriptionButton } from "@/components/checkout/manage-subscription-button"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const subscription = await getUserSubscription()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account and subscription settings.
        </p>
      </div>

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
