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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Eye,
  Pencil,
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

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Date</TableHead>
            <TableHead className="font-semibold">Elder</TableHead>
            <TableHead className="font-semibold">Assessor</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Risk Level</TableHead>
            <TableHead className="font-semibold">Domains</TableHead>
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
                      {new Date(assessment.assessedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(assessment.assessedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
              <TableCell>
                <DomainSummary domains={assessment.domains} />
              </TableCell>
              <TableCell className="text-right">
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
                      View Details
                    </DropdownMenuItem>
                    {/* Only show Edit for completed assessments */}
                    {assessment.status === 'completed' && (
                      <DropdownMenuItem onClick={() => onEdit(assessment)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Assessment
                      </DropdownMenuItem>
                    )}
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
