'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { InterventionTable } from '@/components/interventions/intervention-table'
import { InterventionForm, InterventionFormData } from '@/components/interventions/intervention-form'
import { InterventionCard } from '@/components/interventions/intervention-card'
import {
  getInterventions,
  createIntervention,
  updateIntervention,
  deleteIntervention,
  completeIntervention,
  DOMAIN_NAMES,
} from '@/services/interventions'
import { getElderly } from '@/services/elderly'
import type { Intervention, SafeUser } from '@/types'
import {
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Loader2,
  LayoutGrid,
  LayoutList,
} from 'lucide-react'

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [elderly, setElderly] = useState<SafeUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [interventionsRes, elderlyRes] = await Promise.all([
        getInterventions({ limit: 1000 }),
        getElderly({ limit: 1000 }),
      ])

      if (interventionsRes.success && interventionsRes.data) {
        const allInterventions = interventionsRes.data.interventions
        setInterventions(allInterventions)

        // Calculate stats
        const now = new Date()
        setStats({
          total: allInterventions.length,
          pending: allInterventions.filter(i => i.status === 'pending').length,
          inProgress: allInterventions.filter(i => i.status === 'in_progress').length,
          completed: allInterventions.filter(i => i.status === 'completed').length,
          overdue: allInterventions.filter(i =>
            i.status !== 'completed' &&
            i.status !== 'cancelled' &&
            i.dueDate &&
            new Date(i.dueDate) < now
          ).length,
        })
      }

      if (elderlyRes.success && elderlyRes.data) {
        setElderly(elderlyRes.data.users)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInterventions = interventions.filter(intervention => {
    const matchesSearch =
      intervention.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intervention.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intervention.user?.vayoId?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === 'all' || intervention.status === filterStatus
    const matchesPriority = filterPriority === 'all' || intervention.priority === filterPriority
    const matchesDomain = filterDomain === 'all' || intervention.domain === filterDomain

    return matchesSearch && matchesStatus && matchesPriority && matchesDomain
  })

  const handleCreate = () => {
    setSelectedIntervention(null)
    setFormOpen(true)
  }

  const handleEdit = (intervention: Intervention) => {
    setSelectedIntervention(intervention)
    setFormOpen(true)
  }

  const handleView = (intervention: Intervention) => {
    setSelectedIntervention(intervention)
    setViewDialogOpen(true)
  }

  const handleDeleteClick = (intervention: Intervention) => {
    setSelectedIntervention(intervention)
    setDeleteDialogOpen(true)
  }

  const handleComplete = async (intervention: Intervention) => {
    setActionLoading(true)
    try {
      const result = await completeIntervention(intervention.id)
      if (result.success) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error completing intervention:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleFormSubmit = async (data: InterventionFormData) => {
    try {
      if (selectedIntervention) {
        await updateIntervention(selectedIntervention.id, data)
      } else {
        await createIntervention(data)
      }
      await fetchData()
    } catch (error) {
      console.error('Error saving intervention:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedIntervention) return

    setActionLoading(true)
    try {
      const result = await deleteIntervention(selectedIntervention.id)
      if (result.success) {
        await fetchData()
        setDeleteDialogOpen(false)
        setSelectedIntervention(null)
      }
    } catch (error) {
      console.error('Error deleting intervention:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const statCards = [
    { title: 'Total', value: stats.total, icon: Activity, color: 'bg-primary' },
    { title: 'Pending', value: stats.pending, icon: Clock, color: 'bg-yellow-500' },
    { title: 'In Progress', value: stats.inProgress, icon: AlertCircle, color: 'bg-blue-500' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle, color: 'bg-green-500' },
    { title: 'Overdue', value: stats.overdue, icon: XCircle, color: 'bg-red-500' },
  ]

  return (
    <DashboardLayout
      title="Interventions"
      subtitle="Manage care interventions and treatment plans"
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
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
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
                placeholder="Search interventions..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterDomain} onValueChange={setFilterDomain}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {Object.entries(DOMAIN_NAMES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'bg-muted' : ''}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode('cards')}
                className={viewMode === 'cards' ? 'bg-muted' : ''}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>

            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              New Intervention
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : viewMode === 'table' ? (
        <Card className="border-0 shadow-soft">
          <CardContent className="p-0">
            <InterventionTable
              interventions={filteredInterventions}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onView={handleView}
              onComplete={handleComplete}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInterventions.map((intervention) => (
            <InterventionCard
              key={intervention.id}
              intervention={intervention}
              onEdit={() => handleEdit(intervention)}
              onDelete={() => handleDeleteClick(intervention)}
              onComplete={() => handleComplete(intervention)}
            />
          ))}
          {filteredInterventions.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No interventions found
            </div>
          )}
        </div>
      )}

      {/* Intervention Form Dialog */}
      <InterventionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        intervention={selectedIntervention}
        elderly={elderly}
      />

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Intervention Details</DialogTitle>
          </DialogHeader>
          {selectedIntervention && (
            <InterventionCard
              intervention={selectedIntervention}
              onEdit={() => {
                setViewDialogOpen(false)
                handleEdit(selectedIntervention)
              }}
              onComplete={() => {
                handleComplete(selectedIntervention)
                setViewDialogOpen(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Intervention</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this intervention? This action cannot be undone.
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
