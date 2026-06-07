import nodemailer from 'nodemailer'

interface SendEmailOptions {
  to: string
  subject: string
  ampHtml: string
  fallbackHtml: string
  plainText?: string
}

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendSurveyEmail(options: SendEmailOptions): Promise<void> {
  const transport = createTransport()
  const from = `"${process.env.EMAIL_FROM_NAME || 'Survey'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`

  // AMP emails need a special MIME structure:
  // 1. text/plain (lowest priority fallback)
  // 2. text/html (HTML fallback for non-AMP clients)
  // 3. text/x-amp-html (AMP version - highest priority for Gmail/Yahoo)
  await transport.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.plainText || 'Please open this email in a browser to view the survey.',
    html: options.fallbackHtml,
    alternatives: [
      {
        contentType: 'text/x-amp-html',
        content: options.ampHtml,
      },
    ],
  })
}

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}
