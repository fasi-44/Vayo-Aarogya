'use client'

import React from 'react'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Calendar,
  ClipboardList,
} from 'lucide-react'
import { cn, getInitials, formatDate } from '@/lib/utils'
import type { Intervention } from '@/types'
import { DOMAIN_NAMES, PRIORITY_COLORS, STATUS_COLORS } from '@/services/interventions'

interface InterventionTableProps {
  interventions: Intervention[]
  onEdit: (intervention: Intervention) => void
  onDelete: (intervention: Intervention) => void
  onView: (intervention: Intervention) => void
  onComplete?: (intervention: Intervention) => void
}

export function InterventionTable({
  interventions,
  onEdit,
  onDelete,
  onView,
  onComplete,
}: InterventionTableProps) {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-3.5 h-3.5" />
      case 'high':
        return <AlertTriangle className="w-3.5 h-3.5" />
      case 'medium':
        return <Clock className="w-3.5 h-3.5" />
      default:
        return <CheckCircle className="w-3.5 h-3.5" />
    }
  }

  const getStatusLabel = (status: string) => {
    if (status === 'pending') {
      return 'Yet to Begin'
    }
    return status.replace('_', ' ')
  }

  const isOverdue = (intervention: Intervention) => {
    if (intervention.status === 'completed' || intervention.status === 'cancelled') {
      return false
    }
    if (!intervention.dueDate) return false
    return new Date(intervention.dueDate) < new Date()
  }

  if (interventions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No interventions found</p>
      </div>
    )
  }

  // Action menu component to reuse in both views
  const ActionMenu = ({ intervention }: { intervention: Intervention }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onView(intervention)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(intervention)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        {onComplete && intervention.status !== 'completed' && (
          <DropdownMenuItem onClick={() => onComplete(intervention)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark Complete
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => onDelete(intervention)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {interventions.map((intervention) => {
          const priorityColors = PRIORITY_COLORS[intervention.priority as keyof typeof PRIORITY_COLORS]
          const statusColors = STATUS_COLORS[intervention.status as keyof typeof STATUS_COLORS]
          const overdue = isOverdue(intervention)

          const priorityGradients: Record<string, string> = {
            urgent: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
            high: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
            medium: 'from-yellow-50 to-lime-50 dark:from-yellow-950/30 dark:to-lime-950/30',
            low: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
          }

          return (
            <Card
              key={intervention.id}
              className={cn(
                'overflow-hidden shadow-sm hover:shadow-md transition-shadow',
                overdue && 'ring-2 ring-red-200 dark:ring-red-800'
              )}
            >
              {/* Header with priority-based gradient */}
              <div className={`bg-gradient-to-r ${priorityGradients[intervention.priority] || priorityGradients.low} px-4 py-3 border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                      <AvatarFallback className="bg-indigo-500 text-white text-base font-semibold">
                        {getInitials(intervention.user?.name || 'Unknown')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-base text-foreground">{intervention.user?.name || 'Unknown'}</h3>
                      {intervention.user?.vayoId && (
                        <p className="text-sm text-muted-foreground">{intervention.user.vayoId}</p>
                      )}
                    </div>
                  </div>
                  <ActionMenu intervention={intervention} />
                </div>
              </div>

              <CardContent className="p-4">
                {/* Intervention Title */}
                <div className="mb-3">
                  <h4 className="font-semibold text-sm text-foreground">{intervention.title}</h4>
                  {intervention.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {intervention.description}
                    </p>
                  )}
                </div>

                {/* Status Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {intervention.status === 'completed' ? (
                    <Badge
                      variant="outline"
                      className="gap-1 bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={cn(
                        'gap-1',
                        priorityColors?.bg,
                        priorityColors?.text,
                        priorityColors?.border
                      )}
                    >
                      {getPriorityIcon(intervention.priority)}
                      <span className="capitalize">{intervention.priority}</span>
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      statusColors?.bg,
                      statusColors?.text,
                      statusColors?.border
                    )}
                  >
                    <span className="capitalize">
                      {getStatusLabel(intervention.status)}
                    </span>
                  </Badge>
                  {overdue && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      Overdue
                    </span>
                  )}
                </div>

                {/* Details Grid */}
                <div className="space-y-3">
                  {/* Domain */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Health Domain</p>
                      <p className="text-sm font-medium">{DOMAIN_NAMES[intervention.domain] || intervention.domain}</p>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      overdue ? "bg-red-100 dark:bg-red-900/50" : "bg-blue-100 dark:bg-blue-900/50"
                    )}>
                      <Calendar className={cn(
                        "w-4 h-4",
                        overdue ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                      )} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Due Date</p>
                      {intervention.dueDate ? (
                        <p className={cn("text-sm font-medium", overdue && "text-red-600 dark:text-red-400")}>
                          {formatDate(intervention.dueDate)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not set</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Elder</TableHead>
              <TableHead className="w-[250px]">Intervention</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interventions.map((intervention) => {
              const priorityColors = PRIORITY_COLORS[intervention.priority as keyof typeof PRIORITY_COLORS]
              const statusColors = STATUS_COLORS[intervention.status as keyof typeof STATUS_COLORS]
              const overdue = isOverdue(intervention)

              return (
                <TableRow key={intervention.id} className={cn(overdue && 'bg-red-50/50')}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(intervention.user?.name || 'Unknown')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">
                          {intervention.user?.name || 'Unknown'}
                        </div>
                        {intervention.user?.vayoId && (
                          <div className="text-xs text-muted-foreground">
                            {intervention.user.vayoId}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{intervention.title}</div>
                      {intervention.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {intervention.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {DOMAIN_NAMES[intervention.domain] || intervention.domain}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {intervention.status === 'completed' ? (
                      <Badge
                        variant="outline"
                        className="gap-1 bg-green-50 text-green-700 border-green-300 dark:bg-green-100 dark:text-green-400 dark:border-green-800"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={cn(
                          'gap-1',
                          priorityColors?.bg,
                          priorityColors?.text,
                          priorityColors?.border
                        )}
                      >
                        {getPriorityIcon(intervention.priority)}
                        <span className="capitalize">{intervention.priority}</span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        statusColors?.bg,
                        statusColors?.text,
                        statusColors?.border
                      )}
                    >
                      <span className="capitalize">
                        {getStatusLabel(intervention.status)}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {intervention.dueDate ? (
                      <div className={cn('text-sm', overdue && 'text-red-600 font-medium')}>
                        {formatDate(intervention.dueDate)}
                        {overdue && (
                          <span className="block text-xs">Overdue</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionMenu intervention={intervention} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
