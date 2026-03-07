'use server'

import { getStripe } from '@/lib/stripe'
import { getProduct } from '@/lib/products'
import { auth } from '@/auth'
import { sql } from '@/lib/db'

export async function createCheckoutSession(productId: string, userEmail: string) {
  const product = getProduct(productId)
  if (!product) throw new Error('Product not found')

  const session = await auth()
  if (!session?.user?.id) throw new Error('User not authenticated')

  const userId: string = session.user.id

  // Check if user already has a Stripe customer ID
  const rows = await sql`SELECT stripe_customer_id FROM profiles WHERE id = ${userId}`
  let customerId: string = (rows[0]?.stripe_customer_id as string) || ''

  // Create Stripe customer if one doesn't exist yet
  if (customerId === '') {
    const customer = await getStripe().customers.create({
      email: userEmail,
      metadata: { user_id: userId },
    })
    customerId = customer.id

    await sql`
      UPDATE profiles SET stripe_customer_id = ${customerId} WHERE id = ${userId}
    `
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const interval = product.interval === 'year' ? 'year' as const : 'month' as const

  const checkoutSession = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription' as const,
    payment_method_types: ['card' as const],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: product.name, description: product.description || '' },
          unit_amount: product.priceInCents,
          recurring: { interval },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/dashboard?checkout=canceled`,
    metadata: { user_id: userId, product_id: productId },
  })

  return { url: checkoutSession.url }
}

export async function createBillingPortalSession() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('User not authenticated')

  const rows = await sql`
    SELECT stripe_customer_id FROM profiles WHERE id = ${session.user.id}
  `
  const customerId = rows[0]?.stripe_customer_id as string | undefined

  if (!customerId) throw new Error('No subscription found')

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/dashboard/settings`,
  })

  return { url: portalSession.url }
}
