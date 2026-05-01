// Mini Nutritional Assessment (MNA®)
//
// Guigoz Y, Vellas B, Garry PJ. 1994. Mini Nutritional Assessment: A practical
// assessment tool for grading the nutritional state of elderly patients.
// © Société des Produits Nestlé SA 1994, Revision 2009.
//
// Two-phase structure:
//   SCREENING  (items A–F, max 14 pts)
//     12–14 = Normal nutritional status
//      8–11 = At risk of malnutrition
//      0–7  = Malnourished
//   If screening ≤ 11, continue to ASSESSMENT (items G–R, max 16 pts)
//
//   TOTAL (max 30 pts):
//     24–30   = Normal nutritional status
//     17–23.5 = At risk of malnutrition
//     < 17    = Malnourished
//
// Some items use 0.5-step decimal scores (K, M, P, Q).
// Item K is computed from 3 yes/no sub-checkboxes.

export type MNASection = 'screening' | 'assessment'

export type MNAInputType =
  | 'options'          // standard option list
  | 'protein_markers'  // item K — 3 yes/no checkboxes → computed 0/0.5/1

export interface MNAOption {
  value: number
  label: string
}

export interface MNAQuestion {
  id: string
  letter: string
  section: MNASection
  prompt: string
  helpText?: string
  inputType: MNAInputType
  options?: MNAOption[]
}

export const MNA_SECTION_META: Record<MNASection, { name: string; emoji: string; maxScore: number }> = {
  screening:  { name: 'Screening (items A–F)',   emoji: '🔍', maxScore: 14 },
  assessment: { name: 'Assessment (items G–R)',  emoji: '📋', maxScore: 16 },
}

export const MNA_QUESTIONS: MNAQuestion[] = [
  // ── Screening ──────────────────────────────────────────────
  { id: 'a', letter: 'A', section: 'screening', inputType: 'options',
    prompt: 'Has food intake declined over the past 3 months due to loss of appetite, digestive problems, chewing or swallowing difficulties?',
    options: [
      { value: 0, label: '0 — Severe decrease in food intake' },
      { value: 1, label: '1 — Moderate decrease in food intake' },
      { value: 2, label: '2 — No decrease in food intake' },
    ] },
  { id: 'b', letter: 'B', section: 'screening', inputType: 'options',
    prompt: 'Weight loss during the last 3 months',
    options: [
      { value: 0, label: '0 — Weight loss greater than 3 kg (6.6 lbs)' },
      { value: 1, label: '1 — Does not know' },
      { value: 2, label: '2 — Weight loss between 1 and 3 kg (2.2–6.6 lbs)' },
      { value: 3, label: '3 — No weight loss' },
    ] },
  { id: 'c', letter: 'C', section: 'screening', inputType: 'options',
    prompt: 'Mobility',
    options: [
      { value: 0, label: '0 — Bed or chair bound' },
      { value: 1, label: '1 — Able to get out of bed / chair but does not go out' },
      { value: 2, label: '2 — Goes out' },
    ] },
  { id: 'd', letter: 'D', section: 'screening', inputType: 'options',
    prompt: 'Has suffered psychological stress or acute disease in the past 3 months?',
    options: [
      { value: 0, label: '0 — Yes' },
      { value: 2, label: '2 — No' },
    ] },
  { id: 'e', letter: 'E', section: 'screening', inputType: 'options',
    prompt: 'Neuropsychological problems',
    options: [
      { value: 0, label: '0 — Severe dementia or depression' },
      { value: 1, label: '1 — Mild dementia' },
      { value: 2, label: '2 — No psychological problems' },
    ] },
  { id: 'f', letter: 'F', section: 'screening', inputType: 'options',
    prompt: 'Body Mass Index (BMI) = weight in kg / (height in m)²',
    options: [
      { value: 0, label: '0 — BMI less than 19' },
      { value: 1, label: '1 — BMI 19 to less than 21' },
      { value: 2, label: '2 — BMI 21 to less than 23' },
      { value: 3, label: '3 — BMI 23 or greater' },
    ] },

  // ── Assessment ─────────────────────────────────────────────
  { id: 'g', letter: 'G', section: 'assessment', inputType: 'options',
    prompt: 'Lives independently (not in nursing home or hospital)',
    options: [
      { value: 0, label: '0 — No' },
      { value: 1, label: '1 — Yes' },
    ] },
  { id: 'h', letter: 'H', section: 'assessment', inputType: 'options',
    prompt: 'Takes more than 3 prescription drugs per day',
    options: [
      { value: 0, label: '0 — Yes' },
      { value: 1, label: '1 — No' },
    ] },
  { id: 'i', letter: 'I', section: 'assessment', inputType: 'options',
    prompt: 'Pressure sores or skin ulcers',
    options: [
      { value: 0, label: '0 — Yes' },
      { value: 1, label: '1 — No' },
    ] },
  { id: 'j', letter: 'J', section: 'assessment', inputType: 'options',
    prompt: 'How many full meals does the patient eat daily?',
    options: [
      { value: 0, label: '0 — 1 meal' },
      { value: 1, label: '1 — 2 meals' },
      { value: 2, label: '2 — 3 meals' },
    ] },
  { id: 'k', letter: 'K', section: 'assessment', inputType: 'protein_markers',
    prompt: 'Selected consumption markers for protein intake',
    helpText: 'Check each that applies. Score = 0.0 (0-1 yes) · 0.5 (2 yes) · 1.0 (3 yes).' },
  { id: 'l', letter: 'L', section: 'assessment', inputType: 'options',
    prompt: 'Consumes two or more servings of fruit or vegetables per day?',
    options: [
      { value: 0, label: '0 — No' },
      { value: 1, label: '1 — Yes' },
    ] },
  { id: 'm', letter: 'M', section: 'assessment', inputType: 'options',
    prompt: 'How much fluid (water, juice, coffee, tea, milk…) is consumed per day?',
    options: [
      { value: 0.0, label: '0.0 — Less than 3 cups' },
      { value: 0.5, label: '0.5 — 3 to 5 cups' },
      { value: 1.0, label: '1.0 — More than 5 cups' },
    ] },
  { id: 'n', letter: 'N', section: 'assessment', inputType: 'options',
    prompt: 'Mode of feeding',
    options: [
      { value: 0, label: '0 — Unable to eat without assistance' },
      { value: 1, label: '1 — Self-fed with some difficulty' },
      { value: 2, label: '2 — Self-fed without any problem' },
    ] },
  { id: 'o', letter: 'O', section: 'assessment', inputType: 'options',
    prompt: 'Self view of nutritional status',
    options: [
      { value: 0, label: '0 — Views self as being malnourished' },
      { value: 1, label: '1 — Is uncertain of nutritional state' },
      { value: 2, label: '2 — Views self as having no nutritional problem' },
    ] },
  { id: 'p', letter: 'P', section: 'assessment', inputType: 'options',
    prompt: 'In comparison with other people of the same age, how does the patient consider his/her health status?',
    options: [
      { value: 0.0, label: '0.0 — Not as good' },
      { value: 0.5, label: '0.5 — Does not know' },
      { value: 1.0, label: '1.0 — As good' },
      { value: 2.0, label: '2.0 — Better' },
    ] },
  { id: 'q', letter: 'Q', section: 'assessment', inputType: 'options',
    prompt: 'Mid-arm circumference (MAC) in cm',
    options: [
      { value: 0.0, label: '0.0 — MAC less than 21' },
      { value: 0.5, label: '0.5 — MAC 21 to 22' },
      { value: 1.0, label: '1.0 — MAC greater than 22' },
    ] },
  { id: 'r', letter: 'R', section: 'assessment', inputType: 'options',
    prompt: 'Calf circumference (CC) in cm',
    options: [
      { value: 0, label: '0 — CC less than 31' },
      { value: 1, label: '1 — CC 31 or greater' },
    ] },
]

// Protein sub-markers for item K
export interface ProteinMarkers {
  dairy: boolean      // dairy products daily
  legumes: boolean    // legumes/eggs ≥ 2×/week
  meat: boolean       // meat/fish/poultry daily
}

/** Compute item-K score from the three sub-marker checkboxes. */
export function computeProteinScore(markers: Partial<ProteinMarkers>): number {
  const count = [markers.dairy, markers.legumes, markers.meat].filter(Boolean).length
  if (count >= 3) return 1.0
  if (count === 2) return 0.5
  return 0.0
}

export type MNAAnswers = Record<string, number>   // keyed by question id (a–r)
export type MNAProteinAnswers = Partial<ProteinMarkers>

export type MNABand = 'normal' | 'at_risk' | 'malnourished'

export interface MNAResult {
  screeningScore: number
  assessmentScore: number
  total: number
  screeningMax: 14
  assessmentMax: 16
  totalMax: 30
  screeningBand: MNABand
  totalBand: MNABand | null   // null when assessment not completed
  bandLabel: string
  interpretation: string
  screeningComplete: boolean
  assessmentNeeded: boolean   // screening ≤ 11
  answeredCount: number
  totalQuestions: number
}

const SCREENING_IDS = MNA_QUESTIONS.filter(q => q.section === 'screening').map(q => q.id)
const ASSESSMENT_IDS = MNA_QUESTIONS.filter(q => q.section === 'assessment').map(q => q.id)

function bandFromScreening(score: number): MNABand {
  if (score >= 12) return 'normal'
  if (score >= 8)  return 'at_risk'
  return 'malnourished'
}

function bandFromTotal(score: number): MNABand {
  if (score >= 24)  return 'normal'
  if (score >= 17)  return 'at_risk'
  return 'malnourished'
}

const BAND_LABELS: Record<MNABand, string> = {
  normal:       'Normal nutritional status',
  at_risk:      'At risk of malnutrition',
  malnourished: 'Malnourished',
}

export function calculateMNA(answers: MNAAnswers): MNAResult {
  const screeningScore = SCREENING_IDS.reduce((s, id) => s + (answers[id] ?? 0), 0)
  const assessmentScore = ASSESSMENT_IDS.reduce((s, id) => s + (answers[id] ?? 0), 0)
  const total = screeningScore + assessmentScore

  const screeningComplete = SCREENING_IDS.every(id => answers[id] !== undefined)
  const assessmentNeeded = screeningScore <= 11
  const assessmentComplete = ASSESSMENT_IDS.every(id => answers[id] !== undefined)

  const screeningBand = bandFromScreening(screeningScore)
  const totalBand = (assessmentNeeded && assessmentComplete) || (!assessmentNeeded)
    ? bandFromTotal(total)
    : null

  const activeBand = totalBand ?? screeningBand
  const bandLabel = BAND_LABELS[activeBand]
  const interpretation = totalBand !== null
    ? `Total score ${total}/30 — ${bandLabel}.`
    : screeningComplete
      ? `Screening score ${screeningScore}/14 — ${bandLabel}. ${assessmentNeeded ? 'Continue to Assessment section.' : ''}`
      : 'Complete screening items A–F first.'

  const answeredCount = MNA_QUESTIONS.filter(q => answers[q.id] !== undefined).length

  return {
    screeningScore,
    assessmentScore,
    total,
    screeningMax: 14,
    assessmentMax: 16,
    totalMax: 30,
    screeningBand,
    totalBand,
    bandLabel,
    interpretation,
    screeningComplete,
    assessmentNeeded,
    answeredCount,
    totalQuestions: MNA_QUESTIONS.length,
  }
}
