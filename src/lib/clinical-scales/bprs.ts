// Brief Psychiatric Rating Scale (BPRS)
//
// Overall, 24 symptom constructs each rated on a 7-point severity scale.
// If a specific symptom cannot be assessed, mark "NA" (not assessed).
//
// Scale:
//   1 = Not present
//   2 = Very mild
//   3 = Mild
//   4 = Moderate
//   5 = Moderately severe
//   6 = Severe
//   7 = Extremely severe
//
// Total = sum of all rated (non-NA) items.
// Maximum possible score = 168 (24 × 7).
// Minimum when all rated   = 24 (24 × 1).
//
// Severity bands (commonly cited):
//   24–40  Mild to moderate
//   41–52  Moderate to severe
//   53+    Severe

export interface BPRSItem {
  id: string
  number: number
  label: string
}

export const BPRS_ITEMS: BPRSItem[] = [
  { id: 'somatic_concern',          number: 1,  label: 'Somatic concern' },
  { id: 'anxiety',                  number: 2,  label: 'Anxiety' },
  { id: 'depression',               number: 3,  label: 'Depression' },
  { id: 'suicidality',              number: 4,  label: 'Suicidality' },
  { id: 'guilt',                    number: 5,  label: 'Guilt' },
  { id: 'hostility',                number: 6,  label: 'Hostility' },
  { id: 'elated_mood',              number: 7,  label: 'Elated mood' },
  { id: 'grandiosity',              number: 8,  label: 'Grandiosity' },
  { id: 'suspiciousness',           number: 9,  label: 'Suspiciousness' },
  { id: 'hallucinations',           number: 10, label: 'Hallucinations' },
  { id: 'unusual_thought_content',  number: 11, label: 'Unusual thought content' },
  { id: 'bizarre_behaviour',        number: 12, label: 'Bizarre behaviour' },
  { id: 'self_neglect',             number: 13, label: 'Self-neglect' },
  { id: 'disorientation',           number: 14, label: 'Disorientation' },
  { id: 'conceptual_disorganisation', number: 15, label: 'Conceptual disorganisation' },
  { id: 'blunted_affect',           number: 16, label: 'Blunted affect' },
  { id: 'emotional_withdrawal',     number: 17, label: 'Emotional withdrawal' },
  { id: 'motor_retardation',        number: 18, label: 'Motor retardation' },
  { id: 'tension',                  number: 19, label: 'Tension' },
  { id: 'uncooperativeness',        number: 20, label: 'Uncooperativeness' },
  { id: 'excitement',               number: 21, label: 'Excitement' },
  { id: 'distractibility',          number: 22, label: 'Distractibility' },
  { id: 'motor_hyperactivity',      number: 23, label: 'Motor hyperactivity' },
  { id: 'mannerisms_posturing',     number: 24, label: 'Mannerisms and posturing' },
]

export const BPRS_SCORE_LABELS: Record<number, string> = {
  1: 'Not present',
  2: 'Very mild',
  3: 'Mild',
  4: 'Moderate',
  5: 'Moderately severe',
  6: 'Severe',
  7: 'Extremely severe',
}

export const BPRS_SCORE_VALUES = [1, 2, 3, 4, 5, 6, 7] as const

/** Each answer is 1-7 or 'na'. */
export type BPRSAnswerValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'na'
export type BPRSAnswers = Record<string, BPRSAnswerValue>

export type BPRSBand = 'mild_moderate' | 'moderate_severe' | 'severe'

export interface BPRSResult {
  total: number
  ratedCount: number    // items with a numeric score (not NA)
  naCount: number       // items marked NA
  maxTotal: number      // ratedCount × 7
  band: BPRSBand | null // null when fewer than 24 items are rated
  bandLabel: string
  interpretation: string
  answeredCount: number  // items where any response (including NA) was given
  totalQuestions: number
}

export function calculateBPRS(answers: BPRSAnswers): BPRSResult {
  let total = 0
  let ratedCount = 0
  let naCount = 0
  let answeredCount = 0

  for (const item of BPRS_ITEMS) {
    const v = answers[item.id]
    if (v === undefined) continue
    answeredCount++
    if (v === 'na') {
      naCount++
    } else {
      total += v
      ratedCount++
    }
  }

  const maxTotal = ratedCount * 7

  let band: BPRSBand | null = null
  let bandLabel = 'Incomplete'
  let interpretation = 'Rate all items to obtain a complete score.'

  if (ratedCount > 0) {
    if (total <= 40) {
      band = 'mild_moderate'
      bandLabel = 'Mild to moderate'
      interpretation = 'Symptoms are in the mild to moderate range.'
    } else if (total <= 52) {
      band = 'moderate_severe'
      bandLabel = 'Moderate to severe'
      interpretation = 'Symptoms are in the moderate to severe range. Clinical review recommended.'
    } else {
      band = 'severe'
      bandLabel = 'Severe'
      interpretation = 'Symptoms are severe. Immediate clinical assessment required.'
    }
  }

  return {
    total,
    ratedCount,
    naCount,
    maxTotal,
    band,
    bandLabel,
    interpretation,
    answeredCount,
    totalQuestions: BPRS_ITEMS.length,
  }
}
