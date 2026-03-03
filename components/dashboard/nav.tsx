'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { LogOut, Settings, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Session } from 'next-auth'

export function DashboardNav({ user }: { user: Session['user'] }) {
  async function handleSignOut() {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <header className="border-b border-border/40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Threaded!" className="h-8 w-auto" />
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Database
          </Link>
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <BarChart2 className="h-4 w-4" />
            Analytics
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Settings
          </Link>
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user?.email?.[0].toUpperCase()}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-red-500"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
