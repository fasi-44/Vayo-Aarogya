'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Printer,
  Pencil,
} from 'lucide-react'
import { type Assessment } from '@/types'
import { getAssessmentById } from '@/services/assessments'
import { AssessmentDetailView } from '@/components/assessments'

export default function AssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAssessment() {
      if (!id) return

      setIsLoading(true)
      setError(null)

      try {
        const result = await getAssessmentById(id)

        if (result.success && result.data) {
          setAssessment(result.data)
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

  if (isLoading) {
    return (
      <DashboardLayout
        title="Assessment Details"
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

  if (error || !assessment) {
    return (
      <DashboardLayout
        title="Assessment Details"
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

  return (
    <DashboardLayout
      title="Assessment Details"
      subtitle={`Assessment for ${assessment.subject?.name || 'Unknown'}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/assessments')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assessments
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/assessments/${id}/edit`)}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Assessment
            </Button>
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Assessment Details - Using shared component */}
        <AssessmentDetailView assessment={assessment} />
      </div>
    </DashboardLayout>
  )
}
