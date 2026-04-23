'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  Loader2,
  Calendar,
  UserCircle,
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Brain,
  Heart,
  Eye,
  Footprints,
  Utensils,
  Users,
} from 'lucide-react'
import { type Assessment, type AssessmentDomain, type RiskLevel } from '@/types'
import { getAssessmentById } from '@/services/assessments'
import { getRiskLevelDisplay, buildResultFromStored } from '@/lib/assessment-scoring'
import { AssessmentReport } from '@/components/assessments/assessment-report'
import { formatDate } from '@/lib/utils'

export default function MyAssessmentDetailPage() {
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
            <Button onClick={() => router.push('/dashboard/my-assessments')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Assessments
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  const overallDisplay = getRiskLevelDisplay(assessment.overallRisk)
  const domains = assessment.domains || []

  const domainCounts = {
    healthy: domains.filter(d => d.riskLevel === 'healthy').length,
    at_risk: domains.filter(d => d.riskLevel === 'at_risk').length,
    intervention: domains.filter(d => d.riskLevel === 'intervention').length,
  }

  return (
    <DashboardLayout
      title="My Assessment Details"
      subtitle={`Assessment from ${formatDate(assessment.assessedAt)}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/my-assessments')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Assessments
        </Button>

        {/* Overall Status Card */}
        <Card className={`border-2 shadow-soft ${getBorderColor(assessment.overallRisk)}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full ${overallDisplay.bgColor} flex items-center justify-center`}>
                  {assessment.overallRisk === 'healthy' && <CheckCircle2 className={`w-8 h-8 ${overallDisplay.color}`} />}
                  {assessment.overallRisk === 'at_risk' && <AlertCircle className={`w-8 h-8 ${overallDisplay.color}`} />}
                  {assessment.overallRisk === 'intervention' && <AlertTriangle className={`w-8 h-8 ${overallDisplay.color}`} />}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overall Health Status</p>
                  <p className={`font-bold text-2xl ${overallDisplay.color}`}>{overallDisplay.label}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-3xl font-bold">
                  {assessment.cumulativeScore ?? domains.reduce((sum, d) => sum + (d.score ?? 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assessment Date</p>
                  <p className="font-semibold">{formatDate(assessment.assessedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assessed By</p>
                  <p className="font-semibold">{assessment.assessor?.name || 'Self'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Domain Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-soft bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{domainCounts.healthy}</p>
              <p className="text-sm text-green-700">Healthy</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft bg-yellow-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{domainCounts.at_risk}</p>
              <p className="text-sm text-yellow-700">At Risk</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft bg-red-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{domainCounts.intervention}</p>
              <p className="text-sm text-red-700">Needs Care</p>
            </CardContent>
          </Card>
        </div>

        {/* Domain Results */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Health Domain Results</CardTitle>
            <CardDescription>
              Detailed breakdown of each health area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {domains.map((domain) => (
                <DomainResultCard key={domain.id} domain={domain} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {assessment.notes && (
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {assessment.notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ICOPE Report: Patient Summary / Recommended Scales / Risk Flags / Actions */}
        {(() => {
          const reportResult = buildResultFromStored(
            (assessment.domains || []) as Array<{ domain: string; answers?: unknown; notes?: string | null }>,
            assessment.domainScores,
          )
          if (!reportResult) return null
          return <AssessmentReport result={reportResult} />
        })()}
      </div>
    </DashboardLayout>
  )
}

interface DomainResultCardProps {
  domain: AssessmentDomain
}

function DomainResultCard({ domain }: DomainResultCardProps) {
  const display = getRiskLevelDisplay(domain.riskLevel)
  const Icon = getDomainIcon(domain.domain)
  const maxScore = getMaxScore(domain.domain)
  const percentage = domain.score !== undefined ? ((maxScore - domain.score) / maxScore) * 100 : 0

  return (
    <div className={`p-4 rounded-lg border ${getBorderColorLight(domain.riskLevel)} ${display.bgColor}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg ${getIconBgColor(domain.riskLevel)} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${display.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{getDomainName(domain.domain)}</h3>
            <Badge variant="outline" className={`${display.bgColor} ${display.color} border-current`}>
              {display.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={percentage} className="h-2" />
            </div>
            <span className="text-sm text-muted-foreground w-16 text-right">
              {domain.score ?? '-'}/{maxScore}
            </span>
          </div>
          {domain.notes && (
            <p className="text-sm text-muted-foreground mt-2">{domain.notes}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function getBorderColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'healthy': return 'border-green-300'
    case 'at_risk': return 'border-yellow-300'
    case 'intervention': return 'border-red-300'
    default: return 'border-gray-300'
  }
}

function getBorderColorLight(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'healthy': return 'border-green-200'
    case 'at_risk': return 'border-yellow-200'
    case 'intervention': return 'border-red-200'
    default: return 'border-gray-200'
  }
}

function getIconBgColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'healthy': return 'bg-green-200'
    case 'at_risk': return 'bg-yellow-200'
    case 'intervention': return 'bg-red-200'
    default: return 'bg-gray-200'
  }
}

function getDomainIcon(domain: string) {
  const icons: Record<string, typeof Activity> = {
    cognitive: Brain,
    psychological: Heart,
    locomotor: Footprints,
    sensory: Eye,
    vitality: Utensils,
    social: Users,
  }
  return icons[domain] || Activity
}

function getDomainName(domain: string): string {
  const names: Record<string, string> = {
    cognitive: 'Cognitive',
    psychological: 'Psychological',
    locomotor: 'Locomotor',
    sensory: 'Sensory',
    vitality: 'Vitality',
    social: 'Social',
  }
  return names[domain] || domain
}

function getMaxScore(domain: string): number {
  const questionCounts: Record<string, number> = {
    cognitive: 4,
    psychological: 5,
    locomotor: 3,
    sensory: 3,
    vitality: 3,
    social: 4,
  }
  return (questionCounts[domain] || 1) * 2
}
