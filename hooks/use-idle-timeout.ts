"use client"

import { useEffect, useRef, useCallback } from "react"
import { signOut } from "next-auth/react"

const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"] as const

export function useIdleTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      signOut({ callbackUrl: "/auth/login?reason=idle" })
    }, IDLE_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    resetTimer()

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true })
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer)
      }
    }
  }, [resetTimer])
}
