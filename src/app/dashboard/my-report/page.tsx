'use client'

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore, getRiskLevelStyles } from '@/store'
import { cn, formatDate } from '@/lib/utils'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Download,
  Calendar,
  Activity,
  Brain,
  Heart,
  Eye,
  Ear,
  Footprints,
  Moon,
  Apple,
  Scale,
  Users,
  Home,
  Pill,
  Droplets,
  HeartPulse,
} from 'lucide-react'
import type { Assessment } from '@/types'

const domainIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  cognition: Brain,
  depression: Heart,
  mobility: Footprints,
  vision: Eye,
  hearing: Ear,
  falls: Activity,
  sleep: Moon,
  appetite: Apple,
  weight: Scale,
  incontinence: Droplets,
  social_engagement: Users,
  loneliness: Heart,
  iadl: Home,
  adl: Activity,
  diabetes: HeartPulse,
  hypertension: HeartPulse,
  substance_use: Pill,
  healthcare_access: Activity,
  oral_health: Activity,
  pain: Activity,
}

export default function MyReportPage() {
  const { user } = useAuthStore()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return

      try {
        const res = await fetch(`/api/assessments?elderlyId=${user.id}&limit=10`)
        const data = await res.json()
        if (data.success) {
          setAssessments(data.data?.assessments || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const latestAssessment = assessments[0]
  const previousAssessment = assessments[1]

  const getRiskBadge = (level: string) => {
    const styles = getRiskLevelStyles(level as 'healthy' | 'at_risk' | 'intervention')
    const labels: Record<string, string> = {
      healthy: 'Healthy',
      at_risk: 'At Risk',
      intervention: 'Needs Care',
    }
    return (
      <Badge variant="outline" className={cn('border text-lg px-4 py-1', styles?.badge)}>
        {labels[level] || level}
      </Badge>
    )
  }

  const getTrend = (current: number, previous?: number) => {
    if (previous === undefined) return { icon: Minus, color: 'text-muted-foreground', label: 'No change' }
    if (current < previous) return { icon: TrendingUp, color: 'text-green-500', label: 'Improved' }
    if (current > previous) return { icon: TrendingDown, color: 'text-red-500', label: 'Declined' }
    return { icon: Minus, color: 'text-muted-foreground', label: 'No change' }
  }

  const getDomainScoreColor = (score: number) => {
    if (score >= 4) return 'bg-red-100 text-red-700 border-red-200'
    if (score >= 2) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-green-100 text-green-700 border-green-200'
  }

  if (loading) {
    return (
      <DashboardLayout title="My Health Report" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="My Health Report"
      subtitle="Your comprehensive health overview and trends"
    >
      {/* Overall Status */}
      <Card className="border-0 shadow-soft mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Overall Health Status</h2>
              {latestAssessment ? (
                <div className="flex items-center gap-4">
                  {getRiskBadge(latestAssessment.overallRisk)}
                  <span className="text-muted-foreground">
                    Last assessed: {formatDate(latestAssessment.assessedAt)}
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground">No assessment data available</p>
              )}
            </div>
            <Button variant="outline" disabled={!latestAssessment}>
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Score Summary */}
      {latestAssessment && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className="text-3xl font-bold">{latestAssessment.cumulativeScore ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Domains Assessed</p>
                  <p className="text-3xl font-bold">
                    {latestAssessment.domainScores ? Object.keys(latestAssessment.domainScores).length : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const trend = getTrend(
                    latestAssessment.cumulativeScore ?? 0,
                    previousAssessment?.cumulativeScore ?? 0
                  )
                  const TrendIcon = trend.icon
                  return (
                    <>
                      <div className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center',
                        trend.color === 'text-green-500' ? 'bg-green-100' :
                          trend.color === 'text-red-500' ? 'bg-red-100' : 'bg-gray-100'
                      )}>
                        <TrendIcon className={cn('w-6 h-6', trend.color)} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Trend</p>
                        <p className={cn('text-xl font-bold', trend.color)}>{trend.label}</p>
                      </div>
                    </>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Domain Breakdown */}
      {latestAssessment?.domainScores && (
        <Card className="border-0 shadow-soft mb-6">
          <CardHeader>
            <CardTitle>Health Domain Scores</CardTitle>
            <CardDescription>Detailed breakdown by health domain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(latestAssessment.domainScores).map(([domain, score]) => {
                const Icon = domainIcons[domain] || Activity
                const previousScore = previousAssessment?.domainScores?.[domain] as number | undefined
                const trend = getTrend(score as number, previousScore)
                const TrendIcon = trend.icon

                return (
                  <div
                    key={domain}
                    className={cn(
                      'p-4 rounded-lg border',
                      getDomainScoreColor(score as number)
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium capitalize">
                          {domain.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <TrendIcon className={cn('w-4 h-4', trend.color)} />
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold">{score as number}</span>
                      {previousScore !== undefined && (
                        <span className="text-sm text-muted-foreground">
                          Previous: {previousScore}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessment History */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
          <CardDescription>Your health assessments over time</CardDescription>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No assessment history</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your assessment history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.map((assessment, index) => {
                const trend = getTrend(
                  assessment.cumulativeScore ?? 0,
                  assessments[index + 1]?.cumulativeScore ?? 0
                )
                const TrendIcon = trend.icon
                const riskStyles = getRiskLevelStyles(assessment.overallRisk as 'healthy' | 'at_risk' | 'intervention')

                return (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <TrendIcon className={cn('w-5 h-5', trend.color)} />
                        <span className="font-medium">
                          {formatDate(assessment.assessedAt)}
                        </span>
                      </div>
                      <Badge variant="outline" className={cn('border', riskStyles?.badge)}>
                        {assessment.overallRisk === 'healthy' ? 'Healthy' :
                          assessment.overallRisk === 'at_risk' ? 'At Risk' : 'Needs Care'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Score: {assessment.cumulativeScore ?? 0}</p>
                      {assessment.assessor && (
                        <p className="text-sm text-muted-foreground">
                          By: {assessment.assessor.name}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Tips */}
      {latestAssessment && (
        <Card className="border-0 shadow-soft mt-6 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Based on your latest assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latestAssessment.overallRisk === 'healthy' && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="font-medium text-green-700">Great job maintaining your health!</p>
                  <p className="text-sm text-green-600 mt-1">
                    Continue with your current routine and attend regular check-ups.
                  </p>
                </div>
              )}
              {latestAssessment.overallRisk === 'at_risk' && (
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="font-medium text-yellow-700">Some areas need attention</p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Work with your volunteer or healthcare provider to address flagged areas.
                  </p>
                </div>
              )}
              {latestAssessment.overallRisk === 'intervention' && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="font-medium text-red-700">Professional care recommended</p>
                  <p className="text-sm text-red-600 mt-1">
                    Please consult with your healthcare provider about your care plan.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}
