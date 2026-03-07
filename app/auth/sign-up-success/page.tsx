'use client'

import { useState } from 'react'
import { resendVerificationEmail } from '@/app/actions/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
  const [email, setEmail] = useState('')
  const [resent, setResent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResend = async () => {
    if (!email) return
    setIsLoading(true)
    try {
      await resendVerificationEmail(email)
      setResent(true)
    } catch {
      // silent — don't reveal if email exists
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Check Your Email
            </CardTitle>
            <CardDescription>Verify your email to sign in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We sent a verification link to your email. Click it to activate your account, then sign in.
            </p>

            <div className="border-t pt-4 space-y-3">
              <p className="text-xs text-muted-foreground">Didn&apos;t receive it? Enter your email to resend:</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResend}
                  disabled={isLoading || resent || !email}
                >
                  {resent ? 'Sent' : 'Resend'}
                </Button>
              </div>
            </div>

            <Link href="/auth/login">
              <Button variant="ghost" className="w-full mt-2">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
