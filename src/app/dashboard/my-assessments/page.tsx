'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore, getRiskLevelStyles } from '@/store'
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
} from 'lucide-react'
import type { Assessment } from '@/types'

export default function MyAssessmentsPage() {
  const { user } = useAuthStore()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAssessments() {
      if (!user?.id) return

      try {
        const res = await fetch(`/api/assessments?elderlyId=${user.id}&limit=50`)
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
  }, [user])

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
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Assessments</p>
                <p className="text-2xl font-bold">{assessments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
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
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Assessment</p>
                <p className="text-lg font-bold">
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Ready for a self-assessment?</h3>
              <p className="text-sm text-muted-foreground">
                Complete your periodic health assessment to track your wellbeing
              </p>
            </div>
            <Link href="/dashboard/my-assessments/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
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
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(assessment, assessments[index + 1])}
                        <span className="font-semibold">
                          Assessment #{assessments.length - index}
                        </span>
                      </div>
                      {getRiskBadge(assessment.overallRisk)}
                    </div>
                    <Link href={`/dashboard/my-assessments/${assessment.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(assessment.assessedAt)}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Overall Score: <span className="font-medium text-foreground">{assessment.cumulativeScore ?? '-'}</span>
                    </div>
                    {assessment.assessor && (
                      <div className="text-muted-foreground">
                        Assessed by: <span className="font-medium text-foreground">{assessment.assessor.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Domain Scores Summary */}
                  {assessment.domainScores && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Domain Summary</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(assessment.domainScores).slice(0, 5).map(([domain, score]) => (
                          <span
                            key={domain}
                            className={cn(
                              'text-xs px-2 py-1 rounded-md',
                              (score as number) >= 4 ? 'bg-red-100 text-red-700' :
                                (score as number) >= 2 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                            )}
                          >
                            {domain.replace(/_/g, ' ')}: {score as number}
                          </span>
                        ))}
                        {Object.keys(assessment.domainScores).length > 5 && (
                          <span className="text-xs text-muted-foreground">
                            +{Object.keys(assessment.domainScores).length - 5} more
                          </span>
                        )}
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
