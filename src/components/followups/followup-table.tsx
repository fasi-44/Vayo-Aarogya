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
  CheckCircle,
  Calendar,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { cn, getInitials, formatDate } from '@/lib/utils'
import type { FollowUp } from '@/types'
import { FOLLOW_UP_TYPES, FOLLOW_UP_STATUS_COLORS } from '@/services/followups'

interface FollowUpTableProps {
  followUps: FollowUp[]
  onEdit: (followUp: FollowUp) => void
  onDelete: (followUp: FollowUp) => void
  onComplete?: (followUp: FollowUp) => void
  onReschedule?: (followUp: FollowUp) => void
}

export function FollowUpTable({
  followUps,
  onEdit,
  onDelete,
  onComplete,
  onReschedule,
}: FollowUpTableProps) {
  const isOverdue = (followUp: FollowUp) => {
    if (followUp.status !== 'scheduled') return false
    return new Date(followUp.scheduledDate) < new Date()
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (followUps.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No follow-ups found</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Elder</TableHead>
            <TableHead>Follow-up</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Scheduled</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {followUps.map((followUp) => {
            const statusColors =
              FOLLOW_UP_STATUS_COLORS[
                followUp.status as keyof typeof FOLLOW_UP_STATUS_COLORS
              ]
            const overdue = isOverdue(followUp)

            return (
              <TableRow
                key={followUp.id}
                className={cn(overdue && 'bg-red-50/50')}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
                        {getInitials(followUp.elderly?.name || 'Unknown')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {followUp.elderly?.name || 'Unknown'}
                      </div>
                      {followUp.elderly?.vayoId && (
                        <div className="text-xs text-muted-foreground">
                          {followUp.elderly.vayoId}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{followUp.title}</div>
                    {followUp.description && (
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {followUp.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {FOLLOW_UP_TYPES[followUp.type as keyof typeof FOLLOW_UP_TYPES] ||
                      followUp.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className={cn('text-sm', overdue && 'text-red-600')}>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(followUp.scheduledDate)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatTime(followUp.scheduledDate)}
                    </div>
                    {overdue && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {followUp.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                          {getInitials(followUp.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{followUp.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Unassigned</span>
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
                    {followUp.status.charAt(0).toUpperCase() +
                      followUp.status.slice(1)}
                  </Badge>
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
                      <DropdownMenuItem onClick={() => onEdit(followUp)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {onComplete && followUp.status === 'scheduled' && (
                        <DropdownMenuItem onClick={() => onComplete(followUp)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Complete
                        </DropdownMenuItem>
                      )}
                      {onReschedule && followUp.status === 'scheduled' && (
                        <DropdownMenuItem onClick={() => onReschedule(followUp)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Reschedule
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onDelete(followUp)}
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
