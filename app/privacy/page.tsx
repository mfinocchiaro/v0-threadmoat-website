import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — ThreadMoat',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: March 2026</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">What we collect</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Account information: name, work email, company, job title, phone (optional), LinkedIn URL (optional)</li>
            <li>Subscription and billing data managed by Stripe (we do not store card details)</li>
            <li>Usage data: pages visited, features used (anonymous analytics)</li>
            <li>Marketing consent: recorded when you opt in during sign-up</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Why we collect it</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>To create and manage your ThreadMoat account</li>
            <li>To process payments and manage subscriptions</li>
            <li>To send transactional emails (verification, password reset, receipts)</li>
            <li>To send product updates and marketing emails — only if you consented</li>
            <li>To improve the platform through aggregate usage analytics</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Sub-processors</h2>
          <p className="text-sm text-muted-foreground mb-3">
            We use the following third-party services to operate the platform:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li><strong>Stripe</strong> — payment processing and subscription management</li>
            <li><strong>Neon</strong> — managed PostgreSQL database (EU/US regions)</li>
            <li><strong>Vercel</strong> — hosting and serverless infrastructure</li>
            <li><strong>Resend</strong> — transactional email delivery</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Data retention</h2>
          <p className="text-sm text-muted-foreground">
            Account data is retained while your account is active. If you request deletion, we will remove your
            personal data within 30 days, except where retention is required by law (e.g. billing records).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Your rights</h2>
          <p className="text-sm text-muted-foreground mb-2">
            Under GDPR and applicable privacy law, you have the right to access, correct, or delete your personal data,
            withdraw marketing consent at any time, and lodge a complaint with your local data protection authority.
          </p>
          <p className="text-sm text-muted-foreground">
            To exercise any of these rights, email us at{' '}
            <a href="mailto:privacy@threadmoat.com" className="underline underline-offset-4">
              privacy@threadmoat.com
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Contact</h2>
          <p className="text-sm text-muted-foreground">
            ThreadMoat — questions about this policy:{' '}
            <a href="mailto:privacy@threadmoat.com" className="underline underline-offset-4">
              privacy@threadmoat.com
            </a>
          </p>
        </section>

        <p className="text-xs text-muted-foreground border-t pt-6">
          <Link href="/" className="underline underline-offset-4">← Back to ThreadMoat</Link>
        </p>
      </div>
    </div>
  )
}
