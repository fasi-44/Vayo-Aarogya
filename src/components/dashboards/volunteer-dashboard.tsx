'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { cn, getInitials, formatDate } from '@/lib/utils'
import {
  Users,
  ClipboardCheck,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Phone,
  MapPin,
} from 'lucide-react'
import type { SafeUser, FollowUp } from '@/types'

interface VolunteerDashboardProps {
  volunteer: SafeUser
  assignedElderly: SafeUser[]
  todayFollowUps: FollowUp[]
  upcomingFollowUps: FollowUp[]
  stats: {
    totalAssigned: number
    maxAssignments: number
    completedAssessments: number
    pendingVisits: number
  }
}

export function VolunteerDashboard({
  volunteer,
  assignedElderly,
  todayFollowUps,
  upcomingFollowUps,
  stats,
}: VolunteerDashboardProps) {
  const capacityPercentage = (stats.totalAssigned / stats.maxAssignments) * 100

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="border-0 shadow-soft bg-gradient-to-r from-teal-500 to-teal-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Welcome back, {volunteer.name?.split(' ')[0]}!</h2>
              <p className="text-teal-100">Here&apos;s your daily overview</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{stats.pendingVisits}</p>
              <p className="text-teal-100 text-sm">Pending Visits Today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalAssigned}</p>
                <p className="text-xs text-muted-foreground">Assigned Elders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayFollowUps.length}</p>
                <p className="text-xs text-muted-foreground">Today&apos;s Visits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedAssessments}</p>
                <p className="text-xs text-muted-foreground">Assessments Done</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Capacity</span>
                <span className="font-medium">{stats.totalAssigned}/{stats.maxAssignments}</span>
              </div>
              <Progress value={capacityPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Today&apos;s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayFollowUps.length > 0 ? (
              todayFollowUps.map((followUp) => (
                <div key={followUp.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
                          {getInitials(followUp.elderly?.name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{followUp.elderly?.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{followUp.type}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(followUp.scheduledDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete
                    </Button>
                    <Link href="/dashboard/assessments/new">
                      <Button size="sm" className="flex-1">
                        <ClipboardCheck className="w-3 h-3 mr-1" />
                        Assess
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-50" />
                <p>No visits scheduled for today!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Elders */}
        <Card className="border-0 shadow-soft lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">My Elders</CardTitle>
              <CardDescription>{assignedElderly.length} assigned to you</CardDescription>
            </div>
            <Link href="/dashboard/elderly?assigned=me">
              <Button variant="ghost" size="sm">View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {assignedElderly.slice(0, 6).map((elder) => (
                <div key={elder.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-rose-100 text-rose-700">
                      {getInitials(elder.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{elder.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {elder.vayoId && <span>{elder.vayoId}</span>}
                      {elder.age && <span>• {elder.age} yrs</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {elder.phone && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={`tel:${elder.phone}`}>
                          <Phone className="w-4 h-4 text-green-600" />
                        </a>
                      </Button>
                    )}
                    <Link href="/dashboard/assessments/new">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ClipboardCheck className="w-4 h-4 text-primary" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Follow-ups */}
      <Card className="border-0 shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Upcoming Follow-ups</CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </div>
          <Link href="/dashboard/followups">
            <Button variant="ghost" size="sm">View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {upcomingFollowUps.slice(0, 4).map((followUp) => (
              <div key={followUp.id} className="p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">{formatDate(followUp.scheduledDate)}</span>
                </div>
                <p className="text-sm font-medium">{followUp.elderly?.name}</p>
                <Badge variant="outline" className="text-xs mt-1">{followUp.type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
