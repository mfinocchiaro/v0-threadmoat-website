'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { resetPassword } from '@/app/actions/auth'
import { PASSWORD_RULES } from '@/lib/auth-schema'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Circle } from 'lucide-react'

function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null
  return (
    <ul className="mt-1 space-y-1">
      {Object.entries(PASSWORD_RULES).map(([key, rule]) => {
        const met = rule.test(password)
        return (
          <li key={key} className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-muted-foreground'}`}>
            {met
              ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              : <Circle className="h-3.5 w-3.5 shrink-0" />
            }
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const passwordStrong = Object.values(PASSWORD_RULES).every(r => r.test(password))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('Missing reset token')
      return
    }
    if (!passwordStrong) {
      setError('Password does not meet the requirements')
      return
    }
    if (password !== repeatPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Invalid Link</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-500 mb-4">This reset link is invalid or has expired.</p>
              <Link href="/auth/forgot-password">
                <Button variant="outline" className="w-full">Request New Link</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {done ? 'Password Reset' : 'Set New Password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your password has been reset successfully.
                </p>
                <Link href="/auth/login">
                  <Button className="w-full">Sign In</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <PasswordRequirements password={password} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">Repeat Password</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={e => setRepeatPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
