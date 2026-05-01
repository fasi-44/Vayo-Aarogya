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
  BPRS_ITEMS,
  BPRS_SCORE_LABELS,
  BPRS_SCORE_VALUES,
  calculateBPRS,
  type BPRSAnswerValue,
  type BPRSAnswers,
  type BPRSItem,
  type BPRSResult,
} from '@/lib/clinical-scales/bprs'
import { Brain, RotateCcw, CheckCircle2 } from 'lucide-react'

interface BPRSDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectName?: string
  onComplete?: (result: BPRSResult, answers: BPRSAnswers) => void
}

export function BPRSDialog({ open, onOpenChange, subjectName, onComplete }: BPRSDialogProps) {
  const [answers, setAnswers] = useState<BPRSAnswers>({})

  const result = useMemo(() => calculateBPRS(answers), [answers])
  const completionPercent = (result.answeredCount / result.totalQuestions) * 100

  const setAnswer = (id: string, value: BPRSAnswerValue) => {
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
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">Brief Psychiatric Rating Scale (BPRS)</DialogTitle>
              <DialogDescription className="mt-1">
                Rate each of the 24 symptom constructs. Mark NA if a specific symptom cannot be assessed.
                
              </DialogDescription>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Progress
              value={completionPercent}
              className="h-2 flex-1 bg-primary/15 [&>*]:bg-primary"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {result.answeredCount}/{result.totalQuestions} rated
            </span>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Section title above column headers */}
          <div className="px-3 py-2 bg-primary/5 border-b border-primary/20 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
              <span>🧩</span>
              <span>Symptom Constructs — Clinician Rating</span>
            </h3>
            <Badge variant="outline" className="text-xs bg-background">
              {result.total} / {result.ratedCount * 7 || '—'}
              {result.naCount > 0 && <span className="ml-1 text-muted-foreground">({result.naCount} NA)</span>}
            </Badge>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/60 sticky top-0 z-10">
              <tr className="border-b">
                <th className="w-10 text-left font-medium text-muted-foreground px-3 py-2">#</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Symptom</th>
                {/* NA column */}
                <th className="w-14 px-1 py-2 text-center bg-muted border-x border-border">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">NA</span>
                </th>
                {/* Score columns 1–7 */}
                {BPRS_SCORE_VALUES.map(v => (
                  <th
                    key={v}
                    className="w-16 px-1 py-2 text-center bg-primary/10 border-x border-primary/20"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wide leading-tight">
                        {BPRS_SCORE_LABELS[v]}
                      </span>
                      <span className="text-[10px] text-primary/60 font-mono">{v}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BPRS_ITEMS.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  value={answers[item.id]}
                  onChange={v => setAnswer(item.id, v)}
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
                {result.ratedCount > 0 && (
                  <span className="text-sm text-muted-foreground">/ {result.ratedCount * 7}</span>
                )}
              </div>
              {result.band && (
                <Badge className={cn('font-medium', getBandClass(result.band))}>
                  {result.bandLabel}
                </Badge>
              )}
              {result.naCount > 0 && (
                <span className="text-xs text-muted-foreground">{result.naCount} item(s) not assessed</span>
              )}
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

interface ItemRowProps {
  item: BPRSItem
  value: BPRSAnswerValue | undefined
  onChange: (value: BPRSAnswerValue) => void
}

function ItemRow({ item, value, onChange }: ItemRowProps) {
  return (
    <tr
      className={cn(
        'border-b align-middle transition-colors hover:bg-muted/30',
        value !== undefined && 'bg-primary/[0.02]'
      )}
    >
      <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{item.number}</td>
      <td className="px-3 py-2.5 text-sm font-medium">{item.label}</td>

      {/* NA cell */}
      <td className="px-1 py-2.5 text-center">
        <button
          type="button"
          onClick={() => onChange('na')}
          aria-label="Not assessed"
          className={cn(
            'w-8 h-8 rounded-md border text-[11px] font-semibold transition-colors mx-auto block',
            value === 'na'
              ? 'bg-muted-foreground text-background border-muted-foreground shadow-sm'
              : 'bg-background border-border text-muted-foreground hover:bg-muted'
          )}
        >
          NA
        </button>
      </td>

      {/* Score cells 1–7 */}
      {BPRS_SCORE_VALUES.map(scoreValue => {
        const selected = value === scoreValue
        return (
          <td key={scoreValue} className="px-1 py-2.5 text-center">
            <button
              type="button"
              onClick={() => onChange(scoreValue)}
              aria-label={`${scoreValue} — ${BPRS_SCORE_LABELS[scoreValue]}`}
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

function getBandClass(band: NonNullable<BPRSResult['band']>): string {
  switch (band) {
    case 'mild_moderate':   return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
    case 'moderate_severe': return 'bg-orange-100 text-orange-700 hover:bg-orange-100'
    case 'severe':          return 'bg-red-100 text-red-700 hover:bg-red-100'
  }
}
