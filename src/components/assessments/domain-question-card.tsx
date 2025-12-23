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
  const unansweredQuestions = domain.questions.filter(q => answers[q.id] === undefined)
  const hasUnanswered = unansweredQuestions.length > 0
  const allAnswered = unansweredQuestions.length === 0

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{domain.emoji}</span>
            <div>
              <CardTitle className="text-xl">{domain.name}</CardTitle>
              <CardDescription className="mt-1 text-base">{domain.description}</CardDescription>
            </div>
          </div>
          {showValidationErrors && hasUnanswered ? (
            <Badge variant="destructive" className="flex items-center gap-1 text-sm px-3 py-1">
              <AlertTriangle className="w-4 h-4" />
              {unansweredQuestions.length} left
            </Badge>
          ) : allAnswered ? (
            <Badge className="flex items-center gap-1 text-sm px-3 py-1 bg-green-500">
              <CheckCircle2 className="w-4 h-4" />
              Done
            </Badge>
          ) : null}
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

// Get color based on option value
function getOptionColor(optValue: number): 'green' | 'yellow' | 'red' {
  if (optValue === 0) return 'green'
  if (optValue === 1) return 'yellow'
  return 'red'
}

function QuestionItem({ question, index, value, onChange, showError }: QuestionItemProps) {
  // Use question-specific options if available, otherwise use defaults
  const options = question.options || DEFAULT_OPTIONS

  return (
    <div className={cn(
      'rounded-xl p-5 transition-all',
      showError ? 'bg-red-50 border-2 border-red-300 ring-2 ring-red-200' : 'bg-muted/40 border border-muted',
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((option) => {
          const isSelected = value === option.value
          const color = getOptionColor(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all min-h-[100px]',
                'hover:scale-[1.02] active:scale-[0.98]',
                isSelected && color === 'green' && 'border-green-500 bg-green-50 ring-2 ring-green-300',
                isSelected && color === 'yellow' && 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-300',
                isSelected && color === 'red' && 'border-red-500 bg-red-50 ring-2 ring-red-300',
                !isSelected && 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <span className="text-4xl mb-2">{option.emoji}</span>
              <span className={cn(
                'text-sm font-semibold text-center leading-tight',
                isSelected && color === 'green' && 'text-green-700',
                isSelected && color === 'yellow' && 'text-yellow-700',
                isSelected && color === 'red' && 'text-red-700',
                !isSelected && 'text-gray-600'
              )}>
                {option.label}
              </span>
              {isSelected && (
                <div className={cn(
                  'absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center',
                  color === 'green' && 'bg-green-500',
                  color === 'yellow' && 'bg-yellow-500',
                  color === 'red' && 'bg-red-500'
                )}>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {showError && (
        <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Please select an answer
        </p>
      )}
    </div>
  )
}
