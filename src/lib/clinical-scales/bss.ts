// Beck's Suicide Intent Scale (BSS)
//
// Beck AT et al. (1974). The assessment of suicidal intention:
// The Scale for Suicide Ideation. Journal of Consulting and Clinical Psychology.
//
// 15 scored items (0–2 each) → total /30, split into two parts:
//   Part I  (items 1–8):  Objective circumstances surrounding the attempt
//   Part II (items 9–15): Self-report of ideation / intent
//
// 5 supplementary items (16–20) are administered for clinical context
// but are NOT added to the /30 total.
//
// Risk bands:
//    0–10  Low Risk    — send home; community follow-up
//   11–19  Medium Risk — CMHT / psychiatrist assessment
//   20–30  High Risk   — immediate psychiatric assessment / admission

export type BSSSection = 'part1' | 'part2' | 'supplementary'

export interface BSSOption {
  value: 0 | 1 | 2
  statement: string
}

export interface BSSItem {
  id: string
  number: number
  section: BSSSection
  itemName: string
  options: [BSSOption, BSSOption, BSSOption]
  /** Supplementary items (16–20) are not added to the /30 total. */
  notIncludedInTotal?: boolean
}

export const BSS_SECTION_META: Record<BSSSection, { name: string; emoji: string }> = {
  part1:         { name: 'Part I — Objective Circumstances Surrounding the Attempt', emoji: '🔍' },
  part2:         { name: 'Part II — Self-Report',                                    emoji: '🧩' },
  supplementary: { name: 'Supplementary Items (clinical context, not scored)',        emoji: '📋' },
}

export const BSS_ITEMS: BSSItem[] = [
  // Part I — Objective circumstances
  { id: 'isolation', number: 1, section: 'part1', itemName: 'Isolation',
    options: [
      { value: 0, statement: 'Somebody present' },
      { value: 1, statement: 'Somebody nearby, or in visual or vocal contact' },
      { value: 2, statement: 'No one nearby or in visual or vocal contact' },
    ] },
  { id: 'timing', number: 2, section: 'part1', itemName: 'Timing',
    options: [
      { value: 0, statement: 'Intervention is probable' },
      { value: 1, statement: 'Intervention is not likely' },
      { value: 2, statement: 'Intervention is highly unlikely' },
    ] },
  { id: 'precautions', number: 3, section: 'part1', itemName: 'Precautions Against Discovery / Intervention',
    options: [
      { value: 0, statement: 'No precautions' },
      { value: 1, statement: 'Passive precautions (avoiding others but doing nothing to prevent intervention; alone in room with unlocked door)' },
      { value: 2, statement: 'Active precautions (locked door)' },
    ] },
  { id: 'acting_help', number: 4, section: 'part1', itemName: 'Acting to Get Help During / After Attempt',
    options: [
      { value: 0, statement: 'Notified potential helper regarding attempt' },
      { value: 1, statement: 'Contacted but did not specifically notify potential helper regarding attempt' },
      { value: 2, statement: 'Did not contact or notify potential helper' },
    ] },
  { id: 'final_acts', number: 5, section: 'part1', itemName: 'Final Acts in Anticipation of Death (will, gifts, insurance)',
    options: [
      { value: 0, statement: 'None' },
      { value: 1, statement: 'Thought about or made some arrangements' },
      { value: 2, statement: 'Made definite plans or completed arrangements' },
    ] },
  { id: 'active_prep', number: 6, section: 'part1', itemName: 'Active Preparation for Attempt',
    options: [
      { value: 0, statement: 'None' },
      { value: 1, statement: 'Minimal to moderate' },
      { value: 2, statement: 'Extensive' },
    ] },
  { id: 'suicide_note', number: 7, section: 'part1', itemName: 'Suicide Note',
    options: [
      { value: 0, statement: 'Absence of note' },
      { value: 1, statement: 'Note written, but torn up; note thought about' },
      { value: 2, statement: 'Presence of note' },
    ] },
  { id: 'overt_comm', number: 8, section: 'part1', itemName: 'Overt Communication of Intent Before the Attempt',
    options: [
      { value: 0, statement: 'None' },
      { value: 1, statement: 'Equivocal communication' },
      { value: 2, statement: 'Unequivocal communication' },
    ] },

  // Part II — Self-report
  { id: 'purpose', number: 9, section: 'part2', itemName: 'Alleged Purpose of Attempt',
    options: [
      { value: 0, statement: 'To manipulate environment, get attention, revenge' },
      { value: 1, statement: 'Components of "0" and "2"' },
      { value: 2, statement: 'To escape, surcease, solve problems' },
    ] },
  { id: 'fatality', number: 10, section: 'part2', itemName: 'Expectations of Fatality',
    options: [
      { value: 0, statement: 'Thought that death was unlikely' },
      { value: 1, statement: 'Thought that death was possible but not probable' },
      { value: 2, statement: 'Thought that death was probable or certain' },
    ] },
  { id: 'lethality', number: 11, section: 'part2', itemName: "Conception of Method's Lethality",
    options: [
      { value: 0, statement: 'Did less to self than thought would be lethal' },
      { value: 1, statement: "Wasn't sure if what was done would be lethal" },
      { value: 2, statement: 'Equaled or exceeded what was thought would be lethal' },
    ] },
  { id: 'seriousness', number: 12, section: 'part2', itemName: 'Seriousness of Attempt',
    options: [
      { value: 0, statement: 'Did not seriously attempt to end life' },
      { value: 1, statement: 'Uncertain about seriousness to end life' },
      { value: 2, statement: 'Seriously attempted to end life' },
    ] },
  { id: 'attitude', number: 13, section: 'part2', itemName: 'Attitude Toward Living / Dying',
    options: [
      { value: 0, statement: 'Did not want to die' },
      { value: 1, statement: 'Components of "0" and "2"' },
      { value: 2, statement: 'Wanted to die' },
    ] },
  { id: 'rescuability', number: 14, section: 'part2', itemName: 'Conception of Medical Rescuability',
    options: [
      { value: 0, statement: 'Thought that death would be unlikely if medical attention was received' },
      { value: 1, statement: 'Was uncertain whether death could be averted by medical attention' },
      { value: 2, statement: 'Was certain of death even if medical attention was received' },
    ] },
  { id: 'premeditation', number: 15, section: 'part2', itemName: 'Degree of Premeditation',
    options: [
      { value: 0, statement: 'None; impulsive' },
      { value: 1, statement: 'Suicide contemplated for three hours or less prior to attempt' },
      { value: 2, statement: 'Suicide contemplated for more than three hours prior to attempt' },
    ] },

  // Supplementary items — not scored toward /30 total
  { id: 'reaction', number: 16, section: 'supplementary', itemName: 'Reaction to Attempt',
    notIncludedInTotal: true,
    options: [
      { value: 0, statement: 'Sorry about attempt; feels foolish, ashamed' },
      { value: 1, statement: 'Accepts both attempt and its failure' },
      { value: 2, statement: 'Regrets failure of attempt' },
    ] },
  { id: 'visualization', number: 17, section: 'supplementary', itemName: 'Visualization of Death',
    notIncludedInTotal: true,
    options: [
      { value: 0, statement: 'Life-after-death, reunion with decedents' },
      { value: 1, statement: 'Never-ending sleep, darkness, end-of-things' },
      { value: 2, statement: 'No conceptions of, or thoughts about death' },
    ] },
  { id: 'prev_attempts', number: 18, section: 'supplementary', itemName: 'Number of Previous Attempts',
    notIncludedInTotal: true,
    options: [
      { value: 0, statement: 'None' },
      { value: 1, statement: 'One or two' },
      { value: 2, statement: 'Three or more' },
    ] },
  { id: 'alcohol', number: 19, section: 'supplementary', itemName: 'Relationship Between Alcohol Intake and Attempt',
    notIncludedInTotal: true,
    options: [
      { value: 0, statement: 'Some alcohol intake prior to but not related to attempt; not enough to impair judgment or reality testing' },
      { value: 1, statement: 'Enough alcohol intake to impair judgment, reality testing and diminish responsibility / impulse control' },
      { value: 2, statement: 'Intentional intake of alcohol in order to facilitate implementation of suicide attempt' },
    ] },
  { id: 'drugs', number: 20, section: 'supplementary', itemName: 'Relationship Between Drug Intake and Attempt',
    notIncludedInTotal: true,
    options: [
      { value: 0, statement: 'Some drug intake prior to but not related to attempt; not enough to impair judgment or reality testing' },
      { value: 1, statement: 'Enough drug intake to impair judgment, reality testing and diminish responsibility / impulse control' },
      { value: 2, statement: 'Intentional drug intake in order to facilitate implementation of suicide attempt' },
    ] },
]

export const BSS_MAX_TOTAL = 30  // 15 scored items × max 2

export type BSSAnswers = Record<string, 0 | 1 | 2>

export type BSSBand = 'low' | 'medium' | 'high'

export interface BSSResult {
  total: number
  maxTotal: number
  band: BSSBand
  bandLabel: string
  interpretation: string
  recommendation: string
  answeredCount: number
  totalQuestions: number
}

const SCORED_ITEMS = BSS_ITEMS.filter(i => !i.notIncludedInTotal)
const ALL_ITEMS = BSS_ITEMS

export function calculateBSS(answers: BSSAnswers): BSSResult {
  const total = SCORED_ITEMS.reduce((sum, item) => sum + (answers[item.id] ?? 0), 0)
  const answeredCount = ALL_ITEMS.filter(i => answers[i.id] !== undefined).length

  let band: BSSBand
  let bandLabel: string
  let interpretation: string
  let recommendation: string

  if (total <= 10) {
    band = 'low'
    bandLabel = 'Low Risk'
    interpretation = 'Score indicates low suicide intent.'
    recommendation = 'Send home with advice to see Community Mental Health Team or GP.'
  } else if (total <= 19) {
    band = 'medium'
    bandLabel = 'Medium Risk'
    interpretation = 'Score indicates medium suicide intent.'
    recommendation = 'Assessment by Community Mental Health Team or Psychiatrist is advisable. If treatment is refused, arrange CMHT follow-up. Admission is an option if the patient lives alone, has attempted suicide before, and/or is depressed.'
  } else {
    band = 'high'
    bandLabel = 'High Risk'
    interpretation = 'Score indicates high suicide intent.'
    recommendation = 'Immediate assessment by Psychiatrist or Community Mental Health Team. Psychiatric admission is recommended. Involuntary admission may be required depending on the seriousness of intent.'
  }

  return {
    total,
    maxTotal: BSS_MAX_TOTAL,
    band,
    bandLabel,
    interpretation,
    recommendation,
    answeredCount,
    totalQuestions: ALL_ITEMS.length,
  }
}

/** Group items by section, preserving canonical order. */
export function groupBSSItems(): { section: BSSSection; items: BSSItem[] }[] {
  const groups = new Map<BSSSection, BSSItem[]>()
  for (const item of BSS_ITEMS) {
    const arr = groups.get(item.section) ?? []
    arr.push(item)
    groups.set(item.section, arr)
  }
  return Array.from(groups.entries()).map(([section, items]) => ({ section, items }))
}
