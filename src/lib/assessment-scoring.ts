/**
 * ICOPE-Based Assessment Scoring & Decision Engine
 *
 * Flow: ICOPE Screening (Inputs) → Domain Scores (Flags) → Decision Engine (Rules)
 *       → Recommended Scales → Final Report
 *
 * Question types:
 *   - scale: 0–2 severity (0 = No difficulty, 1 = Mild, 2 = Severe)
 *   - binary: Yes/No — encoded as 0 (favourable) / 2 (flagged)
 *
 * Domain Risk Calculation (sum of all answers, binary counts as 0 or 2):
 *   - 0-1 total = Healthy (green)
 *   - 2-3 total = At Risk (yellow)
 *   - 4+ total = Intervention (red)
 *
 * Overall Risk = Highest domain risk level.
 * Self-harm flag always escalates to an Emergency.
 */

export type RiskLevel = 'healthy' | 'at_risk' | 'intervention'
export type QuestionType = 'scale' | 'binary'

export interface QuestionOption {
  value: number
  label: string
  emoji: string
}

export interface DomainQuestion {
  id: string
  question: string
  shortLabel: string
  emoji: string
  type?: QuestionType // default: 'scale'
  options?: QuestionOption[]
  description?: string
  /** Flag name raised when this question is answered unfavourably (scale ≥ 2 or binary = Yes). */
  triggerFlag?: TriggerFlag
}

export interface Domain {
  id: string
  name: string
  description: string
  emoji: string
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

export type TriggerFlag =
  | 'acute_change'
  | 'self_harm'
  | 'falls'
  | 'hallucination'
  | 'weight_loss'
  | 'no_support'
  | 'unusual_behavior'

export type ClinicalScaleCode =
  | 'HMSE'
  | 'MoCA'
  | 'CAM'
  | 'AD-8'
  | 'GDS'
  | 'PHQ-9'
  | 'GAD-7'
  | 'PSQI'
  | 'BPRS'
  | 'TUG'
  | 'MNA'
  | 'UCLA'

export interface ClinicalScale {
  code: ClinicalScaleCode
  name: string
  purpose: string
}

export interface RiskFlag {
  id: string
  label: string
  severity: 'low' | 'moderate' | 'high' | 'emergency'
}

export interface AssessmentAction {
  id: string
  label: string
  priority: 'routine' | 'soon' | 'urgent' | 'emergency'
}

export interface AssessmentResult {
  overallRisk: RiskLevel
  domainScores: DomainScore[]
  totalScore: number
  maxTotalScore: number
  recommendations: string[] // Kept for backwards compatibility with older views
  flaggedDomains: string[]
  affectedDomains: string[]
  recommendedScales: ClinicalScale[]
  riskFlags: RiskFlag[]
  actions: AssessmentAction[]
  emergency: boolean
}

export const SCALE_OPTIONS = [
  { value: 0, label: 'No Problem', emoji: '😊', color: 'green', description: 'No difficulty' },
  { value: 1, label: 'Some Difficulty', emoji: '😐', color: 'yellow', description: 'Mild issue' },
  { value: 2, label: 'Very Difficult', emoji: '😟', color: 'red', description: 'Severe / needs help' },
]

const SCALE_0_2: QuestionOption[] = [
  { value: 0, label: 'No', emoji: '😊' },
  { value: 1, label: 'Sometimes', emoji: '😐' },
  { value: 2, label: 'Often', emoji: '😟' },
]

const BINARY_NO_YES: QuestionOption[] = [
  { value: 0, label: 'No', emoji: '😊' },
  { value: 2, label: 'Yes', emoji: '⚠️' },
]

const BINARY_YES_NO_SUPPORT: QuestionOption[] = [
  { value: 0, label: 'Yes', emoji: '😊' },
  { value: 2, label: 'No', emoji: '⚠️' },
]

// ----------------------------------------------------------------------------
// 6 ICOPE Domains (source: Further changes.pdf)
// ----------------------------------------------------------------------------

export const ASSESSMENT_DOMAINS: Domain[] = [
  // A. COGNITIVE
  {
    id: 'cognitive',
    name: 'Cognitive',
    emoji: '🧠',
    description: 'Memory, orientation, and awareness',
    questions: [
      {
        id: 'cog_1',
        emoji: '🧠',
        shortLabel: 'Memory',
        question: 'Do you have difficulty remembering recent events?',
        type: 'scale',
        options: SCALE_0_2,
      },
      {
        id: 'cog_2',
        emoji: '🕒',
        shortLabel: 'Orientation',
        question: 'Do you get confused about time or place?',
        type: 'scale',
        options: SCALE_0_2,
      },
      {
        id: 'cog_3',
        emoji: '🔁',
        shortLabel: 'Repeating',
        question: 'Do you repeat questions frequently?',
        type: 'scale',
        options: SCALE_0_2,
      },
      {
        id: 'cog_4',
        emoji: '⚡',
        shortLabel: 'Acute Change',
        question: 'Any sudden change in thinking or awareness?',
        type: 'binary',
        options: BINARY_NO_YES,
        triggerFlag: 'acute_change',
      },
    ],
  },

  // B. PSYCHOLOGICAL
  {
    id: 'psychological',
    name: 'Psychological',
    emoji: '💙',
    description: 'Mood, anxiety, and emotional wellbeing',
    questions: [
      {
        id: 'psy_1',
        emoji: '😔',
        shortLabel: 'Sad / Low',
        question: 'Feeling sad or low?',
        type: 'scale',
        options: SCALE_0_2,
      },
      {
        id: 'psy_2',
        emoji: '💤',
        shortLabel: 'Loss of Interest',
        question: 'Loss of interest in activities?',
        type: 'scale',
        options: SCALE_0_2,
      },
      {
        id: 'psy_3',
        emoji: '😰',
        shortLabel: 'Anxious',
        question: 'Feeling anxious or worried?',
        type: 'scale',
        options: SCALE_0_2,
      },
      {
        id: 'psy_4',
        emoji: '😠',
        shortLabel: 'Irritability',
        question: 'Irritability or mood swings?',
        type: 'scale',
        options: SCALE_0_2,
      },
      {
        id: 'psy_5',
        emoji: '🚨',
        shortLabel: 'Self-Harm Thoughts',
        question: 'Any thoughts of self-harm?',
        type: 'binary',
        options: BINARY_NO_YES,
        triggerFlag: 'self_harm',
      },
    ],
  },

  // C. LOCOMOTOR
  {
    id: 'locomotor',
    name: 'Locomotor',
    emoji: '🚶',
    description: 'Walking, movement, and falls',
    questions: [
      {
        id: 'loc_1',
        emoji: '🚶',
        shortLabel: 'Walking',
        question: 'Difficulty walking?',
        type: 'scale',
        options: SCALE_0_2,
      },
      {
        id: 'loc_2',
        emoji: '⚠️',
        shortLabel: 'Falls',
        question: 'Any history of falls?',
        type: 'binary',
        options: BINARY_NO_YES,
        triggerFlag: 'falls',
      },
      {
        id: 'loc_3',
        emoji: '🐢',
        shortLabel: 'Slowed Movement',
        question: 'Slowed movements?',
        type: 'scale',
        options: SCALE_0_2,
      },
    ],
  },

  // D. SENSORY
  {
    id: 'sensory',
    name: 'Sensory',
    emoji: '👂',
    description: 'Hearing, vision, and perception',
    questions: [
      {
        id: 'sen_1',
        emoji: '👂',
        shortLabel: 'Hearing',
        question: 'Difficulty hearing?',
        type: 'scale',
        options: SCALE_0_2,
      },
      {
        id: 'sen_2',
        emoji: '👁️',
        shortLabel: 'Vision',
        question: 'Difficulty seeing?',
        type: 'scale',
        options: SCALE_0_2,
      },
      {
        id: 'sen_3',
        emoji: '👻',
        shortLabel: 'Hallucinations',
        question: "Do you see or hear things others don't?",
        type: 'binary',
        options: BINARY_NO_YES,
        triggerFlag: 'hallucination',
      },
    ],
  },

  // E. VITALITY
  {
    id: 'vitality',
    name: 'Vitality',
    emoji: '🍽️',
    description: 'Appetite, weight, and energy',
    questions: [
      {
        id: 'vit_1',
        emoji: '⚖️',
        shortLabel: 'Weight Loss',
        question: 'Any unintentional weight loss?',
        type: 'binary',
        options: BINARY_NO_YES,
        triggerFlag: 'weight_loss',
      },
      {
        id: 'vit_2',
        emoji: '🍽️',
        shortLabel: 'Appetite',
        question: 'Reduced appetite?',
        type: 'scale',
        options: SCALE_0_2,
      },
      {
        id: 'vit_3',
        emoji: '🥱',
        shortLabel: 'Fatigue',
        question: 'Feeling tired or low in energy?',
        type: 'scale',
        options: SCALE_0_2,
      },
    ],
  },

  // F. SOCIAL
  {
    id: 'social',
    name: 'Social',
    emoji: '🤝',
    description: 'Connection, support, and behaviour',
    questions: [
      {
        id: 'soc_1',
        emoji: '💔',
        shortLabel: 'Loneliness',
        question: 'Do you feel lonely?',
        type: 'scale',
        options: SCALE_0_2,
      },
      {
        id: 'soc_2',
        emoji: '🤗',
        shortLabel: 'Support',
        question: 'Do you have someone to support you?',
        type: 'binary',
        options: BINARY_YES_NO_SUPPORT,
        triggerFlag: 'no_support',
      },
      {
        id: 'soc_3',
        emoji: '👥',
        shortLabel: 'Social Activity',
        question: 'Reduced social interaction?',
        type: 'scale',
        options: SCALE_0_2,
      },
      {
        id: 'soc_4',
        emoji: '🫨',
        shortLabel: 'Unusual Behavior',
        question: 'Any unusual behaviour noticed by family?',
        type: 'binary',
        options: BINARY_NO_YES,
        triggerFlag: 'unusual_behavior',
      },
    ],
  },
]

// ----------------------------------------------------------------------------
// Clinical scale catalog
// ----------------------------------------------------------------------------

const SCALE_CATALOG: Record<ClinicalScaleCode, ClinicalScale> = {
  HMSE:    { code: 'HMSE',    name: 'Hindi Mental State Examination', purpose: 'Initial cognitive screening' },
  MoCA:    { code: 'MoCA',    name: 'Montreal Cognitive Assessment',  purpose: 'Detailed cognitive evaluation' },
  CAM:     { code: 'CAM',     name: 'Confusion Assessment Method',    purpose: 'Screen for delirium / acute change' },
  'AD-8':  { code: 'AD-8',    name: 'AD-8 Informant Interview',       purpose: 'Dementia screening via informant' },
  GDS:     { code: 'GDS',     name: 'Geriatric Depression Scale',     purpose: 'Depression screening in elderly' },
  'PHQ-9': { code: 'PHQ-9',   name: 'Patient Health Questionnaire-9', purpose: 'Depression severity' },
  'GAD-7': { code: 'GAD-7',   name: 'Generalised Anxiety Disorder-7', purpose: 'Anxiety severity' },
  PSQI:    { code: 'PSQI',    name: 'Pittsburgh Sleep Quality Index', purpose: 'Sleep quality evaluation' },
  BPRS:    { code: 'BPRS',    name: 'Brief Psychiatric Rating Scale', purpose: 'Psychiatric symptom severity' },
  TUG:     { code: 'TUG',     name: 'Timed Up and Go Test',           purpose: 'Mobility and fall risk' },
  MNA:     { code: 'MNA',     name: 'Mini Nutritional Assessment',    purpose: 'Nutritional status' },
  UCLA:    { code: 'UCLA',    name: 'UCLA Loneliness Scale',          purpose: 'Loneliness severity' },
}

// ----------------------------------------------------------------------------
// Scoring helpers
// ----------------------------------------------------------------------------

export function calculateDomainRisk(totalScore: number): RiskLevel {
  if (totalScore <= 1) return 'healthy'
  if (totalScore <= 3) return 'at_risk'
  return 'intervention'
}

export function calculateOverallRisk(domainScores: DomainScore[]): RiskLevel {
  if (domainScores.some(d => d.riskLevel === 'intervention')) return 'intervention'
  if (domainScores.some(d => d.riskLevel === 'at_risk')) return 'at_risk'
  return 'healthy'
}

/** Highest per-question option value for a domain — used as maxScore. */
function domainMaxScore(domain: Domain): number {
  return domain.questions.reduce((sum, q) => {
    const opts = q.options ?? SCALE_OPTIONS
    const max = Math.max(...opts.map(o => o.value))
    return sum + max
  }, 0)
}

/** Raised flags for a domain based on question-level triggerFlag definitions. */
function collectDomainFlags(domain: Domain, answers: Record<string, number>): Set<TriggerFlag> {
  const flags = new Set<TriggerFlag>()
  for (const q of domain.questions) {
    if (!q.triggerFlag) continue
    const value = answers[q.id]
    if (value === undefined) continue
    // Binary: 2 = Yes / flagged. Scale: ≥ 2 = flagged.
    if (value >= 2) flags.add(q.triggerFlag)
  }
  return flags
}

export function scoreDomain(
  domain: Domain,
  answers: Record<string, number>,
  notes?: string,
): DomainScore {
  const score = Object.values(answers).reduce((a, b) => a + b, 0)
  const maxScore = domainMaxScore(domain)
  const riskLevel = calculateDomainRisk(score)
  const flags = collectDomainFlags(domain, answers)

  return {
    domain: domain.id,
    domainName: domain.name,
    score,
    maxScore,
    riskLevel,
    answers,
    notes,
    flagTriggered: flags.size > 0 || riskLevel !== 'healthy',
    triggerAction: domain.triggerAction,
  }
}

// ----------------------------------------------------------------------------
// Decision engine — turn domain scores + flags into scales, risk flags, actions
// ----------------------------------------------------------------------------

interface DecisionContext {
  cognitiveScore: number
  psychologicalScore: number
  locomotorScore: number
  sensoryScore: number
  vitalityScore: number
  socialScore: number
  flags: Set<TriggerFlag>
  answers: Record<string, number> // merged across domains for question-level lookups
}

function buildContext(domainScores: DomainScore[]): DecisionContext {
  const byId: Record<string, DomainScore | undefined> = {}
  const mergedAnswers: Record<string, number> = {}
  const flags = new Set<TriggerFlag>()

  for (const ds of domainScores) {
    byId[ds.domain] = ds
    Object.assign(mergedAnswers, ds.answers)
    const domain = ASSESSMENT_DOMAINS.find(d => d.id === ds.domain)
    if (!domain) continue
    collectDomainFlags(domain, ds.answers).forEach(f => flags.add(f))
  }

  return {
    cognitiveScore: byId.cognitive?.score ?? 0,
    psychologicalScore: byId.psychological?.score ?? 0,
    locomotorScore: byId.locomotor?.score ?? 0,
    sensoryScore: byId.sensory?.score ?? 0,
    vitalityScore: byId.vitality?.score ?? 0,
    socialScore: byId.social?.score ?? 0,
    flags,
    answers: mergedAnswers,
  }
}

function runDecisionEngine(ctx: DecisionContext): {
  scales: ClinicalScale[]
  riskFlags: RiskFlag[]
  actions: AssessmentAction[]
  emergency: boolean
} {
  const scaleCodes = new Set<ClinicalScaleCode>()
  const riskFlags = new Map<string, RiskFlag>()
  const actions = new Map<string, AssessmentAction>()

  const addScale = (code: ClinicalScaleCode) => scaleCodes.add(code)
  const addFlag = (flag: RiskFlag) => { riskFlags.set(flag.id, flag) }
  const addAction = (action: AssessmentAction) => { actions.set(action.id, action) }

  // --- Cognitive
  if (ctx.cognitiveScore >= 2) {
    addScale('HMSE'); addScale('MoCA')
    addFlag({ id: 'cognitive_impairment', label: 'Cognitive impairment', severity: 'moderate' })
    addAction({ id: 'refer_neuro', label: 'Refer to Neurology / memory clinic', priority: 'soon' })
  }
  if (ctx.flags.has('acute_change')) {
    addScale('CAM'); addScale('AD-8')
    addFlag({ id: 'delirium_risk', label: 'Possible delirium / acute change', severity: 'high' })
    addAction({ id: 'urgent_medical', label: 'Urgent medical evaluation for delirium', priority: 'urgent' })
  }

  // --- Psychological
  if (ctx.psychologicalScore >= 2) {
    addScale('GDS'); addScale('PHQ-9'); addScale('GAD-7')
    addFlag({ id: 'mood_symptoms', label: 'Moderate depressive / anxiety symptoms', severity: 'moderate' })
    addAction({ id: 'refer_psych', label: 'Refer to Psychiatry', priority: 'soon' })
    addAction({ id: 'caregiver_counseling', label: 'Initiate caregiver counseling', priority: 'routine' })
  }
  if (ctx.flags.has('self_harm')) {
    addFlag({ id: 'self_harm_risk', label: 'Self-harm risk', severity: 'emergency' })
    addAction({ id: 'emergency_psych', label: 'EMERGENCY: Immediate psychiatric evaluation', priority: 'emergency' })
  }

  // --- Locomotor
  const locomotorIssue =
    ctx.locomotorScore >= 1 || ctx.flags.has('falls')
  if (locomotorIssue) {
    addScale('TUG')
    addFlag({ id: 'fall_risk', label: 'Fall / mobility risk', severity: ctx.flags.has('falls') ? 'high' : 'moderate' })
    addAction({ id: 'physio', label: 'Physiotherapy / home safety assessment', priority: 'soon' })
  }
  // Slowed movement + low mood → reinforce GDS (already added if psych score ≥2)
  const slowedMovement = (ctx.answers['loc_3'] ?? 0) >= 2
  const lowMood = (ctx.answers['psy_1'] ?? 0) >= 1 || (ctx.answers['psy_2'] ?? 0) >= 1
  if (slowedMovement && lowMood) addScale('GDS')

  // --- Sensory
  if (ctx.sensoryScore >= 2) {
    addFlag({ id: 'sensory_loss', label: 'Sensory impairment (vision / hearing)', severity: 'moderate' })
    addAction({ id: 'sensory_screen', label: 'Basic vision & hearing screening', priority: 'routine' })
  }
  if (ctx.flags.has('hallucination')) {
    addScale('BPRS')
    addFlag({ id: 'psychotic_symptoms', label: 'Psychotic symptoms (hallucinations)', severity: 'high' })
    addAction({ id: 'refer_psych', label: 'Refer to Psychiatry', priority: 'urgent' })
  }

  // --- Vitality
  const vitalityFlag =
    ctx.vitalityScore >= 1 || ctx.flags.has('weight_loss')
  if (vitalityFlag) {
    addScale('MNA')
    addFlag({ id: 'nutritional_risk', label: 'Nutritional / vitality risk', severity: ctx.flags.has('weight_loss') ? 'high' : 'moderate' })
    addAction({ id: 'nutrition', label: 'Nutritional assessment & dietitian referral', priority: 'soon' })
  }
  const fatigue = (ctx.answers['vit_3'] ?? 0) >= 2
  if (fatigue && lowMood) addScale('PHQ-9')

  // --- Social
  const lonely = (ctx.answers['soc_1'] ?? 0) >= 2
  const reducedInteraction = (ctx.answers['soc_3'] ?? 0) >= 2
  const isolation = lonely || ctx.flags.has('no_support') || reducedInteraction
  if (isolation) {
    addScale('UCLA'); addScale('GDS')
    addFlag({ id: 'social_isolation', label: 'Social isolation', severity: 'moderate' })
    addAction({ id: 'community_support', label: 'Community engagement & social support', priority: 'soon' })
  }
  if (ctx.flags.has('unusual_behavior')) {
    addScale('BPRS')
    addFlag({ id: 'behavioral_change', label: 'Behavioral change reported by family', severity: 'high' })
    addAction({ id: 'refer_psych', label: 'Refer to Psychiatry', priority: 'urgent' })
  }

  // --- Global rules
  // Any hallucination/delusion/aggression → BPRS (covered above; global safety net)
  if (ctx.flags.has('hallucination') || ctx.flags.has('unusual_behavior')) addScale('BPRS')

  // Sleep cues: fatigue + low mood or loneliness implies sleep disturbance is plausible → PSQI.
  const sleepCue = (ctx.answers['vit_3'] ?? 0) >= 1 && (lowMood || lonely)
  if (sleepCue) addScale('PSQI')

  const emergency = ctx.flags.has('self_harm')
  if (!emergency && riskFlags.size === 0) {
    addAction({ id: 'continue', label: 'Continue current care plan. Annual reassessment.', priority: 'routine' })
  }

  const scales: ClinicalScale[] = Array.from(scaleCodes).map(code => SCALE_CATALOG[code])

  return {
    scales,
    riskFlags: Array.from(riskFlags.values()),
    actions: Array.from(actions.values()),
    emergency,
  }
}

// ----------------------------------------------------------------------------
// Public entry point
// ----------------------------------------------------------------------------

export function calculateAssessmentResult(
  domainAnswers: Record<string, { answers: Record<string, number>; notes?: string }>,
): AssessmentResult {
  const domainScores: DomainScore[] = []
  const flaggedDomains: string[] = []
  const affectedDomains: string[] = []
  const recommendations: string[] = []

  let totalScore = 0
  let maxTotalScore = 0

  for (const domain of ASSESSMENT_DOMAINS) {
    const domainData = domainAnswers[domain.id]
    if (!domainData) continue

    const ds = scoreDomain(domain, domainData.answers, domainData.notes)
    domainScores.push(ds)
    totalScore += ds.score
    maxTotalScore += ds.maxScore

    if (ds.riskLevel !== 'healthy' || ds.flagTriggered) {
      affectedDomains.push(domain.name)
    }
    if (ds.flagTriggered && ds.triggerAction) {
      flaggedDomains.push(domain.name)
      recommendations.push(`${domain.name}: ${ds.triggerAction}`)
    }
  }

  const ctx = buildContext(domainScores)
  const { scales, riskFlags, actions, emergency } = runDecisionEngine(ctx)
  const overallRisk = emergency ? 'intervention' : calculateOverallRisk(domainScores)

  // Backwards-compatible human-readable recommendations list
  if (emergency) {
    recommendations.unshift('🚨 EMERGENCY: Self-harm risk — arrange immediate psychiatric evaluation.')
  }
  if (scales.length > 0) {
    recommendations.push(`Recommended scales: ${scales.map(s => s.code).join(', ')}`)
  }
  actions.forEach(a => recommendations.push(a.label))

  return {
    overallRisk,
    domainScores,
    totalScore,
    maxTotalScore,
    recommendations: Array.from(new Set(recommendations)),
    flaggedDomains,
    affectedDomains,
    recommendedScales: scales,
    riskFlags,
    actions,
    emergency,
  }
}

// ----------------------------------------------------------------------------
// Display helpers
// ----------------------------------------------------------------------------

/**
 * Rebuild the decision-engine result from a stored Assessment.
 * Accepts either:
 *   - an array of AssessmentDomain rows (typed or plain JSON), or
 *   - the `domainScores` JSON blob written by the draft save path.
 * Returns null if neither shape is present.
 */
export function buildResultFromStored(
  domains?: Array<{ domain: string; answers?: unknown; notes?: string | null }> | null,
  domainScoresJson?: unknown,
): AssessmentResult | null {
  const domainAnswers: Record<string, { answers: Record<string, number>; notes?: string }> = {}

  if (domains && domains.length > 0) {
    for (const d of domains) {
      domainAnswers[d.domain] = {
        answers: (d.answers as Record<string, number>) || {},
        notes: d.notes ?? undefined,
      }
    }
  } else if (domainScoresJson && typeof domainScoresJson === 'object') {
    const blob = domainScoresJson as Record<string, unknown>
    for (const [id, value] of Object.entries(blob)) {
      if (value && typeof value === 'object' && 'answers' in (value as Record<string, unknown>)) {
        const v = value as { answers?: Record<string, number>; notes?: string }
        domainAnswers[id] = { answers: v.answers || {}, notes: v.notes }
      }
    }
  }

  if (Object.keys(domainAnswers).length === 0) return null
  return calculateAssessmentResult(domainAnswers)
}

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

