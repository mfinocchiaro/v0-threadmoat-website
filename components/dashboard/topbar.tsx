"use client";

import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { LogOut, Settings, Sun, Moon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import type { Session } from "next-auth";
import { ThesisIndicator } from "@/components/dashboard/thesis-indicator";

interface Profile {
  full_name?: string;
  company?: string;
  title?: string;
  profile_type?: string;
}

const PROFILE_LABELS: Record<string, string> = {
  startup_founder: "Competitive Moat Swimmer",
  vc_investor: "Investment Thesis Writer",
  oem_enterprise: "White Space Filler",
  isv_platform: "Targeted Acquisition Radar",
};

interface TopBarProps {
  user: Session["user"];
  profile?: Profile;
  onEditThesis?: () => void;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

export function TopBar({ user, profile, onEditThesis, showMenuButton, onMenuClick }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const initials = profile?.full_name
    ? profile.full_name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join("")
    : user?.email?.[0].toUpperCase() ?? "?";

  const profileLabel = profile?.profile_type ? PROFILE_LABELS[profile.profile_type] : null;

  async function handleSignOut() {
    await signOut({ callbackUrl: "/" });
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/40 bg-background/80 backdrop-blur-sm px-4">
      {/* Mobile hamburger — visible below md */}
      {showMenuButton && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      {onEditThesis && <ThesisIndicator onEditThesis={onEditThesis} />}
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {initials}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            {profile?.full_name && <p className="text-sm font-medium">{profile.full_name}</p>}
            {(profile?.company || profile?.title) && (
              <p className="text-xs text-muted-foreground">
                {[profile.title, profile.company].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            {profileLabel && (
              <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {profileLabel}
              </span>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-500">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
