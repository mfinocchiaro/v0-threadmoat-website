import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { rateLimit } from '@/lib/rate-limit'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = (credentials.email as string || '').trim().toLowerCase()

        // Rate limit: 10 attempts per email per 15 minutes
        const rl = rateLimit(`login:${email}`, 10, 15 * 60 * 1000)
        if (!rl.allowed) return null

        const sql = neon(process.env.DATABASE_URL!)
        const rows = await sql`
          SELECT id, email, password_hash, email_verified
          FROM users
          WHERE email = ${email}
        `
        const user = rows[0]
        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash as string,
        )
        if (!valid) return null

        // Block login if email not verified
        if (user.email_verified === false) return null

        return { id: user.id as string, email: user.email as string }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
})
