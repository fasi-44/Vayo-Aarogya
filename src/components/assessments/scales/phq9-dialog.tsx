'use client'

import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  PHQ9_SECTION_META,
  calculatePHQ9,
  groupPHQ9Questions,
  type PHQ9Answers,
  type PHQ9Question,
  type PHQ9Result,
} from '@/lib/clinical-scales/phq9'
import { ClipboardCheck, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react'

interface PHQ9DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Optional name of the person being assessed — shown in the header. */
  subjectName?: string
  /** Called with the final result when the assessor clicks Save. */
  onComplete?: (result: PHQ9Result, answers: PHQ9Answers) => void
}

export function PHQ9Dialog({ open, onOpenChange, subjectName, onComplete }: PHQ9DialogProps) {
  const [answers, setAnswers] = useState<PHQ9Answers>({})

  const result = useMemo(() => calculatePHQ9(answers), [answers])
  const groups = useMemo(() => groupPHQ9Questions(), [])
  const completionPercent = (result.answeredCount / result.totalQuestions) * 100

  const setScore = (id: string, value: number) => {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  const handleReset = () => setAnswers({})

  const handleSave = () => {
    onComplete?.(result, answers)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none w-[90vw] max-h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">Patient Health Questionnaire-9 (PHQ-9)</DialogTitle>
              <DialogDescription className="mt-1">
                Depression severity screen — over the last 2 weeks, how often have you been bothered by each of the following?
                
              </DialogDescription>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Progress
              value={completionPercent}
              className="h-2 flex-1 bg-primary/15 [&>*]:bg-primary"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {result.answeredCount}/{result.totalQuestions} answered
            </span>
          </div>
        </DialogHeader>

        {/* Suicidality alert banner — visible whenever Q9 ≥ 1 */}
        {result.suicidalityFlag && (
          <div className="px-6 py-3 border-b bg-red-50 border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-semibold text-sm text-red-700">
                  ⚠ Self-harm / suicidality risk reported (Q9 = {result.suicidalityScore})
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  Conduct an immediate suicide-risk assessment. Do not leave the patient alone if active suicidal ideation is present.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Body — one labeled table per section so the section title sits above the column headers */}
        <div className="flex-1 overflow-y-auto">
          {groups.map(({ section, questions }) => {
            const meta = PHQ9_SECTION_META[section]
            const sectionMax = questions
              .filter(q => !q.notIncludedInTotal)
              .reduce((s, q) => s + q.maxScore, 0)
            const sectionScore = questions
              .filter(q => !q.notIncludedInTotal)
              .reduce((s, q) => s + (answers[q.id] ?? 0), 0)

            return (
              <section key={section}>
                {/* Section title strip — above the column headers */}
                <div className="px-3 py-2 bg-primary/5 border-y border-primary/20 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
                    <span>{meta.emoji}</span>
                    <span>{meta.name}</span>
                  </h3>
                  {sectionMax > 0 && (
                    <Badge variant="outline" className="text-xs bg-background">
                      {sectionScore}/{sectionMax}
                    </Badge>
                  )}
                </div>

                <table className="w-full text-sm border-collapse">
                  <thead className="bg-muted/60">
                    <tr className="border-b">
                      <th className="w-12 text-left font-medium text-muted-foreground px-3 py-2">Q#</th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2">Question</th>
                      <ScoreColumnHeader value={0} label="Not at all" />
                      <ScoreColumnHeader value={1} label="Several days" />
                      <ScoreColumnHeader value={2} label="More than half the days" />
                      <ScoreColumnHeader value={3} label="Nearly every day" />
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map(q => (
                      <QuestionRow
                        key={q.id}
                        question={q}
                        value={answers[q.id]}
                        onChange={v => setScore(q.id, v)}
                      />
                    ))}
                  </tbody>
                </table>
              </section>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-xs text-muted-foreground">Total Score</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{result.total}</span>
                  <span className="text-sm text-muted-foreground">/ {result.maxTotal}</span>
                </div>
                <Badge className={cn('font-medium', getBandClass(result.band))}>
                  {result.bandLabel}
                </Badge>
                {result.provisionalDiagnosis !== 'none' && (
                  <Badge variant="outline" className="text-[11px]">
                    {result.provisionalDiagnosis === 'major_depression' ? 'Provisional MDD' : 'Other depressive disorder'}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Save Result
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ScoreColumnHeader({ label }: { value: number; label: string }) {
  return (
    <th className="w-32 px-2 py-2 text-center align-bottom bg-primary/10 border-x border-primary/20">
      <span className="text-[11px] leading-tight font-semibold text-primary uppercase tracking-wide">
        {label}
      </span>
    </th>
  )
}

interface QuestionRowProps {
  question: PHQ9Question
  value: number | undefined
  onChange: (value: number) => void
}

function QuestionRow({ question, value, onChange }: QuestionRowProps) {
  const isSuicidality = question.isSuicidality

  return (
    <tr
      className={cn(
        'border-b align-top transition-colors hover:bg-muted/30',
        value !== undefined && 'bg-primary/[0.02]',
        isSuicidality && (value ?? 0) >= 1 && 'bg-red-50/60 hover:bg-red-50'
      )}
    >
      <td className="px-3 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
        {question.number}
      </td>
      <td className="px-3 py-3">
        <p className={cn('text-sm font-medium leading-snug', isSuicidality && 'text-red-700')}>
          {question.prompt}
        </p>
        {question.helpText && (
          <p className="text-xs text-muted-foreground/80 italic mt-1 leading-snug">
            {question.helpText}
          </p>
        )}
        {question.notIncludedInTotal && (
          <p className="text-[11px] text-amber-600 mt-1">Not included in PHQ-9 total.</p>
        )}
      </td>
      {[0, 1, 2, 3].map(scoreValue => {
        const selected = value === scoreValue
        return (
          <td key={scoreValue} className="px-2 py-3 text-center align-top">
            <button
              type="button"
              onClick={() => onChange(scoreValue)}
              aria-label={`Score ${scoreValue} — ${question.scoreLabels[scoreValue]}`}
              className={cn(
                'w-8 h-8 rounded-full border text-sm font-mono font-semibold transition-colors mx-auto block',
                selected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {scoreValue}
            </button>
          </td>
        )
      })}
    </tr>
  )
}

function getBandClass(band: PHQ9Result['band']): string {
  switch (band) {
    case 'minimal':
      return 'bg-green-100 text-green-700 hover:bg-green-100'
    case 'mild':
      return 'bg-lime-100 text-lime-700 hover:bg-lime-100'
    case 'moderate':
      return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
    case 'moderately_severe':
      return 'bg-orange-100 text-orange-700 hover:bg-orange-100'
    case 'severe':
      return 'bg-red-100 text-red-700 hover:bg-red-100'
  }
}
