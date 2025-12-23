'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { AssessmentForm, DraftAssessmentsList } from '@/components/assessments'
import { getAssessmentById } from '@/services/assessments'
import { type Assessment } from '@/types'

function NewAssessmentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const elderlyId = searchParams.get('elderlyId') || undefined
  const draftId = searchParams.get('draftId') || undefined

  // State for resuming a draft
  const [resumingDraft, setResumingDraft] = useState<Assessment | null>(null)
  const [showDrafts, setShowDrafts] = useState(true)
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)

  // Load draft from draftId query param
  useEffect(() => {
    async function loadDraft() {
      if (!draftId) return

      setIsLoadingDraft(true)
      try {
        const result = await getAssessmentById(draftId)
        if (result.success && result.data && result.data.status === 'draft') {
          setResumingDraft(result.data)
          setShowDrafts(false)
        }
      } catch (err) {
        console.error('Failed to load draft:', err)
      } finally {
        setIsLoadingDraft(false)
      }
    }
    loadDraft()
  }, [draftId])

  const handleResumeDraft = (draft: Assessment) => {
    setResumingDraft(draft)
    setShowDrafts(false)
  }

  const handleDraftSaved = () => {
    // Redirect to assessments list after saving draft
    router.push('/dashboard/assessments')
  }

  const handleSuccess = () => {
    // Redirect to assessments list when assessment is completed
    router.push('/dashboard/assessments')
  }

  // Show loading state while fetching draft
  if (isLoadingDraft) {
    return (
      <DashboardLayout
        title="Loading..."
        subtitle="Fetching your draft assessment"
      >
        <Card className="border-0 shadow-soft">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading draft assessment...</p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title={resumingDraft ? "Continue Assessment" : "New Assessment"}
      subtitle={resumingDraft ? "Resume your incomplete assessment" : "Conduct a comprehensive WHO ICOPE assessment"}
    >
      <div className="space-y-6">
        {/* Show drafts list only if not already resuming and no elderlyId/draftId is pre-selected */}
        {showDrafts && !elderlyId && !draftId && !resumingDraft && (
          <DraftAssessmentsList
            onResumeDraft={handleResumeDraft}
            onDraftsChange={() => {}}
          />
        )}

        {/* Assessment Form */}
        <AssessmentForm
          elderlyId={elderlyId}
          draftAssessment={resumingDraft}
          onDraftSaved={handleDraftSaved}
          onSuccess={handleSuccess}
        />
      </div>
    </DashboardLayout>
  )
}

export default function NewAssessmentPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout
          title="New Assessment"
          subtitle="Conduct a comprehensive WHO ICOPE assessment"
        >
          <Card className="border-0 shadow-soft">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        </DashboardLayout>
      }
    >
      <NewAssessmentContent />
    </Suspense>
  )
}
