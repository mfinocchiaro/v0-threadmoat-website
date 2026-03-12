import { sql } from '@/lib/db'

/** Duration of the free Explorer trial in days */
export const EXPLORER_TRIAL_DAYS = 30

/** Product ID used for auto-created Explorer trials */
export const EXPLORER_TRIAL_PRODUCT = 'explorer_trial'

/**
 * Create a 30-day Explorer trial subscription for a newly verified user.
 * Uses upsert so it's safe to call multiple times (idempotent).
 */
export async function createExplorerTrial(userId: string) {
  const now = new Date()
  const periodEnd = new Date(now.getTime() + EXPLORER_TRIAL_DAYS * 24 * 60 * 60 * 1000)

  await sql`
    INSERT INTO subscriptions (user_id, product_id, status, current_period_start, current_period_end)
    VALUES (
      ${userId},
      ${EXPLORER_TRIAL_PRODUCT},
      ${'trialing'},
      ${now.toISOString()},
      ${periodEnd.toISOString()}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      product_id = EXCLUDED.product_id,
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = NOW()
  `
}
