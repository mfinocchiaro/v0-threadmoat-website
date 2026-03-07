import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sql } from '@/lib/db'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

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
  const subscriptionId = session.subscription as string

  if (!userId || !subscriptionId) {
    console.error('Missing user ID or subscription ID in checkout session')
    return
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const period = getPeriodDates(subscription)

  await sql`
    INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_price_id, status, current_period_start, current_period_end)
    VALUES (
      ${userId},
      ${subscriptionId},
      ${subscription.items.data[0]?.price.id ?? null},
      ${subscription.status},
      ${period.start},
      ${period.end}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      stripe_price_id        = EXCLUDED.stripe_price_id,
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
      stripe_price_id        = ${subscription.items.data[0]?.price.id ?? null},
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
