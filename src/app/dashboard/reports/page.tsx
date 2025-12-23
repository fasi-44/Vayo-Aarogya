'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateInput } from '@/components/ui/date-input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart3,
  Download,
  FileText,
  Filter,
  Users,
  ClipboardCheck,
  Activity,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Loader2,
  FileSpreadsheet,
  Eye,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateReport, generateDetailedCSV, downloadCSV } from '@/services/reports'
import { getUsers, getVolunteers } from '@/services/users'
import { getInterventions } from '@/services/interventions'
import { getFollowUps } from '@/services/followups'

// Report types
const reportTypes = [
  {
    id: 'elderly-summary',
    title: 'Elderly Summary Report',
    description: 'Overview of all registered elders with demographics',
    icon: Users,
    color: 'bg-primary',
  },
  {
    id: 'assessment-summary',
    title: 'Assessment Summary Report',
    description: 'Summary of all assessments conducted',
    icon: ClipboardCheck,
    color: 'bg-blue-500',
  },
  {
    id: 'risk-distribution',
    title: 'Risk Distribution Report',
    description: 'Health risk level analysis across all elders',
    icon: AlertTriangle,
    color: 'bg-amber-500',
  },
  {
    id: 'intervention-status',
    title: 'Intervention Status Report',
    description: 'Status of all ongoing interventions',
    icon: Activity,
    color: 'bg-green-500',
  },
  {
    id: 'volunteer-performance',
    title: 'Volunteer Performance Report',
    description: 'Volunteer assignments and activity summary',
    icon: TrendingUp,
    color: 'bg-purple-500',
  },
  {
    id: 'followup-schedule',
    title: 'Follow-up Schedule Report',
    description: 'Upcoming and overdue follow-up visits',
    icon: Calendar,
    color: 'bg-teal-500',
  },
]

// Mock stats for demonstration
const summaryStats = [
  { label: 'Total Elders', value: 156, icon: Users, color: 'text-primary' },
  { label: 'Total Assessments', value: 342, icon: ClipboardCheck, color: 'text-blue-500' },
  { label: 'Active Interventions', value: 67, icon: Activity, color: 'text-green-500' },
  { label: 'At-Risk Elders', value: 34, icon: AlertTriangle, color: 'text-amber-500' },
]

interface ReportPreviewData {
  reportId: string
  title: string
  headers: string[]
  rows: string[][]
  summary?: { label: string; value: string | number }[]
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv')

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<ReportPreviewData | null>(null)

  // Set default date range (last 30 days)
  useEffect(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    })
  }, [])

  const fetchReportData = async (reportId: string): Promise<ReportPreviewData | null> => {
    switch (reportId) {
      case 'elderly-summary': {
        const result = await getUsers({ role: 'elderly', limit: 10000 })
        if (!result.success || !result.data) {
          throw new Error('Failed to fetch elderly data')
        }

        const elderly = result.data.users
        return {
          reportId,
          title: 'Elderly Summary Report',
          headers: ['Vayo ID', 'Name', 'Age', 'Gender', 'District', 'Taluk', 'Village', 'Caregiver', 'Phone'],
          rows: elderly.map(e => [
            e.vayoId || '-',
            e.name || '-',
            e.age?.toString() || '-',
            e.gender || '-',
            e.districtName || '-',
            e.talukName || '-',
            e.villageName || '-',
            e.caregiverName || '-',
            e.caregiverPhone || '-',
          ]),
          summary: [
            { label: 'Total Elderly', value: elderly.length },
            { label: 'Male', value: elderly.filter(e => e.gender === 'male').length },
            { label: 'Female', value: elderly.filter(e => e.gender === 'female').length },
          ]
        }
      }

      case 'assessment-summary': {
        const result = await generateReport({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })

        if (!result.success || !result.data) {
          throw new Error('Failed to generate assessment report')
        }

        const data = result.data
        return {
          reportId,
          title: 'Assessment Summary Report',
          headers: ['Date', 'Elder Name', 'Vayo ID', 'Risk Level', 'Assessor'],
          rows: data.assessments.map(a => [
            new Date(a.assessedAt).toLocaleDateString(),
            a.subject?.name || '-',
            a.subject?.vayoId || '-',
            a.overallRisk || '-',
            a.assessor?.name || '-',
          ]),
          summary: [
            { label: 'Total Assessments', value: data.summary.totalAssessments },
            { label: 'Healthy', value: data.summary.healthyCount },
            { label: 'At Risk', value: data.summary.atRiskCount },
            { label: 'Needs Intervention', value: data.summary.interventionCount },
          ]
        }
      }

      case 'risk-distribution': {
        const result = await generateReport({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })

        if (!result.success || !result.data) {
          throw new Error('Failed to generate risk report')
        }

        const data = result.data
        return {
          reportId,
          title: 'Risk Distribution Report',
          headers: ['Domain', 'Avg Score', 'At Risk', 'Intervention', 'Total Flagged'],
          rows: data.domainBreakdown.map(d => [
            d.domainName,
            d.avgScore.toString(),
            d.atRiskCount.toString(),
            d.interventionCount.toString(),
            (d.atRiskCount + d.interventionCount).toString(),
          ]),
          summary: [
            { label: 'Total Assessments', value: data.summary.totalAssessments },
            { label: 'Healthy', value: data.summary.healthyCount },
            { label: 'At Risk', value: data.summary.atRiskCount },
            { label: 'Needs Intervention', value: data.summary.interventionCount },
          ]
        }
      }

      case 'intervention-status': {
        const result = await getInterventions({ limit: 10000 })
        if (!result.success || !result.data) {
          throw new Error('Failed to fetch interventions')
        }

        const interventions = result.data.interventions
        const pending = interventions.filter(i => i.status === 'pending').length
        const inProgress = interventions.filter(i => i.status === 'in_progress').length
        const completed = interventions.filter(i => i.status === 'completed').length

        return {
          reportId,
          title: 'Intervention Status Report',
          headers: ['Elder', 'Vayo ID', 'Title', 'Domain', 'Priority', 'Status', 'Due Date'],
          rows: interventions.map(i => [
            i.user?.name || '-',
            i.user?.vayoId || '-',
            i.title || '-',
            i.domain || '-',
            i.priority || '-',
            i.status || '-',
            i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '-',
          ]),
          summary: [
            { label: 'Total', value: interventions.length },
            { label: 'Pending', value: pending },
            { label: 'In Progress', value: inProgress },
            { label: 'Completed', value: completed },
          ]
        }
      }

      case 'volunteer-performance': {
        const result = await getVolunteers()
        if (!result.success || !result.data) {
          throw new Error('Failed to fetch volunteer data')
        }

        const volunteers = result.data.users as (typeof result.data.users[0] & { assignedElderly?: unknown[] })[]
        const totalAssigned = volunteers.reduce((sum, v) => sum + (v.assignedElderly?.length || 0), 0)

        return {
          reportId,
          title: 'Volunteer Performance Report',
          headers: ['Name', 'Email', 'Phone', 'Status', 'Assigned', 'Max', 'Capacity'],
          rows: volunteers.map(v => {
            const assignedCount = v.assignedElderly?.length || 0
            const maxAssignments = v.maxAssignments || 10
            return [
              v.name || '-',
              v.email || '-',
              v.phone || '-',
              v.isActive ? 'Active' : 'Inactive',
              assignedCount.toString(),
              maxAssignments.toString(),
              Math.round((assignedCount / maxAssignments) * 100) + '%',
            ]
          }),
          summary: [
            { label: 'Total Volunteers', value: volunteers.length },
            { label: 'Active', value: volunteers.filter(v => v.isActive !== false).length },
            { label: 'Total Assigned Elderly', value: totalAssigned },
          ]
        }
      }

      case 'followup-schedule': {
        const result = await getFollowUps({ limit: 10000 })
        if (!result.success || !result.data) {
          throw new Error('Failed to fetch follow-ups')
        }

        const followups = result.data.followUps
        const scheduled = followups.filter(f => f.status === 'scheduled').length
        const completed = followups.filter(f => f.status === 'completed').length
        const missed = followups.filter(f => f.status === 'missed').length

        return {
          reportId,
          title: 'Follow-up Schedule Report',
          headers: ['Elder', 'Vayo ID', 'Type', 'Title', 'Scheduled', 'Status', 'Assigned To'],
          rows: followups.map(f => [
            f.elderly?.name || '-',
            f.elderly?.vayoId || '-',
            f.type || '-',
            f.title || '-',
            f.scheduledDate ? new Date(f.scheduledDate).toLocaleDateString() : '-',
            f.status || '-',
            f.assignee?.name || 'Unassigned',
          ]),
          summary: [
            { label: 'Total Follow-ups', value: followups.length },
            { label: 'Scheduled', value: scheduled },
            { label: 'Completed', value: completed },
            { label: 'Missed', value: missed },
          ]
        }
      }

      default:
        throw new Error('Unknown report type')
    }
  }

  const handlePreview = async (reportId: string) => {
    setLoading(true)
    setSelectedReport(reportId)

    try {
      const data = await fetchReportData(reportId)
      if (data) {
        setPreviewData(data)
        setPreviewOpen(true)
      }
    } catch (error) {
      console.error('Preview error:', error)
      alert('Failed to load report data. Please try again.')
    } finally {
      setLoading(false)
      setSelectedReport(null)
    }
  }

  const handleDownload = () => {
    if (!previewData) return

    const timestamp = new Date().toISOString().split('T')[0]

    // Build CSV content from preview data
    const csvContent = [
      previewData.headers.join(','),
      ...previewData.rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    downloadCSV(csvContent, `${previewData.reportId}-${timestamp}.csv`)
  }

  const closePreview = () => {
    setPreviewOpen(false)
    setPreviewData(null)
  }

  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="Generate and export reports for Vayo Aarogya data"
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-0 shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl bg-muted flex items-center justify-center')}>
                    <Icon className={cn('w-5 h-5', stat.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-soft mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Set date range for reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <DateInput
                id="startDate"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <DateInput
                id="endDate"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'pdf')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      CSV (Excel)
                    </span>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      PDF
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Reports */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Available Reports
          </CardTitle>
          <CardDescription>
            Select a report to preview and download
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon
              const isGenerating = loading && selectedReport === report.id

              return (
                <Card
                  key={report.id}
                  className={cn(
                    'border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group',
                    isGenerating && 'opacity-70'
                  )}
                  onClick={() => !loading && handlePreview(report.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white', report.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {exportFormat.toUpperCase()}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {report.description}
                    </p>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={loading}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview Report
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Report Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{previewData?.title || 'Report Preview'}</DialogTitle>
                <DialogDescription>
                  {previewData?.rows.length || 0} records found
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Summary Stats */}
          {previewData?.summary && (
            <div className="flex-shrink-0 flex flex-wrap gap-4 py-3 border-b">
              {previewData.summary.map((stat, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
                  <span className="text-sm text-muted-foreground">{stat.label}:</span>
                  <span className="font-semibold">{stat.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-auto -mx-6 px-6 py-2">
            {previewData && previewData.rows.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewData.headers.map((header, idx) => (
                      <TableHead key={idx} className="whitespace-nowrap">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.rows.slice(0, 100).map((row, rowIdx) => (
                    <TableRow key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <TableCell key={cellIdx} className="whitespace-nowrap">
                          {cellIdx === 4 && previewData.reportId === 'intervention-status' ? (
                            <Badge
                              variant={
                                cell === 'urgent' || cell === 'high' ? 'destructive' :
                                  cell === 'medium' ? 'default' :
                                    'secondary'
                              }
                              className="capitalize"
                            >
                              {cell}
                            </Badge>
                          ) : cellIdx === 5 && (previewData.reportId === 'intervention-status' || previewData.reportId === 'followup-schedule') ? (
                            <Badge
                              variant={
                                cell === 'completed' ? 'default' :
                                  cell === 'in_progress' ? 'secondary' :
                                    cell === 'missed' ? 'destructive' :
                                      'outline'
                              }
                              className="capitalize"
                            >
                              {cell.replace('_', ' ')}
                            </Badge>
                          ) : cellIdx === 3 && previewData.reportId === 'assessment-summary' ? (
                            <Badge
                              variant={
                                cell === 'healthy' ? 'default' :
                                  cell === 'at_risk' ? 'secondary' :
                                    'destructive'
                              }
                              className="capitalize"
                            >
                              {cell.replace('_', ' ')}
                            </Badge>
                          ) : (
                            cell
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No data available for this report</p>
              </div>
            )}

            {previewData && previewData.rows.length > 100 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Showing first 100 of {previewData.rows.length} records. Download for full data.
              </p>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
            <Button variant="outline" onClick={closePreview}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            <Button onClick={handleDownload} disabled={!previewData || previewData.rows.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
