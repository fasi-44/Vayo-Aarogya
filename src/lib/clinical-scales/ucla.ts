// Three-Item Loneliness Scale (adapted from Revised UCLA Loneliness Scale)
//
// Hughes ME, Waite LJ, Hawkley LC, Cacioppo JT. (2004).
// Research on Aging, 26(6), 655-672.
//
// 3 items, each scored 1–3:
//   1 = Hardly ever
//   2 = Some of the time
//   3 = Often
//
// Total range 3–9:
//   3–5 = Not lonely
//   6–9 = Lonely

export interface UCLAQuestion {
  id: string
  number: number
  prompt: string
}

export const UCLA_QUESTIONS: UCLAQuestion[] = [
  { id: 'q1', number: 1,
    prompt: 'How often do you feel that you lack companionship?' },
  { id: 'q2', number: 2,
    prompt: 'How often do you feel left out?' },
  { id: 'q3', number: 3,
    prompt: 'How often do you feel isolated from others?' },
]

export const UCLA_SCORE_OPTIONS = [
  { value: 1, label: 'Hardly ever' },
  { value: 2, label: 'Some of the time' },
  { value: 3, label: 'Often' },
] as const

export const UCLA_MAX_TOTAL = 9
export const UCLA_MIN_TOTAL = 3

export type UCLAAnswers = Record<string, number>
export type UCLABand = 'not_lonely' | 'lonely'

export interface UCLAResult {
  total: number
  maxTotal: number
  minTotal: number
  band: UCLABand
  bandLabel: string
  interpretation: string
  answeredCount: number
  totalQuestions: number
}

export function calculateUCLA(answers: UCLAAnswers): UCLAResult {
  const total = UCLA_QUESTIONS.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0)
  const answeredCount = UCLA_QUESTIONS.filter(q => answers[q.id] !== undefined).length

  const band: UCLABand = total >= 6 ? 'lonely' : 'not_lonely'
  const bandLabel = band === 'lonely' ? 'Lonely' : 'Not lonely'
  const interpretation = band === 'lonely'
    ? 'Score suggests loneliness. Consider social engagement interventions and follow-up.'
    : 'Score does not indicate significant loneliness.'

  return {
    total,
    maxTotal: UCLA_MAX_TOTAL,
    minTotal: UCLA_MIN_TOTAL,
    band,
    bandLabel,
    interpretation,
    answeredCount,
    totalQuestions: UCLA_QUESTIONS.length,
  }
}
