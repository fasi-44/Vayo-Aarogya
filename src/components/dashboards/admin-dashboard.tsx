'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getInitials, formatDate } from '@/lib/utils'
import {
  Users,
  ClipboardCheck,
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  UserPlus,
  Calendar,
  AlertCircle,
  TrendingUp,
  MapPin,
  Settings,
} from 'lucide-react'
import type { SafeUser, Assessment } from '@/types'

interface AdminDashboardProps {
  stats: {
    totalElderly: number
    totalVolunteers: number
    totalAssessments: number
    atRiskElderly: number
    pendingInterventions: number
    overdueFollowUps: number
  }
  recentAssessments: Assessment[]
  urgentAlerts: { id: string; message: string; type: 'intervention' | 'followup' | 'assessment' }[]
  riskDistribution: { healthy: number; atRisk: number; intervention: number }
}

export function AdminDashboard({
  stats,
  recentAssessments,
  urgentAlerts,
  riskDistribution,
}: AdminDashboardProps) {
  const statCards = [
    { title: 'Total Elders', value: stats.totalElderly, icon: Users, color: 'bg-primary', change: '+12 this month' },
    { title: 'Volunteers', value: stats.totalVolunteers, icon: UserPlus, color: 'bg-teal-500', change: 'Active' },
    { title: 'Assessments', value: stats.totalAssessments, icon: ClipboardCheck, color: 'bg-blue-500', change: 'This month' },
    { title: 'At Risk', value: stats.atRiskElderly, icon: AlertTriangle, color: 'bg-yellow-500', change: 'Need attention' },
    { title: 'Pending Interventions', value: stats.pendingInterventions, icon: Activity, color: 'bg-orange-500', change: 'In progress' },
    { title: 'Overdue Follow-ups', value: stats.overdueFollowUps, icon: Calendar, color: 'bg-red-500', change: 'Urgent' },
  ]

  const quickActions = [
    { title: 'New Assessment', href: '/dashboard/assessments/new', icon: ClipboardCheck, color: 'bg-primary' },
    { title: 'Add Elder', href: '/dashboard/elderly?action=add', icon: UserPlus, color: 'bg-teal-500' },
    { title: 'View Reports', href: '/dashboard/reports', icon: BarChart3, color: 'bg-blue-500' },
    { title: 'Manage Volunteers', href: '/dashboard/care-team', icon: Users, color: 'bg-green-500' },
  ]

  const total = riskDistribution.healthy + riskDistribution.atRisk + riskDistribution.intervention

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-0 shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', stat.color)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.title} href={action.href}>
              <Card className="border-0 shadow-soft hover:shadow-soft-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', action.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium group-hover:text-primary transition-colors">{action.title}</span>
                  <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Assessments */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-soft h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Recent Assessments</CardTitle>
                <CardDescription>Latest health evaluations</CardDescription>
              </div>
              <Link href="/dashboard/assessments">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAssessments.slice(0, 5).map((assessment) => (
                <div key={assessment.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(assessment.subject?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{assessment.subject?.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(assessment.assessedAt)}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      assessment.overallRisk === 'healthy' && 'bg-green-50 text-green-700 border-green-200',
                      assessment.overallRisk === 'at_risk' && 'bg-yellow-50 text-yellow-700 border-yellow-200',
                      assessment.overallRisk === 'intervention' && 'bg-red-50 text-red-700 border-red-200'
                    )}
                  >
                    {assessment.overallRisk === 'healthy' ? 'Healthy' : assessment.overallRisk === 'at_risk' ? 'At Risk' : 'Intervention'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Risk Distribution */}
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Healthy</span>
                  <span>{riskDistribution.healthy} ({total > 0 ? Math.round((riskDistribution.healthy / total) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${total > 0 ? (riskDistribution.healthy / total) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>At Risk</span>
                  <span>{riskDistribution.atRisk} ({total > 0 ? Math.round((riskDistribution.atRisk / total) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${total > 0 ? (riskDistribution.atRisk / total) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Intervention</span>
                  <span>{riskDistribution.intervention} ({total > 0 ? Math.round((riskDistribution.intervention / total) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${total > 0 ? (riskDistribution.intervention / total) * 100 : 0}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgent Alerts */}
          {urgentAlerts.length > 0 && (
            <Card className="border-0 shadow-soft border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Urgent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {urgentAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="p-2 bg-red-50 rounded-lg text-sm text-red-700">
                    {alert.message}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
