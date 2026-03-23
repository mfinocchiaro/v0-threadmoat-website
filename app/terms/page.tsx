import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — ThreadMoat',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: March 2026</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">1. Service overview</h2>
          <p className="text-sm text-muted-foreground">
            ThreadMoat (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides market intelligence on
            engineering software and industrial AI companies through interactive dashboards,
            market reports, and analyst services. By creating an account or purchasing a
            report you agree to these terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">2. Accounts</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>You must provide accurate professional information when registering.</li>
            <li>You are responsible for all activity under your account.</li>
            <li>We may suspend or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">3. Market reports</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Each report is licensed to the purchasing entity as specified at checkout (Latest Quarterly Report or Annual Report Subscription).</li>
            <li>Reports are personalized, watermarked, and carry a unique Copy ID. Redistribution outside the licensed entity is prohibited.</li>
            <li>Latest Quarterly Reports are priced per edition. Annual Report Subscriptions include all four quarterly editions.</li>
            <li>All sales are final. Refunds are at our sole discretion.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">4. Dashboard access</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Free Explorer accounts may access a limited set of dashboards at no cost.</li>
            <li>Full dashboard access is available through Strategist (annual) engagements or as an add-on to a report license.</li>
            <li>We may modify available dashboards and features at any time.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">5. Intellectual property</h2>
          <p className="text-sm text-muted-foreground">
            All data, analysis, scoring methodologies, visualizations, and written content
            are the intellectual property of ThreadMoat. You may use purchased reports
            internally within your licensed entity. You may not resell, republish, or
            create derivative works for external distribution without written permission.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">6. Disclaimer</h2>
          <p className="text-sm text-muted-foreground">
            ThreadMoat provides market intelligence for informational purposes only.
            Our reports and dashboards do not constitute investment advice, legal advice,
            or any recommendation to buy, sell, or hold securities. Company scores and
            rankings reflect our proprietary methodology and are opinions, not guarantees
            of future performance. Use this information at your own risk.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">7. Limitation of liability</h2>
          <p className="text-sm text-muted-foreground">
            To the maximum extent permitted by law, ThreadMoat&rsquo;s total liability
            for any claim arising from your use of the service shall not exceed the
            amount you paid us in the twelve months preceding the claim. We are not
            liable for indirect, incidental, or consequential damages.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">8. Governing law</h2>
          <p className="text-sm text-muted-foreground">
            These terms are governed by French law. Any disputes shall be submitted
            to the exclusive jurisdiction of the courts of Paris, France.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">9. Changes</h2>
          <p className="text-sm text-muted-foreground">
            We may update these terms from time to time. Material changes will be
            communicated via email to registered users. Continued use of the service
            after changes take effect constitutes acceptance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">10. Contact</h2>
          <p className="text-sm text-muted-foreground">
            Questions about these terms:{' '}
            <a href="mailto:fino@demystifyingplm.com" className="underline underline-offset-4">
              fino@demystifyingplm.com
            </a>
          </p>
        </section>

        <p className="text-xs text-muted-foreground border-t pt-6">
          <Link href="/" className="underline underline-offset-4">&larr; Back to ThreadMoat</Link>
          {' · '}
          <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
