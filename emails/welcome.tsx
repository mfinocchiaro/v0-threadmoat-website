import { Text, Button, Section } from '@react-email/components'
import { EmailLayout } from './components/layout'

interface WelcomeEmailProps {
  name?: string
  planName: string
  dashboardUrl: string
}

export default function WelcomeEmail({ name, planName, dashboardUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`Welcome to ThreadMoat - your ${planName} is active`}>
      <Text style={{
        color: '#e5e5e5',
        fontSize: '18px',
        fontWeight: 'bold',
        margin: '0 0 16px',
      }}>
        Welcome to ThreadMoat{name ? `, ${name}` : ''}
      </Text>
      <Text style={{
        color: '#a3a3a3',
        fontSize: '14px',
        lineHeight: '24px',
      }}>
        Your {planName} subscription is now active. You have full access to 44+
        interactive market intelligence visualizations covering 500+ startups in
        the industrial AI landscape.
      </Text>
      <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
        <Button
          href={dashboardUrl}
          style={{
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            textDecoration: 'none',
          }}
        >
          Open Your Dashboard
        </Button>
      </Section>
    </EmailLayout>
  )
}

WelcomeEmail.PreviewProps = {
  name: 'Michael',
  planName: 'Digital Thread',
  dashboardUrl: 'https://threadmoat.com/dashboard',
} satisfies WelcomeEmailProps
