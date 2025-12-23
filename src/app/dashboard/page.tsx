'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore, useHydration, assessmentDomains, getRiskLevelStyles, RiskLevel } from '@/store'
import { cn, getInitials, formatDate } from '@/lib/utils'
import {
  AdminDashboard,
  ProfessionalDashboard,
  VolunteerDashboard,
  FamilyDashboard,
  ElderlyDashboard,
} from '@/components/dashboards'
import {
  Users,
  ClipboardCheck,
  Activity,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Calendar,
  CheckCircle2,
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
  FileText,
  HeartPulse,
  Loader2,
} from 'lucide-react'
import type { SafeUser, Assessment, Intervention, FollowUp } from '@/types'

// Mock data for Vayo Aarogya dashboard
const stats = [
  {
    title: 'Total Elders',
    value: '156',
    change: '+12',
    description: 'this month',
    icon: Users,
    color: 'primary',
  },
  {
    title: 'Pending Assessments',
    value: '23',
    change: '5',
    description: 'urgent',
    icon: ClipboardCheck,
    color: 'at-risk',
  },
  {
    title: 'At-Risk Elders',
    value: '34',
    change: '-3',
    description: 'improving',
    icon: AlertTriangle,
    color: 'intervention',
  },
  {
    title: 'Active Interventions',
    value: '67',
    change: '+8',
    description: 'ongoing',
    icon: Activity,
    color: 'healthy',
  },
]

const recentAssessments = [
  {
    id: '1',
    elderName: 'Shri Ram Prasad',
    age: 72,
    assessedBy: 'Amit Singh',
    date: '2025-01-15',
    riskLevel: 'healthy' as RiskLevel,
    domains: ['cognition', 'mobility', 'nutrition'],
  },
  {
    id: '2',
    elderName: 'Smt. Kamala Devi',
    age: 78,
    assessedBy: 'Priya Sharma',
    date: '2025-01-14',
    riskLevel: 'at_risk' as RiskLevel,
    domains: ['vision', 'hearing', 'falls'],
  },
  {
    id: '3',
    elderName: 'Shri Mohan Lal',
    age: 81,
    assessedBy: 'Amit Singh',
    date: '2025-01-14',
    riskLevel: 'intervention' as RiskLevel,
    domains: ['cognition', 'depression', 'medication'],
  },
  {
    id: '4',
    elderName: 'Smt. Savitri Bai',
    age: 69,
    assessedBy: 'Rahul Verma',
    date: '2025-01-13',
    riskLevel: 'healthy' as RiskLevel,
    domains: ['nutrition', 'sleep', 'social'],
  },
]

const upcomingFollowups = [
  {
    id: '1',
    elderName: 'Shri Ram Prasad',
    type: 'Routine Check',
    date: '2025-01-16',
    time: '10:00 AM',
    volunteer: 'Amit Singh',
  },
  {
    id: '2',
    elderName: 'Smt. Kamala Devi',
    type: 'Vision Review',
    date: '2025-01-17',
    time: '11:30 AM',
    volunteer: 'Priya Sharma',
  },
  {
    id: '3',
    elderName: 'Shri Mohan Lal',
    type: 'Medication Check',
    date: '2025-01-18',
    time: '09:00 AM',
    volunteer: 'Dr. Rajesh Kumar',
  },
]

const riskDistribution = [
  { level: 'Healthy', count: 89, percentage: 57, color: 'bg-healthy' },
  { level: 'At Risk', count: 43, percentage: 28, color: 'bg-at-risk' },
  { level: 'Needs Intervention', count: 24, percentage: 15, color: 'bg-intervention' },
]

const quickActions = [
  { title: 'New Assessment', href: '/dashboard/assessments/new', icon: ClipboardCheck, color: 'bg-primary' },
  { title: 'Add Elder', href: '/dashboard/elderly', icon: UserPlus, color: 'bg-secondary' },
  { title: 'View Reports', href: '/dashboard/reports', icon: BarChart3, color: 'bg-accent' },
  { title: 'Schedule Follow-up', href: '/dashboard/followups', icon: Calendar, color: 'bg-healthy' },
]

const domainStats = [
  { name: 'Cognition', icon: Brain, assessed: 142, atRisk: 23 },
  { name: 'Mobility', icon: Footprints, assessed: 156, atRisk: 31 },
  { name: 'Mental Health', icon: Heart, assessed: 138, atRisk: 28 },
  { name: 'Nutrition', icon: HeartPulse, assessed: 145, atRisk: 19 },
]

export default function DashboardPage() {
  const { user, hasRole } = useAuthStore()
  const hydrated = useHydration()
  const [loading, setLoading] = useState(true)
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

  // Fetch data for elderly/family dashboard
  useEffect(() => {
    async function fetchElderlyData() {
      if (!hydrated) return

      if (currentUser?.role !== 'elderly' && currentUser?.role !== 'family') {
        setLoading(false)
        return
      }

      try {
        const [assessmentsRes, interventionsRes, followUpsRes] = await Promise.all([
          fetch(`/api/assessments?elderlyId=${currentUser.id}&limit=10`).then(r => r.json()),
          fetch(`/api/interventions?elderlyId=${currentUser.id}&status=pending,in_progress`).then(r => r.json()),
          fetch(`/api/followups?elderlyId=${currentUser.id}&status=scheduled`).then(r => r.json()),
        ])

        let volunteer = null
        if (currentUser.assignedVolunteer) {
          const volunteerRes = await fetch(`/api/users/${currentUser.assignedVolunteer}`).then(r => r.json())
          if (volunteerRes.success) volunteer = volunteerRes.data
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
    }

    fetchElderlyData()
  }, [currentUser, hydrated])

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

  // Set loading to false for non-elderly users (already filtered by early returns above)
  if (loading) {
    setLoading(false)
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

  return (
    <DashboardLayout
      title={`Namaste, ${currentUser?.name?.split(' ')[0] || 'User'}`}
      subtitle="Here's the health overview of your elderly community"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const isPositive = stat.change.startsWith('+') || stat.change.startsWith('-3')

          return (
            <Card key={stat.title} className="border-0 shadow-soft hover:shadow-soft-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className={cn(
                        'text-sm font-medium',
                        stat.color === 'intervention' || stat.color === 'at-risk'
                          ? 'text-at-risk'
                          : 'text-healthy'
                      )}>
                        {stat.change}
                      </span>
                      <span className="text-xs text-muted-foreground">{stat.description}</span>
                    </div>
                  </div>
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', `bg-${stat.color}/10`)}>
                    <Icon className={cn('w-6 h-6', `text-${stat.color}`)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} href={action.href}>
                <Card className="border-0 shadow-soft hover:shadow-soft-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white', action.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {action.title}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Assessments */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-soft h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Recent Assessments</CardTitle>
                <CardDescription>Latest health evaluations completed</CardDescription>
              </div>
              <Link href="/dashboard/assessments">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {getInitials(assessment.elderName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {assessment.elderName}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{assessment.age} years</span>
                          <span className="flex items-center gap-1">
                            <HandHeart className="w-3.5 h-3.5" />
                            {assessment.assessedBy}
                          </span>
                        </div>
                      </div>
                    </div>
                    {getRiskBadge(assessment.riskLevel)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {assessment.domains.slice(0, 3).map((domain) => (
                        <span
                          key={domain}
                          className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground capitalize"
                        >
                          {domain}
                        </span>
                      ))}
                      {assessment.domains.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{assessment.domains.length - 3} more
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(assessment.date)}
                    </span>
                  </div>
                </div>
              ))}

              {recentAssessments.length === 0 && (
                <div className="text-center py-8">
                  <ClipboardCheck className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No assessments yet</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Start Assessment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Risk Distribution */}
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Risk Distribution</CardTitle>
              <CardDescription>Health status of all elders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskDistribution.map((item) => (
                  <div key={item.level} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.level}</span>
                      <span className="text-muted-foreground">{item.count} elders</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', item.color)}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Assessed</span>
                  <span className="font-semibold text-foreground">156 elders</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Follow-ups */}
          <Card className="border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Upcoming Follow-ups</CardTitle>
                <CardDescription>Scheduled visits</CardDescription>
              </div>
              <Link href="/dashboard/followups">
                <Button variant="ghost" size="icon" className="text-primary">
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingFollowups.map((followup) => (
                <div
                  key={followup.id}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground text-sm">{followup.elderName}</span>
                    <Badge variant="outline" className="text-xs">{followup.type}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(followup.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {followup.time}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Domain Assessment Stats */}
      <div className="mt-6">
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Assessment Domains Overview</CardTitle>
                <CardDescription>Key health domains being monitored</CardDescription>
              </div>
              <Link href="/dashboard/assessments">
                <Button variant="outline" size="sm">
                  View All 20 Domains
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {domainStats.map((domain) => {
                const Icon = domain.icon
                const atRiskPercentage = Math.round((domain.atRisk / domain.assessed) * 100)
                return (
                  <div
                    key={domain.name}
                    className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{domain.name}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Assessed</span>
                        <span className="font-medium text-foreground">{domain.assessed}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">At Risk</span>
                        <span className="font-medium text-at-risk">{domain.atRisk} ({atRiskPercentage}%)</span>
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
        <Card className="border-0 shadow-soft mt-6 border-l-4 border-l-intervention">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-intervention/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-intervention" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">Urgent Attention Required</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>5 elders</strong> have been flagged as needing immediate intervention based on their latest assessments.
                  Please review their care plans promptly.
                </p>
              </div>
              <Link href="/dashboard/interventions?urgent=true">
                <Button variant="outline" size="sm">
                  Review Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Volunteer Stats - Only for volunteers */}
      {safeHasRole(['volunteer']) && (
        <Card className="border-0 shadow-soft mt-6 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-foreground mb-1">Your Assignments</h4>
                <p className="text-sm text-muted-foreground">
                  You are currently assigned to <strong>8 elders</strong> (max capacity: 10)
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">8</p>
                  <p className="text-xs text-muted-foreground">Assigned</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-healthy">3</p>
                  <p className="text-xs text-muted-foreground">Pending Visits</p>
                </div>
                <Link href="/dashboard/elderly?assigned=me">
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
