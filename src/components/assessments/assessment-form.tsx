'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  User,
  ClipboardCheck,
  FileText,
  RotateCcw,
  PlayCircle,
  X,
} from 'lucide-react'
import { type SafeUser, type Assessment } from '@/types'
import {
  ASSESSMENT_DOMAINS,
  type Domain,
  calculateAssessmentResult,
  type AssessmentResult,
} from '@/lib/assessment-scoring'
import { DomainQuestionCard } from './domain-question-card'
import { AssessmentSummary } from './assessment-summary'
import { createAssessment, saveDraft, updateDraft, completeDraft, deleteAssessment, checkExistingDraft, type AssessmentFormData } from '@/services/assessments'
import { getElderly } from '@/services/elderly'
import { formatDate } from '@/lib/utils'

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

interface AssessmentFormProps {
  elderlyId?: string
  onSuccess?: () => void
  selfAssessment?: boolean
  selfAssessmentUser?: SafeUser | null
  // Draft mode props
  draftAssessment?: Assessment | null
  onDraftSaved?: () => void
}

export function AssessmentForm({
  elderlyId,
  onSuccess,
  selfAssessment = false,
  selfAssessmentUser,
  draftAssessment,
  onDraftSaved,
}: AssessmentFormProps) {
  const router = useRouter()

  // Check if we're resuming a draft
  const isResumingDraft = !!draftAssessment

  // Steps: 0 = Subject Selection (skipped in self-assessment or resume), 1-8 = Domain Groups, 9 = Review & Notes, 10 = Summary
  // In self-assessment mode or when resuming, we start at step 1 (or saved step)
  const getInitialStep = () => {
    if (draftAssessment?.currentStep) return draftAssessment.currentStep
    if (selfAssessment) return 1
    if (elderlyId) return 1
    return 0
  }

  const [currentStep, setCurrentStep] = useState(getInitialStep())
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftSaveMessage, setDraftSaveMessage] = useState<string | null>(null)

  // Draft ID for updates
  const [draftId, setDraftId] = useState<string | null>(draftAssessment?.id || null)

  // Subject selection
  const [elderlyList, setElderlyList] = useState<SafeUser[]>([])
  const [selectedElderly, setSelectedElderly] = useState<SafeUser | null>(null)

  // Continue or Start Over dialog
  const [showDraftDialog, setShowDraftDialog] = useState(false)
  const [existingDraft, setExistingDraft] = useState<Assessment | null>(null)
  const [isCheckingDraft, setIsCheckingDraft] = useState(false)

  // Domain answers: { [domainId]: { answers: { [questionId]: number }, notes: string } }
  const [domainData, setDomainData] = useState<Record<string, { answers: Record<string, number>; notes: string }>>({})

  // General notes
  const [generalNotes, setGeneralNotes] = useState(draftAssessment?.notes || '')

  // Validation tracking
  const [showValidationErrors, setShowValidationErrors] = useState(false)

  // Assessment result after calculation
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)

  const totalSteps = DOMAIN_GROUPS.length + 3 // Subject + Domain Groups + Review + Summary

  // Load elderly list or set self-assessment user
  useEffect(() => {
    // For self-assessment, use the provided user
    if (selfAssessment && selfAssessmentUser) {
      setSelectedElderly(selfAssessmentUser)
      return
    }

    // For resuming draft, set the subject from draft data
    if (draftAssessment?.subject) {
      setSelectedElderly(draftAssessment.subject as unknown as SafeUser)
      return
    }

    async function loadElderly() {
      setIsLoading(true)
      try {
        const result = await getElderly({ limit: 1000 })
        if (result.success && result.data) {
          setElderlyList(result.data.users)

          // Pre-select if elderlyId provided
          if (elderlyId) {
            const selected = result.data.users.find(e => e.id === elderlyId)
            if (selected) {
              setSelectedElderly(selected)
              setCurrentStep(1) // Skip to first domain group
            }
          }
        }
      } catch (err) {
        setError('Failed to load elderly list')
      } finally {
        setIsLoading(false)
      }
    }
    loadElderly()
  }, [elderlyId, selfAssessment, selfAssessmentUser, draftAssessment])

  // Initialize domain data structure (or load from draft)
  useEffect(() => {
    const initialData: Record<string, { answers: Record<string, number>; notes: string }> = {}

    // If resuming a draft, load the saved domain data
    if (draftAssessment?.domainScores) {
      const savedData = draftAssessment.domainScores as Record<string, { answers: Record<string, number>; notes: string }>
      ASSESSMENT_DOMAINS.forEach(domain => {
        if (savedData[domain.id]) {
          initialData[domain.id] = savedData[domain.id]
        } else {
          initialData[domain.id] = { answers: {}, notes: '' }
        }
      })
    } else {
      // Initialize empty structure
      ASSESSMENT_DOMAINS.forEach(domain => {
        initialData[domain.id] = { answers: {}, notes: '' }
      })
    }

    setDomainData(initialData)
  }, [draftAssessment])

  // Show confirmation dialog when resuming a draft from assessment list
  useEffect(() => {
    if (draftAssessment && !selfAssessment) {
      setExistingDraft(draftAssessment)
      setShowDraftDialog(true)
    }
  }, [draftAssessment, selfAssessment])

  // Load draft data into form
  const loadDraftData = useCallback((draft: Assessment) => {
    setDraftId(draft.id)
    setCurrentStep(draft.currentStep || 1)
    setGeneralNotes(draft.notes || '')

    // Load domain data from draft
    if (draft.domainScores) {
      const savedData = draft.domainScores as Record<string, { answers: Record<string, number>; notes: string }>
      const loadedData: Record<string, { answers: Record<string, number>; notes: string }> = {}
      ASSESSMENT_DOMAINS.forEach(domain => {
        if (savedData[domain.id]) {
          loadedData[domain.id] = savedData[domain.id]
        } else {
          loadedData[domain.id] = { answers: {}, notes: '' }
        }
      })
      setDomainData(loadedData)
    }
  }, [])

  // Handle elderly selection - check for existing draft
  const handleElderlySelect = async (elderly: SafeUser) => {
    setSelectedElderly(elderly)
    setIsCheckingDraft(true)

    try {
      const result = await checkExistingDraft(elderly.id)
      if (result.success && result.data) {
        // Found existing draft - show dialog
        setExistingDraft(result.data)
        setShowDraftDialog(true)
      }
    } catch (err) {
      console.error('Error checking for draft:', err)
    } finally {
      setIsCheckingDraft(false)
    }
  }

  // Handle "Continue" - load draft data
  const handleContinueDraft = () => {
    if (existingDraft) {
      loadDraftData(existingDraft)
    }
    setShowDraftDialog(false)
    setExistingDraft(null)
  }

  // Handle "Start Over" - reset to step 1 but keep previous answers for review
  const handleStartOver = () => {
    if (existingDraft) {
      // Load the draft data so user can see previous answers
      loadDraftData(existingDraft)
      // But reset to step 1 so they can review from beginning
      setCurrentStep(1)
    }
    setShowDraftDialog(false)
    setExistingDraft(null)
  }

  // Handle close/exit assessment
  const handleClose = () => {
    router.push('/dashboard/assessments')
  }

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
  const progressPercentage = (currentStep / (totalSteps - 1)) * 100

  // Count answered questions for a domain
  const getAnsweredCount = (domain: Domain): number => {
    const data = domainData[domain.id]
    if (!data) return 0
    return Object.keys(data.answers).length
  }

  // Check if current step is valid
  const isCurrentStepValid = useMemo(() => {
    if (currentStep === 0) {
      return selectedElderly !== null
    }
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
  }, [currentStep, selectedElderly, currentDomains, domainData])

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

  // Navigate to next step with auto-save
  const handleNext = async () => {
    if (!isCurrentStepValid) {
      setShowValidationErrors(true)
      return
    }
    setShowValidationErrors(false)

    const nextStep = Math.min(currentStep + 1, totalSteps - 1)

    if (currentStep === DOMAIN_GROUPS.length + 1) {
      // Moving to summary - calculate result
      const result = calculateAssessmentResult(domainData)
      setAssessmentResult(result)
    }

    // Auto-save as draft when navigating (whenever we have a selected elderly)
    if (selectedElderly) {
      setIsSavingDraft(true)
      setError(null)
      try {
        const partialResult = calculateAssessmentResult(domainData)
        const formData = {
          subjectId: selectedElderly.id,
          overallRisk: partialResult.overallRisk,
          currentStep: nextStep,
          notes: generalNotes || undefined,
          domainScores: domainData,
          domains: partialResult.domainScores.map(score => ({
            domain: score.domain,
            riskLevel: score.riskLevel,
            score: score.score,
            answers: score.answers,
            notes: score.notes,
          })),
        }

        console.log('Auto-saving draft...', { draftId, formData })

        let result
        if (draftId) {
          result = await updateDraft(draftId, formData)
        } else {
          result = await saveDraft(formData)
        }

        console.log('Save result:', result)

        if (result.success && result.data) {
          setDraftId(result.data.id)
          setDraftSaveMessage('Progress saved')
          setTimeout(() => setDraftSaveMessage(null), 2000)
        } else {
          console.error('Save failed:', result.error)
          setError(result.error || 'Failed to save progress')
        }
      } catch (err) {
        console.error('Auto-save failed:', err)
        setError('Failed to save progress')
      } finally {
        setIsSavingDraft(false)
      }
    }

    setCurrentStep(nextStep)
    scrollToTop()
  }

  // Navigate to previous step
  const handlePrevious = () => {
    setShowValidationErrors(false)
    // In self-assessment mode or when resuming draft, don't go back to step 0 (subject selection)
    const minStep = (selfAssessment || isResumingDraft) ? 1 : 0
    setCurrentStep(prev => Math.max(prev - 1, minStep))
    scrollToTop()
  }

  // Save as draft
  const handleSaveDraft = async () => {
    if (!selectedElderly) {
      setError('Please select an elderly person first')
      return
    }

    setIsSavingDraft(true)
    setError(null)
    setDraftSaveMessage(null)

    try {
      // Calculate partial result for domain scores
      const partialResult = calculateAssessmentResult(domainData)

      const formData = {
        subjectId: selectedElderly.id,
        overallRisk: partialResult.overallRisk,
        currentStep,
        notes: generalNotes || undefined,
        domainScores: domainData,
        domains: partialResult.domainScores.map(score => ({
          domain: score.domain,
          riskLevel: score.riskLevel,
          score: score.score,
          answers: score.answers,
          notes: score.notes,
        })),
      }

      let result
      if (draftId) {
        // Update existing draft
        result = await updateDraft(draftId, formData)
      } else {
        // Create new draft
        result = await saveDraft(formData)
      }

      if (result.success && result.data) {
        setDraftId(result.data.id)
        setDraftSaveMessage('Draft saved successfully!')
        if (onDraftSaved) {
          onDraftSaved()
        }
        // Clear message after 3 seconds
        setTimeout(() => setDraftSaveMessage(null), 3000)
      } else {
        setError(result.error || 'Failed to save draft')
      }
    } catch (err) {
      setError('Failed to save draft')
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Save completed assessment
  const handleSave = async () => {
    if (!selectedElderly || !assessmentResult) return

    setIsSaving(true)
    setError(null)

    try {
      const formData: AssessmentFormData = {
        subjectId: selectedElderly.id,
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

      let result
      if (draftId) {
        // Complete the draft
        result = await completeDraft(draftId, formData)
      } else {
        // Create new completed assessment
        result = await createAssessment(formData)
      }

      if (result.success) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/dashboard/assessments')
        }
      } else {
        setError(result.error || 'Failed to save assessment')
      }
    } catch (err) {
      setError('Failed to save assessment')
    } finally {
      setIsSaving(false)
    }
  }

  // Render subject selection step
  const renderSubjectSelection = () => (
    <Card className="border shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Select Elderly
        </CardTitle>
        <CardDescription>
          Choose the elderly person you are assessing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Elderly Person *</Label>
              <Select
                value={selectedElderly?.id || ''}
                onValueChange={(value) => {
                  const elderly = elderlyList.find(e => e.id === value)
                  if (elderly) {
                    handleElderlySelect(elderly)
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an elderly person" />
                </SelectTrigger>
                <SelectContent>
                  {elderlyList.map((elderly) => (
                    <SelectItem key={elderly.id} value={elderly.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{elderly.name}</span>
                        {elderly.vayoId && (
                          <Badge variant="outline" className="text-xs">
                            {elderly.vayoId}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedElderly && (
              <div className="space-y-4">
                {/* Elder Details Card */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">👤</span>
                      <h3 className="font-semibold">Elder Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p className="font-medium">{selectedElderly.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vayo ID</p>
                        <p className="font-medium">{selectedElderly.vayoId || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Age</p>
                        <p className="font-medium">{selectedElderly.age || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Gender</p>
                        <p className="font-medium capitalize">{selectedElderly.gender || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">📧 Email</p>
                        {selectedElderly.email ? (
                          <a href={`mailto:${selectedElderly.email}`} className="font-medium text-primary hover:underline">
                            {selectedElderly.email}
                          </a>
                        ) : (
                          <p className="font-medium">-</p>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground">📞 Phone</p>
                        {selectedElderly.phone ? (
                          <a href={`tel:${selectedElderly.phone}`} className="font-medium text-primary hover:underline">
                            {selectedElderly.phone}
                          </a>
                        ) : (
                          <p className="font-medium">-</p>
                        )}
                      </div>
                      {selectedElderly.villageName && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">📍 Location</p>
                          <p className="font-medium">
                            {[
                              selectedElderly.villageName,
                              selectedElderly.talukName,
                              selectedElderly.districtName,
                            ].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Caregiver Details Card */}
                {(selectedElderly.caregiverName || selectedElderly.caregiverPhone) && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">👨‍👩‍👧</span>
                        <h3 className="font-semibold text-blue-800">Caregiver Details</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-blue-600">Name</p>
                          <p className="font-medium">{selectedElderly.caregiverName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-blue-600">Relation</p>
                          <p className="font-medium capitalize">{selectedElderly.caregiverRelation || '-'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-blue-600">📞 Phone</p>
                          {selectedElderly.caregiverPhone ? (
                            <a
                              href={`tel:${selectedElderly.caregiverPhone}`}
                              className="inline-flex items-center gap-2 font-medium text-blue-700 hover:underline bg-blue-100 px-3 py-1.5 rounded-lg mt-1"
                            >
                              <span>📱</span>
                              {selectedElderly.caregiverPhone}
                              <span className="text-xs">(Tap to call)</span>
                            </a>
                          ) : (
                            <p className="font-medium">-</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {showValidationErrors && !selectedElderly && (
              <p className="text-sm text-red-500">Please select an elderly person to assess</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )

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
    if (!assessmentResult || !selectedElderly) return null

    return (
      <div className="space-y-6">
        <AssessmentSummary
          result={assessmentResult}
          elderlyName={selectedElderly.name}
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

  // Calculate adjusted step display for self-assessment (skip step 0)
  const displayStep = selfAssessment ? currentStep : currentStep + 1
  const displayTotalSteps = selfAssessment ? totalSteps - 1 : totalSteps
  const adjustedProgress = selfAssessment
    ? ((currentStep - 1) / (totalSteps - 2)) * 100
    : progressPercentage

  return (
    <div className="space-y-6">
      {/* Self-Assessment Info */}
      {selfAssessment && selectedElderly && (
        <Card className="border-0 shadow-soft bg-gradient-to-r from-primary to-primary/80 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/70 text-sm">Self Assessment</p>
                <p className="font-semibold">{selectedElderly.name}</p>
                {selectedElderly.vayoId && (
                  <p className="text-white/60 text-xs">ID: {selectedElderly.vayoId}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resuming Draft Banner */}
      {isResumingDraft && selectedElderly && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-amber-800 font-medium">Resuming Draft Assessment</p>
                <p className="text-amber-600 text-sm">
                  For: {selectedElderly.name} {selectedElderly.vayoId && `(${selectedElderly.vayoId})`}
                </p>
              </div>
              <Badge variant="outline" className="border-amber-300 text-amber-700">
                Draft
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Header */}
      <Card className="border shadow-soft">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-base font-semibold">
              Step {displayStep} of {displayTotalSteps}
            </div>
            <div className="text-base font-medium flex items-center gap-2">
              {currentStep === 0 && !selfAssessment && <><span>👤</span> Select Person</>}
              {currentStep >= 1 && currentStep <= DOMAIN_GROUPS.length && (
                <><span>{currentDomainGroup?.emoji}</span> {currentDomainGroup?.name}</>
              )}
              {currentStep === DOMAIN_GROUPS.length + 1 && <><span>📋</span> Review</>}
              {currentStep === DOMAIN_GROUPS.length + 2 && <><span>✅</span> Complete</>}
            </div>
          </div>
          <Progress value={adjustedProgress} className="h-2" />

          {/* Step indicators with emojis - scrollable on mobile, spread on desktop */}
          <div className="mt-4 -mx-4 px-4 sm:mx-0 sm:px-1 overflow-x-auto sm:overflow-visible scrollbar-hide">
            <div className="flex gap-3 sm:gap-0 sm:justify-between min-w-max sm:min-w-0 pb-2 sm:pb-0">
              {/* Only show Select step if not self-assessment */}
              {!selfAssessment && (
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-lg transition-all ${currentStep >= 0 ? 'bg-primary shadow-md sm:scale-110' : 'bg-muted'}`}>
                    👤
                  </div>
                  <span className="text-[10px] sm:text-xs mt-1 hidden sm:block">Select</span>
                </div>
              )}
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
      {currentStep === 0 && !selfAssessment && renderSubjectSelection()}
      {currentStep >= 1 && currentStep <= DOMAIN_GROUPS.length && renderDomainGroup()}
      {currentStep === DOMAIN_GROUPS.length + 1 && renderReview()}
      {currentStep === DOMAIN_GROUPS.length + 2 && renderSummary()}

      {/* Navigation - Large buttons for elderly users */}
      <div className="flex flex-col gap-3 pt-4">
        {/* Auto-save indicator */}
        {draftSaveMessage && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 py-2 px-4 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            {draftSaveMessage}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 py-2 px-4 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Main navigation buttons */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={(selfAssessment || isResumingDraft) ? currentStep === 1 : currentStep === 0 || isSavingDraft}
            className="text-lg px-6 py-6 h-auto"
          >
            <ChevronLeft className="w-6 h-6 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            {/* Close button - shown during assessment steps (not on step 0 or summary) */}
            {currentStep >= 1 && currentStep < totalSteps - 1 && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleClose}
                disabled={isSavingDraft}
                className="text-lg px-6 py-6 h-auto border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <X className="w-6 h-6 mr-2" />
                Close
              </Button>
            )}

            {currentStep < totalSteps - 1 ? (
              <Button
                onClick={handleNext}
                disabled={isSavingDraft}
                size="lg"
                className="text-lg px-8 py-6 h-auto"
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-6 h-6 ml-2" />
                  </>
                )}
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
                    Completing...
                  </>
                ) : (
                  <>
                    <span className="text-xl mr-2">✅</span>
                    Complete Assessment
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Continue or Start Over Dialog */}
      <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Previous Assessment Found
            </DialogTitle>
            <DialogDescription>
              You have an incomplete assessment for this elderly person.
            </DialogDescription>
          </DialogHeader>

          {existingDraft && (
            <div className="space-y-3 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium">
                    {formatDate(existingDraft.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium">
                    {formatDate(existingDraft.updatedAt)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress:</span>
                  <span className="font-medium">
                    Step {existingDraft.currentStep || 1} of {totalSteps}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Would you like to continue from where you left off, or review from the beginning?
                Your previous answers will be preserved.
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleStartOver}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Review from Start
            </Button>
            <Button
              onClick={handleContinueDraft}
              className="flex-1"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
