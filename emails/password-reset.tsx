import { Text, Button, Section } from '@react-email/components'
import { EmailLayout } from './components/layout'

interface PasswordResetEmailProps {
  url: string
}

export function PasswordResetEmail({ url }: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Reset your ThreadMoat password">
      <Text style={{
        color: '#e5e5e5',
        fontSize: '18px',
        fontWeight: 'bold',
        margin: '0 0 16px',
      }}>
        Reset Your Password
      </Text>
      <Text style={{
        color: '#a3a3a3',
        fontSize: '14px',
        lineHeight: '24px',
      }}>
        Click the button below to reset your password.
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
          Reset Password
        </Button>
      </Section>
      <Text style={{
        color: '#737373',
        fontSize: '12px',
        lineHeight: '20px',
      }}>
        This link expires in 1 hour. If you didn&apos;t request a password reset, you
        can safely ignore this email.
      </Text>
    </EmailLayout>
  )
}
