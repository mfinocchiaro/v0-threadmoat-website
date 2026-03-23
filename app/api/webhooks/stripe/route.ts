import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sql } from '@/lib/db'
import { getStripe } from '@/lib/stripe'
import { getInternalProductId } from '@/lib/stripe-prices'
import { sendWelcomeEmail, sendReceiptEmail } from '@/lib/email'
import { getProduct } from '@/lib/products'

/** Extract period dates from subscription items (Stripe SDK v20+) */
function getPeriodDates(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0]
  return {
    start: item ? new Date(item.current_period_start * 1000).toISOString() : new Date().toISOString(),
    end: item ? new Date(item.current_period_end * 1000).toISOString() : new Date().toISOString(),
  }
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, stripe)

        // Send welcome email for subscriptions (non-blocking)
        if (session.mode === 'subscription' && session.customer_details?.email) {
          sendWelcomeEmail(
            session.customer_details.email,
            session.customer_details.name || undefined,
            'your subscription'
          ).catch(err => console.error('[Webhook] Welcome email failed:', err))
        }

        // Send receipt email for one-time payments (non-blocking)
        if (session.mode === 'payment' && session.customer_details?.email) {
          const product = getProduct(session.metadata?.product_id || '')
          const amountFormatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: session.currency || 'usd',
          }).format((session.amount_total ?? 0) / 100)
          sendReceiptEmail(
            session.customer_details.email,
            session.customer_details.name || undefined,
            amountFormatted,
            product?.name || 'ThreadMoat Purchase',
            new Date(),
            new Date(),
            '' // no hosted invoice URL for one-time payments
          ).catch(err => console.error('[Webhook] One-time receipt email failed:', err))
        }

        break
      }
      case 'customer.subscription.created': {
        // Covers subscriptions created outside of Checkout (e.g. via Stripe Dashboard or API)
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(subscription)
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        console.error(`Payment failed for customer ${customerId}, invoice ${invoice.id}`)
        // Mark subscription as past_due if applicable
        if ((invoice as any).subscription) {
          const rows = await sql`SELECT id FROM profiles WHERE stripe_customer_id = ${customerId}`
          if (rows[0]) {
            await sql`
              UPDATE subscriptions SET status = 'past_due', updated_at = NOW()
              WHERE user_id = ${rows[0].id as string}
            `
          }
        }
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.customer_email) break

        const amountFormatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: invoice.currency,
        }).format((invoice.amount_paid ?? 0) / 100)

        sendReceiptEmail(
          invoice.customer_email,
          invoice.customer_name || undefined,
          amountFormatted,
          invoice.lines.data[0]?.description || 'ThreadMoat Subscription',
          new Date((invoice.period_start ?? 0) * 1000),
          new Date((invoice.period_end ?? 0) * 1000),
          invoice.hosted_invoice_url || ''
        ).catch(err => console.error('[Webhook] Receipt email failed:', err))
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, stripe: Stripe) {
  // Support both old (supabase_user_id) and new (user_id) metadata keys during transition
  const userId = session.metadata?.user_id || session.metadata?.supabase_user_id
  const productId = session.metadata?.product_id

  if (!userId) {
    console.error('Missing user ID in checkout session')
    return
  }

  // One-time payment (e.g. market report purchase)
  if (session.mode === 'payment') {
    const paymentIntentId = session.payment_intent as string
    await sql`
      INSERT INTO purchases (user_id, stripe_payment_intent_id, product_id, amount_cents, status, purchased_at)
      VALUES (
        ${userId},
        ${paymentIntentId},
        ${productId ?? 'unknown'},
        ${session.amount_total ?? 0},
        'completed',
        NOW()
      )
    `
    return
  }

  // Recurring subscription
  const subscriptionId = session.subscription as string

  if (!subscriptionId) {
    console.error('Missing subscription ID in checkout session')
    return
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const period = getPeriodDates(subscription)

  await sql`
    INSERT INTO subscriptions (user_id, stripe_subscription_id, product_id, status, current_period_start, current_period_end)
    VALUES (
      ${userId},
      ${subscriptionId},
      ${getInternalProductId(subscription.items.data[0]?.price.id ?? '')},
      ${subscription.status},
      ${period.start},
      ${period.end}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      product_id             = EXCLUDED.product_id,
      status                 = EXCLUDED.status,
      current_period_start   = EXCLUDED.current_period_start,
      current_period_end     = EXCLUDED.current_period_end,
      updated_at             = NOW()
  `
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const period = getPeriodDates(subscription)

  // Look up user by Stripe customer ID stored in profiles
  const rows = await sql`SELECT id FROM profiles WHERE stripe_customer_id = ${customerId}`
  const profile = rows[0]

  if (!profile) {
    console.error('No profile found for customer (subscription.created):', customerId)
    return
  }

  await sql`
    INSERT INTO subscriptions (user_id, stripe_subscription_id, product_id, status, current_period_start, current_period_end)
    VALUES (
      ${profile.id as string},
      ${subscription.id},
      ${getInternalProductId(subscription.items.data[0]?.price.id ?? '')},
      ${subscription.status},
      ${period.start},
      ${period.end}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      product_id             = EXCLUDED.product_id,
      status                 = EXCLUDED.status,
      current_period_start   = EXCLUDED.current_period_start,
      current_period_end     = EXCLUDED.current_period_end,
      updated_at             = NOW()
  `
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const period = getPeriodDates(subscription)

  // Look up user by Stripe customer ID stored in profiles
  const rows = await sql`SELECT id FROM profiles WHERE stripe_customer_id = ${customerId}`
  const profile = rows[0]

  if (!profile) {
    console.error('No profile found for customer:', customerId)
    return
  }

  await sql`
    UPDATE subscriptions SET
      stripe_subscription_id = ${subscription.id},
      product_id             = ${getInternalProductId(subscription.items.data[0]?.price.id ?? '')},
      status                 = ${subscription.status},
      current_period_start   = ${period.start},
      current_period_end     = ${period.end},
      updated_at             = NOW()
    WHERE user_id = ${profile.id as string}
  `
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const rows = await sql`SELECT id FROM profiles WHERE stripe_customer_id = ${customerId}`
  const profile = rows[0]

  if (!profile) return

  await sql`
    UPDATE subscriptions SET status = 'canceled', updated_at = NOW()
    WHERE user_id = ${profile.id as string}
  `
}
