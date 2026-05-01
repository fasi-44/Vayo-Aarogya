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
  CAM_SECTION_META,
  INATTENTION_OPTIONS,
  LOC_OPTIONS,
  YESNO_OPTIONS,
  calculateCAM,
  groupCAMQuestions,
  type CAMAnswers,
  type CAMFeatureStatus,
  type CAMQuestion,
  type CAMResult,
  type InattentionSeverity,
  type LOCLevel,
  type YesNoUncertain,
} from '@/lib/clinical-scales/cam'
import { Stethoscope, RotateCcw, CheckCircle2, Check, X, HelpCircle } from 'lucide-react'

interface CAMDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Optional name of the person being assessed — shown in the header. */
  subjectName?: string
  /** Called with the final result when the assessor clicks Save. */
  onComplete?: (result: CAMResult, answers: CAMAnswers) => void
}

export function CAMDialog({ open, onOpenChange, subjectName, onComplete }: CAMDialogProps) {
  const [answers, setAnswers] = useState<CAMAnswers>({})

  const result = useMemo(() => calculateCAM(answers), [answers])
  const groups = useMemo(() => groupCAMQuestions(), [])
  const completionPercent = (result.answeredCount / result.totalQuestions) * 100

  const setAnswer = <K extends keyof CAMAnswers>(id: K, value: CAMAnswers[K]) => {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  const handleReset = () => setAnswers({})

  const handleSave = () => {
    onComplete?.(result, answers)
    onOpenChange(false)
  }

  // Inattention is "present" when severity = mild OR marked. Used to gate Q2B / Q2C.
  const inattentionPresent =
    answers.q2a_inattention === 'mild' || answers.q2a_inattention === 'marked'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none w-[90vw] max-h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">Confusion Assessment Method (CAM)</DialogTitle>
              <DialogDescription className="mt-1">
                Delirium screening — administer at the bedside or via interview with caregiver.
                
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

        {/* Body — table layout */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <tr className="border-b">
                <th className="w-16 text-left font-medium text-muted-foreground px-3 py-2">Q#</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Question</th>
                <th className="w-[35%] text-left font-medium text-muted-foreground px-3 py-2">Response</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(({ section, questions }) => {
                const meta = CAM_SECTION_META[section]
                return (
                  <FragmentSection key={section}>
                    <tr className="bg-primary/5 border-y border-primary/20">
                      <td colSpan={3} className="px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
                            <span>{meta.emoji}</span>
                            <span>{meta.name}</span>
                          </h3>
                          {section === 'context' && (
                            <Badge variant="outline" className="text-[10px] bg-background">
                              Not in algorithm
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                    {questions.map(q => {
                      const disabled = q.conditionalOnInattention && !inattentionPresent
                      return (
                        <QuestionRow
                          key={q.id}
                          question={q}
                          answers={answers}
                          disabled={disabled}
                          onSet={setAnswer}
                        />
                      )
                    })}
                  </FragmentSection>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={cn('font-semibold text-sm px-3 py-1', getBandClass(result.band))}>
                  {result.bandLabel}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {result.total}/4 features positive
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <FeatureChip label="F1: Acute & fluctuating" status={result.feature1} />
                <FeatureChip label="F2: Inattention" status={result.feature2} />
                <FeatureChip label="F3: Disorganized" status={result.feature3} />
                <FeatureChip label="F4: Altered LOC" status={result.feature4} />
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

// Wrapper to keep React keys clean for grouped rows.
function FragmentSection({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

interface QuestionRowProps {
  question: CAMQuestion
  answers: CAMAnswers
  disabled?: boolean
  onSet: <K extends keyof CAMAnswers>(id: K, value: CAMAnswers[K]) => void
}

function QuestionRow({ question, answers, disabled, onSet }: QuestionRowProps) {
  const value = answers[question.id]
  const hasValue =
    value !== undefined &&
    value !== null &&
    (typeof value !== 'string' || value.trim() !== '')

  return (
    <tr
      className={cn(
        'border-b align-top transition-colors hover:bg-muted/30',
        hasValue && !disabled && 'bg-primary/[0.02]',
        disabled && 'opacity-50'
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
        {question.algorithmic && (
          <Badge variant="outline" className="text-[10px] mt-2 bg-primary/5">
            Algorithm item
          </Badge>
        )}
      </td>
      <td className="px-3 py-3">
        {question.inputType === 'yesno' && (
          <PillGroup
            options={YESNO_OPTIONS}
            value={value as YesNoUncertain | undefined}
            disabled={disabled}
            onChange={v => onSet(question.id, v as CAMAnswers[typeof question.id])}
          />
        )}
        {question.inputType === 'inattention' && (
          <PillGroup
            options={INATTENTION_OPTIONS}
            value={value as InattentionSeverity | undefined}
            disabled={disabled}
            onChange={v => onSet(question.id, v as CAMAnswers[typeof question.id])}
          />
        )}
        {question.inputType === 'loc' && (
          <PillGroup
            options={LOC_OPTIONS}
            value={value as LOCLevel | undefined}
            disabled={disabled}
            onChange={v => onSet(question.id, v as CAMAnswers[typeof question.id])}
          />
        )}
        {question.inputType === 'text' && (
          <textarea
            value={(value as string | undefined) ?? ''}
            disabled={disabled}
            onChange={e => onSet(question.id, e.target.value as CAMAnswers[typeof question.id])}
            placeholder={disabled ? 'Available when inattention is present.' : 'Describe observed behavior…'}
            rows={3}
            className={cn(
              'w-full resize-y rounded-md border bg-background px-2.5 py-1.5 text-xs',
              'focus:outline-none focus:ring-1 focus:ring-primary/50',
              'placeholder:text-muted-foreground',
              'disabled:cursor-not-allowed disabled:bg-muted/30'
            )}
          />
        )}
      </td>
    </tr>
  )
}

interface PillOption<T extends string> {
  value: T
  label: string
  description?: string
}

interface PillGroupProps<T extends string> {
  options: PillOption<T>[]
  value: T | undefined
  disabled?: boolean
  onChange: (v: T) => void
}

function PillGroup<T extends string>({ options, value, disabled, onChange }: PillGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            title={opt.description}
            className={cn(
              'px-2.5 py-1 rounded-md border text-xs font-medium transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-60',
              selected
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span>{opt.label}</span>
            {opt.description && (
              <span className="ml-1 opacity-70 italic font-normal">— {opt.description}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function FeatureChip({ label, status }: { label: string; status: CAMFeatureStatus }) {
  const Icon = !status.evaluable ? HelpCircle : status.present ? Check : X
  const variantClass = !status.evaluable
    ? 'bg-muted text-muted-foreground border-border'
    : status.present
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-green-50 text-green-700 border-green-200'

  return (
    <div
      title={status.reason}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium',
        variantClass
      )}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  )
}

function getBandClass(band: CAMResult['band']): string {
  switch (band) {
    case 'positive':
      return 'bg-red-100 text-red-700 hover:bg-red-100'
    case 'negative':
      return 'bg-green-100 text-green-700 hover:bg-green-100'
    case 'incomplete':
      return 'bg-muted text-muted-foreground hover:bg-muted'
  }
}
