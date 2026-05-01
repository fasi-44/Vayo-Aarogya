// Hindi Mental State Examination (HMSE)
//
// Adapted from the standard 23-item HMSE form. Total score is /31.
// Q22 ("say a line about your house") is administered but excluded from
// the HMSE total per the source form.
//
// Interpretation thresholds use the commonly cited 23/24 cutoff for
// cognitive impairment screening in Indian elderly populations.

export type HMSESection =
  | 'orientation_time'
  | 'orientation_place'
  | 'registration'
  | 'attention'
  | 'recall'
  | 'naming'
  | 'repetition'
  | 'comprehension'
  | 'three_step'
  | 'speech'
  | 'construction'

export interface HMSEQuestion {
  id: string
  /** Question number as printed on the form (e.g. "1", "12.a", "13-15"). */
  number: string
  section: HMSESection
  prompt: string
  promptHindi?: string
  /** Hint shown beside the score input. */
  helpText?: string
  /** Maximum points. Score input is a 0…maxScore picker. */
  maxScore: number
  /** Optional per-value labels (length = maxScore + 1). */
  scoreLabels?: string[]
  /** Q22 only — shown but not added to the /31 total. */
  notIncludedInTotal?: boolean
  /** Q23 only — render a drawing helper hint. */
  isDrawing?: boolean
}

export const HMSE_SECTION_META: Record<HMSESection, { name: string; emoji: string }> = {
  orientation_time:  { name: 'Orientation — Time',  emoji: '🕐' },
  orientation_place: { name: 'Orientation — Place', emoji: '📍' },
  registration:      { name: 'Registration',         emoji: '📝' },
  attention:         { name: 'Attention',            emoji: '🎯' },
  recall:            { name: 'Recall',               emoji: '🧠' },
  naming:            { name: 'Naming',               emoji: '🏷️' },
  repetition:        { name: 'Repetition',           emoji: '🔁' },
  comprehension:     { name: 'Comprehension',        emoji: '👂' },
  three_step:        { name: 'Three-Step Command',   emoji: '✋' },
  speech:            { name: 'Speech',               emoji: '💬' },
  construction:      { name: 'Construction',         emoji: '✏️' },
}

export const HMSE_QUESTIONS: HMSEQuestion[] = [
  // Orientation — Time (5 × 1 = 5)
  { id: 'q1',  number: '1',  section: 'orientation_time',
    prompt: 'Is it morning or afternoon or evening?',
    promptHindi: 'यह सुबह है, दोपहर है या शाम है?', maxScore: 1 },
  { id: 'q2',  number: '2',  section: 'orientation_time',
    prompt: 'What day of the week is today?',
    promptHindi: 'आज सप्ताह का कौनसा दिन है?', maxScore: 1 },
  { id: 'q3',  number: '3',  section: 'orientation_time',
    prompt: 'What date is it today?',
    promptHindi: 'आज कौन सी तारीख है?', maxScore: 1 },
  { id: 'q4',  number: '4',  section: 'orientation_time',
    prompt: 'Which month is today?',
    promptHindi: 'आज कौन सा महीना है?', maxScore: 1 },
  { id: 'q5',  number: '5',  section: 'orientation_time',
    prompt: 'What season of the year is this?',
    promptHindi: 'यह साल का कौनसा मौसम है?', maxScore: 1 },

  // Orientation — Place (5 × 1 = 5)
  { id: 'q6',  number: '6',  section: 'orientation_place',
    prompt: 'Under which post office does your village come?',
    promptHindi: 'कौन से पोस्ट ऑफीस के तहत आपका गाँव पड़ता है?', maxScore: 1 },
  { id: 'q7',  number: '7',  section: 'orientation_place',
    prompt: 'Which district does your village fall under?',
    promptHindi: 'किस ज़िले में आपका गाँव पड़ता है?', maxScore: 1 },
  { id: 'q8',  number: '8',  section: 'orientation_place',
    prompt: 'Which village are you from?',
    promptHindi: 'आप कौन से गाँव से हैं?', maxScore: 1 },
  { id: 'q9',  number: '9',  section: 'orientation_place',
    prompt: 'Which block (or numbered area) is this?',
    promptHindi: 'आपका गाँव कौन से ब्लॉक या क्षेत्र में पड़ता है?',
    helpText: 'If village has only blocks, ask for block number/name.', maxScore: 1 },
  { id: 'q10', number: '10', section: 'orientation_place',
    prompt: 'Which place is this?',
    promptHindi: 'ये कौन सी जगह है?', maxScore: 1 },

  // Registration (max 3)
  { id: 'q11', number: '11', section: 'registration',
    prompt: 'I went to Delhi and brought three things — Mango, chair, and coin. Can you tell me what are the three things I brought from Delhi?',
    promptHindi: 'मैं दिल्ली गया और तीन चीज़ें लाया — आम, कुर्सी और सिक्का। क्या आप बता सकते हैं कि मैं क्या तीन चीज़ें लाया था?',
    helpText: '1 point per object correctly named (max 3).',
    maxScore: 3,
    scoreLabels: ['0 — none', '1 of 3', '2 of 3', '3 of 3'] },

  // Attention (max 5)
  { id: 'q12a', number: '12.a', section: 'attention',
    prompt: 'Can you tell me the names of the days of the week starting from Sunday?',
    promptHindi: 'अब आप मुझे रविवार से शुरू करते हुए सप्ताह के सभी दिनों के नाम बता सकते हैं?',
    helpText: '1 point per correct consecutive day (max 5). Backward recall (12.b) is optional and not scored.',
    maxScore: 5,
    scoreLabels: ['0', '1', '2', '3', '4', '5'] },

  // Recall (max 3)
  { id: 'q13_15', number: '13–15', section: 'recall',
    prompt: 'What are the names of the three things which I told you have brought from Delhi?',
    promptHindi: 'मैं दिल्ली से क्या तीन चीज़ें लाया था?',
    helpText: '1 point per object correctly recalled (max 3).',
    maxScore: 3,
    scoreLabels: ['0 — none', '1 of 3', '2 of 3', '3 of 3'] },

  // Naming (2 × 1 = 2)
  { id: 'q17', number: '17', section: 'naming',
    prompt: 'Show the wrist watch — what is this?',
    promptHindi: 'यह क्या है?',
    helpText: 'If unable, identification by touching is also acceptable.',
    maxScore: 1 },
  { id: 'q18', number: '18', section: 'naming',
    prompt: 'Show the pen — what is this?',
    promptHindi: 'यह क्या है?',
    helpText: 'If unable, identification by touching is also acceptable.',
    maxScore: 1 },

  // Repetition (max 1)
  { id: 'q19', number: '19', section: 'repetition',
    prompt: 'Now I am going to say something — listen carefully and repeat it exactly as I say after I finish: "NEITHER THIS NOR THAT".',
    promptHindi: 'अब मैं कुछ कहूँगा और मेरे कहने के बाद आप उसे दोहराना: "ना तो यह और ना ही वह"',
    maxScore: 1 },

  // Comprehension (max 1)
  { id: 'q20', number: '20', section: 'comprehension',
    prompt: 'Now look at my face and do exactly what I do — close your eyes.',
    promptHindi: 'अब मेरे चेहरे को देखो और जो मैं करूँगा वह आप भी करो — अपनी आंखें बंद करो।',
    maxScore: 1 },

  // 3-step Command (max 3)
  { id: 'q21', number: '21', section: 'three_step',
    prompt: 'First you take the paper in your right hand, then with both hands fold it in half once, and then give the paper back to me.',
    promptHindi: 'पहले आप काग़ज़ अपने दाहिने हाथ में लें और फिर दोनों हाथों से उसे बीच में से मोड़ कर वापस करें।',
    helpText: '1 point per step completed correctly (max 3).',
    maxScore: 3,
    scoreLabels: ['0 — none', '1 of 3', '2 of 3', '3 of 3'] },

  // Speech (NOT scored toward total)
  { id: 'q22', number: '22', section: 'speech',
    prompt: 'Now say a line about your house (something specific about your house).',
    promptHindi: 'अब आप अपने घर के बारे में एक वाक्य बोलिए।',
    helpText: 'Administered for clinical observation. Not added to the HMSE total.',
    maxScore: 1,
    notIncludedInTotal: true },

  // Construction (max 3)
  { id: 'q23', number: '23', section: 'construction',
    prompt: 'Copy this drawing exactly as shown — two four-sided figures, one mostly inside the other.',
    promptHindi: 'इस चित्र को देखिए और हूबहू इसके जैसा चित्र बनाइए।',
    helpText: 'Two four-sided figures = 1 · One mostly inside the other = 2 · Orientation appropriate = 3.',
    maxScore: 3,
    scoreLabels: [
      '0 — not attempted / unrecognisable',
      '1 — two four-sided figures',
      '2 — one mostly inside the other',
      '3 — orientation appropriate',
    ],
    isDrawing: true },
]

export const HMSE_MAX_TOTAL = HMSE_QUESTIONS
  .filter(q => !q.notIncludedInTotal)
  .reduce((sum, q) => sum + q.maxScore, 0)

export type HMSEAnswers = Record<string, number>

export interface HMSEResult {
  total: number
  maxTotal: number
  band: 'normal' | 'mild_impairment' | 'severe_impairment'
  bandLabel: string
  interpretation: string
  answeredCount: number
  totalQuestions: number
}

/**
 * HMSE total = sum of scored questions only (Q22 excluded).
 * Unanswered questions count as 0.
 */
export function calculateHMSE(answers: HMSEAnswers): HMSEResult {
  const scored = HMSE_QUESTIONS.filter(q => !q.notIncludedInTotal)
  const total = scored.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0)
  const answeredCount = HMSE_QUESTIONS.filter(q => answers[q.id] !== undefined).length

  let band: HMSEResult['band']
  let bandLabel: string
  let interpretation: string

  if (total >= 24) {
    band = 'normal'
    bandLabel = 'Normal cognition'
    interpretation = 'Score is within the normal range. No cognitive impairment indicated by HMSE.'
  } else if (total >= 18) {
    band = 'mild_impairment'
    bandLabel = 'Mild cognitive impairment'
    interpretation = 'Score suggests mild cognitive impairment. Recommend clinical correlation and consider further evaluation (e.g. MoCA, geriatrician review).'
  } else {
    band = 'severe_impairment'
    bandLabel = 'Severe cognitive impairment'
    interpretation = 'Score suggests significant cognitive impairment. Refer for specialist evaluation (neurology / psychiatry / memory clinic).'
  }

  return {
    total,
    maxTotal: HMSE_MAX_TOTAL,
    band,
    bandLabel,
    interpretation,
    answeredCount,
    totalQuestions: HMSE_QUESTIONS.length,
  }
}

/** Group questions by section, preserving the canonical order. */
export function groupHMSEQuestions(): { section: HMSESection; questions: HMSEQuestion[] }[] {
  const groups = new Map<HMSESection, HMSEQuestion[]>()
  for (const q of HMSE_QUESTIONS) {
    const arr = groups.get(q.section) ?? []
    arr.push(q)
    groups.set(q.section, arr)
  }
  return Array.from(groups.entries()).map(([section, questions]) => ({ section, questions }))
}
