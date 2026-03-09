'use client'

import React, { useState } from 'react'
import { registerUser } from '@/app/actions/auth'
import { PASSWORD_RULES, type RegisterData } from '@/lib/auth-schema'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, Circle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const PROFILE_OPTIONS = [
  { value: 'startup_founder', label: 'Startup / Founder' },
  { value: 'vc_investor', label: 'VC / Investor' },
  { value: 'oem_enterprise', label: 'OEM / Enterprise' },
  { value: 'isv_platform', label: 'ISV / Platform' },
] as const

const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+'] as const

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

export default function SignUpPage() {
  const [form, setForm] = useState({
    fullName: '',
    company: '',
    title: '',
    profileType: '' as RegisterData['profileType'] | '',
    email: '',
    phone: '',
    linkedinUrl: '',
    companySize: '' as RegisterData['companySize'] | '',
    password: '',
    repeatPassword: '',
    inviteCode: '',
  })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const passwordStrong = Object.values(PASSWORD_RULES).every(r => r.test(form.password))

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.profileType) {
      setError('Please select your profile type')
      return
    }
    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy to continue')
      return
    }
    if (!passwordStrong) {
      setError('Password does not meet the requirements below')
      return
    }
    if (form.password !== form.repeatPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    const result = await registerUser({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      company: form.company,
      title: form.title,
      profileType: form.profileType,
      phone: form.phone || undefined,
      linkedinUrl: form.linkedinUrl || undefined,
      companySize: (form.companySize as RegisterData['companySize']) || undefined,
      inviteCode: form.inviteCode || undefined,
      marketingConsent,
    })
    if (result.success) {
      router.push('/auth/sign-up-success')
    } else {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign up</CardTitle>
              <CardDescription>Create your ThreadMoat account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">

                  {/* Name */}
                  <div className="grid gap-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      type="text"
                      placeholder="Jane Smith"
                      required
                      maxLength={100}
                      value={form.fullName}
                      onChange={set('fullName')}
                    />
                  </div>

                  {/* Company + Title */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        type="text"
                        placeholder="Acme Corp"
                        required
                        maxLength={100}
                        value={form.company}
                        onChange={set('company')}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        type="text"
                        placeholder="CEO"
                        required
                        maxLength={100}
                        value={form.title}
                        onChange={set('title')}
                      />
                    </div>
                  </div>

                  {/* Profile type */}
                  <div className="grid gap-2">
                    <Label htmlFor="profile-type">Profile</Label>
                    <Select
                      value={form.profileType}
                      onValueChange={val =>
                        setForm(prev => ({ ...prev, profileType: val as RegisterData['profileType'] }))
                      }
                    >
                      <SelectTrigger id="profile-type">
                        <SelectValue placeholder="Select your role..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PROFILE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Email */}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      required
                      maxLength={254}
                      value={form.email}
                      onChange={set('email')}
                    />
                  </div>

                  {/* Phone + Company size */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="phone">
                        Phone <span className="text-muted-foreground text-xs">(optional)</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 555 000 0000"
                        maxLength={30}
                        value={form.phone}
                        onChange={set('phone')}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="company-size">
                        Team size <span className="text-muted-foreground text-xs">(optional)</span>
                      </Label>
                      <Select
                        value={form.companySize}
                        onValueChange={val =>
                          setForm(prev => ({ ...prev, companySize: val as RegisterData['companySize'] }))
                        }
                      >
                        <SelectTrigger id="company-size">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPANY_SIZE_OPTIONS.map(size => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="grid gap-2">
                    <Label htmlFor="linkedin">
                      LinkedIn <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      maxLength={500}
                      value={form.linkedinUrl}
                      onChange={set('linkedinUrl')}
                    />
                  </div>

                  {/* Invite Code */}
                  <div className="grid gap-2">
                    <Label htmlFor="invite-code">
                      Invite Code <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="invite-code"
                      type="text"
                      placeholder="Enter code if you have one"
                      maxLength={50}
                      value={form.inviteCode}
                      onChange={set('inviteCode')}
                      className="uppercase"
                    />
                  </div>

                  {/* Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={form.password}
                      onChange={set('password')}
                    />
                    <PasswordRequirements password={form.password} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">Repeat Password</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={form.repeatPassword}
                      onChange={set('repeatPassword')}
                    />
                  </div>

                  {/* GDPR checkboxes */}
                  <div className="flex flex-col gap-3 pt-1">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                        checked={termsAccepted}
                        onChange={e => setTermsAccepted(e.target.checked)}
                        required
                      />
                      <span className="text-sm text-muted-foreground">
                        I agree to the{' '}
                        <Link href="/terms" className="underline underline-offset-4 text-foreground" target="_blank">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="underline underline-offset-4 text-foreground" target="_blank">
                          Privacy Policy
                        </Link>
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                        checked={marketingConsent}
                        onChange={e => setMarketingConsent(e.target.checked)}
                      />
                      <span className="text-sm text-muted-foreground">
                        I agree to receive product updates and marketing emails from ThreadMoat.{' '}
                        <span className="text-muted-foreground/70">(optional)</span>
                      </span>
                    </label>
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Sign up'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="underline underline-offset-4">
                    Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
