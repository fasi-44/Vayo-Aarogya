'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getInitials, formatDate } from '@/lib/utils'
import {
  ClipboardCheck,
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  AlertCircle,
  FileText,
  Stethoscope,
  Clock,
} from 'lucide-react'
import type { Assessment, Intervention, FollowUp } from '@/types'

interface ProfessionalDashboardProps {
  stats: {
    myAssessments: number
    pendingReviews: number
    activeInterventions: number
    upcomingFollowUps: number
  }
  recentAssessments: Assessment[]
  pendingInterventions: Intervention[]
  todayFollowUps: FollowUp[]
}

export function ProfessionalDashboard({
  stats,
  recentAssessments,
  pendingInterventions,
  todayFollowUps,
}: ProfessionalDashboardProps) {
  const statCards = [
    { title: 'My Assessments', value: stats.myAssessments, icon: ClipboardCheck, color: 'bg-primary' },
    { title: 'Pending Reviews', value: stats.pendingReviews, icon: FileText, color: 'bg-yellow-500' },
    { title: 'Active Interventions', value: stats.activeInterventions, icon: Activity, color: 'bg-orange-500' },
    { title: 'Upcoming Follow-ups', value: stats.upcomingFollowUps, icon: Calendar, color: 'bg-blue-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-0 shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
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
        <Link href="/dashboard/assessments/new">
          <Card className="border-0 shadow-soft hover:shadow-soft-md transition-all hover:-translate-y-0.5 cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <span className="font-medium group-hover:text-primary">New Assessment</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/interventions">
          <Card className="border-0 shadow-soft hover:shadow-soft-md transition-all hover:-translate-y-0.5 cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-medium group-hover:text-primary">Interventions</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/followups">
          <Card className="border-0 shadow-soft hover:shadow-soft-md transition-all hover:-translate-y-0.5 cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="font-medium group-hover:text-primary">Schedule Follow-up</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/reports">
          <Card className="border-0 shadow-soft hover:shadow-soft-md transition-all hover:-translate-y-0.5 cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-medium group-hover:text-primary">Reports</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Follow-ups */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Today&apos;s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayFollowUps.length > 0 ? (
              todayFollowUps.slice(0, 5).map((followUp) => (
                <div key={followUp.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{followUp.elderly?.name}</span>
                    <Badge variant="outline" className="text-xs">{followUp.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{followUp.title}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No follow-ups scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Interventions */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Pending Interventions
            </CardTitle>
            <Link href="/dashboard/interventions">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInterventions.slice(0, 5).map((intervention) => (
              <div key={intervention.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{intervention.title}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      intervention.priority === 'urgent' && 'bg-red-50 text-red-700',
                      intervention.priority === 'high' && 'bg-orange-50 text-orange-700',
                      intervention.priority === 'medium' && 'bg-yellow-50 text-yellow-700',
                      intervention.priority === 'low' && 'bg-green-50 text-green-700'
                    )}
                  >
                    {intervention.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{intervention.user?.name}</p>
              </div>
            ))}
            {pendingInterventions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No pending interventions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Assessments */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Recent Assessments
            </CardTitle>
            <Link href="/dashboard/assessments">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAssessments.slice(0, 5).map((assessment) => (
              <div key={assessment.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(assessment.subject?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{assessment.subject?.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(assessment.assessedAt)}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    assessment.overallRisk === 'healthy' && 'bg-green-50 text-green-700',
                    assessment.overallRisk === 'at_risk' && 'bg-yellow-50 text-yellow-700',
                    assessment.overallRisk === 'intervention' && 'bg-red-50 text-red-700'
                  )}
                >
                  {assessment.overallRisk === 'at_risk' ? 'At Risk' : assessment.overallRisk}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
