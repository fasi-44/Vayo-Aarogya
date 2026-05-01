// Confusion Assessment Method (CAM)
//
// Adapted from Inouye SK et al., Ann Intern Med. 1990;113(12):941-948.
//
// Unlike HMSE/MoCA, CAM is *not* a points-based screen — it is a four-feature
// diagnostic algorithm for delirium. The full questionnaire collects ten
// observations (Q1–Q9 with Q2 split into 2A/2B/2C and Q8 split into 8A/8B);
// only Q1–Q4 are part of the diagnostic algorithm. Q5–Q9 are administered to
// document clinical context (disorientation, memory, perceptual disturbances,
// psychomotor agitation/retardation, sleep-wake disturbance).
//
// Algorithm — delirium is positive when ALL of:
//   Feature 1: Acute Onset AND fluctuating course           (Q1 = yes AND Q2B = yes)
//   Feature 2: Inattention                                  (Q2A = mild OR marked)
//   AND EITHER
//     Feature 3: Disorganized thinking                      (Q3 = yes)
//     Feature 4: Altered level of consciousness             (Q4 ≠ alert)

export type CAMSection =
  | 'acute_onset'
  | 'inattention'
  | 'disorganized_thinking'
  | 'altered_loc'
  | 'context'

/** Standard 4-option response used for most CAM items. */
export type YesNoUncertain = 'yes' | 'no' | 'uncertain' | 'na'

/** Q2A — observed severity of inattention during the interview. */
export type InattentionSeverity = 'absent' | 'mild' | 'marked' | 'uncertain'

/** Q4 — overall rating of level of consciousness. */
export type LOCLevel = 'alert' | 'vigilant' | 'lethargic' | 'stupor' | 'coma' | 'uncertain'

/** Distinguishes the input control to render in the dialog row. */
export type CAMInputType = 'yesno' | 'inattention' | 'loc' | 'text'

export interface CAMQuestion {
  id: keyof CAMAnswers
  /** Item label as printed on the form (e.g. "1", "2A"). */
  number: string
  section: CAMSection
  prompt: string
  helpText?: string
  inputType: CAMInputType
  /** True for Q1–Q4 — items that drive the diagnostic algorithm. */
  algorithmic?: boolean
  /** True for Q2C and Q2B — only meaningful if Q2A indicates inattention is present. */
  conditionalOnInattention?: boolean
}

export const CAM_SECTION_META: Record<CAMSection, { name: string; emoji: string }> = {
  acute_onset:           { name: 'Acute Onset',           emoji: '⚡' },
  inattention:           { name: 'Inattention',           emoji: '🎯' },
  disorganized_thinking: { name: 'Disorganized Thinking', emoji: '🌀' },
  altered_loc:           { name: 'Level of Consciousness', emoji: '👁️' },
  context:               { name: 'Clinical Context',      emoji: '🩺' },
}

export interface CAMAnswers {
  q1_acute_onset?: YesNoUncertain
  q2a_inattention?: InattentionSeverity
  q2b_fluctuates?: YesNoUncertain
  q2c_description?: string
  q3_disorganized?: YesNoUncertain
  q4_loc?: LOCLevel
  q5_disorientation?: YesNoUncertain
  q6_memory?: YesNoUncertain
  q7_perceptual?: YesNoUncertain
  q8a_agitation?: YesNoUncertain
  q8b_retardation?: YesNoUncertain
  q9_sleep_wake?: YesNoUncertain
}

export const CAM_QUESTIONS: CAMQuestion[] = [
  // Feature 1 — Acute Onset
  { id: 'q1_acute_onset', number: '1', section: 'acute_onset', algorithmic: true,
    inputType: 'yesno',
    prompt: 'Is there evidence of an acute change in mental status from the patient’s baseline?',
    helpText: 'Usually obtained from a family member, caregiver, or nurse.' },

  // Feature 2 — Inattention
  { id: 'q2a_inattention', number: '2A', section: 'inattention', algorithmic: true,
    inputType: 'inattention',
    prompt: 'Did the patient have difficulty focusing attention (easily distractible, difficulty keeping track of what was being said)?' },
  { id: 'q2b_fluctuates', number: '2B', section: 'inattention', algorithmic: true,
    conditionalOnInattention: true,
    inputType: 'yesno',
    prompt: 'Did this behavior fluctuate during the interview (come and go, or increase and decrease in severity)?',
    helpText: 'Only applicable if inattention is present (Q2A mild or marked).' },
  { id: 'q2c_description', number: '2C', section: 'inattention',
    conditionalOnInattention: true,
    inputType: 'text',
    prompt: 'Describe the inattentive behavior observed.',
    helpText: 'Free-text observation. Not part of the diagnostic algorithm.' },

  // Feature 3 — Disorganized Thinking
  { id: 'q3_disorganized', number: '3', section: 'disorganized_thinking', algorithmic: true,
    inputType: 'yesno',
    prompt: 'Was the patient’s thinking disorganized or incoherent — rambling or irrelevant conversation, unclear or illogical flow of ideas, or unpredictable switching from subject to subject?' },

  // Feature 4 — Altered Level of Consciousness
  { id: 'q4_loc', number: '4', section: 'altered_loc', algorithmic: true,
    inputType: 'loc',
    prompt: 'Overall, how would you rate this patient’s level of consciousness?' },

  // Clinical context — Q5 through Q9 (not algorithmic)
  { id: 'q5_disorientation', number: '5', section: 'context',
    inputType: 'yesno',
    prompt: 'Was the patient disoriented at any time during the interview (e.g. thinking they were somewhere else, using the wrong bed, misjudging the time of day)?' },
  { id: 'q6_memory', number: '6', section: 'context',
    inputType: 'yesno',
    prompt: 'Did the patient demonstrate any memory problems during the interview (e.g. inability to remember events, difficulty remembering instructions)?' },
  { id: 'q7_perceptual', number: '7', section: 'context',
    inputType: 'yesno',
    prompt: 'Did the patient have any evidence of perceptual disturbances such as hallucinations, illusions, or misinterpretations?' },
  { id: 'q8a_agitation', number: '8A', section: 'context',
    inputType: 'yesno',
    prompt: 'Psychomotor agitation — unusually increased motor activity (restlessness, picking at bedclothes, tapping fingers, frequent sudden position changes)?' },
  { id: 'q8b_retardation', number: '8B', section: 'context',
    inputType: 'yesno',
    prompt: 'Psychomotor retardation — unusually decreased motor activity (sluggishness, staring into space, staying in one position for a long time, moving very slowly)?' },
  { id: 'q9_sleep_wake', number: '9', section: 'context',
    inputType: 'yesno',
    prompt: 'Disturbance of the sleep-wake cycle (excessive daytime sleepiness with insomnia at night)?' },
]

export interface CAMFeatureStatus {
  /** True if the feature is satisfied per the CAM algorithm. */
  present: boolean
  /** True if the inputs needed to evaluate this feature have been provided. */
  evaluable: boolean
  /** Human-readable reason for the present/absent decision. */
  reason: string
}

export interface CAMResult {
  feature1: CAMFeatureStatus  // Acute onset + fluctuating course
  feature2: CAMFeatureStatus  // Inattention
  feature3: CAMFeatureStatus  // Disorganized thinking
  feature4: CAMFeatureStatus  // Altered level of consciousness
  /** True iff F1 AND F2 AND (F3 OR F4) — all evaluable. */
  delirium: boolean
  band: 'positive' | 'negative' | 'incomplete'
  bandLabel: string
  interpretation: string
  /** Number of *positive* features (0–4) — useful as a summary metric. */
  total: number
  maxTotal: 4
  answeredCount: number
  totalQuestions: number
}

/** Total number of questions in the CAM form (excluding the free-text Q2C). */
const COUNTABLE_QUESTIONS = CAM_QUESTIONS.filter(q => q.inputType !== 'text')

function isAnswered(question: CAMQuestion, answers: CAMAnswers): boolean {
  const v = answers[question.id]
  if (v === undefined || v === null) return false
  if (typeof v === 'string' && v.trim() === '') return false
  return true
}

/** Run the CAM diagnostic algorithm against the current answers. */
export function calculateCAM(answers: CAMAnswers): CAMResult {
  const acuteYes = answers.q1_acute_onset === 'yes'
  const acuteNo = answers.q1_acute_onset === 'no'
  const fluctuatesYes = answers.q2b_fluctuates === 'yes'
  const fluctuatesNo = answers.q2b_fluctuates === 'no'

  const inattentionPresent = answers.q2a_inattention === 'mild' || answers.q2a_inattention === 'marked'
  const inattentionAbsent = answers.q2a_inattention === 'absent'

  const disorganizedYes = answers.q3_disorganized === 'yes'
  const disorganizedNo = answers.q3_disorganized === 'no'

  const locKnown = answers.q4_loc !== undefined && answers.q4_loc !== 'uncertain'
  const locAbnormal = locKnown && answers.q4_loc !== 'alert'
  const locAlert = answers.q4_loc === 'alert'

  // Feature 1 — Acute onset AND fluctuating course
  const feature1: CAMFeatureStatus = (() => {
    // If inattention is absent, fluctuation cannot be observed; only Q1 matters.
    if (acuteNo) {
      return { present: false, evaluable: true, reason: 'No acute change in mental status reported.' }
    }
    if (acuteYes && fluctuatesYes) {
      return { present: true, evaluable: true, reason: 'Acute change present and fluctuating course observed.' }
    }
    if (acuteYes && fluctuatesNo) {
      return { present: false, evaluable: true, reason: 'Acute change present but no fluctuation observed.' }
    }
    return { present: false, evaluable: false, reason: 'Acute onset and/or fluctuation not yet rated.' }
  })()

  // Feature 2 — Inattention
  const feature2: CAMFeatureStatus = (() => {
    if (inattentionPresent) {
      return { present: true, evaluable: true, reason: `Inattention observed (${answers.q2a_inattention}).` }
    }
    if (inattentionAbsent) {
      return { present: false, evaluable: true, reason: 'No inattention observed during interview.' }
    }
    return { present: false, evaluable: false, reason: 'Inattention severity not yet rated.' }
  })()

  // Feature 3 — Disorganized thinking
  const feature3: CAMFeatureStatus = (() => {
    if (disorganizedYes) return { present: true, evaluable: true, reason: 'Disorganized or incoherent thinking observed.' }
    if (disorganizedNo) return { present: false, evaluable: true, reason: 'Thinking was organized and coherent.' }
    return { present: false, evaluable: false, reason: 'Thinking organization not yet rated.' }
  })()

  // Feature 4 — Altered LOC
  const feature4: CAMFeatureStatus = (() => {
    if (locAbnormal) return { present: true, evaluable: true, reason: `Level of consciousness rated ${answers.q4_loc}.` }
    if (locAlert) return { present: false, evaluable: true, reason: 'Patient is alert (normal).' }
    return { present: false, evaluable: false, reason: 'Level of consciousness not yet rated.' }
  })()

  const allEvaluable = feature1.evaluable && feature2.evaluable && feature3.evaluable && feature4.evaluable
  const delirium = feature1.present && feature2.present && (feature3.present || feature4.present)

  let band: CAMResult['band']
  let bandLabel: string
  let interpretation: string

  if (!allEvaluable) {
    band = 'incomplete'
    bandLabel = 'Incomplete'
    interpretation = 'Not all algorithm items have been rated. CAM diagnosis cannot be confirmed yet.'
  } else if (delirium) {
    band = 'positive'
    bandLabel = 'Delirium positive'
    interpretation = 'CAM criteria met. Patient screens positive for delirium — clinical correlation required.'
  } else {
    band = 'negative'
    bandLabel = 'Delirium negative'
    interpretation = 'CAM criteria not met. Patient does not screen positive for delirium.'
  }

  const positiveCount = [feature1, feature2, feature3, feature4].filter(f => f.present).length

  const answeredCount = COUNTABLE_QUESTIONS.filter(q => isAnswered(q, answers)).length

  return {
    feature1,
    feature2,
    feature3,
    feature4,
    delirium,
    band,
    bandLabel,
    interpretation,
    total: positiveCount,
    maxTotal: 4,
    answeredCount,
    totalQuestions: COUNTABLE_QUESTIONS.length,
  }
}

/** Group questions by section, preserving the canonical order. */
export function groupCAMQuestions(): { section: CAMSection; questions: CAMQuestion[] }[] {
  const groups = new Map<CAMSection, CAMQuestion[]>()
  for (const q of CAM_QUESTIONS) {
    const arr = groups.get(q.section) ?? []
    arr.push(q)
    groups.set(q.section, arr)
  }
  return Array.from(groups.entries()).map(([section, questions]) => ({ section, questions }))
}

/** Labels for YES/NO/UNCERTAIN/NA inputs. */
export const YESNO_OPTIONS: { value: YesNoUncertain; label: string }[] = [
  { value: 'yes',       label: 'Yes' },
  { value: 'no',        label: 'No' },
  { value: 'uncertain', label: 'Uncertain' },
  { value: 'na',        label: 'N/A' },
]

export const INATTENTION_OPTIONS: { value: InattentionSeverity; label: string }[] = [
  { value: 'absent',    label: 'Not present' },
  { value: 'mild',      label: 'Mild' },
  { value: 'marked',    label: 'Marked' },
  { value: 'uncertain', label: 'Uncertain' },
]

export const LOC_OPTIONS: { value: LOCLevel; label: string; description?: string }[] = [
  { value: 'alert',     label: 'Alert',     description: 'Normal' },
  { value: 'vigilant',  label: 'Vigilant',  description: 'Hyperalert, overly sensitive, easily startled' },
  { value: 'lethargic', label: 'Lethargic', description: 'Drowsy, easily aroused' },
  { value: 'stupor',    label: 'Stupor',    description: 'Difficult to arouse' },
  { value: 'coma',      label: 'Coma',      description: 'Unarousable' },
  { value: 'uncertain', label: 'Uncertain' },
]
