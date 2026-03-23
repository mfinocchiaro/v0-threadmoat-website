'use server'

import { getStripe } from '@/lib/stripe'
import { getProduct } from '@/lib/products'
import { getStripePriceId } from '@/lib/stripe-prices'
import { auth } from '@/auth'
import { sql } from '@/lib/db'

export async function createCheckoutSession(productId: string, userEmail: string) {
  try {
  console.log('[Checkout] Starting for productId:', productId, 'email:', userEmail)

  const product = getProduct(productId)
  if (!product) {
    console.error('[Checkout] Product not found:', productId)
    throw new Error(`Product not found: ${productId}`)
  }
  console.log('[Checkout] Product found:', product.name, 'mode:', product.mode)

  const session = await auth()
  console.log('[Checkout] Auth result:', session?.user?.id ? 'authenticated' : 'NO SESSION')
  if (!session?.user?.id) {
    throw new Error('User not authenticated')
  }

  const userId: string = session.user.id

  // Check if user already has a Stripe customer ID
  const rows = await sql`SELECT stripe_customer_id FROM profiles WHERE id = ${userId}`
  let customerId: string = (rows[0]?.stripe_customer_id as string) || ''
  console.log('[Checkout] Existing customerId:', customerId || 'NONE')

  // Validate existing customer ID works with current Stripe key (test vs live mismatch)
  if (customerId) {
    try {
      await getStripe().customers.retrieve(customerId)
      console.log('[Checkout] Customer validated OK')
    } catch (err) {
      console.log('[Checkout] Stale customer ID, creating new. Error:', String(err))
      customerId = ''
      await sql`UPDATE profiles SET stripe_customer_id = NULL WHERE id = ${userId}`
    }
  }

  // Create Stripe customer if one doesn't exist yet
  if (customerId === '') {
    console.log('[Checkout] Creating new Stripe customer for:', userEmail)
    const customer = await getStripe().customers.create({
      email: userEmail,
      metadata: { user_id: userId },
    })
    customerId = customer.id
    console.log('[Checkout] Created customer:', customerId)

    await sql`
      UPDATE profiles SET stripe_customer_id = ${customerId} WHERE id = ${userId}
    `
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  console.log('[Checkout] Customer:', customerId, 'Mode:', product.mode, 'BaseURL:', baseUrl)

  if (product.mode === 'payment') {
    // One-time payment (e.g. market reports)
    const stripePriceId = getStripePriceId(productId)
    console.log('[Checkout] StripePriceId resolved:', stripePriceId)

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

  const checkoutSession = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription' as const,
    payment_method_types: ['card' as const],
    line_items: [lineItem],
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/dashboard?checkout=canceled`,
    metadata: { user_id: userId, product_id: productId },
  })

  return { url: checkoutSession.url }
  } catch (err) {
    console.error('[Checkout] FULL ERROR:', String(err), err instanceof Error ? err.stack : '')
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
