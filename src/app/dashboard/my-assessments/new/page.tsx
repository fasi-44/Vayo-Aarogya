'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { AssessmentForm } from '@/components/assessments'
import { getAssessmentById } from '@/services/assessments'
import { type Assessment } from '@/types'
import { useAuthStore } from '@/store'

function SelfAssessmentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftId = searchParams.get('draftId') || undefined
  const { user, activeElder } = useAuthStore()

  const [resumingDraft, setResumingDraft] = useState<Assessment | null>(null)
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!draftId)

  // Subject of this self-assessment: the active elder when family is
  // impersonating, otherwise the logged-in user themself.
  const selfAssessmentUser =
    user?.role === 'family' ? (activeElder ?? null) : user

  // Family without an active elder shouldn't be on this page — bounce them.
  useEffect(() => {
    if (!user) return
    if (user.role === 'family' && !activeElder) {
      router.replace('/dashboard/my-elders')
      return
    }
    // Staff roles (admin/professional/volunteer) belong on the regular flow.
    if (!['family', 'elderly'].includes(user.role)) {
      router.push('/dashboard/assessments/new')
    }
  }, [user, activeElder, router])

  // Load draft when ?draftId=<id> is provided.
  useEffect(() => {
    if (!draftId) return
    let cancelled = false
    setIsLoadingDraft(true)
    getAssessmentById(draftId)
      .then((res) => {
        if (cancelled) return
        if (res.success && res.data) setResumingDraft(res.data)
      })
      .catch((err) => console.error('Failed to load draft:', err))
      .finally(() => { if (!cancelled) setIsLoadingDraft(false) })
    return () => { cancelled = true }
  }, [draftId])

  if (!user || !selfAssessmentUser || isLoadingDraft) {
    return (
      <DashboardLayout
        title="Self Assessment"
        subtitle={isLoadingDraft ? 'Loading draft…' : 'Complete your health assessment'}
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

  return (
    <DashboardLayout
      title={resumingDraft ? 'Continue Assessment' : 'Self Assessment'}
      subtitle={resumingDraft
        ? 'Resume your incomplete assessment'
        : 'Complete your periodic WHO ICOPE health assessment'}
    >
      <AssessmentForm
        selfAssessment={true}
        selfAssessmentUser={selfAssessmentUser}
        draftAssessment={resumingDraft}
        onSuccess={() => router.push('/dashboard/my-assessments')}
        onDraftSaved={() => router.push('/dashboard/my-assessments')}
      />
    </DashboardLayout>
  )
}

export default function SelfAssessmentPage() {
  return (
    <Suspense fallback={
      <DashboardLayout title="Self Assessment" subtitle="Loading…">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    }>
      <SelfAssessmentContent />
    </Suspense>
  )
}
