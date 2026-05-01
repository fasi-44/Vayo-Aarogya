// Geriatric Depression Scale — Short Form (GDS-15)
//
// Yesavage JA et al. (1983). Development and validation of a geriatric depression
// screening scale: A preliminary report. J Psychiatric Research, 17(1), 37-49.
//
// 15 yes/no items answered by the patient about the past week.
// Score 1 point for each answer that matches the item's scoring answer (bolded
// on the official form). The scoring answer is NOT always "yes" — 5 items score
// on "no" and 10 items score on "yes".
//
// Interpretation:
//   0–4  : Normal (no depression)
//   5–8  : Mild depression
//   9–11 : Moderate depression
//  12–15 : Severe depression
//
// A score ≥ 5 suggests depression.

export type GDSAnswer = 'yes' | 'no'

export interface GDSQuestion {
  id: string
  number: string
  prompt: string
  /** The answer that scores 1 point (bolded on the official form). */
  scoringAnswer: GDSAnswer
}

export const GDS_QUESTIONS: GDSQuestion[] = [
  { id: 'q1',  number: '1',  scoringAnswer: 'no',
    prompt: 'Are you basically satisfied with your life?' },
  { id: 'q2',  number: '2',  scoringAnswer: 'yes',
    prompt: 'Have you dropped many of your activities and interests?' },
  { id: 'q3',  number: '3',  scoringAnswer: 'yes',
    prompt: 'Do you feel that your life is empty?' },
  { id: 'q4',  number: '4',  scoringAnswer: 'yes',
    prompt: 'Do you often get bored?' },
  { id: 'q5',  number: '5',  scoringAnswer: 'no',
    prompt: 'Are you in good spirits most of the time?' },
  { id: 'q6',  number: '6',  scoringAnswer: 'yes',
    prompt: 'Are you afraid that something bad is going to happen to you?' },
  { id: 'q7',  number: '7',  scoringAnswer: 'no',
    prompt: 'Do you feel happy most of the time?' },
  { id: 'q8',  number: '8',  scoringAnswer: 'yes',
    prompt: 'Do you often feel helpless?' },
  { id: 'q9',  number: '9',  scoringAnswer: 'yes',
    prompt: 'Do you prefer to stay at home, rather than going out and doing things?' },
  { id: 'q10', number: '10', scoringAnswer: 'yes',
    prompt: 'Do you feel that you have more problems with memory than most?' },
  { id: 'q11', number: '11', scoringAnswer: 'no',
    prompt: 'Do you think it is wonderful to be alive now?' },
  { id: 'q12', number: '12', scoringAnswer: 'yes',
    prompt: 'Do you feel worthless the way you are now?' },
  { id: 'q13', number: '13', scoringAnswer: 'no',
    prompt: 'Do you feel full of energy?' },
  { id: 'q14', number: '14', scoringAnswer: 'yes',
    prompt: 'Do you feel that your situation is hopeless?' },
  { id: 'q15', number: '15', scoringAnswer: 'yes',
    prompt: 'Do you think that most people are better off than you are?' },
]

export const GDS_MAX_TOTAL = GDS_QUESTIONS.length  // 15

export type GDSAnswers = Record<string, GDSAnswer>

export type GDSBand = 'normal' | 'mild' | 'moderate' | 'severe'

export interface GDSResult {
  total: number
  maxTotal: number
  band: GDSBand
  bandLabel: string
  interpretation: string
  depressionLikely: boolean
  answeredCount: number
  totalQuestions: number
}

export function calculateGDS(answers: GDSAnswers): GDSResult {
  const total = GDS_QUESTIONS.reduce((sum, q) => {
    return sum + (answers[q.id] === q.scoringAnswer ? 1 : 0)
  }, 0)

  const answeredCount = GDS_QUESTIONS.filter(q => answers[q.id] !== undefined).length

  let band: GDSBand
  let bandLabel: string
  let interpretation: string

  if (total <= 4) {
    band = 'normal'
    bandLabel = 'Normal'
    interpretation = 'Score within normal range. No depression suggested.'
  } else if (total <= 8) {
    band = 'mild'
    bandLabel = 'Mild depression'
    interpretation = 'Score suggests mild depression. Monitor and consider follow-up.'
  } else if (total <= 11) {
    band = 'moderate'
    bandLabel = 'Moderate depression'
    interpretation = 'Score suggests moderate depression. Clinical evaluation recommended.'
  } else {
    band = 'severe'
    bandLabel = 'Severe depression'
    interpretation = 'Score suggests severe depression. Prompt clinical assessment and treatment.'
  }

  return {
    total,
    maxTotal: GDS_MAX_TOTAL,
    band,
    bandLabel,
    interpretation,
    depressionLikely: total >= 5,
    answeredCount,
    totalQuestions: GDS_QUESTIONS.length,
  }
}
