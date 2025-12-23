'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { AssessmentForm } from '@/components/assessments'
import { useAuthStore } from '@/store'

export default function SelfAssessmentPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  // Redirect if not an elderly user
  useEffect(() => {
    if (user && user.role !== 'elderly') {
      router.push('/dashboard/assessments/new')
    }
  }, [user, router])

  if (!user) {
    return (
      <DashboardLayout
        title="Self Assessment"
        subtitle="Complete your health assessment"
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
      title="Self Assessment"
      subtitle="Complete your periodic WHO ICOPE health assessment"
    >
      <AssessmentForm
        selfAssessment={true}
        selfAssessmentUser={user}
        onSuccess={() => router.push('/dashboard/my-assessments')}
      />
    </DashboardLayout>
  )
}
