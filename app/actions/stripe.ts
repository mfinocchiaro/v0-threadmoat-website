'use server'

import { getStripe } from '@/lib/stripe'
import { getProduct } from '@/lib/products'
import { getStripePriceId } from '@/lib/stripe-prices'
import { auth } from '@/auth'
import { sql } from '@/lib/db'

export async function createCheckoutSession(productId: string, userEmail: string) {
  try {
  const product = getProduct(productId)
  if (!product) {
    throw new Error(`Product not found: ${productId}`)
  }

  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('User not authenticated')
  }

  const userId: string = session.user.id

  // Check if user already has a Stripe customer ID
  const rows = await sql`SELECT stripe_customer_id FROM profiles WHERE id = ${userId}`
  let customerId: string = (rows[0]?.stripe_customer_id as string) || ''

  // Validate existing customer ID works with current Stripe key (test vs live mismatch)
  if (customerId) {
    try {
      await getStripe().customers.retrieve(customerId)
    } catch {
      customerId = ''
      await sql`UPDATE profiles SET stripe_customer_id = NULL WHERE id = ${userId}`
    }
  }

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

  if (product.mode === 'payment') {
    // One-time payment (e.g. market reports)
    const stripePriceId = getStripePriceId(productId)

    const lineItem = stripePriceId
      ? { price: stripePriceId, quantity: 1 }
      : {
          price_data: {
            currency: 'usd' as const,
            product_data: { name: product.name, description: product.description || '' },
            unit_amount: product.priceInCents,
          },
          quantity: 1,
        }

    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [lineItem],
      success_url: `${baseUrl}/dashboard?checkout=success&product=${productId}`,
      cancel_url: `${baseUrl}/pricing?checkout=canceled`,
      metadata: { user_id: userId, product_id: productId },
    })

    return { url: checkoutSession.url }
  }

  // Recurring subscription
  const stripePriceId = getStripePriceId(productId)

  const lineItem = stripePriceId
    ? { price: stripePriceId, quantity: 1 }
    : {
        price_data: {
          currency: 'usd' as const,
          product_data: { name: product.name, description: product.description || '' },
          unit_amount: product.priceInCents,
          recurring: { interval: (product.interval === 'year' ? 'year' : 'month') as 'year' | 'month' },
        },
        quantity: 1,
      }

  // Check if this is a Strategist upgrade from an existing Analyst purchase
  const discounts = await getUpgradeDiscounts(userId, productId)

  const checkoutSession = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription' as const,
    payment_method_types: ['card' as const],
    line_items: [lineItem],
    ...(discounts.length > 0 ? { discounts } : {}),
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/dashboard?checkout=canceled`,
    metadata: { user_id: userId, product_id: productId },
  })

  return { url: checkoutSession.url }
  } catch (err) {
    console.error('[Checkout]', err instanceof Error ? err.message : String(err))
    throw err
  }
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

/** Upgrade coupon ID — consistent across Stripe environments via idempotency key */
const UPGRADE_COUPON_ID = 'threadmoat_analyst_upgrade_4999'
const UPGRADE_AMOUNT_OFF = 499900 // $4,999 in cents

/**
 * Check if user has a completed Analyst purchase and return a Stripe discount
 * array for the Strategist subscription checkout. Returns empty array if
 * no upgrade credit applies.
 */
async function getUpgradeDiscounts(
  userId: string,
  targetProductId: string
): Promise<{ coupon: string }[]> {
  // Only apply to Strategist upgrades
  if (targetProductId !== 'strategist_annual') return []

  // Check for a completed Analyst purchase
  const purchases = await sql`
    SELECT id FROM purchases
    WHERE user_id = ${userId}
      AND product_id = 'analyst_annual'
      AND status = 'completed'
    LIMIT 1
  `

  if (purchases.length === 0) return []

  // Ensure the coupon exists in Stripe (idempotent — retrieves if already created)
  const stripe = getStripe()
  try {
    await stripe.coupons.retrieve(UPGRADE_COUPON_ID)
  } catch {
    // Coupon doesn't exist yet — create it
    await stripe.coupons.create({
      id: UPGRADE_COUPON_ID,
      amount_off: UPGRADE_AMOUNT_OFF,
      currency: 'usd',
      duration: 'once',
      name: 'Analyst Upgrade Credit ($4,999)',
      metadata: { purpose: 'analyst_to_strategist_upgrade' },
    })
  }

  return [{ coupon: UPGRADE_COUPON_ID }]
}
