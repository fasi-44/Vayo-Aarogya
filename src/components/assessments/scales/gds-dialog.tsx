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
  GDS_QUESTIONS,
  calculateGDS,
  type GDSAnswer,
  type GDSAnswers,
  type GDSQuestion,
  type GDSResult,
} from '@/lib/clinical-scales/gds'
import { Heart, RotateCcw, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store'

interface GDSDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectName?: string
  onComplete?: (result: GDSResult, answers: GDSAnswers) => void
  initialAnswers?: GDSAnswers
  viewOnly?: boolean
}

export function GDSDialog({ open, onOpenChange, subjectName, onComplete, initialAnswers, viewOnly }: GDSDialogProps) {
  const [answers, setAnswers] = useState<GDSAnswers>({})
  const { user } = useAuthStore()
  const hideRiskLabel = user?.role === 'elderly' || user?.role === 'family'

  useEffect(() => {
    if (open && initialAnswers) setAnswers(initialAnswers)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const result = useMemo(() => calculateGDS(answers), [answers])
  const completionPercent = (result.answeredCount / result.totalQuestions) * 100

  const setAnswer = (id: string, value: GDSAnswer) => {
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
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">Geriatric Depression Scale — Short Form (GDS-15)</DialogTitle>
              <DialogDescription className="mt-1">
                Circle the answer that best describes how you felt over the <span className="underline">past week</span>.
                
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
              <span>💬</span>
              <span>Depression Symptoms (past week)</span>
            </h3>
            <Badge variant="outline" className="text-xs bg-background">
              {result.total}/{result.maxTotal}
            </Badge>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/60">
              <tr className="border-b">
                <th className="w-12 text-left font-medium text-muted-foreground px-3 py-2">Q#</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Question</th>
                <th className="w-36 px-2 py-2 text-center bg-primary/10 border-x border-primary/20">
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">Yes</span>
                </th>
                <th className="w-36 px-2 py-2 text-center bg-primary/10 border-x border-primary/20">
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">No</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {GDS_QUESTIONS.map(q => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  value={answers[q.id]}
                  onChange={v => setAnswer(q.id, v)}
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
              {!hideRiskLabel && (
                <Badge className={cn('font-medium', getBandClass(result.band))}>
                  {result.bandLabel}
                </Badge>
              )}
              {!hideRiskLabel && result.depressionLikely && (
                <Badge variant="outline" className="text-[11px] border-orange-300 text-orange-700">
                  ≥5 — depression suggested
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
  question: GDSQuestion
  value: GDSAnswer | undefined
  onChange: (value: GDSAnswer) => void
}

function QuestionRow({ question, value, onChange }: QuestionRowProps) {
  const answers: GDSAnswer[] = ['yes', 'no']

  return (
    <tr
      className={cn(
        'border-b align-middle transition-colors hover:bg-muted/30',
        value !== undefined && 'bg-primary/[0.02]'
      )}
    >
      <td className="px-3 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
        {question.number}
      </td>
      <td className="px-3 py-3">
        <p className="text-sm font-medium leading-snug">{question.prompt}</p>
      </td>
      {answers.map(ans => {
        const selected = value === ans
        return (
          <td key={ans} className="px-2 py-3 text-center">
            <button
              type="button"
              onClick={() => onChange(ans)}
              aria-label={ans}
              className={cn(
                'w-10 h-10 rounded-full border-2 text-xs font-semibold transition-colors mx-auto block',
                selected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {ans === 'yes' ? 'Y' : 'N'}
            </button>
          </td>
        )
      })}
    </tr>
  )
}

function getBandClass(band: GDSResult['band']): string {
  switch (band) {
    case 'normal':   return 'bg-green-100 text-green-700 hover:bg-green-100'
    case 'mild':     return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
    case 'moderate': return 'bg-orange-100 text-orange-700 hover:bg-orange-100'
    case 'severe':   return 'bg-red-100 text-red-700 hover:bg-red-100'
  }
}
