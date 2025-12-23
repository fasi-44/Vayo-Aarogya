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

  return (
    <div className="rounded-md border">
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
                      {intervention.status.replace('_', ' ')}
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
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
