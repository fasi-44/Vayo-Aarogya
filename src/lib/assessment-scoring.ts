/**
 * WHO ICOPE-based Assessment Scoring Logic
 *
 * Scale: 0 - No difficulty, 1 - Mild (Some Difficulty), 2 - Severe (Needs Intervention)
 *
 * Domain Risk Calculation:
 * - 0-1 total = Healthy (green)
 * - 2-3 total = At Risk (yellow)
 * - 4+ total = Intervention (red)
 *
 * Overall Risk = Highest domain risk level
 */

export type RiskLevel = 'healthy' | 'at_risk' | 'intervention'

export interface QuestionOption {
  value: number
  label: string
  emoji: string
}

export interface DomainQuestion {
  id: string
  question: string
  shortLabel: string // Short label with emoji for quick understanding
  emoji: string
  options?: QuestionOption[] // Custom options per question
  description?: string
}

export interface Domain {
  id: string
  name: string
  description: string
  emoji: string // Domain emoji
  questions: DomainQuestion[]
  flagTrigger?: (answers: Record<string, number>) => boolean
  triggerAction?: string
}

export interface DomainScore {
  domain: string
  domainName: string
  score: number
  maxScore: number
  riskLevel: RiskLevel
  answers: Record<string, number>
  notes?: string
  flagTriggered?: boolean
  triggerAction?: string
}

export interface AssessmentResult {
  overallRisk: RiskLevel
  domainScores: DomainScore[]
  totalScore: number
  maxTotalScore: number
  recommendations: string[]
  flaggedDomains: string[]
}

// Default scale options (used when question doesn't have custom options)
export const SCALE_OPTIONS = [
  { value: 0, label: 'No Problem', emoji: '😊', color: 'green', description: 'I can do this easily' },
  { value: 1, label: 'Some Difficulty', emoji: '😐', color: 'yellow', description: 'I struggle a bit' },
  { value: 2, label: 'Very Difficult', emoji: '😟', color: 'red', description: 'I need help' },
]

// ICOPE-Based Basic Screening Questions (15 questions across 12 domains)
// "Answer based on the elder's usual condition in the last 2–4 weeks."
export const ASSESSMENT_DOMAINS: Domain[] = [
  // 1. COGNITION (Memory & Thinking)
  {
    id: 'cognition',
    name: 'Memory & Thinking',
    emoji: '🧠',
    description: 'Memory, confusion, and orientation',
    questions: [
      {
        id: 'cog_1',
        emoji: '🧠',
        shortLabel: 'Memory Problems',
        question: 'Does the elder have problems with memory, confusion, or getting lost?',
        options: [
          { value: 0, label: 'No problem', emoji: '😊' },
          { value: 1, label: 'Some problem (forgets sometimes)', emoji: '😐' },
          { value: 2, label: 'Severe (often confused / forgets people or place)', emoji: '😟' },
        ],
      },
    ],
    flagTrigger: (answers) => Object.values(answers).some(v => v === 2),
    triggerAction: 'Refer for cognitive specialist evaluation',
  },

  // 2. PSYCHOLOGICAL / MOOD
  {
    id: 'mood',
    name: 'Mood & Feelings',
    emoji: '💙',
    description: 'Emotional wellbeing and mood',
    questions: [
      {
        id: 'mood_1',
        emoji: '😢',
        shortLabel: 'Feeling Sad',
        question: 'In the last 2 weeks, has the elder felt sad, low, or lost interest in daily activities?',
        options: [
          { value: 0, label: 'No', emoji: '😊' },
          { value: 1, label: 'Sometimes', emoji: '😐' },
          { value: 2, label: 'Most days', emoji: '😟' },
        ],
      },
    ],
    flagTrigger: (answers) => Object.values(answers).some(v => v === 2),
    triggerAction: 'Consider mental health referral. Administer PHQ-2 screening.',
  },

  // 3. MOBILITY (Walking & Falls)
  {
    id: 'mobility',
    name: 'Walking & Falls',
    emoji: '🚶',
    description: 'Walking ability and fall history',
    questions: [
      {
        id: 'mob_1',
        emoji: '🚶',
        shortLabel: 'Walking / Getting Up',
        question: 'Does the elder have difficulty walking or getting up from a chair?',
        options: [
          { value: 0, label: 'No difficulty', emoji: '😊' },
          { value: 1, label: 'Some difficulty', emoji: '😐' },
          { value: 2, label: 'Unable / needs help', emoji: '😟' },
        ],
      },
      {
        id: 'mob_2',
        emoji: '⚠️',
        shortLabel: 'Falls in Past Year',
        question: 'Has the elder fallen in the last 1 year?',
        options: [
          { value: 0, label: 'No', emoji: '😊' },
          { value: 1, label: 'Yes, once', emoji: '😐' },
          { value: 2, label: 'Yes, more than once', emoji: '😟' },
        ],
      },
    ],
    flagTrigger: (answers) => answers['mob_2'] >= 1 || Object.values(answers).some(v => v === 2),
    triggerAction: 'Home safety assessment. Consider physiotherapy referral.',
  },

  // 4. VISION
  {
    id: 'vision',
    name: 'Vision',
    emoji: '👁️',
    description: 'Eyesight and visual function',
    questions: [
      {
        id: 'vis_1',
        emoji: '👁️',
        shortLabel: 'Seeing Difficulty',
        question: 'Does the elder have difficulty seeing (even with spectacles)?',
        options: [
          { value: 0, label: 'No difficulty', emoji: '😊' },
          { value: 1, label: 'Some difficulty', emoji: '😐' },
          { value: 2, label: 'Severe difficulty / cannot see well', emoji: '😟' },
        ],
      },
    ],
    flagTrigger: (answers) => Object.values(answers).some(v => v === 2),
    triggerAction: 'Refer for ophthalmology evaluation',
  },

  // 5. HEARING
  {
    id: 'hearing',
    name: 'Hearing',
    emoji: '👂',
    description: 'Hearing ability and communication',
    questions: [
      {
        id: 'hear_1',
        emoji: '👂',
        shortLabel: 'Hearing Difficulty',
        question: 'Does the elder have difficulty hearing normal conversation?',
        options: [
          { value: 0, label: 'No difficulty', emoji: '😊' },
          { value: 1, label: 'Some difficulty', emoji: '😐' },
          { value: 2, label: 'Severe difficulty / cannot hear properly', emoji: '😟' },
        ],
      },
    ],
    flagTrigger: (answers) => Object.values(answers).some(v => v === 2),
    triggerAction: 'Refer for audiology evaluation',
  },

  // 6. VITALITY – APPETITE & WEIGHT
  {
    id: 'vitality',
    name: 'Appetite & Weight',
    emoji: '🍽️',
    description: 'Eating habits and weight changes',
    questions: [
      {
        id: 'vit_1',
        emoji: '🍽️',
        shortLabel: 'Appetite Change',
        question: "Has the elder's appetite changed recently?",
        options: [
          { value: 0, label: 'No change', emoji: '😊' },
          { value: 1, label: 'Slightly reduced', emoji: '😐' },
          { value: 2, label: 'Very poor appetite / eating very little', emoji: '😟' },
        ],
      },
      {
        id: 'vit_2',
        emoji: '⚖️',
        shortLabel: 'Weight Change',
        question: 'Has there been unintentional weight change?',
        options: [
          { value: 0, label: 'No change', emoji: '😊' },
          { value: 1, label: 'Mild weight loss or gain', emoji: '😐' },
          { value: 2, label: 'Significant weight loss or gain', emoji: '😟' },
        ],
      },
    ],
    flagTrigger: (answers) => Object.values(answers).some(v => v === 2),
    triggerAction: 'Nutritional assessment and dietitian referral',
  },

  // 7. SLEEP
  {
    id: 'sleep',
    name: 'Sleep',
    emoji: '🌙',
    description: 'Sleep quality and patterns',
    questions: [
      {
        id: 'sleep_1',
        emoji: '🛏️',
        shortLabel: 'Sleep Trouble',
        question: 'Does the elder have trouble falling asleep or staying asleep?',
        options: [
          { value: 0, label: 'No problem', emoji: '😊' },
          { value: 1, label: 'Sometimes', emoji: '😐' },
          { value: 2, label: 'Most nights', emoji: '😟' },
        ],
      },
    ],
  },

  // 8. URINARY / BOWEL CONTROL
  {
    id: 'continence',
    name: 'Bladder & Bowel',
    emoji: '🚽',
    description: 'Urinary and bowel control',
    questions: [
      {
        id: 'cont_1',
        emoji: '🚽',
        shortLabel: 'Control Problems',
        question: 'Does the elder have difficulty controlling urine or bowel movements?',
        options: [
          { value: 0, label: 'No problem', emoji: '😊' },
          { value: 1, label: 'Urine problem only', emoji: '😐' },
          { value: 2, label: 'Urine and bowel problems', emoji: '😟' },
        ],
      },
    ],
  },

  // 9. ACTIVITIES OF DAILY LIVING (ADL)
  {
    id: 'adl',
    name: 'Self-Care (ADL)',
    emoji: '🧼',
    description: 'Basic self-care activities',
    questions: [
      {
        id: 'adl_1',
        emoji: '🧼',
        shortLabel: 'Daily Self-Care',
        question: 'Does the elder need help with bathing, dressing, eating or toileting?',
        options: [
          { value: 0, label: 'Independent', emoji: '😊' },
          { value: 1, label: 'Needs some help', emoji: '😐' },
          { value: 2, label: 'Fully dependent', emoji: '😟' },
        ],
      },
    ],
    flagTrigger: (answers) => Object.values(answers).some(v => v === 2),
    triggerAction: 'Assess need for personal care support',
  },

  // 10. INSTRUMENTAL ACTIVITIES (IADL)
  {
    id: 'iadl',
    name: 'Daily Tasks (IADL)',
    emoji: '🏠',
    description: 'Complex daily activities',
    questions: [
      {
        id: 'iadl_1',
        emoji: '🏠',
        shortLabel: 'Managing Tasks',
        question: 'Can the elder manage cooking, shopping, medicines, or money?',
        options: [
          { value: 0, label: 'Independent', emoji: '😊' },
          { value: 1, label: 'Needs assistance', emoji: '😐' },
          { value: 2, label: 'Fully dependent', emoji: '😟' },
        ],
      },
    ],
    flagTrigger: (answers) => Object.values(answers).some(v => v === 2),
    triggerAction: 'Assess need for daily living support',
  },

  // 11. SOCIAL CONNECTION & LONELINESS
  {
    id: 'social',
    name: 'Social & Loneliness',
    emoji: '👥',
    description: 'Social activities and feelings of loneliness',
    questions: [
      {
        id: 'soc_1',
        emoji: '👨‍👩‍👧',
        shortLabel: 'Social Activities',
        question: 'Does the elder take part in family or community activities?',
        options: [
          { value: 0, label: 'Regularly', emoji: '😊' },
          { value: 1, label: 'Occasionally', emoji: '😐' },
          { value: 2, label: 'Rarely / never', emoji: '😟' },
        ],
      },
      {
        id: 'soc_2',
        emoji: '💔',
        shortLabel: 'Feeling Lonely',
        question: 'How often does the elder feel lonely?',
        options: [
          { value: 0, label: 'Never', emoji: '😊' },
          { value: 1, label: 'Sometimes', emoji: '😐' },
          { value: 2, label: 'Often', emoji: '😟' },
        ],
      },
    ],
    flagTrigger: (answers) => Object.values(answers).every(v => v >= 1),
    triggerAction: 'Social support assessment. Consider community programs.',
  },

  // 12. ACCESS TO HEALTH CARE
  {
    id: 'healthcare',
    name: 'Healthcare Access',
    emoji: '🏥',
    description: 'Access to medical care',
    questions: [
      {
        id: 'hc_1',
        emoji: '🏥',
        shortLabel: 'Reaching Doctor',
        question: 'Is it easy for the elder to reach a doctor or hospital when needed?',
        options: [
          { value: 0, label: 'Easy', emoji: '😊' },
          { value: 1, label: 'Some difficulty', emoji: '😐' },
          { value: 2, label: 'Very difficult / needs full help', emoji: '😟' },
        ],
      },
    ],
  },
]

/**
 * Calculate risk level based on total domain score
 */
export function calculateDomainRisk(totalScore: number): RiskLevel {
  if (totalScore <= 1) return 'healthy'
  if (totalScore <= 3) return 'at_risk'
  return 'intervention'
}

/**
 * Calculate overall risk from domain scores
 * Overall risk = highest domain risk level
 */
export function calculateOverallRisk(domainScores: DomainScore[]): RiskLevel {
  const hasIntervention = domainScores.some(d => d.riskLevel === 'intervention')
  if (hasIntervention) return 'intervention'

  const hasAtRisk = domainScores.some(d => d.riskLevel === 'at_risk')
  if (hasAtRisk) return 'at_risk'

  return 'healthy'
}

/**
 * Score a single domain
 */
export function scoreDomain(
  domain: Domain,
  answers: Record<string, number>,
  notes?: string
): DomainScore {
  const score = Object.values(answers).reduce((a, b) => a + b, 0)
  const maxScore = domain.questions.length * 2
  const riskLevel = calculateDomainRisk(score)

  let flagTriggered = false
  let triggerAction: string | undefined

  if (domain.flagTrigger && domain.flagTrigger(answers)) {
    flagTriggered = true
    triggerAction = domain.triggerAction
  }

  return {
    domain: domain.id,
    domainName: domain.name,
    score,
    maxScore,
    riskLevel,
    answers,
    notes,
    flagTriggered,
    triggerAction,
  }
}

/**
 * Calculate full assessment result
 */
export function calculateAssessmentResult(
  domainAnswers: Record<string, { answers: Record<string, number>; notes?: string }>
): AssessmentResult {
  const domainScores: DomainScore[] = []
  const flaggedDomains: string[] = []
  const recommendations: string[] = []

  let totalScore = 0
  let maxTotalScore = 0

  for (const domain of ASSESSMENT_DOMAINS) {
    const domainData = domainAnswers[domain.id]
    if (!domainData) continue

    const domainScore = scoreDomain(domain, domainData.answers, domainData.notes)
    domainScores.push(domainScore)

    totalScore += domainScore.score
    maxTotalScore += domainScore.maxScore

    if (domainScore.flagTriggered && domainScore.triggerAction) {
      flaggedDomains.push(domain.name)
      recommendations.push(`${domain.name}: ${domainScore.triggerAction}`)
    }

    // Add risk-based recommendations
    if (domainScore.riskLevel === 'intervention') {
      recommendations.push(`${domain.name}: Immediate professional consultation required`)
    } else if (domainScore.riskLevel === 'at_risk') {
      recommendations.push(`${domain.name}: Schedule follow-up within 2 weeks`)
    }
  }

  const overallRisk = calculateOverallRisk(domainScores)

  // Add overall recommendations based on risk
  if (overallRisk === 'intervention') {
    recommendations.unshift('URGENT: Comprehensive geriatric assessment recommended')
  } else if (overallRisk === 'at_risk') {
    recommendations.unshift('Schedule comprehensive follow-up assessment within 2 weeks')
  } else {
    recommendations.unshift('Continue current care plan. Annual reassessment recommended.')
  }

  return {
    overallRisk,
    domainScores,
    totalScore,
    maxTotalScore,
    recommendations: Array.from(new Set(recommendations)), // Remove duplicates
    flaggedDomains,
  }
}

/**
 * Get risk level display properties
 */
export function getRiskLevelDisplay(riskLevel: RiskLevel): {
  label: string
  color: string
  bgColor: string
  description: string
} {
  switch (riskLevel) {
    case 'healthy':
      return {
        label: 'Healthy',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        description: 'Continue current care plan',
      }
    case 'at_risk':
      return {
        label: 'At Risk',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100',
        description: 'Schedule follow-up within 2 weeks',
      }
    case 'intervention':
      return {
        label: 'Needs Intervention',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        description: 'Immediate professional consultation required',
      }
  }
}

/**
 * PHQ-2 Depression Screening
 */
export interface PHQ2Result {
  score: number
  positive: boolean
  recommendation: string
}

export function scorePHQ2(
  littleInterest: number, // 0-3
  feelingDown: number     // 0-3
): PHQ2Result {
  const score = littleInterest + feelingDown
  const positive = score >= 3

  return {
    score,
    positive,
    recommendation: positive
      ? 'PHQ-2 positive. Consider PHQ-9 or professional mental health evaluation.'
      : 'PHQ-2 negative. Continue monitoring.',
  }
}
