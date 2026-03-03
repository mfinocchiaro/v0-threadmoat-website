"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createCheckoutSession } from "@/app/actions/stripe"

export function CheckoutButton({
  productId,
  userEmail,
}: {
  productId: string
  userEmail: string
}) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleCheckout() {
    setIsLoading(true)
    try {
      const { url } = await createCheckoutSession(productId, userEmail)
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleCheckout} disabled={isLoading} className="w-full">
      {isLoading ? "Loading..." : "Subscribe Now"}
    </Button>
  )
}
