// Montreal Cognitive Assessment (MoCA) — Version 8.3 English
//
// 30-point cognitive screen used as an alternative to HMSE for literate /
// urban-elderly populations. Items follow the canonical MoCA v8.3 form:
//
//   Visuospatial / Executive  /5
//   Naming                    /3
//   Memory (registration)     not scored
//   Attention                 /6
//   Language                  /3
//   Abstraction               /2
//   Delayed Recall            /5
//   Orientation               /6
//                            ───
//   Total                    /30
//
// Education adjustment: +1 point if the subject had ≤12 years of formal
// education (capped at 30). Cutoff for normal cognition is ≥26/30.

export type MoCASection =
  | 'visuospatial_executive'
  | 'naming'
  | 'memory_registration'
  | 'attention'
  | 'language'
  | 'abstraction'
  | 'delayed_recall'
  | 'orientation'

/** Visual figure rendered next to a question (resolved by the dialog). */
export type MoCAFigureKey =
  | 'trail'
  | 'bed'
  | 'clock'
  | 'animal-horse'
  | 'animal-tiger'
  | 'animal-duck'

export interface MoCAQuestion {
  id: string
  /** Question label as printed on the form (e.g. "1", "Clock — Contour"). */
  number: string
  section: MoCASection
  prompt: string
  /** Hint shown beneath the prompt. */
  helpText?: string
  /** Maximum points. Score input is a 0…maxScore picker. */
  maxScore: number
  /** Optional per-value labels (length = maxScore + 1). */
  scoreLabels?: string[]
  /** Memory registration trials are administered but not added to the /30 total. */
  notIncludedInTotal?: boolean
  /** Visual figure to display alongside the prompt (e.g. trail, bed, animals). */
  figure?: MoCAFigureKey
}

export const MOCA_SECTION_META: Record<MoCASection, { name: string; emoji: string }> = {
  visuospatial_executive: { name: 'Visuospatial / Executive', emoji: '🧩' },
  naming:                 { name: 'Naming',                   emoji: '🐾' },
  memory_registration:    { name: 'Memory (Registration)',    emoji: '📝' },
  attention:              { name: 'Attention',                emoji: '🎯' },
  language:               { name: 'Language',                 emoji: '💬' },
  abstraction:            { name: 'Abstraction',              emoji: '🔗' },
  delayed_recall:         { name: 'Delayed Recall',           emoji: '🧠' },
  orientation:            { name: 'Orientation',              emoji: '🧭' },
}

export const MOCA_QUESTIONS: MoCAQuestion[] = [
  // Visuospatial / Executive (max 5)
  { id: 'trail', number: 'VE.1', section: 'visuospatial_executive',
    prompt: 'Trail Making — connect alternating numbers and letters (1→A→2→B→3→C→4→D→5→E).',
    helpText: '1 point if completed correctly without crossing lines.',
    maxScore: 1, figure: 'trail' },
  { id: 'copy_bed', number: 'VE.2', section: 'visuospatial_executive',
    prompt: 'Copy bed — reproduce the three-dimensional figure exactly as shown.',
    helpText: '1 point if all lines drawn correctly with proper depth.',
    maxScore: 1, figure: 'bed' },
  { id: 'clock_contour', number: 'VE.3', section: 'visuospatial_executive',
    prompt: 'Clock drawing (Five past ten) — Contour.',
    helpText: 'Closed circle, only minor distortion acceptable.',
    maxScore: 1, figure: 'clock' },
  { id: 'clock_numbers', number: 'VE.4', section: 'visuospatial_executive',
    prompt: 'Clock drawing — Numbers.',
    helpText: 'All 12 numbers present, in correct order and approximate quadrants.', maxScore: 1 },
  { id: 'clock_hands', number: 'VE.5', section: 'visuospatial_executive',
    prompt: 'Clock drawing — Hands.',
    helpText: 'Two hands jointly indicate "five past ten" (11 and 2).', maxScore: 1 },

  // Naming (max 3)
  { id: 'name_1', number: 'N.1', section: 'naming',
    prompt: 'Name the first animal (horse).',
    helpText: '1 point for correct name.',
    maxScore: 1, figure: 'animal-horse' },
  { id: 'name_2', number: 'N.2', section: 'naming',
    prompt: 'Name the second animal (tiger).',
    helpText: '1 point for correct name.',
    maxScore: 1, figure: 'animal-tiger' },
  { id: 'name_3', number: 'N.3', section: 'naming',
    prompt: 'Name the third animal (duck).',
    helpText: '1 point for correct name.',
    maxScore: 1, figure: 'animal-duck' },

  // Memory — registration (NOT scored)
  { id: 'mem_trial_1', number: 'M.T1', section: 'memory_registration',
    prompt: 'Read the 5 words once at 1 word/sec — LEG, COTTON, SCHOOL, TOMATO, WHITE. Subject repeats them (1st trial).',
    helpText: 'Record number of words correctly repeated. Not added to total.',
    maxScore: 5,
    scoreLabels: ['0 of 5', '1 of 5', '2 of 5', '3 of 5', '4 of 5', '5 of 5'],
    notIncludedInTotal: true },
  { id: 'mem_trial_2', number: 'M.T2', section: 'memory_registration',
    prompt: 'Repeat the same 5 words a second time. Subject repeats them (2nd trial).',
    helpText: 'Do both trials even if 1st was perfect. Not added to total.',
    maxScore: 5,
    scoreLabels: ['0 of 5', '1 of 5', '2 of 5', '3 of 5', '4 of 5', '5 of 5'],
    notIncludedInTotal: true },

  // Attention (max 6)
  { id: 'attn_fwd', number: 'A.1', section: 'attention',
    prompt: 'Forward digit span — read 5 digits at 1/sec; subject repeats in same order: 2 4 8 1 5.',
    helpText: '1 point if entire sequence repeated correctly.', maxScore: 1 },
  { id: 'attn_bwd', number: 'A.2', section: 'attention',
    prompt: 'Backward digit span — read 3 digits; subject repeats in reverse order: 4 2 7.',
    helpText: '1 point if reversed correctly (i.e. 7 2 4).', maxScore: 1 },
  { id: 'attn_tap', number: 'A.3', section: 'attention',
    prompt: 'Vigilance — read the letter list and have the subject tap on every letter "A". (FBACMNAAJKLBAFAKDEAAAJAMOFAAB)',
    helpText: '1 point if ≤1 error (omission or false tap).', maxScore: 1 },
  { id: 'attn_serial7', number: 'A.4', section: 'attention',
    prompt: 'Serial 7 subtraction starting at 100. Record values: 93, 86, 79, 72, 65 (5 expected subtractions: 53, 46, 39, 32, 25 — see form).',
    helpText: '4–5 correct = 3 pts · 2–3 correct = 2 pts · 1 correct = 1 pt · 0 correct = 0 pt.',
    maxScore: 3,
    scoreLabels: ['0 — none correct', '1 correct', '2–3 correct', '4–5 correct'] },

  // Language (max 3)
  { id: 'lang_repeat_1', number: 'L.1', section: 'language',
    prompt: 'Repetition — "The child walked his dog in the park after midnight."',
    helpText: '1 point if repeated exactly.', maxScore: 1 },
  { id: 'lang_repeat_2', number: 'L.2', section: 'language',
    prompt: 'Repetition — "The artist finished his painting at the right moment for the exhibition."',
    helpText: '1 point if repeated exactly.', maxScore: 1 },
  { id: 'lang_fluency', number: 'L.3', section: 'language',
    prompt: 'Verbal fluency — name as many words as possible in 1 minute that begin with the letter "B".',
    helpText: '1 point if ≥11 distinct words produced.', maxScore: 1 },

  // Abstraction (max 2)
  { id: 'abstr_1', number: 'AB.1', section: 'abstraction',
    prompt: 'Similarity — "How are a hammer and a screwdriver alike?"',
    helpText: 'Example given first: banana–orange = fruit. 1 point for category answer (e.g. tools).', maxScore: 1 },
  { id: 'abstr_2', number: 'AB.2', section: 'abstraction',
    prompt: 'Similarity — "How are matches and a lamp alike?"',
    helpText: '1 point for category answer (e.g. light sources).', maxScore: 1 },

  // Delayed Recall (max 5)
  { id: 'recall_leg',    number: 'DR.1', section: 'delayed_recall',
    prompt: 'Delayed recall — LEG (no cue).',
    helpText: '1 point if recalled spontaneously without any cue.', maxScore: 1 },
  { id: 'recall_cotton', number: 'DR.2', section: 'delayed_recall',
    prompt: 'Delayed recall — COTTON (no cue).',
    helpText: '1 point if recalled spontaneously without any cue.', maxScore: 1 },
  { id: 'recall_school', number: 'DR.3', section: 'delayed_recall',
    prompt: 'Delayed recall — SCHOOL (no cue).',
    helpText: '1 point if recalled spontaneously without any cue.', maxScore: 1 },
  { id: 'recall_tomato', number: 'DR.4', section: 'delayed_recall',
    prompt: 'Delayed recall — TOMATO (no cue).',
    helpText: '1 point if recalled spontaneously without any cue.', maxScore: 1 },
  { id: 'recall_white',  number: 'DR.5', section: 'delayed_recall',
    prompt: 'Delayed recall — WHITE (no cue).',
    helpText: '1 point if recalled spontaneously without any cue.', maxScore: 1 },

  // Orientation (max 6)
  { id: 'ori_date',  number: 'O.1', section: 'orientation', prompt: 'Date — "What is the date today?"',  maxScore: 1 },
  { id: 'ori_month', number: 'O.2', section: 'orientation', prompt: 'Month — "What month are we in?"',     maxScore: 1 },
  { id: 'ori_year',  number: 'O.3', section: 'orientation', prompt: 'Year — "What year is it?"',          maxScore: 1 },
  { id: 'ori_day',   number: 'O.4', section: 'orientation', prompt: 'Day of the week — "What day of the week is it?"', maxScore: 1 },
  { id: 'ori_place', number: 'O.5', section: 'orientation', prompt: 'Place — "What is the name of this place (clinic / hospital / building)?"', maxScore: 1 },
  { id: 'ori_city',  number: 'O.6', section: 'orientation', prompt: 'City — "Which city are we in?"',     maxScore: 1 },
]

export const MOCA_MAX_TOTAL = 30

export type MoCAAnswers = Record<string, number>

export interface MoCAResult {
  /** Sum of scored items, before education adjustment. */
  baseTotal: number
  /** +1 if ≤12 years of education (capped so total ≤ 30). */
  educationBonus: 0 | 1
  /** Final adjusted total = min(baseTotal + educationBonus, 30). */
  total: number
  maxTotal: number
  band: 'normal' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment'
  bandLabel: string
  interpretation: string
  answeredCount: number
  totalQuestions: number
}

/**
 * MoCA total = sum of scored items + education bonus (capped at 30).
 * Memory registration trials are excluded from the total per the source form.
 */
export function calculateMoCA(answers: MoCAAnswers, lowEducation: boolean = false): MoCAResult {
  const scored = MOCA_QUESTIONS.filter(q => !q.notIncludedInTotal)
  const baseTotal = scored.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0)
  const educationBonus: 0 | 1 = lowEducation ? 1 : 0
  const total = Math.min(MOCA_MAX_TOTAL, baseTotal + educationBonus)
  const answeredCount = MOCA_QUESTIONS.filter(q => answers[q.id] !== undefined).length

  let band: MoCAResult['band']
  let bandLabel: string
  let interpretation: string

  if (total >= 26) {
    band = 'normal'
    bandLabel = 'Normal cognition'
    interpretation = 'Score is within the normal range. No cognitive impairment indicated by MoCA.'
  } else if (total >= 18) {
    band = 'mild_impairment'
    bandLabel = 'Mild cognitive impairment'
    interpretation = 'Score suggests mild cognitive impairment. Recommend clinical correlation and further evaluation.'
  } else if (total >= 10) {
    band = 'moderate_impairment'
    bandLabel = 'Moderate cognitive impairment'
    interpretation = 'Score suggests moderate cognitive impairment. Recommend specialist evaluation.'
  } else {
    band = 'severe_impairment'
    bandLabel = 'Severe cognitive impairment'
    interpretation = 'Score suggests severe cognitive impairment. Refer for specialist evaluation (neurology / psychiatry / memory clinic).'
  }

  return {
    baseTotal,
    educationBonus,
    total,
    maxTotal: MOCA_MAX_TOTAL,
    band,
    bandLabel,
    interpretation,
    answeredCount,
    totalQuestions: MOCA_QUESTIONS.length,
  }
}

/** Group questions by section, preserving the canonical order. */
export function groupMoCAQuestions(): { section: MoCASection; questions: MoCAQuestion[] }[] {
  const groups = new Map<MoCASection, MoCAQuestion[]>()
  for (const q of MOCA_QUESTIONS) {
    const arr = groups.get(q.section) ?? []
    arr.push(q)
    groups.set(q.section, arr)
  }
  return Array.from(groups.entries()).map(([section, questions]) => ({ section, questions }))
}
