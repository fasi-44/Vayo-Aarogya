// Hamilton Anxiety Rating Scale (HAM-A)
//
// Hamilton M. The assessment of anxiety states by rating.
// Br J Med Psychol 1959;32:50-5.
//
// 14 clinician-rated items, each scored 0–4:
//   0 = Not present
//   1 = Mild
//   2 = Moderate
//   3 = Severe
//   4 = Very severe
//
// Total range 0–56.
// Severity bands:
//    0–17 Mild
//   18–24 Mild to moderate
//   25–30 Moderate to severe
//   31–56 Severe to very severe
//
// The HAM-A is in the public domain.

export interface HAMAItem {
  id: string
  number: number
  /** Bold title as printed on the form. */
  title: string
  /** Descriptor symptoms listed beneath the title. */
  descriptors: string
}

export const HAMA_ITEMS: HAMAItem[] = [
  { id: 'anxious_mood',       number: 1,  title: 'Anxious mood',
    descriptors: 'Worries, anticipation of the worst, fearful anticipation, irritability.' },
  { id: 'tension',            number: 2,  title: 'Tension',
    descriptors: 'Feelings of tension, fatigability, startle response, moved to tears easily, trembling, feelings of restlessness, inability to relax.' },
  { id: 'fears',              number: 3,  title: 'Fears',
    descriptors: 'Of dark, of strangers, of being left alone, of animals, of traffic, of crowds.' },
  { id: 'insomnia',           number: 4,  title: 'Insomnia',
    descriptors: 'Difficulty in falling asleep, broken sleep, unsatisfying sleep and fatigue on waking, dreams, nightmares, night terrors.' },
  { id: 'intellectual',       number: 5,  title: 'Intellectual',
    descriptors: 'Difficulty in concentration, poor memory.' },
  { id: 'depressed_mood',     number: 6,  title: 'Depressed mood',
    descriptors: 'Loss of interest, lack of pleasure in hobbies, depression, early waking, diurnal swing.' },
  { id: 'somatic_muscular',   number: 7,  title: 'Somatic (muscular)',
    descriptors: 'Pains and aches, twitching, stiffness, myoclonic jerks, grinding of teeth, unsteady voice, increased muscular tone.' },
  { id: 'somatic_sensory',    number: 8,  title: 'Somatic (sensory)',
    descriptors: 'Tinnitus, blurring of vision, hot and cold flushes, feelings of weakness, pricking sensation.' },
  { id: 'cardiovascular',     number: 9,  title: 'Cardiovascular symptoms',
    descriptors: 'Tachycardia, palpitations, pain in chest, throbbing of vessels, fainting feelings, missing beat.' },
  { id: 'respiratory',        number: 10, title: 'Respiratory symptoms',
    descriptors: 'Pressure or constriction in chest, choking feelings, sighing, dyspnea.' },
  { id: 'gastrointestinal',   number: 11, title: 'Gastrointestinal symptoms',
    descriptors: 'Difficulty in swallowing, wind abdominal pain, burning sensations, abdominal fullness, nausea, vomiting, borborygmi, looseness of bowels, loss of weight, constipation.' },
  { id: 'genitourinary',      number: 12, title: 'Genitourinary symptoms',
    descriptors: 'Frequency of micturition, urgency of micturition, amenorrhea, menorrhagia, development of frigidity, premature ejaculation, loss of libido, impotence.' },
  { id: 'autonomic',          number: 13, title: 'Autonomic symptoms',
    descriptors: 'Dry mouth, flushing, pallor, tendency to sweat, giddiness, tension headache, raising of hair.' },
  { id: 'behaviour',          number: 14, title: 'Behaviour at interview',
    descriptors: 'Fidgeting, restlessness or pacing, tremor of hands, furrowed brow, strained face, sighing or rapid respiration, facial pallor, swallowing, etc.' },
]

export const HAMA_MAX_TOTAL = HAMA_ITEMS.length * 4  // 56

export const HAMA_SCORE_LABELS: Record<number, string> = {
  0: 'Not present',
  1: 'Mild',
  2: 'Moderate',
  3: 'Severe',
  4: 'Very severe',
}

export type HAMAAnswers = Record<string, number>

export type HAMABand =
  | 'mild'
  | 'mild_moderate'
  | 'moderate_severe'
  | 'severe'

export interface HAMAResult {
  total: number
  maxTotal: number
  band: HAMABand
  bandLabel: string
  interpretation: string
  answeredCount: number
  totalQuestions: number
}

export function calculateHAMA(answers: HAMAAnswers): HAMAResult {
  const total = HAMA_ITEMS.reduce((sum, item) => sum + (answers[item.id] ?? 0), 0)
  const answeredCount = HAMA_ITEMS.filter(item => answers[item.id] !== undefined).length

  let band: HAMABand
  let bandLabel: string
  let interpretation: string

  if (total < 17) {
    band = 'mild'
    bandLabel = 'Mild anxiety'
    interpretation = 'Score indicates mild anxiety severity.'
  } else if (total <= 24) {
    band = 'mild_moderate'
    bandLabel = 'Mild to moderate anxiety'
    interpretation = 'Score indicates mild to moderate anxiety severity. Consider psychoeducation and monitoring.'
  } else if (total <= 30) {
    band = 'moderate_severe'
    bandLabel = 'Moderate to severe anxiety'
    interpretation = 'Score indicates moderate to severe anxiety. Clinician assessment and treatment planning recommended.'
  } else {
    band = 'severe'
    bandLabel = 'Severe to very severe anxiety'
    interpretation = 'Score indicates severe to very severe anxiety. Prompt clinical assessment and treatment required.'
  }

  return {
    total,
    maxTotal: HAMA_MAX_TOTAL,
    band,
    bandLabel,
    interpretation,
    answeredCount,
    totalQuestions: HAMA_ITEMS.length,
  }
}
