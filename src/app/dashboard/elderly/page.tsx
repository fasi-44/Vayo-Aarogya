'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/store'
import {
  Search,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Filter,
  Download,
  RefreshCw,
  HandHeart,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { type SafeUser } from '@/types'
import {
  getElderly,
  createElderly,
  updateElderly,
  deleteElderly,
  type ElderlyFormData,
  type ElderlyFilters,
} from '@/services/elderly'
import { getVolunteers } from '@/services/users'
import {
  ElderlyTable,
  ElderlyForm,
  ElderlyViewDialog,
  ElderlyDeleteDialog,
  ElderlyAssessmentsDialog,
  type ElderlyWithRelations,
} from '@/components/elderly'

export default function ElderlyRecordsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hasPermission, user } = useAuthStore()

  // Hydration state - prevents SSR/client mismatch
  const [mounted, setMounted] = useState(false)

  // URL params
  const actionParam = searchParams.get('action')
  const returnTo = searchParams.get('returnTo')

  // Data state
  const [elderly, setElderly] = useState<SafeUser[]>([])
  const [volunteers, setVolunteers] = useState<SafeUser[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [volunteerFilter, setVolunteerFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isAssessmentsOpen, setIsAssessmentsOpen] = useState(false)
  const [selectedElderly, setSelectedElderly] = useState<SafeUser | null>(null)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withVolunteer: 0,
    withoutVolunteer: 0,
  })

  // Load elderly
  const loadElderly = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const filters: ElderlyFilters = {
        page,
        limit,
      }

      if (searchQuery) {
        filters.search = searchQuery
      }

      if (statusFilter === 'active') {
        filters.isActive = true
      } else if (statusFilter === 'inactive') {
        filters.isActive = false
      }

      if (volunteerFilter === 'assigned') {
        filters.hasVolunteer = true
      } else if (volunteerFilter === 'unassigned') {
        filters.hasVolunteer = false
      } else if (volunteerFilter !== 'all') {
        filters.assignedVolunteer = volunteerFilter
      }

      const result = await getElderly(filters)

      if (result.success && result.data) {
        setElderly(result.data.users)
        setTotal(result.data.total)
      } else {
        setError(result.error || 'Failed to load elderly records')
      }
    } catch (err) {
      setError('Failed to load elderly records')
      console.error('Load elderly error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, searchQuery, statusFilter, volunteerFilter])

  // Load volunteers for filter and table display
  const loadVolunteers = useCallback(async () => {
    try {
      const result = await getVolunteers()
      if (result.success && result.data) {
        setVolunteers(result.data.users)
      }
    } catch (err) {
      console.error('Load volunteers error:', err)
    }
  }, [])

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const [allElderly, activeElderly, inactiveElderly] = await Promise.all([
        getElderly({ limit: 1 }),
        getElderly({ isActive: true, limit: 1 }),
        getElderly({ isActive: false, limit: 1 }),
      ])

      // Calculate volunteer assignment stats from full list
      const fullResult = await getElderly({ limit: 1000 })
      let withVolunteer = 0
      let withoutVolunteer = 0

      if (fullResult.success && fullResult.data) {
        fullResult.data.users.forEach(e => {
          if (e.assignedVolunteer) {
            withVolunteer++
          } else {
            withoutVolunteer++
          }
        })
      }

      setStats({
        total: allElderly.data?.total || 0,
        active: activeElderly.data?.total || 0,
        inactive: inactiveElderly.data?.total || 0,
        withVolunteer,
        withoutVolunteer,
      })
    } catch (err) {
      console.error('Load stats error:', err)
    }
  }, [])

  // Set mounted after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle URL action parameter
  useEffect(() => {
    if (mounted && actionParam === 'add') {
      setSelectedElderly(null)
      setIsFormOpen(true)
    }
  }, [mounted, actionParam])

  // Load data on mount and filter change
  useEffect(() => {
    loadElderly()
  }, [loadElderly])

  useEffect(() => {
    loadVolunteers()
    loadStats()
  }, [loadVolunteers, loadStats])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, volunteerFilter])

  // Handlers
  const handleCreate = () => {
    setSelectedElderly(null)
    setIsFormOpen(true)
  }

  const normalizeElder = (elder: ElderlyWithRelations): SafeUser => {
    return {
      ...elder,
      assignedFamily: typeof elder.assignedFamily === 'object' && elder.assignedFamily ? elder.assignedFamily.id : elder.assignedFamily as string | undefined,
      assignedVolunteer: typeof elder.assignedVolunteer === 'object' && elder.assignedVolunteer ? elder.assignedVolunteer.id : elder.assignedVolunteer as string | undefined,
    }
  }

  const handleEdit = (elder: ElderlyWithRelations) => {
    setSelectedElderly(normalizeElder(elder))
    setIsFormOpen(true)
  }

  const handleView = (elder: ElderlyWithRelations) => {
    setSelectedElderly(normalizeElder(elder))
    setIsViewOpen(true)
  }

  const handleViewAssessments = (elder: ElderlyWithRelations) => {
    setSelectedElderly(normalizeElder(elder))
    setIsAssessmentsOpen(true)
  }

  const handleDelete = (elder: ElderlyWithRelations) => {
    setSelectedElderly(normalizeElder(elder))
    setIsDeleteOpen(true)
  }

  const handleFormSubmit = async (data: ElderlyFormData) => {
    try {
      if (selectedElderly) {
        // Update existing elderly
        const result = await updateElderly(selectedElderly.id, data)
        if (!result.success) {
          throw new Error(result.error || 'Failed to update elder')
        }
      } else {
        // Create new elderly
        if (!data.password) {
          throw new Error('Password is required for new elders')
        }

        // If family member is creating, auto-assign them as family
        const createData = { ...data }
        if (user?.role === 'family') {
          createData.assignedFamily = user.id
        }

        const result = await createElderly(createData)
        if (!result.success) {
          throw new Error(result.error || 'Failed to register elder')
        }
      }

      // Reload data
      loadElderly()
      loadStats()

      // Redirect if returnTo is specified
      if (returnTo && !selectedElderly) {
        router.push(returnTo)
        return
      }
    } catch (err) {
      throw err // Re-throw to let the form handle it
    }
  }

  // Handle form close with URL cleanup
  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open && actionParam) {
      // Clear URL params when closing
      router.replace('/dashboard/elderly')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedElderly) return

    try {
      const result = await deleteElderly(selectedElderly.id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to deactivate elder')
      }

      // Reload data
      loadElderly()
      loadStats()
    } catch (err) {
      console.error('Delete elderly error:', err)
      throw err
    }
  }

  const handleRefresh = () => {
    loadElderly()
    loadStats()
  }

  // Permissions - only check after hydration to prevent SSR mismatch
  const canCreateElderly = mounted && hasPermission('elderly:create')
  const totalPages = Math.ceil(total / limit)

  return (
    <DashboardLayout
      title="Elderly Records"
      subtitle="Manage and monitor elderly individuals in Vayo Aarogya"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Elders</p>
                <p className="text-xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-bold text-foreground">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inactive</p>
                <p className="text-xl font-bold text-foreground">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <HandHeart className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assigned</p>
                <p className="text-xl font-bold text-foreground">{stats.withVolunteer}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unassigned</p>
                <p className="text-xl font-bold text-foreground">{stats.withoutVolunteer}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-soft">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="text-lg">All Elderly Records</CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Volunteer Filter */}
              <Select value={volunteerFilter} onValueChange={setVolunteerFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Volunteer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Volunteers</SelectItem>
                  <SelectItem value="assigned">Has Volunteer</SelectItem>
                  <SelectItem value="unassigned">No Volunteer</SelectItem>
                  {volunteers.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>

                <Button variant="outline" size="icon" title="Export Records">
                  <Download className="w-4 h-4" />
                </Button>

                {canCreateElderly && (
                  <Button onClick={handleCreate} className="gradient-medical text-white">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register Elder
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Elderly Table */}
          {!isLoading && (
            <div className="p-4">
              <ElderlyTable
                elderly={elderly}
                volunteers={volunteers}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onViewAssessments={handleViewAssessments}
              />
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} records
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Elderly Form Dialog */}
      <ElderlyForm
        open={isFormOpen}
        onClose={() => {
          handleFormClose(false)
          setSelectedElderly(null)
        }}
        onSubmit={handleFormSubmit}
        elderly={selectedElderly}
      />

      {/* Elderly View Dialog */}
      <ElderlyViewDialog
        open={isViewOpen}
        onClose={() => {
          setIsViewOpen(false)
          setSelectedElderly(null)
        }}
        elderly={selectedElderly}
        volunteers={volunteers}
        onEdit={() => {
          setIsViewOpen(false)
          setIsFormOpen(true)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ElderlyDeleteDialog
        open={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedElderly(null)
        }}
        onConfirm={handleDeleteConfirm}
        elderly={selectedElderly}
      />

      {/* Assessments Dialog */}
      <ElderlyAssessmentsDialog
        open={isAssessmentsOpen}
        onClose={() => {
          setIsAssessmentsOpen(false)
          setSelectedElderly(null)
        }}
        elderly={selectedElderly}
      />
    </DashboardLayout>
  )
}
