import { Resend } from 'resend'

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

function emailWrapper(content: string) {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;background:#0a0a0a;">
    <h2 style="color:#7c3aed;text-align:center;margin:0 0 32px;">ThreadMoat</h2>
    <div style="background:#171717;border-radius:8px;padding:32px;border:1px solid #262626;">
      ${content}
    </div>
    <p style="color:#737373;font-size:12px;text-align:center;margin-top:32px;">ThreadMoat Inc. - Market Intelligence for Industrial AI</p>
  </div>`
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${getBaseUrl()}/auth/verify-email?token=${token}`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Verify your ThreadMoat account',
    html: emailWrapper(`
      <h3 style="color:#e5e5e5;font-size:18px;margin:0 0 16px;">Verify Your Email</h3>
      <p style="color:#a3a3a3;font-size:14px;line-height:24px;">Click the button below to verify your email address.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${url}" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:bold;text-decoration:none;">Verify Email</a>
      </p>
      <p style="color:#737373;font-size:12px;line-height:20px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
    `),
  })

  if (error) {
    console.error('[Resend] Verification email failed:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${getBaseUrl()}/auth/reset-password?token=${token}`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset your ThreadMoat password',
    html: emailWrapper(`
      <h3 style="color:#e5e5e5;font-size:18px;margin:0 0 16px;">Reset Your Password</h3>
      <p style="color:#a3a3a3;font-size:14px;line-height:24px;">Click the button below to reset your password.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${url}" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:bold;text-decoration:none;">Reset Password</a>
      </p>
      <p style="color:#737373;font-size:12px;line-height:20px;">This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.</p>
    `),
  })

  if (error) {
    console.error('[Resend] Password reset email failed:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string | undefined,
  planName: string
) {
  const dashboardUrl = `${getBaseUrl()}/dashboard`
  const greeting = name ? `Hi ${name},` : 'Welcome,'

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Welcome to ThreadMoat',
    html: emailWrapper(`
      <h3 style="color:#e5e5e5;font-size:18px;margin:0 0 16px;">${greeting}</h3>
      <p style="color:#a3a3a3;font-size:14px;line-height:24px;">Your ThreadMoat account is active with <strong style="color:#e5e5e5;">${planName}</strong>.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${dashboardUrl}" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:bold;text-decoration:none;">Go to Dashboard</a>
      </p>
    `),
  })

  if (error) {
    console.error('[Resend] Welcome email failed:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }
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
  const greeting = name ? `Hi ${name},` : 'Hello,'
  const invoiceLink = invoiceUrl
    ? `<p style="text-align:center;margin:24px 0;"><a href="${invoiceUrl}" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:bold;text-decoration:none;">View Invoice</a></p>`
    : ''

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Payment Receipt - ${amountFormatted}`,
    html: emailWrapper(`
      <h3 style="color:#e5e5e5;font-size:18px;margin:0 0 16px;">${greeting}</h3>
      <p style="color:#a3a3a3;font-size:14px;line-height:24px;">Thank you for your payment.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="color:#737373;font-size:13px;padding:8px 0;border-bottom:1px solid #262626;">Product</td><td style="color:#e5e5e5;font-size:13px;padding:8px 0;border-bottom:1px solid #262626;text-align:right;">${planName}</td></tr>
        <tr><td style="color:#737373;font-size:13px;padding:8px 0;border-bottom:1px solid #262626;">Amount</td><td style="color:#e5e5e5;font-size:13px;padding:8px 0;border-bottom:1px solid #262626;text-align:right;">${amountFormatted}</td></tr>
        <tr><td style="color:#737373;font-size:13px;padding:8px 0;border-bottom:1px solid #262626;">Period</td><td style="color:#e5e5e5;font-size:13px;padding:8px 0;border-bottom:1px solid #262626;text-align:right;">${formattedStart} — ${formattedEnd}</td></tr>
      </table>
      ${invoiceLink}
    `),
  })

  if (error) {
    console.error('[Resend] Receipt email failed:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }
}

export async function sendAdminPurchaseNotification(
  customerEmail: string,
  customerName: string | undefined,
  productName: string,
  amountFormatted: string
) {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean)
  if (adminEmails.length === 0) return

  const { error } = await getResend().emails.send({
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
  }
}
