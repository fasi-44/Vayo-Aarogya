'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FollowUpTable } from '@/components/followups/followup-table'
import { FollowUpForm, FollowUpFormData } from '@/components/followups/followup-form'
import { FollowUpCalendar, FollowUpDayView } from '@/components/followups/followup-calendar'
import {
  getFollowUps,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  completeFollowUp,
  FOLLOW_UP_TYPES,
} from '@/services/followups'
import { getElderly } from '@/services/elderly'
import { getUsers } from '@/services/users'
import type { FollowUp, SafeUser } from '@/types'
import {
  Plus,
  Search,
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  LayoutList,
} from 'lucide-react'

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [elderly, setElderly] = useState<SafeUser[]>([])
  const [volunteers, setVolunteers] = useState<SafeUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    overdue: 0,
    upcoming: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [followUpsRes, elderlyRes, volunteersRes] = await Promise.all([
        getFollowUps({ limit: 1000 }),
        getElderly({ limit: 1000 }),
        getUsers({ role: 'volunteer', limit: 1000 }),
      ])

      if (followUpsRes.success && followUpsRes.data) {
        const allFollowUps = followUpsRes.data.followUps
        setFollowUps(allFollowUps)

        // Calculate stats
        const now = new Date()
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

        setStats({
          total: allFollowUps.length,
          scheduled: allFollowUps.filter((f) => f.status === 'scheduled').length,
          completed: allFollowUps.filter((f) => f.status === 'completed').length,
          overdue: allFollowUps.filter(
            (f) =>
              f.status === 'scheduled' && new Date(f.scheduledDate) < now
          ).length,
          upcoming: allFollowUps.filter(
            (f) =>
              f.status === 'scheduled' &&
              new Date(f.scheduledDate) >= now &&
              new Date(f.scheduledDate) <= sevenDaysLater
          ).length,
        })
      }

      if (elderlyRes.success && elderlyRes.data) {
        setElderly(elderlyRes.data.users)
      }

      if (volunteersRes.success && volunteersRes.data) {
        setVolunteers(volunteersRes.data.users)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFollowUps = followUps.filter((followUp) => {
    const matchesSearch =
      followUp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      followUp.elderly?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      followUp.elderly?.vayoId?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === 'all' || followUp.status === filterStatus
    const matchesType = filterType === 'all' || followUp.type === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  const handleCreate = () => {
    setSelectedFollowUp(null)
    setFormOpen(true)
  }

  const handleEdit = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp)
    setFormOpen(true)
  }

  const handleDeleteClick = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp)
    setDeleteDialogOpen(true)
  }

  const handleComplete = async (followUp: FollowUp) => {
    setActionLoading(true)
    try {
      await completeFollowUp(followUp.id)
      await fetchData()
    } catch (error) {
      console.error('Error completing follow-up:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReschedule = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp)
    setFormOpen(true)
  }

  const handleFormSubmit = async (data: FollowUpFormData) => {
    try {
      const scheduledDate = new Date(`${data.scheduledDate}T${data.scheduledTime}`)
      const submitData = {
        ...data,
        scheduledDate: scheduledDate.toISOString(),
      }

      if (selectedFollowUp) {
        await updateFollowUp(selectedFollowUp.id, submitData)
      } else {
        await createFollowUp(submitData)
      }
      await fetchData()
    } catch (error) {
      console.error('Error saving follow-up:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedFollowUp) return

    setActionLoading(true)
    try {
      await deleteFollowUp(selectedFollowUp.id)
      await fetchData()
      setDeleteDialogOpen(false)
      setSelectedFollowUp(null)
    } catch (error) {
      console.error('Error deleting follow-up:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const statCards = [
    { title: 'Total', value: stats.total, icon: CalendarDays, color: 'bg-primary' },
    { title: 'Scheduled', value: stats.scheduled, icon: Clock, color: 'bg-blue-500' },
    { title: 'Upcoming (7 days)', value: stats.upcoming, icon: Calendar, color: 'bg-green-500' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle, color: 'bg-emerald-500' },
    { title: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'bg-red-500' },
  ]

  return (
    <DashboardLayout
      title="Follow-up Management"
      subtitle="Schedule and track follow-up visits"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-0 shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters and Actions */}
      <Card className="border-0 shadow-soft mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search follow-ups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(FOLLOW_UP_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as 'list' | 'calendar')}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="list">
                  <LayoutList className="w-4 h-4 mr-1" />
                  List
                </TabsTrigger>
                <TabsTrigger value="calendar">
                  <Calendar className="w-4 h-4 mr-1" />
                  Calendar
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Follow-up
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : viewMode === 'list' ? (
        <Card className="border-0 shadow-soft">
          <CardContent className="p-0">
            <FollowUpTable
              followUps={filteredFollowUps}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onComplete={handleComplete}
              onReschedule={handleReschedule}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FollowUpCalendar
              followUps={followUps}
              onDateSelect={setSelectedDate}
              onFollowUpClick={handleEdit}
            />
          </div>
          <div>
            <FollowUpDayView
              date={selectedDate}
              followUps={followUps}
              onFollowUpClick={handleEdit}
            />
          </div>
        </div>
      )}

      {/* Follow-up Form Dialog */}
      <FollowUpForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        followUp={selectedFollowUp}
        elderly={elderly}
        volunteers={volunteers}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Follow-up</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this follow-up? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
