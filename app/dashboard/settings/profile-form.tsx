"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { CheckCircle2 } from "lucide-react"

const PROFILE_OPTIONS = [
  { value: "startup_founder", label: "Startup / Founder" },
  { value: "vc_investor",     label: "VC / Investor" },
  { value: "oem_enterprise",  label: "OEM / Enterprise" },
  { value: "isv_platform",    label: "ISV / Platform" },
]

interface ProfileFormProps {
  initialProfile?: {
    full_name?: string
    company?: string
    title?: string
    profile_type?: string
  }
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [profileType, setProfileType] = useState(initialProfile?.profile_type ?? "")
  const [fullName, setFullName] = useState(initialProfile?.full_name ?? "")
  const [company, setCompany] = useState(initialProfile?.company ?? "")
  const [title, setTitle] = useState(initialProfile?.title ?? "")
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setSaved(false)
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_type: profileType || null, full_name: fullName, company, title }),
        })
        if (!res.ok) throw new Error("Save failed")
        // Also persist to localStorage so the dashboard picks it up without a reload
        if (profileType) localStorage.setItem("dashboard-profile-type", profileType)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch {
        setError("Could not save — database may be unavailable.")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Dashboard Role</Label>
        <Select value={profileType} onValueChange={setProfileType}>
          <SelectTrigger>
            <SelectValue placeholder="Select your role…" />
          </SelectTrigger>
          <SelectContent>
            {PROFILE_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Controls which widgets appear on your dashboard home page.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" />
        </div>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Product Manager" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Company</Label>
        <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save Profile"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" /> Saved
          </span>
        )}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </div>
  )
}
