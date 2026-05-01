// Patient Health Questionnaire-9 (PHQ-9)
//
// Spitzer RL, Williams JBW, Kroenke K et al. Pfizer Inc.
// Self-report 9-item depression severity screen + 1 functional impairment item.
//
// Each of the 9 symptom items is scored 0–3:
//   0 = Not at all
//   1 = Several days
//   2 = More than half the days
//   3 = Nearly every day
//
// Total /27. Standard severity bands:
//   0–4   None / minimal
//   5–9   Mild
//   10–14 Moderate
//   15–19 Moderately severe
//   20–27 Severe
//
// The functional-impairment item ("how difficult have these problems made it
// for you...") is administered but not added to the /27 symptom total.
//
// Item 9 (self-harm / suicidality) is flagged separately whenever it is ≥ 1.

export type PHQ9Section = 'symptoms' | 'functional_impairment'

export interface PHQ9Question {
  id: string
  /** Item label as printed on the form (e.g. "1", "Functional"). */
  number: string
  section: PHQ9Section
  prompt: string
  /** Optional additional context shown beneath the prompt. */
  helpText?: string
  /** Maximum points. PHQ-9 items are all 0–3. */
  maxScore: number
  /** Per-value labels (length = maxScore + 1). */
  scoreLabels: string[]
  /** Functional-impairment item is not added to the /27 total. */
  notIncludedInTotal?: boolean
  /** Item 9 — flagged separately for suicidality risk. */
  isSuicidality?: boolean
}

export const PHQ9_SECTION_META: Record<PHQ9Section, { name: string; emoji: string }> = {
  symptoms:               { name: 'Depression Symptoms (last 2 weeks)', emoji: '🩺' },
  functional_impairment:  { name: 'Functional Impairment',              emoji: '🧭' },
}

const SYMPTOM_LABELS = [
  'Not at all',
  'Several days',
  'More than half the days',
  'Nearly every day',
]

const FUNCTIONAL_LABELS = [
  'Not difficult at all',
  'Somewhat difficult',
  'Very difficult',
  'Extremely difficult',
]

export const PHQ9_QUESTIONS: PHQ9Question[] = [
  // Core 9 items (sum to /27)
  { id: 'q1', number: '1', section: 'symptoms', maxScore: 3, scoreLabels: SYMPTOM_LABELS,
    prompt: 'Little interest or pleasure in doing things' },
  { id: 'q2', number: '2', section: 'symptoms', maxScore: 3, scoreLabels: SYMPTOM_LABELS,
    prompt: 'Feeling down, depressed, or hopeless' },
  { id: 'q3', number: '3', section: 'symptoms', maxScore: 3, scoreLabels: SYMPTOM_LABELS,
    prompt: 'Trouble falling or staying asleep, or sleeping too much' },
  { id: 'q4', number: '4', section: 'symptoms', maxScore: 3, scoreLabels: SYMPTOM_LABELS,
    prompt: 'Feeling tired or having little energy' },
  { id: 'q5', number: '5', section: 'symptoms', maxScore: 3, scoreLabels: SYMPTOM_LABELS,
    prompt: 'Poor appetite or overeating' },
  { id: 'q6', number: '6', section: 'symptoms', maxScore: 3, scoreLabels: SYMPTOM_LABELS,
    prompt: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down' },
  { id: 'q7', number: '7', section: 'symptoms', maxScore: 3, scoreLabels: SYMPTOM_LABELS,
    prompt: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
  { id: 'q8', number: '8', section: 'symptoms', maxScore: 3, scoreLabels: SYMPTOM_LABELS,
    prompt: 'Moving or speaking so slowly that other people could have noticed — or the opposite, being so fidgety or restless that you have been moving around a lot more than usual' },
  { id: 'q9', number: '9', section: 'symptoms', maxScore: 3, scoreLabels: SYMPTOM_LABELS,
    prompt: 'Thoughts that you would be better off dead or of hurting yourself in some way',
    helpText: 'Any positive response (≥1) is a clinical alert — assess suicide risk immediately.',
    isSuicidality: true },

  // Functional impairment — not scored toward /27 total
  { id: 'functional', number: 'F', section: 'functional_impairment',
    maxScore: 3, scoreLabels: FUNCTIONAL_LABELS,
    notIncludedInTotal: true,
    prompt: 'If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?',
    helpText: 'Recorded for clinical context. Not added to the PHQ-9 total.' },
]

export const PHQ9_MAX_TOTAL = PHQ9_QUESTIONS
  .filter(q => !q.notIncludedInTotal)
  .reduce((sum, q) => sum + q.maxScore, 0)

export type PHQ9Answers = Record<string, number>

export type PHQ9Band =
  | 'minimal'
  | 'mild'
  | 'moderate'
  | 'moderately_severe'
  | 'severe'

export interface PHQ9Result {
  total: number
  maxTotal: number
  band: PHQ9Band
  bandLabel: string
  interpretation: string
  /** Q9 score — present whenever rated. */
  suicidalityScore?: number
  /** True iff Q9 ≥ 1 — clinical alert for self-harm risk. */
  suicidalityFlag: boolean
  /** Provisional DSM-aligned classification per the PHQ-9 scoring guide. */
  provisionalDiagnosis: 'major_depression' | 'other_depression' | 'none'
  answeredCount: number
  totalQuestions: number
}

const SYMPTOM_QUESTIONS = PHQ9_QUESTIONS.filter(q => !q.notIncludedInTotal)

/**
 * PHQ-9 total = sum of the 9 symptom items.
 * Functional impairment item is excluded from the total per the source form.
 */
export function calculatePHQ9(answers: PHQ9Answers): PHQ9Result {
  const total = SYMPTOM_QUESTIONS.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0)
  const answeredCount = PHQ9_QUESTIONS.filter(q => answers[q.id] !== undefined).length

  let band: PHQ9Band
  let bandLabel: string
  let interpretation: string

  if (total <= 4) {
    band = 'minimal'
    bandLabel = 'None / minimal'
    interpretation = 'Symptoms are minimal. Monitoring and reassurance may be sufficient.'
  } else if (total <= 9) {
    band = 'mild'
    bandLabel = 'Mild depression'
    interpretation = 'Mild depression. Watchful waiting; repeat PHQ-9 at follow-up.'
  } else if (total <= 14) {
    band = 'moderate'
    bandLabel = 'Moderate depression'
    interpretation = 'Moderate depression. Consider counselling, follow-up, and/or pharmacotherapy.'
  } else if (total <= 19) {
    band = 'moderately_severe'
    bandLabel = 'Moderately severe depression'
    interpretation = 'Moderately severe depression. Active treatment with pharmacotherapy and/or psychotherapy is recommended.'
  } else {
    band = 'severe'
    bandLabel = 'Severe depression'
    interpretation = 'Severe depression. Immediate initiation of pharmacotherapy and expedited psychiatric referral.'
  }

  // Provisional diagnosis (per the PHQ-9 scoring guide):
  //   Major Depressive Disorder: ≥5 of items 1–9 scored ≥2 (item 9 counts if ≥1),
  //     AND item 1 or item 2 scored ≥2.
  //   Other Depressive Disorder: 2–4 items scored ≥2 (with the same anchor on items 1/2 and item 9).
  const itemThresholdHits = SYMPTOM_QUESTIONS.filter(q => {
    const v = answers[q.id] ?? 0
    return q.id === 'q9' ? v >= 1 : v >= 2
  }).length
  const anchorPresent = (answers.q1 ?? 0) >= 2 || (answers.q2 ?? 0) >= 2

  let provisionalDiagnosis: PHQ9Result['provisionalDiagnosis'] = 'none'
  if (anchorPresent && itemThresholdHits >= 5) provisionalDiagnosis = 'major_depression'
  else if (anchorPresent && itemThresholdHits >= 2) provisionalDiagnosis = 'other_depression'

  const suicidalityScore = answers.q9
  const suicidalityFlag = (suicidalityScore ?? 0) >= 1

  return {
    total,
    maxTotal: PHQ9_MAX_TOTAL,
    band,
    bandLabel,
    interpretation,
    suicidalityScore,
    suicidalityFlag,
    provisionalDiagnosis,
    answeredCount,
    totalQuestions: PHQ9_QUESTIONS.length,
  }
}

/** Group questions by section, preserving the canonical order. */
export function groupPHQ9Questions(): { section: PHQ9Section; questions: PHQ9Question[] }[] {
  const groups = new Map<PHQ9Section, PHQ9Question[]>()
  for (const q of PHQ9_QUESTIONS) {
    const arr = groups.get(q.section) ?? []
    arr.push(q)
    groups.set(q.section, arr)
  }
  return Array.from(groups.entries()).map(([section, questions]) => ({ section, questions }))
}
