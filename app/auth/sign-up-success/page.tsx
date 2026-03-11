'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { Mail, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

function SignUpSuccessContent() {
  const searchParams = useSearchParams()
  const emailFailed = searchParams.get('warn') === 'email'

  const [email, setEmail] = useState('')
  const [resent, setResent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResend = async () => {
    if (!email) return
    setIsLoading(true)
    try {
      const result = await resendVerificationEmail(email)
      if (result.success) setResent(true)
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
            {emailFailed ? (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  We had trouble sending your verification email. Enter your email below to try again.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                We sent a verification link to your email. Click it to activate your account, then sign in.
              </p>
            )}

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

export default function SignUpSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <SignUpSuccessContent />
    </Suspense>
  )
}
