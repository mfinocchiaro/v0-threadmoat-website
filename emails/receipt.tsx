import { Text, Button, Section, Hr } from '@react-email/components'
import { EmailLayout } from './components/layout'

interface ReceiptEmailProps {
  name?: string
  amountFormatted: string
  planName: string
  periodStart: string
  periodEnd: string
  invoiceUrl: string
}

export function ReceiptEmail({
  name,
  amountFormatted,
  planName,
  periodStart,
  periodEnd,
  invoiceUrl,
}: ReceiptEmailProps) {
  return (
    <EmailLayout preview={`Payment receipt - ${amountFormatted} for ${planName}`}>
      <Text style={{
        color: '#e5e5e5',
        fontSize: '18px',
        fontWeight: 'bold',
        margin: '0 0 16px',
      }}>
        Payment Receipt
      </Text>
      <Text style={{
        color: '#a3a3a3',
        fontSize: '14px',
        lineHeight: '24px',
      }}>
        {name ? `Hi ${name}, your` : 'Your'} payment has been processed
        successfully.
      </Text>
      <Hr style={{ borderColor: '#262626', margin: '16px 0' }} />
      <Text style={{ color: '#e5e5e5', fontSize: '14px', margin: '4px 0' }}>
        <strong>Amount:</strong> {amountFormatted}
      </Text>
      <Text style={{ color: '#e5e5e5', fontSize: '14px', margin: '4px 0' }}>
        <strong>Plan:</strong> {planName}
      </Text>
      <Text style={{ color: '#e5e5e5', fontSize: '14px', margin: '4px 0' }}>
        <strong>Period:</strong> {periodStart} - {periodEnd}
      </Text>
      <Hr style={{ borderColor: '#262626', margin: '16px 0' }} />
      <Section style={{ textAlign: 'center' as const, margin: '16px 0' }}>
        <Button
          href={invoiceUrl}
          style={{
            backgroundColor: '#262626',
            color: '#e5e5e5',
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            textDecoration: 'none',
            border: '1px solid #404040',
          }}
        >
          View Full Invoice
        </Button>
      </Section>
    </EmailLayout>
  )
}
