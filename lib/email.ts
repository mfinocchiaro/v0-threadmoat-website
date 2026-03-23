import { Resend } from 'resend'
import VerificationEmail from '@/emails/verification'
import PasswordResetEmail from '@/emails/password-reset'
import WelcomeEmail from '@/emails/welcome'
import ReceiptEmail from '@/emails/receipt'

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'ThreadMoat <noreply@threadmoat.com>'

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${getBaseUrl()}/auth/verify-email?token=${token}`

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Verify your ThreadMoat account',
    react: VerificationEmail({ url }),
  })

  if (error) {
    console.error('[Resend] Verification email failed:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }
  console.log('[Resend] Verification email sent:', data?.id)
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${getBaseUrl()}/auth/reset-password?token=${token}`

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset your ThreadMoat password',
    react: PasswordResetEmail({ url }),
  })

  if (error) {
    console.error('[Resend] Password reset email failed:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }
  console.log('[Resend] Password reset email sent:', data?.id)
}

export async function sendWelcomeEmail(
  email: string,
  name: string | undefined,
  planName: string
) {
  const dashboardUrl = `${getBaseUrl()}/dashboard`

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Welcome to ThreadMoat',
    react: WelcomeEmail({
      name: name || undefined,
      planName,
      dashboardUrl,
    }),
  })

  if (error) {
    console.error('[Resend] Welcome email failed:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }
  console.log('[Resend] Welcome email sent:', data?.id)
}

export async function sendReceiptEmail(
  email: string,
  name: string | undefined,
  amountFormatted: string,
  planName: string,
  periodStart: Date,
  periodEnd: Date,
  invoiceUrl: string
) {
  const formattedStart = periodStart.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedEnd = periodEnd.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Payment Receipt - ${amountFormatted}`,
    react: ReceiptEmail({
      name: name || undefined,
      amountFormatted,
      planName,
      periodStart: formattedStart,
      periodEnd: formattedEnd,
      invoiceUrl,
    }),
  })

  if (error) {
    console.error('[Resend] Receipt email failed:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }
  console.log('[Resend] Receipt email sent:', data?.id)
}

export async function sendAdminPurchaseNotification(
  customerEmail: string,
  customerName: string | undefined,
  productName: string,
  amountFormatted: string
) {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean)
  if (adminEmails.length === 0) return

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: adminEmails,
    subject: `New purchase: ${productName} — ${amountFormatted}`,
    html: `
      <h2>New ThreadMoat Purchase</h2>
      <p><strong>Product:</strong> ${productName}</p>
      <p><strong>Amount:</strong> ${amountFormatted}</p>
      <p><strong>Customer:</strong> ${customerName || 'N/A'} (${customerEmail})</p>
      <p><strong>Action needed:</strong> Send watermarked report to ${customerEmail}</p>
      <p><em>Sent at ${new Date().toISOString()}</em></p>
    `,
  })

  if (error) {
    console.error('[Resend] Admin notification failed:', error)
  } else {
    console.log('[Resend] Admin purchase notification sent:', data?.id)
  }
}
