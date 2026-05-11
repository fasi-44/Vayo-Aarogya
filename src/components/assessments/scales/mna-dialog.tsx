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
  MNA_QUESTIONS,
  MNA_SECTION_META,
  calculateMNA,
  computeProteinScore,
  type MNAAnswers,
  type MNAProteinAnswers,
  type MNAQuestion,
  type MNAResult,
} from '@/lib/clinical-scales/mna'
import { Apple, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store'

interface MNADialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectName?: string
  onComplete?: (result: MNAResult, answers: MNAAnswers) => void
  initialAnswers?: MNAAnswers
  viewOnly?: boolean
}

export function MNADialog({ open, onOpenChange, subjectName, onComplete, initialAnswers, viewOnly }: MNADialogProps) {
  const [answers, setAnswers] = useState<MNAAnswers>({})
  const { user } = useAuthStore()
  const hideRiskLabel = user?.role === 'elderly' || user?.role === 'family'
  const [proteinMarkers, setProteinMarkers] = useState<MNAProteinAnswers>({})

  useEffect(() => {
    if (open && initialAnswers) setAnswers(initialAnswers)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Merge protein score into answers whenever markers change
  const mergedAnswers = useMemo<MNAAnswers>(() => ({
    ...answers,
    k: computeProteinScore(proteinMarkers),
  }), [answers, proteinMarkers])

  const result = useMemo(() => calculateMNA(mergedAnswers), [mergedAnswers])
  const completionPercent = (result.answeredCount / result.totalQuestions) * 100

  const setScore = (id: string, value: number) => {
    if (viewOnly) return
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  const toggleProtein = (key: keyof MNAProteinAnswers) => {
    setProteinMarkers(prev => ({ ...prev, [key]: !prev[key] }))
    // Mark K as answered once any marker is touched
    if (!answers.k_touched) setAnswers(prev => ({ ...prev, k_touched: 1 }))
  }

  const handleReset = () => {
    setAnswers({})
    setProteinMarkers({})
  }

  const handleSave = () => {
    onComplete?.(result, mergedAnswers)
    onOpenChange(false)
  }

  const screeningQuestions = MNA_QUESTIONS.filter(q => q.section === 'screening')
  const assessmentQuestions = MNA_QUESTIONS.filter(q => q.section === 'assessment')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none w-[90vw] max-h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Apple className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">Mini Nutritional Assessment (MNA®)</DialogTitle>
              <DialogDescription className="mt-1">
                Complete Screening (A–F). If score ≤ 11, continue with Assessment (G–R).
                
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

          {/* ── Screening Section ── */}
          <div className="px-3 py-2 bg-primary/5 border-b border-primary/20 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
              <span>{MNA_SECTION_META.screening.emoji}</span>
              <span>{MNA_SECTION_META.screening.name}</span>
            </h3>
            <Badge variant="outline" className="text-xs bg-background">
              {result.screeningScore} / {MNA_SECTION_META.screening.maxScore}
            </Badge>
          </div>

          <div className="divide-y">
            {screeningQuestions.map(q => (
              <QuestionRow
                key={q.id}
                question={q}
                value={mergedAnswers[q.id]}
                proteinMarkers={proteinMarkers}
                onChange={v => setScore(q.id, v)}
                onToggleProtein={toggleProtein}
              />
            ))}
          </div>

          {/* Screening score band strip */}
          <div className={cn(
            'px-4 py-3 border-y flex items-center gap-3 flex-wrap',
            result.screeningBand === 'normal' && 'bg-green-50 border-green-200',
            result.screeningBand === 'at_risk' && 'bg-yellow-50 border-yellow-200',
            result.screeningBand === 'malnourished' && 'bg-red-50 border-red-200',
          )}>
            <span className="text-xs font-semibold">
              Screening score: {result.screeningScore}/14
            </span>
            <Badge className={cn('text-xs', getScreeningBandClass(result.screeningBand))}>
              {result.screeningBand === 'normal' ? '12–14: Normal nutritional status'
                : result.screeningBand === 'at_risk' ? '8–11: At risk of malnutrition'
                : '0–7: Malnourished'}
            </Badge>
            {result.assessmentNeeded && result.screeningComplete && (
              <span className="text-xs text-primary font-medium flex items-center gap-1 ml-auto">
                <AlertCircle className="w-3.5 h-3.5" />
                Continue with Assessment (G–R) below
              </span>
            )}
          </div>

          {/* ── Assessment Section ── */}
          <div className="px-3 py-2 bg-primary/5 border-b border-primary/20 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
              <span>{MNA_SECTION_META.assessment.emoji}</span>
              <span>{MNA_SECTION_META.assessment.name}</span>
              {!result.assessmentNeeded && result.screeningComplete && (
                <span className="text-[10px] text-muted-foreground font-normal normal-case ml-1">
                  (not required — screening ≥ 12)
                </span>
              )}
            </h3>
            <Badge variant="outline" className="text-xs bg-background">
              {result.assessmentScore} / {MNA_SECTION_META.assessment.maxScore}
            </Badge>
          </div>

          <div className="divide-y">
            {assessmentQuestions.map(q => (
              <QuestionRow
                key={q.id}
                question={q}
                value={mergedAnswers[q.id]}
                proteinMarkers={proteinMarkers}
                onChange={v => setScore(q.id, v)}
                onToggleProtein={toggleProtein}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Screening {result.screeningScore}/14</span>
                  <span className="text-muted-foreground/40">+</span>
                  <span>Assessment {result.assessmentScore}/16</span>
                  <span className="text-muted-foreground/40">=</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{result.total}</span>
                  <span className="text-sm text-muted-foreground">/ 30</span>
                </div>
                {!hideRiskLabel && result.totalBand && (
                  <Badge className={cn('font-medium', getTotalBandClass(result.totalBand))}>
                    {result.bandLabel}
                  </Badge>
                )}
                {!hideRiskLabel && !result.totalBand && result.screeningComplete && (
                  <Badge className={cn('font-medium', getScreeningBandClass(result.screeningBand))}>
                    {result.bandLabel}
                  </Badge>
                )}
              </div>
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
  question: MNAQuestion
  value: number | undefined
  proteinMarkers: MNAProteinAnswers
  onChange: (value: number) => void
  onToggleProtein: (key: keyof MNAProteinAnswers) => void
}

function optionGridClass(count: number): string {
  if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2'
  if (count === 3) return 'grid grid-cols-1 sm:grid-cols-3'
  return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
}

function QuestionRow({ question, value, proteinMarkers, onChange, onToggleProtein }: QuestionRowProps) {
  const isAnswered = question.inputType === 'protein_markers'
    ? Object.keys(proteinMarkers).length > 0
    : value !== undefined

  return (
    <div className={cn('px-4 py-3 transition-colors', isAnswered && 'bg-primary/[0.02]')}>
      <div className="flex gap-2">
        {/* Letter badge — fixed width so options align with question text */}
        <span className="shrink-0 w-6 text-xs font-bold text-primary pt-0.5 text-right">
          {question.letter}
        </span>

        <div className="flex-1 min-w-0">
          {/* Question */}
          <p className="text-sm font-medium leading-snug mb-2">{question.prompt}</p>
          {question.helpText && (
            <p className="text-xs text-muted-foreground/80 italic mb-2">{question.helpText}</p>
          )}

          {/* Options below the question, responsive grid */}
          {question.inputType === 'protein_markers' ? (
            <ProteinMarkersInput markers={proteinMarkers} onToggle={onToggleProtein} />
          ) : (
            <div className={cn(optionGridClass(question.options!.length), 'gap-2')}>
              {question.options!.map(opt => {
                const selected = value === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={cn(
                      'text-left px-3 py-2 rounded-md border text-xs transition-colors h-full',
                      selected
                        ? 'bg-primary/10 border-primary text-foreground font-medium'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProteinMarkersInput({
  markers,
  onToggle,
}: {
  markers: MNAProteinAnswers
  onToggle: (key: keyof MNAProteinAnswers) => void
}) {
  const score = computeProteinScore(markers)
  const items: { key: keyof MNAProteinAnswers; label: string }[] = [
    { key: 'dairy',   label: 'At least one serving of dairy products (milk, cheese, yoghurt) per day' },
    { key: 'legumes', label: 'Two or more servings of legumes or eggs per week' },
    { key: 'meat',    label: 'Meat, fish or poultry every day' },
  ]

  return (
    <div className="space-y-2">
      {items.map(({ key, label }) => (
        <label key={key} className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={!!markers[key]}
            onChange={() => onToggle(key)}
            className="w-4 h-4 mt-0.5 accent-primary shrink-0"
          />
          <span className="text-xs text-muted-foreground group-hover:text-foreground leading-snug transition-colors">
            {label}
          </span>
        </label>
      ))}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Score:</span>
        <Badge variant="outline" className="text-xs font-mono">{score.toFixed(1)}</Badge>
        <span className="text-[11px] text-muted-foreground">
          ({[markers.dairy, markers.legumes, markers.meat].filter(Boolean).length} of 3 yes)
        </span>
      </div>
    </div>
  )
}

function getScreeningBandClass(band: MNAResult['screeningBand']): string {
  switch (band) {
    case 'normal':       return 'bg-green-100 text-green-700 hover:bg-green-100'
    case 'at_risk':      return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
    case 'malnourished': return 'bg-red-100 text-red-700 hover:bg-red-100'
  }
}

function getTotalBandClass(band: NonNullable<MNAResult['totalBand']>): string {
  switch (band) {
    case 'normal':       return 'bg-green-100 text-green-700 hover:bg-green-100'
    case 'at_risk':      return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
    case 'malnourished': return 'bg-red-100 text-red-700 hover:bg-red-100'
  }
}
