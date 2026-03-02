import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL)

async function createAdmin() {
  const email = 'michael.finocchiaro@gmail.com'
  const password = 'guwci1-qysqig-bepfUx'
  
  // Hash password with bcrypt
  const passwordHash = await bcrypt.hash(password, 12)
  
  try {
    // Check if user already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`
    
    if (existing.length > 0) {
      // Update existing user to be admin
      await sql`
        UPDATE users 
        SET is_admin = TRUE, password_hash = ${passwordHash}
        WHERE email = ${email}
      `
      console.log('Updated existing user to admin:', email)
    } else {
      // Create new admin user
      await sql`
        INSERT INTO users (email, password_hash, company_name, title, profile_type, is_admin)
        VALUES (${email}, ${passwordHash}, 'ThreadMoat', 'Founder', 'vc_pe_investor', TRUE)
      `
      console.log('Created admin user:', email)
    }
    
    // Verify the user was created
    const user = await sql`SELECT id, email, is_admin, profile_type FROM users WHERE email = ${email}`
    console.log('User record:', user[0])
    
  } catch (error) {
    console.error('Error creating admin:', error)
    process.exit(1)
  }
}

createAdmin()
