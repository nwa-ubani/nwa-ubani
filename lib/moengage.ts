/**
 * MoEngage Data API integration
 * Docs: https://developers.moengage.com/hc/en-us/articles/4407549827348
 */

const MOENGAGE_APP_ID = process.env.MOENGAGE_APP_ID
const MOENGAGE_API_KEY = process.env.MOENGAGE_API_KEY
const MOENGAGE_DATA_CENTER = process.env.MOENGAGE_DATA_CENTER || '01'

function getMoEngageBaseUrl(): string {
  return `https://sdk-0${MOENGAGE_DATA_CENTER}.moengage.com`
}

function getAuthHeader(): string {
  const credentials = `${MOENGAGE_APP_ID}:${MOENGAGE_API_KEY}`
  return `Basic ${Buffer.from(credentials).toString('base64')}`
}

export function isMoEngageConfigured(): boolean {
  return !!(MOENGAGE_APP_ID && MOENGAGE_API_KEY)
}

/**
 * Update or create a customer profile in MoEngage
 */
export async function updateContact(
  email: string,
  attributes: Record<string, string | number | boolean>
): Promise<boolean> {
  if (!isMoEngageConfigured()) {
    console.warn('[MoEngage] Not configured - skipping updateContact')
    return false
  }

  const baseUrl = getMoEngageBaseUrl()
  const url = `${baseUrl}/v1/customer`

  const payload = {
    type: 'customer',
    customer_id: email,
    attributes: {
      EMAIL: email,
      ...attributes,
    },
  }

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
        'MOE-APPKEY': MOENGAGE_APP_ID!,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[MoEngage] updateContact failed: ${response.status} - ${errorText}`)
      return false
    }

    console.log(`[MoEngage] Successfully updated contact: ${email}`)
    return true
  } catch (error) {
    console.error('[MoEngage] updateContact error:', error)
    return false
  }
}

/**
 * Track a custom event in MoEngage
 */
export async function trackEvent(
  email: string,
  eventName: string,
  attributes: Record<string, string | number | boolean>
): Promise<boolean> {
  if (!isMoEngageConfigured()) {
    console.warn('[MoEngage] Not configured - skipping trackEvent')
    return false
  }

  const baseUrl = getMoEngageBaseUrl()
  const url = `${baseUrl}/v1/event`

  const payload = {
    type: 'event',
    customer_id: email,
    actions: [
      {
        action: eventName,
        attributes: {
          platform: 'email_survey',
          ...attributes,
        },
        platform: 'Email',
        app_version: '1.0.0',
      },
    ],
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
        'MOE-APPKEY': MOENGAGE_APP_ID!,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[MoEngage] trackEvent failed: ${response.status} - ${errorText}`)
      return false
    }

    console.log(`[MoEngage] Successfully tracked event "${eventName}" for: ${email}`)
    return true
  } catch (error) {
    console.error('[MoEngage] trackEvent error:', error)
    return false
  }
}

/**
 * Sync a survey response to MoEngage:
 * 1. Updates contact attributes with survey answers
 * 2. Tracks a survey_completed event
 */
export async function syncSurveyResponse(
  email: string,
  surveyTitle: string,
  surveyId: string,
  answers: Array<{ question_text: string; answer_text: string; answer_value: string }>
): Promise<void> {
  // Build attribute map from answers
  const contactAttributes: Record<string, string> = {}
  const eventAttributes: Record<string, string> = {
    survey_id: surveyId,
    survey_title: surveyTitle,
  }

  answers.forEach((answer, index) => {
    // Sanitize key: lowercase, replace spaces/special chars with underscores
    const sanitizedQuestion = answer.question_text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50)

    const attrKey = `survey_${sanitizedQuestion}`
    contactAttributes[attrKey] = answer.answer_text || answer.answer_value
    eventAttributes[`q${index + 1}_${sanitizedQuestion}`] = answer.answer_text || answer.answer_value
  })

  eventAttributes['completed_at'] = new Date().toISOString()

  // Run both calls in parallel, don't let either failure block the response
  await Promise.allSettled([
    updateContact(email, contactAttributes),
    trackEvent(email, 'survey_completed', eventAttributes),
  ])
}
