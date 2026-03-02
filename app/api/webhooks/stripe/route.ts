import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { neon } from "@neondatabase/serverless"

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const subscriptionId = session.subscription as string
  const productId = session.metadata?.product_id

  if (!userId || !subscriptionId) {
    console.error("Missing user ID or subscription ID in checkout session")
    return
  }

  const stripe = getStripe()
  const sql = getSql()

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  await sql`
    INSERT INTO subscriptions (user_id, product_id, stripe_subscription_id, status, current_period_start, current_period_end)
    VALUES (
      ${userId}::uuid,
      ${productId || 'unknown'},
      ${subscriptionId},
      ${subscription.status},
      ${new Date(subscription.current_period_start * 1000).toISOString()}::timestamptz,
      ${new Date(subscription.current_period_end * 1000).toISOString()}::timestamptz
    )
    ON CONFLICT (user_id) DO UPDATE SET
      product_id = EXCLUDED.product_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = NOW()
  `
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const sql = getSql()

  const users = await sql`
    SELECT id FROM users WHERE stripe_customer_id = ${customerId}
  `

  if (!users[0]) {
    console.error("No user found for customer:", customerId)
    return
  }

  await sql`
    INSERT INTO subscriptions (user_id, product_id, stripe_subscription_id, status, current_period_start, current_period_end)
    VALUES (
      ${users[0].id}::uuid,
      'unknown',
      ${subscription.id},
      ${subscription.status},
      ${new Date(subscription.current_period_start * 1000).toISOString()}::timestamptz,
      ${new Date(subscription.current_period_end * 1000).toISOString()}::timestamptz
    )
    ON CONFLICT (user_id) DO UPDATE SET
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = NOW()
  `
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const sql = getSql()

  const users = await sql`
    SELECT id FROM users WHERE stripe_customer_id = ${customerId}
  `

  if (!users[0]) return

  await sql`
    UPDATE subscriptions SET status = 'canceled', updated_at = NOW() WHERE user_id = ${users[0].id}::uuid
  `
}
