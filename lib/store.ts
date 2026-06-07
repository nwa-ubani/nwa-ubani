import { v4 as uuidv4 } from 'uuid'
import type { Survey, SurveyResponse, CreateSurveyPayload } from '@/types'

// Global in-memory store for dev/demo. Data lost on restart.
// Set NEXT_PUBLIC_SUPABASE_URL + keys to persist with Supabase instead.
declare global {
  // eslint-disable-next-line no-var
  var __survey_store: {
    surveys: Map<string, Survey>
    responses: Map<string, SurveyResponse[]>
  } | undefined
}

function getStore() {
  if (!global.__survey_store) {
    global.__survey_store = {
      surveys: new Map(),
      responses: new Map(),
    }
  }
  return global.__survey_store
}

export const memStore = {
  createSurvey(payload: CreateSurveyPayload): Survey {
    const store = getStore()
    const id = uuidv4()
    const now = new Date().toISOString()
    const survey: Survey = {
      id,
      title: payload.title,
      email_subject: payload.email_subject,
      intro_text: payload.intro_text,
      created_at: now,
      updated_at: now,
      questions: payload.questions.map((q, i) => ({
        ...q,
        id: uuidv4(),
        survey_id: id,
        order_index: i,
        options: q.options?.map(o => ({ ...o, id: uuidv4() })),
      })),
      sent_count: 0,
      response_count: 0,
    }
    store.surveys.set(id, survey)
    store.responses.set(id, [])
    return survey
  },

  getSurvey(id: string): Survey | undefined {
    return getStore().surveys.get(id)
  },

  listSurveys(): Survey[] {
    return Array.from(getStore().surveys.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  },

  deleteSurvey(id: string): boolean {
    const store = getStore()
    const existed = store.surveys.has(id)
    store.surveys.delete(id)
    store.responses.delete(id)
    return existed
  },

  incrementSentCount(id: string, by = 1): void {
    const store = getStore()
    const survey = store.surveys.get(id)
    if (survey) {
      survey.sent_count += by
      store.surveys.set(id, survey)
    }
  },

  addResponse(
    surveyId: string,
    data: Omit<SurveyResponse, 'id' | 'submitted_at'>
  ): SurveyResponse | null {
    const store = getStore()
    const survey = store.surveys.get(surveyId)
    if (!survey) return null

    const response: SurveyResponse = {
      ...data,
      id: uuidv4(),
      submitted_at: new Date().toISOString(),
    }

    const list = store.responses.get(surveyId) || []
    list.push(response)
    store.responses.set(surveyId, list)

    survey.response_count = list.length
    store.surveys.set(surveyId, survey)

    return response
  },

  getResponses(surveyId: string): SurveyResponse[] {
    return getStore().responses.get(surveyId) || []
  },
}
