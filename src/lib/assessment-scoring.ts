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

import type { UserRole } from '@/types'

export type RiskLevel = 'healthy' | 'at_risk' | 'intervention'
export type QuestionType = 'scale' | 'binary'

export interface QuestionOption {
  /** Stored answer + selection key. Must be unique within an option set. */
  value: number
  label: string
  emoji: string
  /**
   * Optional override for what this option contributes to scoring + flag
   * triggers. Defaults to `value`. Use this when two visually distinct options
   * both mean "no concern" (e.g., Normal vs Increased social interaction):
   * give each a unique `value` so selection is unambiguous, and set `score: 0`
   * on the ones that shouldn't push the domain score up.
   */
  score?: number
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
  /** Roles allowed to administer this question. If undefined, all roles can. */
  allowedAssessorRoles?: UserRole[]
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
  | 'memory_complaint'
  | 'orientation_problem'
  | 'self_harm'
  | 'sleep_complaint'
  | 'anxiety'
  | 'falls'
  | 'walking_difficulty'
  | 'fear_of_falling'
  | 'hallucination'
  | 'weight_loss'
  | 'reduced_appetite'
  | 'unusual_behavior'

export type ClinicalScaleCode =
  | 'HMSE'
  | 'MoCA'
  | 'CAM'
  | 'GDS'
  | 'PHQ-9'
  | 'B-PSQI'
  | 'BPRS'

  | 'MNA'
  | 'UCLA'
  | 'BSS'
  | 'HAM-A'

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

export const SCALE_OPTIONS: (QuestionOption & { color: string; description: string })[] = [
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

// Higher = better (e.g., recall 3 words). "Yes / could" is favourable.
const BINARY_YES_NO_INVERTED: QuestionOption[] = [
  { value: 0, label: 'Yes', emoji: '😊' },
  { value: 2, label: 'No', emoji: '⚠️' },
]

// 0–3 scale used for cognitive recall / orientation tests where the score is
// the number of *errors* the elder made out of 3 (so 0 = perfect, 3 = worst).
const ERRORS_0_3: QuestionOption[] = [
  { value: 0, label: 'No errors', emoji: '😊' },
  { value: 1, label: '1 error', emoji: '🙂' },
  { value: 2, label: '2 errors', emoji: '😐' },
  { value: 3, label: 'All wrong', emoji: '😟' },
]

const WALKING_OPTIONS: QuestionOption[] = [
  { value: 0, label: 'Independent', emoji: '🚶' },
  { value: 1, label: 'Assisted', emoji: '👣' },
  { value: 2, label: 'Bedridden', emoji: '🛏️' },
]

// Sleep change — both directions are abnormal but "decreased" is the stronger
// trigger for B-PSQI per the PDF. Increased is treated as mild.
const SLEEP_OPTIONS: QuestionOption[] = [
  { value: 2, label: 'Decreased', emoji: '🥱' },
  { value: 0, label: 'Normal', emoji: '😴' },
  { value: 1, label: 'Increased', emoji: '💤' },
]

// Social interaction change — only "reduced" is concerning. Normal and
// "increased" both contribute 0 to the score, but we give them distinct
// `value`s so selection state is unambiguous (sharing a value would
// highlight both buttons).
const SOCIAL_INTERACTION_OPTIONS: QuestionOption[] = [
  { value: 2, label: 'Reduced', emoji: '😔' },
  { value: 0, label: 'Normal', emoji: '🙂' },
  { value: 3, score: 0, label: 'Increased', emoji: '😊' },
]

// Roles allowed to administer questions that require trained observation /
// clinical interpretation (e.g., orientation tests, hallucination probes).
const PROFESSIONAL_ROLES: UserRole[] = ['volunteer', 'professional', 'super_admin']

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
        shortLabel: 'Memory complaint',
        question: 'Do you find any difficulty in memory or thinking?',
        type: 'binary',
        options: BINARY_NO_YES,
        triggerFlag: 'memory_complaint',
      },
      {
        id: 'cog_2',
        emoji: '🍋',
        shortLabel: 'Memory test (3 words)',
        question:
          'Recall test: ask the elder to repeat 3 words (e.g., lemon, key, ball). Score = number of words missed (0–3).',
        type: 'scale',
        options: ERRORS_0_3,
        allowedAssessorRoles: PROFESSIONAL_ROLES,
      },
      {
        id: 'cog_3',
        emoji: '🕒',
        shortLabel: 'Orientation test',
        question:
          'Orientation: ask date, time, place, who am I? Score = errors out of 3 categories (time / place / person).',
        type: 'scale',
        options: ERRORS_0_3,
        triggerFlag: 'orientation_problem',
        allowedAssessorRoles: PROFESSIONAL_ROLES,
      },
      {
        id: 'cog_4',
        emoji: '🔁',
        shortLabel: 'Delayed recall',
        question: 'After a brief delay, can the elder recall the 3 words?',
        type: 'binary',
        options: BINARY_YES_NO_INVERTED,
        allowedAssessorRoles: PROFESSIONAL_ROLES,
      },
    ],
  },

  // B. PSYCHOLOGICAL
  {
    id: 'psychological',
    name: 'Psychological',
    emoji: '💙',
    description: 'Mood, anxiety, sleep, and emotional wellbeing',
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
        triggerFlag: 'anxiety',
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
        question: 'Any thoughts of self-harm or suicidal ideas?',
        type: 'binary',
        options: BINARY_NO_YES,
        triggerFlag: 'self_harm',
      },
      {
        id: 'psy_6',
        emoji: '🌙',
        shortLabel: 'Sleep',
        question: 'How is your sleep?',
        type: 'scale',
        options: SLEEP_OPTIONS,
        triggerFlag: 'sleep_complaint',
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
        question: 'How does the elder walk?',
        type: 'scale',
        options: WALKING_OPTIONS,
      },
      {
        id: 'loc_2',
        emoji: '⚠️',
        shortLabel: 'History of falls',
        question: 'Any history of falls in the last 12 months?',
        type: 'binary',
        options: BINARY_NO_YES,
        triggerFlag: 'falls',
      },
      {
        id: 'loc_3',
        emoji: '⚖️',
        shortLabel: 'Trouble balancing',
        question: 'Any trouble walking or balancing?',
        type: 'binary',
        options: BINARY_NO_YES,
        triggerFlag: 'walking_difficulty',
      },
      {
        id: 'loc_4',
        emoji: '😨',
        shortLabel: 'Fear of falling',
        question: 'Fear of falling?',
        type: 'binary',
        options: BINARY_NO_YES,
        triggerFlag: 'fear_of_falling',
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
        allowedAssessorRoles: PROFESSIONAL_ROLES,
      },
    ],
  },

  // E. VITALITY
  {
    id: 'vitality',
    name: 'Vitality',
    emoji: '🍽️',
    description: 'Appetite and weight',
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
        triggerFlag: 'reduced_appetite',
      },
    ],
  },

  // F. SOCIAL
  {
    id: 'social',
    name: 'Social',
    emoji: '🤝',
    description: 'Connection and behaviour',
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
        emoji: '👥',
        shortLabel: 'Social Interaction',
        question: 'Has your social interaction changed?',
        type: 'scale',
        options: SOCIAL_INTERACTION_OPTIONS,
      },
      {
        id: 'soc_3',
        emoji: '🫨',
        shortLabel: 'Unusual Behavior',
        question: 'Any unusual behaviour noticed by family?',
        type: 'binary',
        options: BINARY_NO_YES,
        triggerFlag: 'unusual_behavior',
        allowedAssessorRoles: PROFESSIONAL_ROLES,
      },
    ],
  },
]

/**
 * Returns the assessment domains with role-restricted questions filtered out.
 * Family-administered assessments hide questions marked
 * `allowedAssessorRoles: PROFESSIONAL_ROLES` (orientation tests, hallucination
 * probe, unusual behaviour probe — these need trained observation).
 */
export function getAssessmentDomainsForRole(role: UserRole | null | undefined): Domain[] {
  if (!role) return ASSESSMENT_DOMAINS
  return ASSESSMENT_DOMAINS.map(domain => ({
    ...domain,
    questions: domain.questions.filter(q =>
      !q.allowedAssessorRoles || q.allowedAssessorRoles.includes(role)
    ),
  }))
}

// ----------------------------------------------------------------------------
// Clinical scale catalog
// ----------------------------------------------------------------------------

const SCALE_CATALOG: Record<ClinicalScaleCode, ClinicalScale> = {
  HMSE:    { code: 'HMSE',    name: 'Hindi Mental State Examination', purpose: 'Cognitive screening (literate)' },
  MoCA:    { code: 'MoCA',    name: 'Montreal Cognitive Assessment',  purpose: 'Cognitive screening (illiterate)' },
  CAM:     { code: 'CAM',     name: 'Confusion Assessment Method',    purpose: 'Delirium screening when orientation is impaired' },
  GDS:     { code: 'GDS',     name: 'Geriatric Depression Scale',     purpose: 'Self-administered depression screening' },
  'PHQ-9': { code: 'PHQ-9',   name: 'Patient Health Questionnaire-9', purpose: 'Depression severity' },
  'B-PSQI':{ code: 'B-PSQI',  name: 'Brief Pittsburgh Sleep Quality Index', purpose: 'Sleep complaint evaluation' },
  BPRS:    { code: 'BPRS',    name: 'Brief Psychiatric Rating Scale', purpose: 'Psychotic / behavioural symptom severity' },

  MNA:     { code: 'MNA',     name: 'Mini Nutritional Assessment',    purpose: 'Nutritional status' },
  UCLA:    { code: 'UCLA',    name: 'UCLA Loneliness Scale',          purpose: 'Loneliness severity' },
  BSS:     { code: 'BSS',     name: "Beck's Suicidal Scale",          purpose: 'Suicidal ideation severity (vol/prof)' },
  'HAM-A': { code: 'HAM-A',   name: 'Hamilton Anxiety Rating Scale',  purpose: 'Anxiety severity (vol/prof)' },
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

/** Resolve the scoring contribution of a stored answer for a question. */
function effectiveScoreFor(question: DomainQuestion, value: number): number {
  const opts = question.options ?? SCALE_OPTIONS
  const opt = opts.find(o => o.value === value)
  return opt?.score ?? value
}

/** Highest per-question scoring contribution for a domain — used as maxScore. */
function domainMaxScore(domain: Domain): number {
  return domain.questions.reduce((sum, q) => {
    const opts = q.options ?? SCALE_OPTIONS
    const max = Math.max(...opts.map(o => o.score ?? o.value))
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
    // Binary: 2 = Yes / flagged. Scale: ≥ 2 = flagged. Uses the option's
    // `score` override if present (so e.g. "Increased" social interaction
    // with value=3 / score=0 doesn't trigger).
    if (effectiveScoreFor(q, value) >= 2) flags.add(q.triggerFlag)
  }
  return flags
}

export function scoreDomain(
  domain: Domain,
  answers: Record<string, number>,
  notes?: string,
): DomainScore {
  let score = 0
  for (const q of domain.questions) {
    const value = answers[q.id]
    if (value === undefined) continue
    score += effectiveScoreFor(q, value)
  }
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

/**
 * Decision engine — turns ICOPE answers + flags into recommended scales,
 * risk flags, and actions, per the PDF "Further changes" spec.
 *
 * Some scales (Beck's Suicidal Scale, HAM-A) are only recommended when the
 * assessment is being conducted by a volunteer or professional — family
 * members can flag self-harm but shouldn't be asked to administer Beck's.
 */
function runDecisionEngine(
  ctx: DecisionContext,
  assessorRole?: UserRole | null,
): {
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
  const isProfessional = assessorRole
    ? PROFESSIONAL_ROLES.includes(assessorRole)
    : true // when role unknown, assume professional context (no info to gate on)

  // --- A. Cognitive
  // PDF: total cognitive score ≥ 2 → HMSE / MoCA. HMSE and MoCA are
  // clinician-administered tools, so we only surface them when the assessor
  // is a volunteer or professional. Family-led assessments still raise the
  // cognitive impairment flag and a referral action.
  if (ctx.cognitiveScore >= 2 || ctx.flags.has('memory_complaint')) {
    if (isProfessional) { addScale('HMSE'); addScale('MoCA') }
    addFlag({ id: 'cognitive_impairment', label: 'Cognitive impairment', severity: 'moderate' })
    addAction({ id: 'refer_neuro', label: 'Refer to Neurology / memory clinic', priority: 'soon' })
  }
  // PDF: orientation test reveals issues → CAM
  if (ctx.flags.has('orientation_problem')) {
    addScale('CAM')
    addFlag({ id: 'delirium_risk', label: 'Possible delirium / disorientation', severity: 'high' })
    addAction({ id: 'urgent_medical', label: 'Urgent medical evaluation for delirium', priority: 'urgent' })
  }

  // --- B. Psychological
  // PDF: total psych ≥ 2 → PHQ-9; sad/loi/self-harm cues → GDS (self-administered)
  if (ctx.psychologicalScore >= 2) {
    addScale('PHQ-9')
    addFlag({ id: 'mood_symptoms', label: 'Moderate depressive / anxiety symptoms', severity: 'moderate' })
    addAction({ id: 'refer_psych', label: 'Refer to Psychiatry', priority: 'soon' })
    addAction({ id: 'caregiver_counseling', label: 'Initiate caregiver counseling', priority: 'routine' })

    const sad = (ctx.answers['psy_1'] ?? 0) >= 1
    const lossOfInterest = (ctx.answers['psy_2'] ?? 0) >= 1
    const selfHarmCue = ctx.flags.has('self_harm')
    if (sad || lossOfInterest || selfHarmCue) addScale('GDS')
  }
  // PDF: sleep complaint → B-PSQI
  if (ctx.flags.has('sleep_complaint')) {
    addScale('B-PSQI')
    addFlag({ id: 'sleep_disturbance', label: 'Sleep complaint', severity: 'moderate' })
  }
  // PDF: self-harm = Yes → emergency. Beck's Suicidal Scale is vol/prof-only.
  if (ctx.flags.has('self_harm')) {
    addFlag({ id: 'self_harm_risk', label: 'Self-harm risk', severity: 'emergency' })
    addAction({ id: 'emergency_psych', label: 'EMERGENCY: Immediate psychiatric evaluation', priority: 'emergency' })
    if (isProfessional) addScale('BSS')
  }
  // PDF: anxiety → HAM-A (vol/prof-only)
  if (ctx.flags.has('anxiety') && isProfessional) {
    addScale('HAM-A')
  }

  // --- C. Locomotor
  const locomotorConcern =
    ctx.locomotorScore >= 1 ||
    ctx.flags.has('falls') ||
    ctx.flags.has('walking_difficulty') ||
    ctx.flags.has('fear_of_falling')
  if (locomotorConcern) {
    addFlag({
      id: 'fall_risk',
      label: 'Fall / mobility risk',
      severity: ctx.flags.has('falls') ? 'high' : 'moderate',
    })
    addAction({ id: 'physio', label: 'Physiotherapy / home safety assessment', priority: 'soon' })
  }

  // --- D. Sensory
  if (ctx.sensoryScore >= 2) {
    addFlag({ id: 'sensory_loss', label: 'Sensory impairment (vision / hearing)', severity: 'moderate' })
    addAction({ id: 'sensory_screen', label: 'Basic vision & hearing screening', priority: 'routine' })
  }
  // PDF: hallucinations = Yes → BPRS
  if (ctx.flags.has('hallucination')) {
    addScale('BPRS')
    addFlag({ id: 'psychotic_symptoms', label: 'Psychotic symptoms (hallucinations)', severity: 'high' })
    addAction({ id: 'refer_psych', label: 'Refer to Psychiatry', priority: 'urgent' })
  }

  // --- E. Vitality
  // PDF: any vitality issue → MNA
  const vitalityIssue =
    ctx.vitalityScore >= 1 ||
    ctx.flags.has('weight_loss') ||
    ctx.flags.has('reduced_appetite')
  if (vitalityIssue) {
    addScale('MNA')
    addFlag({
      id: 'nutritional_risk',
      label: 'Nutritional risk',
      severity: ctx.flags.has('weight_loss') ? 'high' : 'moderate',
    })
    addAction({ id: 'nutrition', label: 'Nutritional assessment & dietitian referral', priority: 'soon' })
  }

  // --- F. Social
  // PDF: isolation → UCLA + GDS
  const lonely = (ctx.answers['soc_1'] ?? 0) >= 2
  const reducedInteraction = (ctx.answers['soc_2'] ?? 0) >= 2
  const isolation = lonely || reducedInteraction
  if (isolation) {
    addScale('UCLA'); addScale('GDS')
    addFlag({ id: 'social_isolation', label: 'Social isolation', severity: 'moderate' })
    addAction({ id: 'community_support', label: 'Community engagement & social support', priority: 'soon' })
  }
  // PDF: unusual behaviour → BPRS
  if (ctx.flags.has('unusual_behavior')) {
    addScale('BPRS')
    addFlag({ id: 'behavioral_change', label: 'Behavioural change reported by family', severity: 'high' })
    addAction({ id: 'refer_psych', label: 'Refer to Psychiatry', priority: 'urgent' })
  }

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
  assessorRole?: UserRole | null,
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
  const { scales, riskFlags, actions, emergency } = runDecisionEngine(ctx, assessorRole)
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
  assessorRole?: UserRole | null,
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
  return calculateAssessmentResult(domainAnswers, assessorRole)
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

