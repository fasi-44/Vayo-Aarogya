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
  HAMA_ITEMS,
  HAMA_MAX_TOTAL,
  HAMA_SCORE_LABELS,
  calculateHAMA,
  type HAMAAnswers,
  type HAMAItem,
  type HAMAResult,
} from '@/lib/clinical-scales/hama'
import { Activity, RotateCcw, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store'

const SCORE_VALUES = [0, 1, 2, 3, 4] as const

interface HAMADialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectName?: string
  onComplete?: (result: HAMAResult, answers: HAMAAnswers) => void
  initialAnswers?: HAMAAnswers
  viewOnly?: boolean
}

export function HAMADialog({ open, onOpenChange, subjectName, onComplete, initialAnswers, viewOnly }: HAMADialogProps) {
  const [answers, setAnswers] = useState<HAMAAnswers>({})
  const { user } = useAuthStore()
  const hideRiskLabel = user?.role === 'elderly' || user?.role === 'family'

  useEffect(() => {
    if (open && initialAnswers) setAnswers(initialAnswers)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const result = useMemo(() => calculateHAMA(answers), [answers])
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

  const runningTotal = HAMA_ITEMS.reduce((s, item) => s + (answers[item.id] ?? 0), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none w-[90vw] max-h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">Hamilton Anxiety Rating Scale (HAM-A)</DialogTitle>
              <DialogDescription className="mt-1">
                Clinician-rated. Select one of five responses for each of the 14 items based on the patient's condition.
                
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
              <span>🧠</span>
              <span>Anxiety Symptoms — Clinician Rating</span>
            </h3>
            <Badge variant="outline" className="text-xs bg-background">
              {runningTotal}/{HAMA_MAX_TOTAL}
            </Badge>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/60">
              <tr className="border-b">
                <th className="w-10 text-left font-medium text-muted-foreground px-3 py-2">#</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Item</th>
                {SCORE_VALUES.map(v => (
                  <th
                    key={v}
                    className="w-24 px-2 py-2 text-center bg-primary/10 border-x border-primary/20"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                        {HAMA_SCORE_LABELS[v]}
                      </span>
                      <span className="text-[10px] text-primary/60 font-mono">{v}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HAMA_ITEMS.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  value={answers[item.id]}
                  onChange={v => setScore(item.id, v)}
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

interface ItemRowProps {
  item: HAMAItem
  value: number | undefined
  onChange: (value: number) => void
}

function ItemRow({ item, value, onChange }: ItemRowProps) {
  return (
    <tr
      className={cn(
        'border-b align-top transition-colors hover:bg-muted/30',
        value !== undefined && 'bg-primary/[0.02]'
      )}
    >
      <td className="px-3 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
        {item.number}
      </td>
      <td className="px-3 py-3">
        <p className="text-sm font-semibold leading-snug">{item.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.descriptors}</p>
      </td>
      {SCORE_VALUES.map(scoreValue => {
        const selected = value === scoreValue
        return (
          <td key={scoreValue} className="px-2 py-3 text-center align-middle">
            <button
              type="button"
              onClick={() => onChange(scoreValue)}
              aria-label={`${scoreValue} — ${HAMA_SCORE_LABELS[scoreValue]}`}
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

function getBandClass(band: HAMAResult['band']): string {
  switch (band) {
    case 'mild':            return 'bg-green-100 text-green-700 hover:bg-green-100'
    case 'mild_moderate':   return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
    case 'moderate_severe': return 'bg-orange-100 text-orange-700 hover:bg-orange-100'
    case 'severe':          return 'bg-red-100 text-red-700 hover:bg-red-100'
  }
}
