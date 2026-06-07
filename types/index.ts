export type QuestionType = 'dropdown' | 'text' | 'rating'

export interface AnswerOption {
  id: string
  text: string
  value: string
}

export interface Question {
  id: string
  survey_id: string
  order_index: number
  text: string
  type: QuestionType
  required: boolean
  options?: AnswerOption[]
}

export interface Survey {
  id: string
  title: string
  email_subject: string
  intro_text: string
  created_at: string
  updated_at: string
  questions: Question[]
  sent_count: number
  response_count: number
}

export interface SurveyResponse {
  id: string
  survey_id: string
  respondent_email: string
  submitted_at: string
  answers: ResponseAnswer[]
}

export interface ResponseAnswer {
  question_id: string
  question_text: string
  answer_value: string
  answer_text: string
}

export interface CreateSurveyPayload {
  title: string
  email_subject: string
  intro_text: string
  questions: Omit<Question, 'id' | 'survey_id'>[]
}

export interface SendSurveyPayload {
  recipients: string[]
  send_via_moengage?: boolean
  moengage_segment_id?: string
}
