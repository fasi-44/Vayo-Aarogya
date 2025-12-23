'use client'

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/store'
import { cn, formatDate, getInitials } from '@/lib/utils'
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  CalendarDays,
  User,
  Phone,
  MapPin,
} from 'lucide-react'
import type { FollowUp } from '@/types'

export default function MyFollowupsPage() {
  const { user } = useAuthStore()
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('upcoming')

  useEffect(() => {
    async function fetchFollowUps() {
      if (!user?.id) return

      try {
        const res = await fetch(`/api/followups?elderlyId=${user.id}&limit=50`)
        const data = await res.json()
        if (data.success) {
          setFollowUps(data.data?.followUps || [])
        }
      } catch (error) {
        console.error('Failed to fetch follow-ups:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFollowUps()
  }, [user])

  const now = new Date()
  const filteredFollowUps = followUps.filter((f) => {
    const scheduledDate = new Date(f.scheduledDate)
    if (filter === 'upcoming') {
      return scheduledDate >= now && f.status === 'scheduled'
    }
    if (filter === 'past') {
      return scheduledDate < now || f.status === 'completed' || f.status === 'missed'
    }
    return true
  }).sort((a, b) => {
    if (filter === 'upcoming') {
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    }
    return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { className: string; icon: React.ReactNode }> = {
      scheduled: { className: 'bg-blue-100 text-blue-700', icon: <Clock className="w-3 h-3 mr-1" /> },
      completed: { className: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      missed: { className: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3 mr-1" /> },
      rescheduled: { className: 'bg-yellow-100 text-yellow-700', icon: <Calendar className="w-3 h-3 mr-1" /> },
    }
    const style = styles[status] || styles.scheduled
    return (
      <Badge variant="outline" className={cn('flex items-center', style.className)}>
        {style.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      routine: 'bg-gray-100 text-gray-700',
      assessment: 'bg-purple-100 text-purple-700',
      intervention: 'bg-orange-100 text-orange-700',
      emergency: 'bg-red-100 text-red-700',
    }
    return (
      <Badge variant="outline" className={styles[type] || ''}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const stats = {
    total: followUps.length,
    upcoming: followUps.filter((f) => new Date(f.scheduledDate) >= now && f.status === 'scheduled').length,
    completed: followUps.filter((f) => f.status === 'completed').length,
    missed: followUps.filter((f) => f.status === 'missed').length,
  }

  const nextFollowUp = followUps.find((f) => new Date(f.scheduledDate) >= now && f.status === 'scheduled')

  if (loading) {
    return (
      <DashboardLayout title="My Follow-ups" subtitle="View your scheduled visits">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="My Follow-ups"
      subtitle="View and manage your scheduled visits"
    >
      {/* Next Follow-up Highlight */}
      {nextFollowUp && (
        <Card className="border-0 shadow-soft mb-6 bg-gradient-to-r from-primary to-primary/80 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">Your Next Visit</p>
                <h3 className="text-xl font-bold mb-2">{nextFollowUp.title}</h3>
                <div className="flex items-center gap-4 text-white/90">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    {formatDate(nextFollowUp.scheduledDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(nextFollowUp.scheduledDate).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              {nextFollowUp.assignee && (
                <div className="text-right">
                  <p className="text-white/70 text-sm mb-1">Visitor</p>
                  <p className="font-medium">{nextFollowUp.assignee.name}</p>
                  {nextFollowUp.assignee.phone && (
                    <a
                      href={`tel:${nextFollowUp.assignee.phone}`}
                      className="text-sm text-white/90 hover:text-white flex items-center justify-end gap-1 mt-1"
                    >
                      <Phone className="w-3 h-3" />
                      Call
                    </a>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Missed</p>
                <p className="text-2xl font-bold">{stats.missed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'upcoming' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </Button>
        <Button
          variant={filter === 'past' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('past')}
        >
          Past
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
      </div>

      {/* Follow-ups List */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>
            {filter === 'upcoming' ? 'Upcoming Visits' : filter === 'past' ? 'Past Visits' : 'All Visits'}
          </CardTitle>
          <CardDescription>
            {filter === 'upcoming'
              ? 'Your scheduled upcoming visits'
              : filter === 'past'
              ? 'Your completed and past visits'
              : 'All your scheduled and past visits'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFollowUps.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No follow-ups found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === 'upcoming'
                  ? 'No upcoming visits scheduled'
                  : 'No past visits to show'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFollowUps.map((followUp) => (
                <div
                  key={followUp.id}
                  className={cn(
                    'p-4 rounded-lg border transition-colors',
                    followUp.status === 'missed' && 'border-red-200 bg-red-50/50',
                    followUp.status === 'completed' && 'opacity-70'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{followUp.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {getTypeBadge(followUp.type)}
                        {getStatusBadge(followUp.status)}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{formatDate(followUp.scheduledDate)}</p>
                      <p className="text-muted-foreground">
                        {new Date(followUp.scheduledDate).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {followUp.assignee && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(followUp.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{followUp.assignee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {followUp.assignee.role === 'volunteer' ? 'Volunteer' : 'Healthcare Provider'}
                        </p>
                      </div>
                      {followUp.assignee.phone && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`tel:${followUp.assignee.phone}`}>
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </a>
                        </Button>
                      )}
                    </div>
                  )}

                  {followUp.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                      <p className="text-sm">{followUp.notes}</p>
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
