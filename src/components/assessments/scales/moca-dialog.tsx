'use client'

import { useEffect, useMemo, useState } from 'react'
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
  MOCA_SECTION_META,
  calculateMoCA,
  groupMoCAQuestions,
  type MoCAAnswers,
  type MoCAQuestion,
  type MoCAResult,
} from '@/lib/clinical-scales/moca'
import { MoCAFigure } from './moca-figures'
import { Brain, RotateCcw, CheckCircle2, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/store'

interface MoCADialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectName?: string
  onComplete?: (result: MoCAResult, answers: MoCAAnswers, lowEducation: boolean) => void
  initialAnswers?: MoCAAnswers
  initialLowEducation?: boolean
  viewOnly?: boolean
}

export function MoCADialog({ open, onOpenChange, subjectName, onComplete, initialAnswers, initialLowEducation, viewOnly }: MoCADialogProps) {
  const [answers, setAnswers] = useState<MoCAAnswers>({})
  const [lowEducation, setLowEducation] = useState(false)
  const { user } = useAuthStore()
  const hideRiskLabel = user?.role === 'elderly' || user?.role === 'family'

  useEffect(() => {
    if (open && initialAnswers) {
      setAnswers(initialAnswers)
      setLowEducation(initialLowEducation ?? false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const result = useMemo(() => calculateMoCA(answers, lowEducation), [answers, lowEducation])
  const groups = useMemo(() => groupMoCAQuestions(), [])
  const completionPercent = (result.answeredCount / result.totalQuestions) * 100

  const setScore = (id: string, value: number) => {
    if (viewOnly) return
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  const handleReset = () => {
    setAnswers({})
    setLowEducation(false)
  }

  const handleSave = () => {
    onComplete?.(result, answers, lowEducation)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none w-[90vw] max-h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">Montreal Cognitive Assessment (MoCA)</DialogTitle>
              <DialogDescription className="mt-1">
                Cognitive screening — Version 8.3 English. Administer all items.
                
              </DialogDescription>
            </div>
            <a
              href="/scales/MoCA.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap mt-1"
            >
              View original form <ExternalLink className="w-3 h-3" />
            </a>
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

        {/* Body — table layout */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <tr className="border-b">
                <th className="w-16 text-left font-medium text-muted-foreground px-3 py-2">Q#</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Question</th>
                <th className="w-[30%] text-left font-medium text-muted-foreground px-3 py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(({ section, questions }) => {
                const meta = MOCA_SECTION_META[section]
                const sectionMax = questions
                  .filter(q => !q.notIncludedInTotal)
                  .reduce((s, q) => s + q.maxScore, 0)
                const sectionScore = questions
                  .filter(q => !q.notIncludedInTotal)
                  .reduce((s, q) => s + (answers[q.id] ?? 0), 0)

                return (
                  <FragmentSection key={section}>
                    <tr className="bg-primary/5 border-y border-primary/20">
                      <td colSpan={3} className="px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
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
                      </td>
                    </tr>
                    {questions.map(q => (
                      <QuestionRow
                        key={q.id}
                        question={q}
                        value={answers[q.id]}
                        onChange={v => setScore(q.id, v)}
                      />
                    ))}
                  </FragmentSection>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-xs text-muted-foreground">Total Score</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{result.total}</span>
                  <span className="text-sm text-muted-foreground">/ {result.maxTotal}</span>
                </div>
                {!hideRiskLabel && (
                  <Badge className={cn('font-medium', getBandClass(result.band))}>
                    {result.bandLabel}
                  </Badge>
                )}
                {result.educationBonus === 1 && (
                  <Badge variant="outline" className="text-[11px]">
                    +1 education
                  </Badge>
                )}
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 accent-primary"
                  checked={lowEducation}
                  onChange={e => setLowEducation(e.target.checked)}
                />
                <span>Subject has ≤12 years of formal education (adds +1, capped at 30)</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              {viewOnly ? (
                <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Reset
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Save Result
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Wrapper to keep React keys clean for grouped rows.
function FragmentSection({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

interface QuestionRowProps {
  question: MoCAQuestion
  value: number | undefined
  onChange: (value: number) => void
}

function QuestionRow({ question, value, onChange }: QuestionRowProps) {
  const options = useMemo(() => {
    const arr: { value: number; label: string }[] = []
    for (let i = 0; i <= question.maxScore; i++) {
      arr.push({
        value: i,
        label: question.scoreLabels?.[i] ?? String(i),
      })
    }
    return arr
  }, [question.maxScore, question.scoreLabels])

  return (
    <tr
      className={cn(
        'border-b align-top transition-colors hover:bg-muted/30',
        value !== undefined && 'bg-primary/[0.02]'
      )}
    >
      <td className="px-3 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
        {question.number}
      </td>
      <td className="px-3 py-3">
        <p className="text-sm font-medium leading-snug">{question.prompt}</p>
        {question.helpText && (
          <p className="text-xs text-muted-foreground/80 italic mt-1 leading-snug">
            {question.helpText}
          </p>
        )}
        {question.notIncludedInTotal && (
          <p className="text-[11px] text-amber-600 mt-1">Not included in MoCA total.</p>
        )}
        {question.figure && (
          <div className="mt-2">
            <MoCAFigure figure={question.figure} />
          </div>
        )}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1.5">
          {options.map(opt => {
            const selected = value === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={cn(
                  'px-2.5 py-1 rounded-md border text-xs font-medium transition-colors',
                  selected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </td>
    </tr>
  )
}

function getBandClass(band: MoCAResult['band']): string {
  switch (band) {
    case 'normal':
      return 'bg-green-100 text-green-700 hover:bg-green-100'
    case 'mild_impairment':
      return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
    case 'moderate_impairment':
      return 'bg-orange-100 text-orange-700 hover:bg-orange-100'
    case 'severe_impairment':
      return 'bg-red-100 text-red-700 hover:bg-red-100'
  }
}
