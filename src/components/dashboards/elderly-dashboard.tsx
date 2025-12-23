'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getInitials, formatDate } from '@/lib/utils'
import {
  User,
  Calendar,
  Activity,
  Phone,
  Heart,
  CheckCircle,
  Clock,
  Pill,
  Sun,
  ClipboardCheck,
  BarChart3,
  Settings,
  ArrowRight,
} from 'lucide-react'
import { HealthStatusCard } from '@/components/health-status/health-status-card'
import type { SafeUser, Assessment, FollowUp, Intervention } from '@/types'

interface ElderlyDashboardProps {
  elderly: SafeUser
  latestAssessment: Assessment | null
  upcomingFollowUps: FollowUp[]
  activeInterventions: Intervention[]
  assignedVolunteer: SafeUser | null
  caregiver: { name?: string; phone?: string; relation?: string } | null
}

export function ElderlyDashboard({
  elderly,
  latestAssessment,
  upcomingFollowUps,
  activeInterventions,
  assignedVolunteer,
  caregiver,
}: ElderlyDashboardProps) {
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="border-0 shadow-soft bg-gradient-to-r from-primary to-primary/80 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Sun className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{getGreeting()}, {elderly.name?.split(' ')[0]}!</h1>
              <p className="text-white/80">Here&apos;s your health overview</p>
              {elderly.vayoId && (
                <p className="text-white/60 text-sm mt-1">ID: {elderly.vayoId}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/my-assessments">
          <Card className="border-0 shadow-soft hover:shadow-soft-md transition-all hover:-translate-y-0.5 cursor-pointer group h-full">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                <ClipboardCheck className="w-6 h-6 text-blue-600" />
              </div>
              <span className="font-medium text-sm group-hover:text-primary transition-colors">
                My Assessments
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/my-interventions">
          <Card className="border-0 shadow-soft hover:shadow-soft-md transition-all hover:-translate-y-0.5 cursor-pointer group h-full">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <span className="font-medium text-sm group-hover:text-primary transition-colors">
                My Care Plans
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/my-followups">
          <Card className="border-0 shadow-soft hover:shadow-soft-md transition-all hover:-translate-y-0.5 cursor-pointer group h-full">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <span className="font-medium text-sm group-hover:text-primary transition-colors">
                My Follow-ups
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/my-report">
          <Card className="border-0 shadow-soft hover:shadow-soft-md transition-all hover:-translate-y-0.5 cursor-pointer group h-full">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <span className="font-medium text-sm group-hover:text-primary transition-colors">
                Health Report
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Profile Quick Action */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Manage Your Profile</p>
                <p className="text-sm text-muted-foreground">Update your details or change password</p>
              </div>
            </div>
            <Link href="/dashboard/profile">
              <Button variant="outline" size="sm">
                Edit Profile
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Health Status */}
      {latestAssessment && (
        <HealthStatusCard
          riskLevel={latestAssessment.overallRisk}
          lastAssessmentDate={formatDate(latestAssessment.assessedAt)}
          compact={false}
        />
      )}

      {/* Quick Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Next Appointment */}
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium">Next Visit</span>
            </div>
            {upcomingFollowUps.length > 0 ? (
              <div>
                <p className="text-lg font-bold">{formatDate(upcomingFollowUps[0].scheduledDate)}</p>
                <p className="text-sm text-muted-foreground">{upcomingFollowUps[0].title}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming visits</p>
            )}
          </CardContent>
        </Card>

        {/* Active Care Plans */}
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <span className="font-medium">Care Plans</span>
            </div>
            <p className="text-lg font-bold">{activeInterventions.length} Active</p>
            <p className="text-sm text-muted-foreground">
              {activeInterventions.filter(i => i.priority === 'high' || i.priority === 'urgent').length} require attention
            </p>
          </CardContent>
        </Card>

        {/* My Volunteer */}
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-teal-600" />
              </div>
              <span className="font-medium">My Volunteer</span>
            </div>
            {assignedVolunteer ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{assignedVolunteer.name}</p>
                  {assignedVolunteer.phone && (
                    <p className="text-sm text-muted-foreground">{assignedVolunteer.phone}</p>
                  )}
                </div>
                {assignedVolunteer.phone && (
                  <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <a href={`tel:${assignedVolunteer.phone}`}>
                      <Phone className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Not assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Visits */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              My Upcoming Visits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingFollowUps.length > 0 ? (
              upcomingFollowUps.slice(0, 5).map((followUp) => (
                <div key={followUp.id} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{followUp.title}</span>
                    <Badge variant="outline">{followUp.type}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(followUp.scheduledDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(followUp.scheduledDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {followUp.assignee && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Visitor: {followUp.assignee.name}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-50" />
                <p className="text-lg">No upcoming visits</p>
                <p className="text-sm">Your schedule is clear!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-500" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Caregiver */}
            {caregiver?.name && (
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-rose-100 text-rose-700">
                        {getInitials(caregiver.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{caregiver.name}</p>
                      <p className="text-sm text-muted-foreground">{caregiver.relation || 'Caregiver'}</p>
                    </div>
                  </div>
                  {caregiver.phone && (
                    <Button variant="default" asChild>
                      <a href={`tel:${caregiver.phone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Volunteer */}
            {assignedVolunteer && (
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-teal-100 text-teal-700">
                        {getInitials(assignedVolunteer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{assignedVolunteer.name}</p>
                      <p className="text-sm text-muted-foreground">Volunteer</p>
                    </div>
                  </div>
                  {assignedVolunteer.phone && (
                    <Button variant="outline" asChild>
                      <a href={`tel:${assignedVolunteer.phone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Emergency Number */}
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-red-700">Emergency Services</p>
                  <p className="text-sm text-red-600">Call for immediate help</p>
                </div>
                <Button variant="destructive" asChild>
                  <a href="tel:112">
                    <Phone className="w-4 h-4 mr-2" />
                    112
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Care Plans */}
      {activeInterventions.length > 0 && (
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="w-5 h-5 text-purple-500" />
              My Care Plans
            </CardTitle>
            <CardDescription>Things to focus on for better health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {activeInterventions.slice(0, 4).map((intervention) => (
                <div key={intervention.id} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{intervention.title}</h4>
                    <Badge
                      variant="outline"
                      className={cn(
                        intervention.status === 'pending' && 'bg-gray-50',
                        intervention.status === 'in_progress' && 'bg-blue-50 text-blue-700'
                      )}
                    >
                      {intervention.status === 'in_progress' ? 'In Progress' : 'Pending'}
                    </Badge>
                  </div>
                  {intervention.description && (
                    <p className="text-sm text-muted-foreground">{intervention.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
