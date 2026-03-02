"use server"

import { getStripe } from "@/lib/stripe"
import { getProduct } from "@/lib/products"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function createCheckoutSession(productId: string, userEmail: string) {
  const product = getProduct(productId)
  
  if (!product) {
    throw new Error("Product not found")
  }

  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error("User not authenticated")
  }

  // Check if user already has a Stripe customer ID
  const profiles = await sql`
    SELECT stripe_customer_id FROM users WHERE id = ${user.id}
  `
  let customerId = profiles[0]?.stripe_customer_id

  // Create Stripe customer if doesn't exist
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: userEmail,
      metadata: {
        user_id: user.id,
      },
    })
    customerId = customer.id

    // Save customer ID to user
    await sql`
      UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${user.id}
    `
  }

  // Get the base URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  // Create checkout session
  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          recurring: {
            interval: product.interval || "month",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/dashboard?checkout=canceled`,
    metadata: {
      user_id: user.id,
      product_id: productId,
    },
  })

  return { url: session.url }
}

export async function createBillingPortalSession() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error("User not authenticated")
  }

  const profiles = await sql`
    SELECT stripe_customer_id FROM users WHERE id = ${user.id}
  `

  if (!profiles[0]?.stripe_customer_id) {
    throw new Error("No subscription found")
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const session = await getStripe().billingPortal.sessions.create({
    customer: profiles[0].stripe_customer_id,
    return_url: `${baseUrl}/dashboard/settings`,
  })

  return { url: session.url }
}
