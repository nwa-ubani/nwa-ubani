import type { Survey } from '@/types'

export function generateAmpEmail(
  survey: Survey,
  appUrl: string,
  recipientEmail = '{{email}}'
): string {
  const responseUrl = `${appUrl}/api/responses/${survey.id}`
  const fallbackUrl = `${appUrl}/s/${survey.id}`

  const questionsHtml = survey.questions
    .map((q, i) => {
      const fieldName = `q_${q.id}`
      const labelText = `${i + 1}. ${q.text}${q.required ? '*' : ''}`

      if (q.type === 'dropdown' && q.options?.length) {
        const opts = q.options
          .map(o => `<option value="${escHtml(o.value)}">${escHtml(o.text)}</option>`)
          .join('')
        return `<div class="q-wrap">
  <label class="q-label">${escHtml(labelText)}</label>
  <select name="${fieldName}"${q.required ? ' required' : ''} class="q-input">
    <option value="">Choose answer...</option>
    ${opts}
  </select>
</div>`
      }

      if (q.type === 'text') {
        return `<div class="q-wrap">
  <label class="q-label">${escHtml(labelText)}</label>
  <input type="text" name="${fieldName}"${q.required ? ' required' : ''} placeholder="Your answer..." class="q-input" />
</div>`
      }

      if (q.type === 'rating') {
        const radios = [1, 2, 3, 4, 5]
          .map(
            n =>
              `<label class="rating-opt"><input type="radio" name="${fieldName}" value="${n}"${q.required && n === 1 ? ' required' : ''} /> ${n}</label>`
          )
          .join('')
        return `<div class="q-wrap">
  <label class="q-label">${escHtml(labelText)}</label>
  <div class="rating-row">${radios}</div>
</div>`
      }

      return ''
    })
    .join('\n')

  return `<!doctype html>
<html ⚡4email data-css-strict>
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
  <style amp4email-boilerplate>body{visibility:hidden}</style>
  <style amp-custom>
    *{box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d0d1a;color:#fff;margin:0;padding:0}
    .wrap{max-width:480px;margin:0 auto;padding:24px 16px}
    .card{background:#16213e;border-radius:12px;padding:24px;margin-bottom:16px}
    .brand{font-size:20px;font-weight:700;color:#C41E3A;margin:0 0 8px}
    .intro{font-size:14px;color:#cccccc;line-height:1.6;margin:0 0 24px}
    .q-wrap{margin-bottom:20px}
    .q-label{display:block;font-size:14px;font-weight:600;color:#fff;margin-bottom:8px}
    .q-input{width:100%;padding:12px;background:#1e2a45;border:1px solid #2a3f6f;border-radius:8px;color:#fff;font-size:14px}
    .rating-row{display:flex;gap:12px;flex-wrap:wrap}
    .rating-opt{display:flex;align-items:center;gap:4px;font-size:14px;color:#fff;cursor:pointer}
    .btn{display:block;width:100%;background:#C41E3A;color:#fff;border:none;border-radius:8px;padding:16px;font-size:16px;font-weight:700;cursor:pointer;margin-top:8px}
    .success{background:#1a3a2a;border:1px solid #2a6a4a;border-radius:8px;padding:20px;text-align:center;color:#5dbe8c;font-size:15px}
    .error-msg{background:#3a1a1a;border:1px solid #6a2a2a;border-radius:8px;padding:16px;color:#ff6b6b;font-size:14px;margin-top:8px}
    .footer{text-align:center;margin-top:16px;font-size:13px;color:#888}
    .footer a{color:#C41E3A;text-decoration:underline}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <p class="brand">Friend, let's update your status;</p>
      <p class="intro">${escHtml(survey.intro_text || '')}</p>

      <form method="post" action-xhr="${responseUrl}" target="_top">
        <input type="hidden" name="respondent_email" value="${recipientEmail}" />
        <input type="hidden" name="survey_id" value="${survey.id}" />

        ${questionsHtml}

        <div submit-success>
          <div class="success">✓ Thank you! Your response has been recorded.</div>
        </div>
        <div submit-error>
          <div class="error-msg">Something went wrong. Please use the link below.</div>
        </div>

        <input type="submit" class="btn" value="Submit Profile" />
      </form>

      <p class="footer">
        Having trouble clicking submit?<br />
        <a href="${fallbackUrl}">Open the survey in your browser</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

export function generateFallbackHtml(survey: Survey, appUrl: string): string {
  const fallbackUrl = `${appUrl}/s/${survey.id}`
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escHtml(survey.email_subject)}</title>
</head>
<body style="font-family:-apple-system,sans-serif;background:#0d0d1a;color:#fff;margin:0;padding:0;">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px;">
    <div style="background:#16213e;border-radius:12px;padding:24px;">
      <p style="font-size:20px;font-weight:700;color:#C41E3A;margin:0 0 8px;">${escHtml(survey.title)}</p>
      <p style="color:#ccc;font-size:14px;line-height:1.6;">${escHtml(survey.intro_text || '')}</p>
      <a href="${fallbackUrl}" style="display:block;background:#C41E3A;color:#fff;text-align:center;padding:16px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;margin-top:16px;">Open Survey</a>
    </div>
  </div>
</body>
</html>`
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
