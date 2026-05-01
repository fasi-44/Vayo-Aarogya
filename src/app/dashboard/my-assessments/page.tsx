'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore, useHydration, getRiskLevelStyles } from '@/store'
import { cn, formatDate } from '@/lib/utils'
import {
  ClipboardCheck,
  Plus,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Loader2,
  FileText,
  Pencil,
} from 'lucide-react'
import type { Assessment } from '@/types'

// Compute a domain's numeric score from the stored shape. Domain values can
// be a number (legacy) or { answers: {...}, notes: "..." } where answers maps
// question id → option value. Sum option values to get the domain total.
function computeDomainScore(value: unknown): number {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'answers' in (value as any)) {
    const answers = (value as { answers?: Record<string, number> }).answers ?? {}
    return Object.values(answers).reduce((sum, v) => sum + (Number(v) || 0), 0)
  }
  return 0
}

// Total score across all domains. Falls back to summing per-domain totals
// when the stored cumulativeScore is missing.
function getTotalScore(assessment: Assessment): number {
  if (typeof assessment.cumulativeScore === 'number') return assessment.cumulativeScore
  if (!assessment.domainScores) return 0
  return Object.values(assessment.domainScores).reduce<number>(
    (sum, v) => sum + computeDomainScore(v),
    0
  )
}

export default function MyAssessmentsPage() {
  const router = useRouter()
  const hydrated = useHydration()
  const { user, activeElder } = useAuthStore()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  // Family role: this view shows the currently impersonated elder's records.
  // Without one selected, send them to the elders list.
  useEffect(() => {
    if (!hydrated) return
    if (user?.role === 'family' && !activeElder) {
      router.replace('/dashboard/my-elders')
    }
  }, [hydrated, user, activeElder, router])

  // Subject is the active elder for family role, otherwise the user themself.
  const subjectId = user?.role === 'family' ? activeElder?.id : user?.id

  useEffect(() => {
    async function fetchAssessments() {
      if (!subjectId) return

      try {
        const res = await fetch(`/api/assessments?subjectId=${subjectId}&limit=50`)
        const data = await res.json()
        if (data.success) {
          setAssessments(data.data?.assessments || [])
        }
      } catch (error) {
        console.error('Failed to fetch assessments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssessments()
  }, [subjectId])

  const getRiskBadge = (level: string) => {
    const styles = getRiskLevelStyles(level as 'healthy' | 'at_risk' | 'intervention')
    const labels: Record<string, string> = {
      healthy: 'Healthy',
      at_risk: 'At Risk',
      intervention: 'Needs Care',
    }
    return (
      <Badge variant="outline" className={cn('border', styles?.badge)}>
        {labels[level] || level}
      </Badge>
    )
  }

  const getTrendIcon = (current: Assessment, previous?: Assessment) => {
    if (!previous) return <Minus className="w-4 h-4 text-muted-foreground" />

    const riskOrder = { healthy: 0, at_risk: 1, intervention: 2 }
    const currentRisk = riskOrder[current.overallRisk as keyof typeof riskOrder] ?? 1
    const previousRisk = riskOrder[previous.overallRisk as keyof typeof riskOrder] ?? 1

    if (currentRisk < previousRisk) {
      return <TrendingUp className="w-4 h-4 text-green-500" />
    } else if (currentRisk > previousRisk) {
      return <TrendingDown className="w-4 h-4 text-red-500" />
    }
    return <Minus className="w-4 h-4 text-muted-foreground" />
  }

  if (loading) {
    return (
      <DashboardLayout title="My Assessments" subtitle="View your health assessments">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="My Assessments"
      subtitle="View and track your health assessments over time"
    >
      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Assessments</p>
                <p className="text-3xl font-bold">{assessments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Status</p>
                <p className="text-2xl font-bold capitalize">
                  {assessments[0]?.overallRisk?.replace('_', ' ') || 'No data'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Assessment</p>
                <p className="text-xl font-bold">
                  {assessments[0] ? formatDate(assessments[0].assessedAt) : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action */}
      <Card className="border-0 shadow-soft mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-base">Ready for a self-assessment?</h3>
              <p className="text-sm text-muted-foreground">
                Complete your periodic health assessment to track your wellbeing
              </p>
            </div>
            <Link href="/dashboard/my-assessments/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto text-base">
                <Plus className="w-5 h-5 mr-2" />
                Start Self Assessment
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Assessments List */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
          <CardDescription>All your health assessments</CardDescription>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No assessments yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your health assessments will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment, index) => (
                <div
                  key={assessment.id}
                  className="p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  {/* Title + Trend */}
                  <div className="flex items-center gap-2 mb-1">
                    {getTrendIcon(assessment, assessments[index + 1])}
                    <span className="font-semibold text-base">
                      Assessment #{assessments.length - index}
                    </span>
                    {assessment.status !== 'completed' && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs capitalize">
                        {assessment.status}
                      </Badge>
                    )}
                  </div>

                  {/* Status + Action buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
                    {getRiskBadge(assessment.overallRisk)}
                    <div className="flex items-center gap-2">
                      {assessment.status !== 'completed' ? (
                        <Link href={`/dashboard/my-assessments/new?draftId=${assessment.id}`}>
                          <Button variant="default" size="sm" className="text-sm">
                            <Pencil className="w-4 h-4 mr-1" />
                            Continue
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/dashboard/my-assessments/${assessment.id}`}>
                          <Button variant="outline" size="sm" className="text-sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(assessment.assessedAt)}</span>
                    </div>
                    <div className="text-muted-foreground" title="Sum of all domain scores. Higher = more concerns (0–1 healthy, 2–3 at risk, 4+ needs intervention per domain).">
                      Total Score: <span className="font-medium text-foreground">{getTotalScore(assessment)}</span>
                    </div>
                    {assessment.assessor && (
                      <div className="text-muted-foreground">
                        By: <span className="font-medium text-foreground">{assessment.assessor.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Domain Scores Summary - all domains shown */}
                  {assessment.domainScores && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Domain Summary</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(assessment.domainScores).map(([domain, value]) => {
                          const numericScore = computeDomainScore(value)
                          return (
                            <span
                              key={domain}
                              className={cn(
                                'text-sm px-2.5 py-1 rounded-md capitalize',
                                numericScore >= 4 ? 'bg-red-100 text-red-700' :
                                  numericScore >= 2 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                              )}
                            >
                              {domain.replace(/_/g, ' ')}: {numericScore}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
