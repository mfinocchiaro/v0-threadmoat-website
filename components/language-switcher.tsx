"use client"

import { useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import { routing, type Locale } from "@/i18n/routing"
import { Globe, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "🇺🇸🇬🇧 English",
  fr: "🇫🇷 Français",
  es: "🇪🇸 Español",
  it: "🇮🇹 Italiano",
  de: "🇩🇪 Deutsch",
  pt: "🇧🇷🇵🇹 Português",
}

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Switch language"
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {routing.locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => switchLocale(l)}
            className="flex items-center justify-between cursor-pointer"
          >
            {LANGUAGE_NAMES[l]}
            {l === locale && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
