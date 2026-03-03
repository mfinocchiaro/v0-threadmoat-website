import { neon } from '@neondatabase/serverless'

// Reuse a single tagged-template SQL client per request in serverless
export const sql = neon(process.env.DATABASE_URL!)
