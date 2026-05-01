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
  BSS_SECTION_META,
  calculateBSS,
  groupBSSItems,
  type BSSAnswers,
  type BSSItem,
  type BSSResult,
} from '@/lib/clinical-scales/bss'
import { ShieldAlert, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react'

interface BSSDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectName?: string
  onComplete?: (result: BSSResult, answers: BSSAnswers) => void
}

export function BSSDialog({ open, onOpenChange, subjectName, onComplete }: BSSDialogProps) {
  const [answers, setAnswers] = useState<BSSAnswers>({})

  const result = useMemo(() => calculateBSS(answers), [answers])
  const groups = useMemo(() => groupBSSItems(), [])
  const completionPercent = (result.answeredCount / result.totalQuestions) * 100

  const setAnswer = (id: string, value: 0 | 1 | 2) => {
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
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">Beck's Suicide Intent Scale (BSS)</DialogTitle>
              <DialogDescription className="mt-1">
                Clinician-administered. Rate each item based on the attempt being assessed.
                
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

        {/* High-risk alert banner */}
        {result.band === 'high' && (
          <div className="px-6 py-3 border-b bg-red-50 border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-semibold text-sm text-red-700">⚠ High Risk — Immediate psychiatric assessment required</p>
                <p className="text-xs text-red-700 mt-0.5">
                  Psychiatric admission is recommended. Involuntary admission may be required depending on the seriousness of intent.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {groups.map(({ section, items }) => {
            const meta = BSS_SECTION_META[section]
            const sectionScored = items.filter(i => !i.notIncludedInTotal)
            const sectionTotal = sectionScored.reduce((s, i) => s + (answers[i.id] ?? 0), 0)
            const sectionMax = sectionScored.length * 2

            return (
              <section key={section}>
                {/* Section title above column headers */}
                <div className="px-3 py-2 bg-primary/5 border-y border-primary/20 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
                    <span>{meta.emoji}</span>
                    <span>{meta.name}</span>
                  </h3>
                  {sectionMax > 0 && (
                    <Badge variant="outline" className="text-xs bg-background">
                      {sectionTotal}/{sectionMax}
                    </Badge>
                  )}
                </div>

                <div className="divide-y">
                  {items.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      value={answers[item.id]}
                      onChange={v => setAnswer(item.id, v)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-start justify-between gap-3 flex-wrap">
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
              </div>
              {result.band !== 'low' && (
                <p className="text-xs text-muted-foreground max-w-lg">{result.recommendation}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className={result.band === 'high' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
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
  item: BSSItem
  value: 0 | 1 | 2 | undefined
  onChange: (value: 0 | 1 | 2) => void
}

function ItemRow({ item, value, onChange }: ItemRowProps) {
  return (
    <div className={cn('px-4 py-3 transition-colors', value !== undefined && 'bg-primary/[0.02]')}>
      {/* Number + content in a flex row so options align with the question text */}
      <div className="flex gap-2">
        <span className="text-xs font-mono text-muted-foreground shrink-0 pt-0.5 w-6 text-right">
          {item.number}.
        </span>

        <div className="flex-1 min-w-0">
          {/* Question name */}
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-semibold leading-snug">{item.itemName}</p>
            {item.notIncludedInTotal && (
              <span className="text-[11px] text-amber-600 shrink-0">(not scored)</span>
            )}
          </div>

          {/* Responsive option cards — stacked on mobile, side-by-side on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {item.options.map(opt => {
              const selected = value === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange(opt.value)}
                  className={cn(
                    'text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-xs transition-colors h-full',
                    selected
                      ? 'bg-primary/10 border-primary text-foreground'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-muted-foreground/40'
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold mt-0.5',
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-muted-foreground/40 text-muted-foreground'
                    )}
                  >
                    {opt.value}
                  </span>
                  <span className={cn('leading-snug', selected && 'font-medium text-foreground')}>
                    {opt.statement}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function getBandClass(band: BSSResult['band']): string {
  switch (band) {
    case 'low':    return 'bg-green-100 text-green-700 hover:bg-green-100'
    case 'medium': return 'bg-orange-100 text-orange-700 hover:bg-orange-100'
    case 'high':   return 'bg-red-100 text-red-700 hover:bg-red-100'
  }
}
