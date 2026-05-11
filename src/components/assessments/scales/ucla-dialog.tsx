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
  UCLA_QUESTIONS,
  UCLA_SCORE_OPTIONS,
  calculateUCLA,
  type UCLAAnswers,
  type UCLAQuestion,
  type UCLAResult,
} from '@/lib/clinical-scales/ucla'
import { Users, RotateCcw, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store'

interface UCLADialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectName?: string
  onComplete?: (result: UCLAResult, answers: UCLAAnswers) => void
  initialAnswers?: UCLAAnswers
  viewOnly?: boolean
}

export function UCLADialog({ open, onOpenChange, subjectName, onComplete, initialAnswers, viewOnly }: UCLADialogProps) {
  const [answers, setAnswers] = useState<UCLAAnswers>({})
  const { user } = useAuthStore()
  const hideRiskLabel = user?.role === 'elderly' || user?.role === 'family'

  useEffect(() => {
    if (open && initialAnswers) setAnswers(initialAnswers)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const result = useMemo(() => calculateUCLA(answers), [answers])
  const completionPercent = (result.answeredCount / result.totalQuestions) * 100

  const setScore = (id: string, value: number) => {
    if (viewOnly) return
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
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">Three-Item Loneliness Scale (UCLA)</DialogTitle>
              <DialogDescription className="mt-1">
                The next questions are about how you feel about different aspects of your life. For each one, tell me how often you feel that way.
                
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Section title above column headers */}
          <div className="px-3 py-2 bg-primary/5 border-b border-primary/20 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
              <span>🤝</span>
              <span>Loneliness — Frequency of Feelings</span>
            </h3>
            <Badge variant="outline" className="text-xs bg-background">
              {result.total} / {result.maxTotal}
            </Badge>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/60">
              <tr className="border-b">
                <th className="w-12 text-left font-medium text-muted-foreground px-3 py-2">#</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Question</th>
                {UCLA_SCORE_OPTIONS.map(opt => (
                  <th
                    key={opt.value}
                    className="w-40 px-2 py-2 text-center bg-primary/10 border-x border-primary/20"
                  >
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                      {opt.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {UCLA_QUESTIONS.map(q => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  value={answers[q.id]}
                  onChange={v => setScore(q.id, v)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-xs text-muted-foreground">Total Score</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{result.total}</span>
                <span className="text-sm text-muted-foreground">/ {result.maxTotal}</span>
              </div>
              {!hideRiskLabel && result.answeredCount > 0 && (
                <Badge className={cn('font-medium', getBandClass(result.band))}>
                  {result.bandLabel}
                </Badge>
              )}
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

interface QuestionRowProps {
  question: UCLAQuestion
  value: number | undefined
  onChange: (value: number) => void
}

function QuestionRow({ question, value, onChange }: QuestionRowProps) {
  return (
    <tr className={cn(
      'border-b align-middle transition-colors hover:bg-muted/30',
      value !== undefined && 'bg-primary/[0.02]'
    )}>
      <td className="px-3 py-4 text-xs font-mono text-muted-foreground">{question.number}</td>
      <td className="px-3 py-4 text-sm font-medium leading-snug">{question.prompt}</td>
      {UCLA_SCORE_OPTIONS.map(opt => {
        const selected = value === opt.value
        return (
          <td key={opt.value} className="px-2 py-4 text-center">
            <button
              type="button"
              onClick={() => onChange(opt.value)}
              aria-label={opt.label}
              className={cn(
                'w-8 h-8 rounded-full border text-sm font-mono font-semibold transition-colors mx-auto block',
                selected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {opt.value}
            </button>
          </td>
        )
      })}
    </tr>
  )
}

function getBandClass(band: UCLAResult['band']): string {
  switch (band) {
    case 'not_lonely': return 'bg-green-100 text-green-700 hover:bg-green-100'
    case 'lonely':     return 'bg-orange-100 text-orange-700 hover:bg-orange-100'
  }
}
