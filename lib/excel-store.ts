// lib/excel-store.ts
import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.cwd(), 'data')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

export function appendResponse(
  surveyId: string,
  surveyTitle: string,
  respondentEmail: string,
  answers: Array<{ question_text: string; answer_text: string }>
) {
  ensureDataDir()
  const filePath = path.join(DATA_DIR, `${surveyId}.xlsx`)

  let workbook: XLSX.WorkBook
  let worksheet: XLSX.WorkSheet

  if (fs.existsSync(filePath)) {
    workbook = XLSX.readFile(filePath)
    worksheet = workbook.Sheets[workbook.SheetNames[0]]
  } else {
    workbook = XLSX.utils.book_new()
    // Header row: Timestamp, Email, then one column per question
    const headers = ['Timestamp', 'Email', ...answers.map(a => a.question_text)]
    worksheet = XLSX.utils.aoa_to_sheet([headers])
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Responses')
  }

  // Append the new row
  const row = [new Date().toISOString(), respondentEmail, ...answers.map(a => a.answer_text)]
  XLSX.utils.sheet_add_aoa(worksheet, [row], { origin: -1 })

  XLSX.writeFile(workbook, filePath)
}

export function getResponsesAsBuffer(surveyId: string): Buffer | null {
  ensureDataDir()
  const filePath = path.join(DATA_DIR, `${surveyId}.xlsx`)
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath)
}

export function getResponseCount(surveyId: string): number {
  ensureDataDir()
  const filePath = path.join(DATA_DIR, `${surveyId}.xlsx`)
  if (!fs.existsSync(filePath)) return 0
  const workbook = XLSX.readFile(filePath)
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(worksheet)
  return data.length
}
