'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  ClipboardPlus,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
} from 'lucide-react'
import { type Assessment, type RiskLevel } from '@/types'
import {
  getAssessments,
  getDraftAssessments,
  deleteAssessment,
  type AssessmentFilters,
} from '@/services/assessments'
import {
  AssessmentTable,
  AssessmentViewDialog,
  AssessmentDeleteDialog,
} from '@/components/assessments'
import { FileText } from 'lucide-react'

export default function AssessmentsPage() {
  const router = useRouter()
  const { hasPermission } = useAuthStore()

  // Hydration state
  const [mounted, setMounted] = useState(false)

  // Data state
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  // Dialog state
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    healthy: 0,
    atRisk: 0,
    intervention: 0,
    thisMonth: 0,
    drafts: 0,
  })

  // Load assessments (all statuses based on filter)
  const loadAssessments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const filters: AssessmentFilters = {
        page,
        limit,
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filters.status = statusFilter as 'draft' | 'completed'
      }

      if (riskFilter !== 'all') {
        filters.overallRisk = riskFilter as RiskLevel
      }

      const result = await getAssessments(filters)

      if (result.success && result.data) {
        setAssessments(result.data.assessments)
        setTotal(result.data.total)
      } else {
        setError(result.error || 'Failed to load assessments')
      }
    } catch (err) {
      setError('Failed to load assessments')
      console.error('Load assessments error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, riskFilter, statusFilter])

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      // Get all assessments for stats
      const [completedResult, draftsResult] = await Promise.all([
        getAssessments({ limit: 1000, status: 'completed' }),
        getDraftAssessments(),
      ])

      if (completedResult.success && completedResult.data) {
        const completed = completedResult.data.assessments
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const draftsCount = draftsResult.success && draftsResult.data ? draftsResult.data.total : 0

        setStats({
          total: completed.length + draftsCount,
          healthy: completed.filter(a => a.overallRisk === 'healthy').length,
          atRisk: completed.filter(a => a.overallRisk === 'at_risk').length,
          intervention: completed.filter(a => a.overallRisk === 'intervention').length,
          thisMonth: completed.filter(a => new Date(a.assessedAt) >= startOfMonth).length,
          drafts: draftsCount,
        })
      }
    } catch (err) {
      console.error('Load stats error:', err)
    }
  }, [])

  // Set mounted after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load data on mount and filter change
  useEffect(() => {
    loadAssessments()
  }, [loadAssessments])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [riskFilter, statusFilter])

  // Handlers
  const handleCreate = () => {
    router.push('/dashboard/assessments/new')
  }

  const handleView = (assessment: Assessment) => {
    setSelectedAssessment(assessment)
    setIsViewOpen(true)
  }

  const handleEdit = (assessment: Assessment) => {
    router.push(`/dashboard/assessments/${assessment.id}/edit`)
  }

  const handleResume = (assessment: Assessment) => {
    // Navigate to new assessment page with draft ID
    router.push(`/dashboard/assessments/new?draftId=${assessment.id}`)
  }

  const handleDelete = (assessment: Assessment) => {
    setSelectedAssessment(assessment)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedAssessment) return

    try {
      const result = await deleteAssessment(selectedAssessment.id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete assessment')
      }

      // Reload data
      loadAssessments()
      loadStats()
    } catch (err) {
      console.error('Delete assessment error:', err)
      throw err
    }
  }

  const handleRefresh = () => {
    loadAssessments()
    loadStats()
  }

  // Permissions - only check after hydration
  const canCreateAssessment = mounted && hasPermission('assessments:create')
  const totalPages = Math.ceil(total / limit)

  // Filter assessments by search
  const filteredAssessments = searchQuery
    ? assessments.filter(a =>
        a.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.subject?.vayoId?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : assessments

  return (
    <DashboardLayout
      title="Assessments"
      subtitle="Conduct and manage WHO ICOPE assessments for elderly individuals"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Assessments</p>
                <p className="text-xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Healthy</p>
                <p className="text-xl font-bold text-foreground">{stats.healthy}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">At Risk</p>
                <p className="text-xl font-bold text-foreground">{stats.atRisk}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Intervention</p>
                <p className="text-xl font-bold text-foreground">{stats.intervention}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-xl font-bold text-foreground">{stats.thisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drafts Card - clickable to filter drafts */}
        <Card
          className={`border-0 shadow-soft cursor-pointer hover:bg-muted/50 transition-colors ${statusFilter === 'draft' ? 'ring-2 ring-amber-400' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Drafts</p>
                <p className="text-xl font-bold text-foreground">{stats.drafts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-soft">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="text-lg">All Assessments</CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or Vayo ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <FileText className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                </SelectContent>
              </Select>

              {/* Risk Filter */}
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                  <SelectItem value="intervention">Intervention</SelectItem>
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

                <Button variant="outline" size="icon" title="Export">
                  <Download className="w-4 h-4" />
                </Button>

                {canCreateAssessment && (
                  <Button onClick={handleCreate} className="gradient-medical text-white">
                    <ClipboardPlus className="w-4 h-4 mr-2" />
                    New Assessment
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

          {/* Assessments Table */}
          {!isLoading && (
            <div className="p-4">
              <AssessmentTable
                assessments={filteredAssessments}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onResume={handleResume}
              />
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} assessments
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

      {/* View Dialog */}
      <AssessmentViewDialog
        open={isViewOpen}
        onClose={() => {
          setIsViewOpen(false)
          setSelectedAssessment(null)
        }}
        assessment={selectedAssessment}
      />

      {/* Delete Dialog */}
      <AssessmentDeleteDialog
        open={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedAssessment(null)
        }}
        onConfirm={handleDeleteConfirm}
        assessment={selectedAssessment}
      />
    </DashboardLayout>
  )
}
