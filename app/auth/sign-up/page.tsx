'use client'

import React from "react"
import { Shield } from 'lucide-react'
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
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const PROFILE_TYPES = [
  { value: 'startup_founder', label: 'Startup / Founder' },
  { value: 'vc_pe_investor', label: 'VC / PE / Investor' },
  { value: 'oem_enterprise', label: 'OEM / Enterprise' },
  { value: 'isv_platform', label: 'ISV / Platform' },
]

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    repeatPassword: '',
    companyName: '',
    title: '',
    phone: '',
    profileType: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (formData.password !== formData.repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    if (!formData.profileType) {
      setError('Please select a profile type')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          title: formData.title,
          phone: formData.phone || null,
          profileType: formData.profileType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center mb-2">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">ThreadMoat</span>
            </Link>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign up</CardTitle>
              <CardDescription>Create your ThreadMoat account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="Acme Inc."
                        required
                        value={formData.companyName}
                        onChange={(e) => handleChange('companyName', e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        type="text"
                        placeholder="Partner"
                        required
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="profileType">Profile Type *</Label>
                      <Select
                        value={formData.profileType}
                        onValueChange={(value) => handleChange('profileType', value)}
                      >
                        <SelectTrigger id="profileType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROFILE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="repeatPassword">Confirm Password *</Label>
                    <Input
                      id="repeatPassword"
                      type="password"
                      required
                      value={formData.repeatPassword}
                      onChange={(e) => handleChange('repeatPassword', e.target.value)}
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    className="underline underline-offset-4"
                  >
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
