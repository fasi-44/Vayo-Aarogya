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
  Ear,
  Footprints,
  Moon,
  Utensils,
  Droplets,
  Users,
  Home,
  Hospital,
} from 'lucide-react'
import { type Assessment, type AssessmentDomain, type RiskLevel } from '@/types'
import { getAssessmentById } from '@/services/assessments'
import { getRiskLevelDisplay } from '@/lib/assessment-scoring'
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

        {/* Recommendations based on risk */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {assessment.overallRisk === 'healthy' && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="font-medium text-green-700">Great job maintaining your health!</p>
                <p className="text-sm text-green-600 mt-1">
                  Continue with your current routine and attend regular check-ups.
                </p>
              </div>
            )}
            {assessment.overallRisk === 'at_risk' && (
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="font-medium text-yellow-700">Some areas need attention</p>
                <p className="text-sm text-yellow-600 mt-1">
                  Work with your volunteer or healthcare provider to address the flagged areas.
                </p>
              </div>
            )}
            {assessment.overallRisk === 'intervention' && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="font-medium text-red-700">Professional care recommended</p>
                <p className="text-sm text-red-600 mt-1">
                  Please consult with your healthcare provider about your care plan as soon as possible.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
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
  // Updated for ICOPE 12 domains
  const icons: Record<string, typeof Activity> = {
    cognition: Brain,
    mood: Heart,
    mobility: Footprints,
    vision: Eye,
    hearing: Ear,
    vitality: Utensils,
    sleep: Moon,
    continence: Droplets,
    adl: Activity,
    iadl: Home,
    social: Users,
    healthcare: Hospital,
  }
  return icons[domain] || Activity
}

function getDomainName(domain: string): string {
  // Updated for ICOPE 12 domains
  const names: Record<string, string> = {
    cognition: 'Memory & Thinking',
    mood: 'Mood & Feelings',
    mobility: 'Walking & Falls',
    vision: 'Vision',
    hearing: 'Hearing',
    vitality: 'Appetite & Weight',
    sleep: 'Sleep',
    continence: 'Bladder & Bowel',
    adl: 'Self-Care (ADL)',
    iadl: 'Daily Tasks (IADL)',
    social: 'Social & Loneliness',
    healthcare: 'Healthcare Access',
  }
  return names[domain] || domain
}

function getMaxScore(domain: string): number {
  // Updated for ICOPE 15 questions across 12 domains
  // Each question has max score of 2
  const questionCounts: Record<string, number> = {
    cognition: 1,  // 1 question
    mood: 1,       // 1 question
    mobility: 2,   // 2 questions (walking + falls)
    vision: 1,     // 1 question
    hearing: 1,    // 1 question
    vitality: 2,   // 2 questions (appetite + weight)
    sleep: 1,      // 1 question
    continence: 1, // 1 question
    adl: 1,        // 1 question
    iadl: 1,       // 1 question
    social: 2,     // 2 questions (activities + loneliness)
    healthcare: 1, // 1 question
  }
  return (questionCounts[domain] || 1) * 2
}
