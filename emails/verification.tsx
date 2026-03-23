import { Text, Button, Section } from '@react-email/components'
import { EmailLayout } from './components/layout'

interface VerificationEmailProps {
  url: string
}

export default function VerificationEmail({ url }: VerificationEmailProps) {
  return (
    <EmailLayout preview="Verify your ThreadMoat account">
      <Text style={{
        color: '#e5e5e5',
        fontSize: '18px',
        fontWeight: 'bold',
        margin: '0 0 16px',
      }}>
        Verify Your Email
      </Text>
      <Text style={{
        color: '#a3a3a3',
        fontSize: '14px',
        lineHeight: '24px',
      }}>
        Click the button below to verify your email address.
      </Text>
      <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
        <Button
          href={url}
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
          Verify Email
        </Button>
      </Section>
      <Text style={{
        color: '#737373',
        fontSize: '12px',
        lineHeight: '20px',
      }}>
        This link expires in 24 hours. If you didn&apos;t create an account, you can
        safely ignore this email.
      </Text>
    </EmailLayout>
  )
}

VerificationEmail.PreviewProps = {
  url: 'https://threadmoat.com/auth/verify-email?token=example123',
} satisfies VerificationEmailProps
