'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore, useHydration, getRiskLevelStyles, RiskLevel } from '@/store'
import { cn, getInitials, formatDate } from '@/lib/utils'
import {
  ElderlyDashboard,
  FamilyDashboard,
} from '@/components/dashboards'
import {
  Users,
  ClipboardCheck,
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  AlertCircle,
  BarChart3,
  Plus,
  Eye,
  ArrowUpRight,
  Brain,
  Footprints,
  Heart,
  HandHeart,
  Clock,
  UserPlus,
  HeartPulse,
  Loader2,
} from 'lucide-react'
import type { SafeUser, Assessment, Intervention, FollowUp } from '@/types'

// Dashboard data interface
interface DashboardData {
  stats: {
    totalElderly: number
    totalAssessments: number
    atRiskElderly: number
    activeInterventions: number
    pendingFollowUps: number
  }
  recentAssessments: Assessment[]
  upcomingFollowUps: FollowUp[]
  riskDistribution: {
    healthy: number
    at_risk: number
    intervention: number
  }
  volunteerStats?: {
    assignedCount: number
    maxAssignments: number
    pendingVisits: number
  }
}

const quickActions = [
  { title: 'Add Elder', href: '/dashboard/elderly?action=add', icon: UserPlus, color: 'bg-secondary' },
  { title: 'New Assessment', href: '/dashboard/assessments/new', icon: ClipboardCheck, color: 'bg-primary' },
  { title: 'View Reports', href: '/dashboard/reports', icon: BarChart3, color: 'bg-accent' },
  { title: 'Schedule Follow-up', href: '/dashboard/followups/new', icon: Calendar, color: 'bg-healthy' },
]

const domainIcons = [
  { name: 'Cognition', icon: Brain },
  { name: 'Mobility', icon: Footprints },
  { name: 'Mental Health', icon: Heart },
  { name: 'Nutrition', icon: HeartPulse },
]

export default function DashboardPage() {
  const { user, hasRole } = useAuthStore()
  const hydrated = useHydration()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      totalElderly: 0,
      totalAssessments: 0,
      atRiskElderly: 0,
      activeInterventions: 0,
      pendingFollowUps: 0,
    },
    recentAssessments: [],
    upcomingFollowUps: [],
    riskDistribution: { healthy: 0, at_risk: 0, intervention: 0 },
    volunteerStats: undefined,
  })
  const [elderlyData, setElderlyData] = useState<{
    assessments: Assessment[]
    interventions: Intervention[]
    followUps: FollowUp[]
    assignedVolunteer: SafeUser | null
  }>({
    assessments: [],
    interventions: [],
    followUps: [],
    assignedVolunteer: null,
  })

  // Use hydration-safe user value
  const currentUser = hydrated ? user : null
  const safeHasRole = hydrated ? hasRole : () => false

  // Fetch dashboard data based on user role
  const fetchDashboardData = useCallback(async () => {
    if (!hydrated || !currentUser) return

    // For elderly/family, use different data fetching
    if (currentUser.role === 'elderly' || currentUser.role === 'family') {
      try {
        const [assessmentsRes, interventionsRes, followUpsRes] = await Promise.all([
          fetch(`/api/assessments?subjectId=${currentUser.id}&limit=10`).then(r => r.json()),
          fetch(`/api/interventions?userId=${currentUser.id}&status=pending,in_progress`).then(r => r.json()),
          fetch(`/api/followups?elderlyId=${currentUser.id}&status=scheduled`).then(r => r.json()),
        ])

        let volunteer = null
        if (currentUser.assignedVolunteer) {
          const volunteerId = typeof currentUser.assignedVolunteer === 'object'
            ? (currentUser.assignedVolunteer as any).id
            : currentUser.assignedVolunteer
          if (volunteerId) {
            const volunteerRes = await fetch(`/api/users/${volunteerId}`).then(r => r.json())
            if (volunteerRes.success) volunteer = volunteerRes.data
          }
        }

        setElderlyData({
          assessments: assessmentsRes.success ? assessmentsRes.data?.assessments || [] : [],
          interventions: interventionsRes.success ? interventionsRes.data?.interventions || [] : [],
          followUps: followUpsRes.success ? followUpsRes.data?.followUps || [] : [],
          assignedVolunteer: volunteer,
        })
      } catch (error) {
        console.error('Failed to fetch elderly data:', error)
      } finally {
        setLoading(false)
      }
      return
    }

    // For admin/professional/volunteer - fetch dashboard stats
    try {
      const [elderlyRes, assessmentsRes, interventionsRes, followUpsRes] = await Promise.all([
        fetch('/api/users?role=elderly&limit=1000').then(r => r.json()),
        fetch('/api/assessments?limit=10').then(r => r.json()),
        fetch('/api/interventions?status=pending,in_progress&limit=100').then(r => r.json()),
        fetch('/api/followups?status=scheduled&limit=10').then(r => r.json()),
      ])

      const elderlyList: SafeUser[] = elderlyRes.success ? elderlyRes.data?.users || [] : []
      const assessmentsList: Assessment[] = assessmentsRes.success ? assessmentsRes.data?.assessments || [] : []
      const interventionsList: Intervention[] = interventionsRes.success ? interventionsRes.data?.interventions || [] : []
      const followUpsList: FollowUp[] = followUpsRes.success ? followUpsRes.data?.followUps || [] : []

      // Calculate risk distribution from assessments
      const riskCounts = { healthy: 0, at_risk: 0, intervention: 0 }

      // Get latest assessment per elderly to calculate current risk status
      const elderlyLatestAssessment = new Map<string, Assessment>()
      assessmentsList.forEach((assessment: Assessment) => {
        const existing = elderlyLatestAssessment.get(assessment.subjectId)
        if (!existing || new Date(assessment.assessedAt) > new Date(existing.assessedAt)) {
          elderlyLatestAssessment.set(assessment.subjectId, assessment)
        }
      })

      elderlyLatestAssessment.forEach((assessment) => {
        if (assessment.overallRisk && riskCounts.hasOwnProperty(assessment.overallRisk)) {
          riskCounts[assessment.overallRisk as keyof typeof riskCounts]++
        }
      })

      // Calculate volunteer-specific stats
      let volunteerStats = undefined
      if (currentUser.role === 'volunteer') {
        const assignedElderly = elderlyList.filter(e => e.assignedVolunteer === currentUser.id)
        const pendingFollowUps = followUpsList.filter(f => f.assigneeId === currentUser.id)
        volunteerStats = {
          assignedCount: assignedElderly.length,
          maxAssignments: currentUser.maxAssignments || 10,
          pendingVisits: pendingFollowUps.length,
        }
      }

      setDashboardData({
        stats: {
          totalElderly: elderlyRes.success ? elderlyRes.data?.total || elderlyList.length : 0,
          totalAssessments: assessmentsRes.success ? assessmentsRes.data?.total || assessmentsList.length : 0,
          atRiskElderly: riskCounts.at_risk + riskCounts.intervention,
          activeInterventions: interventionsList.length,
          pendingFollowUps: followUpsList.length,
        },
        recentAssessments: assessmentsList.slice(0, 5),
        upcomingFollowUps: followUpsList.slice(0, 5),
        riskDistribution: riskCounts,
        volunteerStats,
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [hydrated, currentUser])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Show loading state while hydrating
  if (!hydrated) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  // Elderly Dashboard
  if (currentUser?.role === 'elderly') {
    if (loading) {
      return (
        <DashboardLayout title="My Health Dashboard" subtitle="Loading...">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      )
    }

    return (
      <DashboardLayout
        title="My Health Dashboard"
        subtitle="Your personal health overview"
      >
        <ElderlyDashboard
          elderly={currentUser as SafeUser}
          latestAssessment={elderlyData.assessments[0] || null}
          upcomingFollowUps={elderlyData.followUps}
          activeInterventions={elderlyData.interventions}
          assignedVolunteer={elderlyData.assignedVolunteer}
          caregiver={{
            name: currentUser.caregiverName,
            phone: currentUser.caregiverPhone,
            relation: currentUser.caregiverRelation,
          }}
        />
      </DashboardLayout>
    )
  }

  // Family Dashboard
  if (currentUser?.role === 'family') {
    if (loading) {
      return (
        <DashboardLayout title="Family Dashboard" subtitle="Loading...">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      )
    }

    return (
      <DashboardLayout
        title="Family Dashboard"
        subtitle="Monitor your loved one's health"
      >
        <FamilyDashboard
          familyMember={currentUser as SafeUser}
          linkedElderly={null}
          latestAssessment={elderlyData.assessments[0] || null}
          upcomingFollowUps={elderlyData.followUps}
          activeInterventions={elderlyData.interventions}
          assignedVolunteer={elderlyData.assignedVolunteer}
        />
      </DashboardLayout>
    )
  }

  const getRiskBadge = (level: RiskLevel) => {
    const styles = getRiskLevelStyles(level)
    const labels: Record<RiskLevel, string> = {
      healthy: 'Healthy',
      at_risk: 'At Risk',
      intervention: 'Needs Care',
    }
    return (
      <Badge variant="outline" className={cn('border', styles?.badge)}>
        {labels[level]}
      </Badge>
    )
  }

  // Show loading for staff dashboards (elderly/family already handled above)
  if (loading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  // Generate dynamic stats
  const stats = [
    {
      title: 'Total Elders',
      value: dashboardData.stats.totalElderly.toString(),
      description: 'registered',
      icon: Users,
      color: 'primary',
    },
    {
      title: 'Total Assessments',
      value: dashboardData.stats.totalAssessments.toString(),
      description: 'completed',
      icon: ClipboardCheck,
      color: 'secondary',
    },
    {
      title: 'At-Risk Elders',
      value: dashboardData.stats.atRiskElderly.toString(),
      description: 'need attention',
      icon: AlertTriangle,
      color: 'intervention',
    },
    {
      title: 'Active Interventions',
      value: dashboardData.stats.activeInterventions.toString(),
      description: 'ongoing',
      icon: Activity,
      color: 'healthy',
    },
  ]

  // Calculate risk distribution percentages
  const totalRisk = dashboardData.riskDistribution.healthy + dashboardData.riskDistribution.at_risk + dashboardData.riskDistribution.intervention
  const riskDistribution = [
    {
      level: 'Healthy',
      count: dashboardData.riskDistribution.healthy,
      percentage: totalRisk > 0 ? Math.round((dashboardData.riskDistribution.healthy / totalRisk) * 100) : 0,
      color: 'bg-healthy',
    },
    {
      level: 'At Risk',
      count: dashboardData.riskDistribution.at_risk,
      percentage: totalRisk > 0 ? Math.round((dashboardData.riskDistribution.at_risk / totalRisk) * 100) : 0,
      color: 'bg-at-risk',
    },
    {
      level: 'Needs Intervention',
      count: dashboardData.riskDistribution.intervention,
      percentage: totalRisk > 0 ? Math.round((dashboardData.riskDistribution.intervention / totalRisk) * 100) : 0,
      color: 'bg-intervention',
    },
  ]

  return (
    <DashboardLayout
      title={`Namaste, ${currentUser?.name?.split(' ')[0] || 'User'}`}
      subtitle="Here's the health overview of your elderly community"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.title} className="border-0 shadow-soft hover:shadow-soft-md transition-shadow">
              <CardContent className="p-3 lg:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-0.5 lg:mb-1 truncate">{stat.title}</p>
                    <p className="text-xl lg:text-3xl font-bold text-foreground">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1 lg:mt-2">
                      <span className="text-[10px] lg:text-xs text-muted-foreground">{stat.description}</span>
                    </div>
                  </div>
                  <div className={cn('w-9 h-9 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0', `bg-${stat.color}/10`)}>
                    <Icon className={cn('w-4 h-4 lg:w-6 lg:h-6', `text-${stat.color}`)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-4 lg:mb-6">
        <h3 className="text-xs lg:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 lg:mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} href={action.href}>
                <Card className="border-0 shadow-soft hover:shadow-soft-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                  <CardContent className="p-3 lg:p-4 flex items-center gap-2.5 lg:gap-4">
                    <div className={cn('w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0', action.color)}>
                      <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                    <span className="font-medium text-xs lg:text-base text-foreground group-hover:text-primary transition-colors truncate">
                      {action.title}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Recent Assessments */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-soft h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 lg:px-6">
              <div>
                <CardTitle className="text-base lg:text-lg">Recent Assessments</CardTitle>
                <CardDescription className="text-xs lg:text-sm">Latest health evaluations</CardDescription>
              </div>
              <Link href="/dashboard/assessments">
                <Button variant="ghost" size="sm" className="text-primary text-xs lg:text-sm">
                  View All
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 px-4 lg:px-6">
              {dashboardData.recentAssessments.map((assessment) => (
                <Link
                  key={assessment.id}
                  href={`/dashboard/assessments/${assessment.id}`}
                  className="block p-3 lg:p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2 lg:mb-3">
                    <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                      <Avatar className="w-8 h-8 lg:w-10 lg:h-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs lg:text-sm font-medium">
                          {getInitials(assessment.subject?.name || 'Unknown')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm lg:text-base text-foreground group-hover:text-primary transition-colors truncate">
                          {assessment.subject?.name || 'Unknown Elder'}
                        </h4>
                        <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm text-muted-foreground">
                          {assessment.subject?.vayoId && <span className="truncate">{assessment.subject.vayoId}</span>}
                          <span className="hidden sm:flex items-center gap-1">
                            <HandHeart className="w-3 h-3" />
                            <span className="truncate">{assessment.assessor?.name || 'Unknown'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    {getRiskBadge(assessment.overallRisk as RiskLevel)}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {assessment.domains?.slice(0, 2).map((domain) => (
                        <span
                          key={domain.id}
                          className="text-[10px] lg:text-xs px-1.5 lg:px-2 py-0.5 lg:py-1 bg-muted rounded-md text-muted-foreground capitalize"
                        >
                          {domain.domain}
                        </span>
                      ))}
                      {(assessment.domains?.length || 0) > 2 && (
                        <span className="text-[10px] lg:text-xs text-muted-foreground">
                          +{(assessment.domains?.length || 0) - 2} more
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] lg:text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                      <Calendar className="w-3 h-3" />
                      {formatDate(assessment.assessedAt)}
                    </span>
                  </div>
                </Link>
              ))}

              {dashboardData.recentAssessments.length === 0 && (
                <div className="text-center py-6 lg:py-8">
                  <ClipboardCheck className="w-10 h-10 lg:w-12 lg:h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No assessments yet</p>
                  <Link href="/dashboard/assessments/new">
                    <Button variant="outline" size="sm" className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Start Assessment
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4 lg:space-y-6">
          {/* Risk Distribution */}
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-2 px-4 lg:px-6">
              <CardTitle className="text-base lg:text-lg">Risk Distribution</CardTitle>
              <CardDescription className="text-xs lg:text-sm">Health status of all elders</CardDescription>
            </CardHeader>
            <CardContent className="px-4 lg:px-6">
              <div className="space-y-3 lg:space-y-4">
                {riskDistribution.map((item) => (
                  <div key={item.level} className="space-y-1.5 lg:space-y-2">
                    <div className="flex items-center justify-between text-xs lg:text-sm">
                      <span className="font-medium text-foreground">{item.level}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="h-1.5 lg:h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', item.color)}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-border">
                <div className="flex items-center justify-between text-xs lg:text-sm">
                  <span className="text-muted-foreground">Total Assessed</span>
                  <span className="font-semibold text-foreground">{dashboardData.riskDistribution.healthy + dashboardData.riskDistribution.at_risk + dashboardData.riskDistribution.intervention}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Follow-ups */}
          <Card className="border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 lg:px-6">
              <div>
                <CardTitle className="text-base lg:text-lg">Upcoming Follow-ups</CardTitle>
                <CardDescription className="text-xs lg:text-sm">Scheduled visits</CardDescription>
              </div>
              <Link href="/dashboard/followups">
                <Button variant="ghost" size="icon" className="text-primary">
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 lg:space-y-3 px-4 lg:px-6">
              {dashboardData.upcomingFollowUps.length > 0 ? (
                dashboardData.upcomingFollowUps.map((followup) => (
                  <Link
                    key={followup.id}
                    href={`/dashboard/followups`}
                    className="block p-2.5 lg:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="font-medium text-foreground text-xs lg:text-sm truncate">
                        {followup.elderly?.name || 'Unknown'}
                      </span>
                      <Badge variant="outline" className="text-[10px] lg:text-xs flex-shrink-0">{followup.type}</Badge>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-3 text-[10px] lg:text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(followup.scheduledDate)}
                      </span>
                      {followup.assignee && (
                        <span className="hidden sm:flex items-center gap-1">
                          <HandHeart className="w-3 h-3" />
                          <span className="truncate">{followup.assignee.name}</span>
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-4">
                  <Calendar className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs lg:text-sm text-muted-foreground">No upcoming follow-ups</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Domain Assessment Stats */}
      <div className="mt-4 lg:mt-6">
        <Card className="border-0 shadow-soft">
          <CardHeader className="px-4 lg:px-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base lg:text-lg">Assessment Domains Overview</CardTitle>
                <CardDescription className="text-xs lg:text-sm">Key health domains being monitored</CardDescription>
              </div>
              <Link href="/dashboard/assessments">
                <Button variant="outline" size="sm" className="text-xs lg:text-sm">
                  <span className="hidden sm:inline">View All Assessments</span>
                  <span className="sm:hidden">View All</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 lg:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {domainIcons.map((domain) => {
                const Icon = domain.icon
                return (
                  <div
                    key={domain.name}
                    className="p-3 lg:p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                      </div>
                      <span className="font-medium text-sm lg:text-base text-foreground">{domain.name}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs lg:text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium text-foreground">Active</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {safeHasRole(['super_admin', 'professional']) && (
        <Card className="border-0 shadow-soft mt-4 lg:mt-6 border-l-4 border-l-intervention">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-start gap-3 lg:gap-4">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-intervention/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5 text-intervention" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm lg:text-base text-foreground mb-1">Urgent Attention Required</h4>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  <strong>5 elders</strong> have been flagged as needing immediate intervention based on their latest assessments.
                  Please review their care plans promptly.
                </p>
              </div>
              <Link href="/dashboard/interventions?urgent=true" className="flex-shrink-0">
                <Button variant="outline" size="sm" className="text-xs lg:text-sm">
                  Review Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Volunteer Stats - Only for volunteers */}
      {safeHasRole(['volunteer']) && dashboardData.volunteerStats && (
        <Card className="border-0 shadow-soft mt-6 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="font-semibold text-foreground mb-1">Your Assignments</h4>
                <p className="text-sm text-muted-foreground">
                  You are currently assigned to <strong>{dashboardData.volunteerStats.assignedCount} elders</strong> (max capacity: {dashboardData.volunteerStats.maxAssignments})
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{dashboardData.volunteerStats.assignedCount}</p>
                  <p className="text-xs text-muted-foreground">Assigned</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-healthy">{dashboardData.volunteerStats.pendingVisits}</p>
                  <p className="text-xs text-muted-foreground">Pending Visits</p>
                </div>
                <Link href="/dashboard/elderly">
                  <Button size="sm">
                    View My Elders
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}
