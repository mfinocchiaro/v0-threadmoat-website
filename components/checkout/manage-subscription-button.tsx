"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createBillingPortalSession } from "@/app/actions/stripe"

export function ManageSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleManage() {
    setIsLoading(true)
    try {
      const { url } = await createBillingPortalSession()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Billing portal error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleManage} disabled={isLoading} variant="outline">
      {isLoading ? "Loading..." : "Manage Subscription"}
    </Button>
  )
}
