'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Eye,
  MoreHorizontal,
  Trash2,
  FileText,
  User,
  Calendar,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Play,
} from 'lucide-react'
import { type Assessment, type RiskLevel, type AssessmentStatus } from '@/types'
import { useAuthStore } from '@/store'
import { getInitials, formatDate, formatTime } from '@/lib/utils'

interface AssessmentTableProps {
  assessments: Assessment[]
  onView: (assessment: Assessment) => void
  onEdit: (assessment: Assessment) => void
  onDelete: (assessment: Assessment) => void
  onCompare?: (assessment: Assessment) => void
  onResume?: (assessment: Assessment) => void
}

export function AssessmentTable({
  assessments,
  onView,
  onEdit,
  onDelete,
  onCompare,
  onResume,
}: AssessmentTableProps) {
  const { hasPermission } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useState(() => {
    setMounted(true)
  })

  const canDelete = mounted && hasPermission('assessments:delete')

  if (assessments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Assessments Found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Start by creating a new assessment for an elderly person
        </p>
      </div>
    )
  }

  // Action menu component to reuse in both views
  const ActionMenu = ({ assessment }: { assessment: Assessment }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Resume option for draft assessments */}
        {assessment.status === 'draft' && onResume && (
          <DropdownMenuItem onClick={() => onResume(assessment)} className="text-amber-600">
            <Play className="w-4 h-4 mr-2" />
            Resume Assessment
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onView(assessment)}>
          <Eye className="w-4 h-4 mr-2" />
          {assessment.status === 'completed' ? 'View Summary' : 'View Details'}
        </DropdownMenuItem>
        {onCompare && assessment.status === 'completed' && (
          <DropdownMenuItem onClick={() => onCompare(assessment)}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Compare Progress
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem
            onClick={() => onDelete(assessment)}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {assessments.map((assessment) => {
          const riskColors = {
            healthy: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
            at_risk: 'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30',
            intervention: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
          }
          const headerBg = assessment.status === 'draft'
            ? 'from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30'
            : riskColors[assessment.overallRisk] || riskColors.healthy

          return (
            <Card key={assessment.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Header with risk-based gradient */}
              <div className={`bg-gradient-to-r ${headerBg} px-4 py-3 border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                      <AvatarFallback className="bg-rose-500 text-white text-base font-semibold">
                        {getInitials(assessment.subject?.name || 'UN')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-base text-foreground">{assessment.subject?.name || '-'}</h3>
                      {assessment.subject?.vayoId && (
                        <p className="text-sm text-muted-foreground">{assessment.subject.vayoId}</p>
                      )}
                    </div>
                  </div>
                  <ActionMenu assessment={assessment} />
                </div>
              </div>

              <CardContent className="p-4">
                {/* Status and Risk Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <StatusBadge status={assessment.status} />
                  <RiskBadge riskLevel={assessment.overallRisk} isDraft={assessment.status === 'draft'} />
                </div>

                {/* Details Grid */}
                <div className="space-y-3">
                  {/* Date & Time */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Assessment Date</p>
                      <p className="text-sm font-medium">
                        {formatDate(assessment.assessedAt)}
                        <span className="text-muted-foreground font-normal ml-2">
                          {formatTime(assessment.assessedAt)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Assessor */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Assessed By</p>
                      <p className="text-sm font-medium">
                        {assessment.assessor?.name || '-'}
                        {assessment.assessor?.role && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 capitalize">
                            {assessment.assessor.role}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Elder</TableHead>
              <TableHead className="font-semibold">Assessor</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Risk Level</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.map((assessment) => (
              <TableRow key={assessment.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {formatDate(assessment.assessedAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(assessment.assessedAt)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{assessment.subject?.name || '-'}</p>
                      {assessment.subject?.vayoId && (
                        <p className="text-xs text-muted-foreground">{assessment.subject.vayoId}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{assessment.assessor?.name || '-'}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {assessment.assessor?.role || '-'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={assessment.status} />
                </TableCell>
                <TableCell>
                  <RiskBadge riskLevel={assessment.overallRisk} isDraft={assessment.status === 'draft'} />
                </TableCell>
                <TableCell className="text-right">
                  <ActionMenu assessment={assessment} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

interface StatusBadgeProps {
  status: AssessmentStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'draft') {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
        <FileText className="w-3 h-3 mr-1" />
        Draft
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
      Completed
    </Badge>
  )
}

interface RiskBadgeProps {
  riskLevel: RiskLevel
  isDraft?: boolean
}

function RiskBadge({ riskLevel, isDraft }: RiskBadgeProps) {
  // For drafts, show a muted/pending indicator
  if (isDraft) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">
        Pending
      </Badge>
    )
  }

  const config: Record<RiskLevel, { label: string; className: string }> = {
    healthy: {
      label: 'Healthy',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    at_risk: {
      label: 'At Risk',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    intervention: {
      label: 'Intervention',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
  }

  const { label, className } = config[riskLevel]

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}

interface DomainSummaryProps {
  domains?: Assessment['domains']
}

function DomainSummary({ domains }: DomainSummaryProps) {
  if (!domains || domains.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>
  }

  const counts = {
    healthy: domains.filter(d => d.riskLevel === 'healthy').length,
    at_risk: domains.filter(d => d.riskLevel === 'at_risk').length,
    intervention: domains.filter(d => d.riskLevel === 'intervention').length,
  }

  return (
    <div className="flex gap-1">
      {counts.healthy > 0 && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
          {counts.healthy}
        </Badge>
      )}
      {counts.at_risk > 0 && (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
          {counts.at_risk}
        </Badge>
      )}
      {counts.intervention > 0 && (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
          {counts.intervention}
        </Badge>
      )}
    </div>
  )
}
