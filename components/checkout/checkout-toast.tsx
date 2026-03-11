'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

/**
 * Reads ?checkout=success|canceled from URL, shows a toast, then cleans the URL.
 * Mount once inside the dashboard layout.
 */
export function CheckoutToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const status = searchParams.get('checkout')
    if (!status) return

    if (status === 'success') {
      toast({
        title: 'Purchase confirmed',
        description: 'Your report will be delivered within 24 hours. Check your email.',
      })
    } else if (status === 'canceled') {
      toast({
        title: 'Checkout canceled',
        description: 'No charge was made. You can try again from the pricing page.',
        variant: 'destructive',
      })
    }

    // Clean checkout param from URL without navigation
    const url = new URL(window.location.href)
    url.searchParams.delete('checkout')
    url.searchParams.delete('product')
    window.history.replaceState({}, '', url.pathname + url.search)
  }, [searchParams, toast, router])

  return null
}
