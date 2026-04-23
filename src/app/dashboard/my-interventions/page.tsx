'use client'

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store'
import { cn, formatDate } from '@/lib/utils'
import {
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Heart,
  Brain,
  Eye,
} from 'lucide-react'
import type { Intervention } from '@/types'

export default function MyInterventionsPage() {
  const { user } = useAuthStore()
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    async function fetchInterventions() {
      if (!user?.id) return

      try {
        const res = await fetch(`/api/interventions?userId=${user.id}&limit=50`)
        const data = await res.json()
        if (data.success) {
          setInterventions(data.data?.interventions || [])
        }
      } catch (error) {
        console.error('Failed to fetch interventions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInterventions()
  }, [user])

  const filteredInterventions = interventions.filter((i) => {
    if (filter === 'all') return true
    if (filter === 'active') return i.status === 'pending' || i.status === 'in_progress'
    return i.status === filter
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    }
    return (
      <Badge variant="outline" className={styles[status] || ''}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-50 text-gray-600',
      medium: 'bg-yellow-50 text-yellow-700',
      high: 'bg-orange-50 text-orange-700',
      urgent: 'bg-red-50 text-red-700',
    }
    return (
      <Badge variant="outline" className={styles[priority] || ''}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  const getDomainIcon = (domain: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      cognitive: Brain,
      psychological: Heart,
      sensory: Eye,
    }
    const Icon = icons[domain] || Activity
    return <Icon className="w-5 h-5" />
  }

  const stats = {
    total: interventions.length,
    active: interventions.filter((i) => i.status === 'pending' || i.status === 'in_progress').length,
    completed: interventions.filter((i) => i.status === 'completed').length,
    urgent: interventions.filter((i) => i.priority === 'urgent' || i.priority === 'high').length,
  }

  if (loading) {
    return (
      <DashboardLayout title="My Care Plans" subtitle="View your interventions">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="My Care Plans"
      subtitle="Track your health interventions and care activities"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="border-0 shadow-soft cursor-pointer hover:shadow-soft-md transition-shadow"
              onClick={() => setFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft cursor-pointer hover:shadow-soft-md transition-shadow"
              onClick={() => setFilter('active')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft cursor-pointer hover:shadow-soft-md transition-shadow"
              onClick={() => setFilter('completed')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.urgent}</p>
                <p className="text-sm text-muted-foreground">Needs Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="overflow-x-auto -mx-1 px-1 mb-6">
        <div className="flex gap-2">
          {['all', 'active', 'pending', 'in_progress', 'completed'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              className="text-sm whitespace-nowrap"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : f.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Button>
          ))}
        </div>
      </div>

      {/* Interventions List */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Care Plans</CardTitle>
          <CardDescription className="text-sm">
            {filter === 'all' ? 'All your care plans' : `Showing ${filter.replace('_', ' ')} care plans`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInterventions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-base text-muted-foreground">No care plans found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === 'all'
                  ? 'Care plans will appear here when assigned'
                  : `No ${filter.replace('_', ' ')} care plans`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInterventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className={cn(
                    'p-4 rounded-lg border transition-colors',
                    intervention.priority === 'urgent' && 'border-red-200 bg-red-50/50',
                    intervention.priority === 'high' && 'border-orange-200 bg-orange-50/50',
                    intervention.status === 'completed' && 'opacity-70'
                  )}
                >
                  {/* Title row */}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      intervention.status === 'completed' ? 'bg-green-100' : 'bg-primary/10'
                    )}>
                      {getDomainIcon(intervention.domain || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base">{intervention.title}</h4>
                      {intervention.domain && (
                        <p className="text-sm text-muted-foreground capitalize">
                          {intervention.domain.replace(/_/g, ' ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-2">
                    {getPriorityBadge(intervention.priority)}
                    {getStatusBadge(intervention.status)}
                  </div>

                  {intervention.description && (
                    <p className="text-sm text-muted-foreground mt-3">
                      {intervention.description}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground mt-3 pt-3 border-t">
                    <span>Created: {formatDate(intervention.createdAt)}</span>
                    {intervention.assignee && (
                      <span>Assigned to: {intervention.assignee.name}</span>
                    )}
                  </div>

                  {intervention.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                      <p className="text-sm">{intervention.notes}</p>
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
