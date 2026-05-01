'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { type Domain, type DomainQuestion, type QuestionOption, SCALE_OPTIONS } from '@/lib/assessment-scoring'
import { cn } from '@/lib/utils'

// Default options with color property for styling
const DEFAULT_OPTIONS = SCALE_OPTIONS.map(opt => ({ ...opt, color: opt.color as 'green' | 'yellow' | 'red' }))

interface DomainQuestionCardProps {
  domain: Domain
  answers: Record<string, number>
  notes: string
  onAnswerChange: (questionId: string, value: number) => void
  onNotesChange: (notes: string) => void
  showValidationErrors?: boolean
}

export function DomainQuestionCard({
  domain,
  answers,
  notes,
  onAnswerChange,
  onNotesChange,
  showValidationErrors = false,
}: DomainQuestionCardProps) {
  const totalQuestions = domain.questions.length
  const answeredCount = domain.questions.filter(q => answers[q.id] !== undefined).length
  const unansweredCount = totalQuestions - answeredCount
  const allAnswered = unansweredCount === 0
  const hasValidationError = showValidationErrors && unansweredCount > 0

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{domain.emoji}</span>
            <div>
              <CardTitle className="text-xl">{domain.name}</CardTitle>
              <CardDescription className="mt-1 text-base">{domain.description}</CardDescription>
            </div>
          </div>
          <Badge
            className={cn(
              'flex items-center gap-1 text-sm px-3 py-1',
              hasValidationError && 'bg-destructive text-destructive-foreground',
              !hasValidationError && allAnswered && 'bg-moss-500 text-white',
              !hasValidationError && !allAnswered && 'bg-white text-foreground border'
            )}
          >
            {hasValidationError ? (
              <AlertTriangle className="w-4 h-4" />
            ) : allAnswered ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : null}
            {answeredCount}/{totalQuestions}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {domain.questions.map((question, idx) => (
          <QuestionItem
            key={question.id}
            question={question}
            index={idx + 1}
            value={answers[question.id]}
            onChange={(value) => onAnswerChange(question.id, value)}
            showError={showValidationErrors && answers[question.id] === undefined}
          />
        ))}

        <div className="pt-4 border-t">
          <Label htmlFor={`notes-${domain.id}`} className="text-base font-medium flex items-center gap-2">
            <span>📝</span> Additional Notes (Optional)
          </Label>
          <Textarea
            id={`notes-${domain.id}`}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={`Any additional observations for ${domain.name}...`}
            rows={2}
            className="mt-2 text-base"
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface QuestionItemProps {
  question: DomainQuestion
  index: number
  value: number | undefined
  onChange: (value: number) => void
  showError?: boolean
}

// Get color based on option value relative to the max for this question.
function getOptionColor(optValue: number, maxValue: number): 'green' | 'yellow' | 'red' {
  if (maxValue <= 0) return 'green'
  const ratio = optValue / maxValue
  if (ratio === 0) return 'green'
  if (ratio < 1) return 'yellow'
  return 'red'
}

function QuestionItem({ question, index, value, onChange, showError }: QuestionItemProps) {
  // Use question-specific options if available, otherwise use defaults
  const options = question.options || DEFAULT_OPTIONS
  // Colour ramp is driven by the option's *scoring* contribution — not its
  // storage `value` — so an option like Increased social interaction
  // (value=3, score=0) still renders as green.
  const maxOptionScore = Math.max(...options.map(o => o.score ?? o.value))
  // Pick column count based on # of options. Tailwind needs static class names.
  const gridCols =
    options.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
    options.length === 4 ? 'grid-cols-2 sm:grid-cols-4' :
    'grid-cols-1 sm:grid-cols-3'

  return (
    <div className={cn(
      'rounded-xl p-5 transition-all',
      showError ? 'bg-coral-50 border-2 border-coral-300 ring-2 ring-coral-200' : 'bg-muted/40 border border-muted',
      value !== undefined && 'border-primary/30 bg-primary/5'
    )}>
      {/* Question Header with Emoji */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center text-3xl border">
          {question.emoji}
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-primary">
            {question.shortLabel}
          </p>
          <p className="text-base text-muted-foreground mt-1">
            {question.question}
          </p>
        </div>
      </div>

      {/* Scale Options - Large Buttons */}
      <div className={cn('grid gap-3', gridCols)}>
        {options.map((option, optIdx) => {
          const isSelected = value === option.value
          const color = getOptionColor(option.score ?? option.value, maxOptionScore)
          return (
            <button
              key={`${option.value}-${optIdx}`}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all min-h-[100px]',
                'hover:scale-[1.02] active:scale-[0.98]',
                isSelected && color === 'green' && 'border-moss-500 bg-moss-50 ring-2 ring-moss-300',
                isSelected && color === 'yellow' && 'border-smoked-500 bg-smoked-50 ring-2 ring-smoked-300',
                isSelected && color === 'red' && 'border-coral-500 bg-coral-50 ring-2 ring-coral-300',
                !isSelected && 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <span className="text-4xl mb-2">{option.emoji}</span>
              <span className={cn(
                'text-sm font-semibold text-center leading-tight',
                isSelected && color === 'green' && 'text-moss-700',
                isSelected && color === 'yellow' && 'text-smoked-700',
                isSelected && color === 'red' && 'text-coral-700',
                !isSelected && 'text-gray-600'
              )}>
                {option.label}
              </span>
              {isSelected && (
                <div className={cn(
                  'absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center',
                  color === 'green' && 'bg-moss-500',
                  color === 'yellow' && 'bg-smoked-500',
                  color === 'red' && 'bg-coral-500'
                )}>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {showError && (
        <p className="text-sm text-coral-600 mt-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Please select an answer
        </p>
      )}
    </div>
  )
}
