'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  User,
  ClipboardCheck,
} from 'lucide-react'
import { type Assessment } from '@/types'
import {
  ASSESSMENT_DOMAINS,
  type Domain,
  calculateAssessmentResult,
  type AssessmentResult,
} from '@/lib/assessment-scoring'
import { DomainQuestionCard } from '@/components/assessments/domain-question-card'
import { AssessmentSummary } from '@/components/assessments/assessment-summary'
import { getAssessmentById, updateAssessment, type AssessmentFormData } from '@/services/assessments'

// Group domains into logical categories for wizard steps (ICOPE-based)
const DOMAIN_GROUPS = [
  {
    id: 'cognitive',
    name: 'Mind & Mood',
    emoji: '🧠',
    domains: ['cognition', 'mood'],
  },
  {
    id: 'physical',
    name: 'Movement & Falls',
    emoji: '🚶',
    domains: ['mobility'],
  },
  {
    id: 'sensory',
    name: 'Vision & Hearing',
    emoji: '👁️',
    domains: ['vision', 'hearing'],
  },
  {
    id: 'vitality',
    name: 'Food, Weight & Sleep',
    emoji: '🍽️',
    domains: ['vitality', 'sleep'],
  },
  {
    id: 'daily',
    name: 'Daily Activities',
    emoji: '🏠',
    domains: ['continence', 'adl', 'iadl'],
  },
  {
    id: 'social',
    name: 'Social & Healthcare',
    emoji: '👥',
    domains: ['social', 'healthcare'],
  },
]

export default function EditAssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Steps: 1-6 = Domain Groups, 7 = Review & Notes, 8 = Summary
  const [currentStep, setCurrentStep] = useState(1)

  // Domain answers: { [domainId]: { answers: { [questionId]: number }, notes: string } }
  const [domainData, setDomainData] = useState<Record<string, { answers: Record<string, number>; notes: string }>>({})

  // General notes
  const [generalNotes, setGeneralNotes] = useState('')

  // Validation tracking
  const [showValidationErrors, setShowValidationErrors] = useState(false)

  // Assessment result after calculation
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)

  const totalSteps = DOMAIN_GROUPS.length + 2 // Domain Groups + Review + Summary

  // Load assessment data
  useEffect(() => {
    async function loadAssessment() {
      if (!id) return

      setIsLoading(true)
      setError(null)

      try {
        const result = await getAssessmentById(id)

        if (result.success && result.data) {
          const assessmentData = result.data
          setAssessment(assessmentData)
          setGeneralNotes(assessmentData.notes || '')

          // Initialize domain data from existing assessment
          const initialData: Record<string, { answers: Record<string, number>; notes: string }> = {}

          // First initialize all domains with empty values
          ASSESSMENT_DOMAINS.forEach(domain => {
            initialData[domain.id] = { answers: {}, notes: '' }
          })

          // Then populate with existing data from assessment
          if (assessmentData.domains && assessmentData.domains.length > 0) {
            assessmentData.domains.forEach(domain => {
              if (domain.domain && initialData[domain.domain]) {
                initialData[domain.domain] = {
                  answers: domain.answers as Record<string, number> || {},
                  notes: domain.notes || '',
                }
              }
            })
          }

          setDomainData(initialData)
        } else {
          setError(result.error || 'Assessment not found')
        }
      } catch (err) {
        setError('Failed to load assessment')
        console.error('Load assessment error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAssessment()
  }, [id])

  // Get current domain group
  const currentDomainGroup = useMemo(() => {
    if (currentStep >= 1 && currentStep <= DOMAIN_GROUPS.length) {
      return DOMAIN_GROUPS[currentStep - 1]
    }
    return null
  }, [currentStep])

  // Get domains for current step
  const currentDomains = useMemo(() => {
    if (!currentDomainGroup) return []
    return ASSESSMENT_DOMAINS.filter(d => currentDomainGroup.domains.includes(d.id))
  }, [currentDomainGroup])

  // Calculate progress
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100

  // Count answered questions for a domain
  const getAnsweredCount = (domain: Domain): number => {
    const data = domainData[domain.id]
    if (!data) return 0
    return Object.keys(data.answers).length
  }

  // Check if current step is valid
  const isCurrentStepValid = useMemo(() => {
    if (currentStep >= 1 && currentStep <= DOMAIN_GROUPS.length) {
      // Check all questions in current domains are answered
      for (const domain of currentDomains) {
        const data = domainData[domain.id]
        if (!data) return false
        for (const question of domain.questions) {
          if (data.answers[question.id] === undefined) {
            return false
          }
        }
      }
      return true
    }
    return true
  }, [currentStep, currentDomains, domainData])

  // Handle answer change
  const handleAnswerChange = (domainId: string, questionId: string, value: number) => {
    setDomainData(prev => ({
      ...prev,
      [domainId]: {
        ...prev[domainId],
        answers: {
          ...prev[domainId]?.answers,
          [questionId]: value,
        },
      },
    }))
  }

  // Handle notes change
  const handleNotesChange = (domainId: string, notes: string) => {
    setDomainData(prev => ({
      ...prev,
      [domainId]: {
        ...prev[domainId],
        notes,
      },
    }))
  }

  // Scroll to top of page
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Navigate to next step
  const handleNext = () => {
    if (!isCurrentStepValid) {
      setShowValidationErrors(true)
      return
    }
    setShowValidationErrors(false)

    if (currentStep === DOMAIN_GROUPS.length + 1) {
      // Moving to summary - calculate result
      const result = calculateAssessmentResult(domainData)
      setAssessmentResult(result)
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    scrollToTop()
  }

  // Navigate to previous step
  const handlePrevious = () => {
    setShowValidationErrors(false)
    setCurrentStep(prev => Math.max(prev - 1, 1))
    scrollToTop()
  }

  // Save assessment
  const handleSave = async () => {
    if (!assessment || !assessmentResult) return

    setIsSaving(true)
    setError(null)

    try {
      const formData: Partial<AssessmentFormData> = {
        overallRisk: assessmentResult.overallRisk,
        notes: generalNotes || undefined,
        domains: assessmentResult.domainScores.map(score => ({
          domain: score.domain,
          riskLevel: score.riskLevel,
          score: score.score,
          answers: score.answers,
          notes: score.notes,
        })),
      }

      const result = await updateAssessment(id, formData)

      if (result.success) {
        router.push(`/dashboard/assessments/${id}`)
      } else {
        setError(result.error || 'Failed to update assessment')
      }
    } catch (err) {
      setError('Failed to update assessment')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout
        title="Edit Assessment"
        subtitle="Loading..."
      >
        <Card className="border-0 shadow-soft">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  if (error && !assessment) {
    return (
      <DashboardLayout
        title="Edit Assessment"
        subtitle="Error"
      >
        <Card className="border-0 shadow-soft">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Assessment Not Found</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/dashboard/assessments')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  // Render domain group step
  const renderDomainGroup = () => {
    if (!currentDomainGroup) return null

    return (
      <div className="space-y-6">
        {/* Domain Group Header */}
        <Card className="border-0 shadow-soft bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-4xl">
                {currentDomainGroup.emoji}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{currentDomainGroup.name}</h2>
                <p className="text-muted-foreground">
                  Tap the emoji that best describes how you feel
                </p>
              </div>
            </div>

            {/* Domain Progress Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {currentDomains.map(domain => {
                const answered = getAnsweredCount(domain)
                const total = domain.questions.length
                const isComplete = answered === total

                return (
                  <Badge
                    key={domain.id}
                    variant={isComplete ? 'default' : 'outline'}
                    className={`text-sm px-3 py-1 ${isComplete ? 'bg-green-500' : ''}`}
                  >
                    <span className="mr-1">{domain.emoji}</span>
                    {domain.name}: {answered}/{total}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {currentDomains.map(domain => (
          <DomainQuestionCard
            key={domain.id}
            domain={domain}
            answers={domainData[domain.id]?.answers || {}}
            notes={domainData[domain.id]?.notes || ''}
            onAnswerChange={(questionId, value) => handleAnswerChange(domain.id, questionId, value)}
            onNotesChange={(notes) => handleNotesChange(domain.id, notes)}
            showValidationErrors={showValidationErrors}
          />
        ))}
      </div>
    )
  }

  // Render review step
  const renderReview = () => {
    // Count total questions and answered
    let totalQuestions = 0
    let answeredQuestions = 0

    ASSESSMENT_DOMAINS.forEach(domain => {
      totalQuestions += domain.questions.length
      const data = domainData[domain.id]
      if (data) {
        answeredQuestions += Object.keys(data.answers).length
      }
    })

    const completionPercentage = (answeredQuestions / totalQuestions) * 100

    return (
      <div className="space-y-6">
        <Card className="border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              Review & Notes
            </CardTitle>
            <CardDescription>
              Review your assessment progress and add any general notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Completion Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Assessment Completion</span>
                <span className="font-medium">{answeredQuestions}/{totalQuestions} questions</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              {completionPercentage < 100 && (
                <p className="text-sm text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Some questions are unanswered
                </p>
              )}
            </div>

            {/* Domain Group Summary */}
            <div className="space-y-3">
              <p className="font-medium text-sm">Domain Summary</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DOMAIN_GROUPS.map(group => {
                  const domains = ASSESSMENT_DOMAINS.filter(d => group.domains.includes(d.id))
                  let groupTotal = 0
                  let groupAnswered = 0

                  domains.forEach(domain => {
                    groupTotal += domain.questions.length
                    const data = domainData[domain.id]
                    if (data) {
                      groupAnswered += Object.keys(data.answers).length
                    }
                  })

                  const isComplete = groupAnswered === groupTotal

                  return (
                    <div
                      key={group.id}
                      className={`p-3 rounded-lg border ${isComplete ? 'bg-green-50 border-green-200' : 'bg-muted/50'}`}
                    >
                      <div className="flex items-center gap-2">
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="text-sm font-medium">{group.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {groupAnswered}/{groupTotal} answered
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* General Notes */}
            <div className="space-y-2">
              <Label htmlFor="generalNotes">General Notes (Optional)</Label>
              <Textarea
                id="generalNotes"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Add any overall observations, concerns, or notes about this assessment..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render summary step
  const renderSummary = () => {
    if (!assessmentResult || !assessment) return null

    return (
      <div className="space-y-6">
        <AssessmentSummary
          result={assessmentResult}
          elderlyName={assessment.subject?.name || 'Unknown'}
          assessedAt={new Date().toISOString()}
        />

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <DashboardLayout
      title="Edit Assessment"
      subtitle={`Editing assessment for ${assessment?.subject?.name || 'Unknown'}`}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/assessments/${id}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assessment
        </Button>

        {/* Subject Info */}
        {assessment?.subject && (
          <Card className="border-0 shadow-soft bg-gradient-to-r from-primary to-primary/80 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Editing Assessment</p>
                  <p className="font-semibold">{assessment.subject.name}</p>
                  {assessment.subject.vayoId && (
                    <p className="text-white/60 text-xs">ID: {assessment.subject.vayoId}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Header */}
        <Card className="border shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-base font-semibold">
                Step {currentStep} of {totalSteps}
              </div>
              <div className="text-base font-medium flex items-center gap-2">
                {currentStep >= 1 && currentStep <= DOMAIN_GROUPS.length && (
                  <><span>{currentDomainGroup?.emoji}</span> {currentDomainGroup?.name}</>
                )}
                {currentStep === DOMAIN_GROUPS.length + 1 && <><span>📋</span> Review</>}
                {currentStep === DOMAIN_GROUPS.length + 2 && <><span>✅</span> Complete</>}
              </div>
            </div>
            <Progress value={progressPercentage} className="h-2" />

            {/* Step indicators with emojis */}
            <div className="mt-4 -mx-4 px-4 sm:mx-0 sm:px-1 overflow-x-auto sm:overflow-visible scrollbar-hide">
              <div className="flex gap-3 sm:gap-0 sm:justify-between min-w-max sm:min-w-0 pb-2 sm:pb-0">
                {DOMAIN_GROUPS.map((group, idx) => (
                  <div key={group.id} className="flex flex-col items-center">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-lg transition-all ${currentStep >= idx + 1 ? 'bg-primary shadow-md sm:scale-110' : 'bg-muted'} ${currentStep === idx + 1 ? 'ring-2 ring-primary ring-offset-1 sm:ring-offset-2' : ''}`}>
                      {group.emoji}
                    </div>
                    <span className="text-[10px] sm:text-xs mt-1 hidden md:block truncate max-w-12 text-center">{group.name}</span>
                  </div>
                ))}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-lg transition-all ${currentStep >= DOMAIN_GROUPS.length + 1 ? 'bg-primary shadow-md sm:scale-110' : 'bg-muted'} ${currentStep === DOMAIN_GROUPS.length + 1 ? 'ring-2 ring-primary ring-offset-1 sm:ring-offset-2' : ''}`}>
                    📋
                  </div>
                  <span className="text-[10px] sm:text-xs mt-1 hidden sm:block">Review</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-lg transition-all ${currentStep >= DOMAIN_GROUPS.length + 2 ? 'bg-primary shadow-md sm:scale-110' : 'bg-muted'} ${currentStep === DOMAIN_GROUPS.length + 2 ? 'ring-2 ring-primary ring-offset-1 sm:ring-offset-2' : ''}`}>
                    ✅
                  </div>
                  <span className="text-[10px] sm:text-xs mt-1 hidden sm:block">Done</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep >= 1 && currentStep <= DOMAIN_GROUPS.length && renderDomainGroup()}
        {currentStep === DOMAIN_GROUPS.length + 1 && renderReview()}
        {currentStep === DOMAIN_GROUPS.length + 2 && renderSummary()}

        {/* Navigation - Large buttons for elderly users */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="text-lg px-6 py-6 h-auto"
          >
            <ChevronLeft className="w-6 h-6 mr-2" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext} size="lg" className="text-lg px-8 py-6 h-auto">
              Next
              <ChevronRight className="w-6 h-6 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="lg"
              className="gradient-medical text-white text-lg px-8 py-6 h-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-6 h-6 mr-2" />
                  Update Assessment
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
