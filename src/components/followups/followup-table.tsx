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
  CheckCircle,
  Calendar,
  Clock,
  XCircle,
  AlertCircle,
  User,
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

  // Action menu component to reuse in both views
  const ActionMenu = ({ followUp }: { followUp: FollowUp }) => (
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
  )

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {followUps.map((followUp) => {
          const statusColors =
            FOLLOW_UP_STATUS_COLORS[
              followUp.status as keyof typeof FOLLOW_UP_STATUS_COLORS
            ]
          const overdue = isOverdue(followUp)

          const statusGradients: Record<string, string> = {
            scheduled: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
            completed: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
            missed: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
            rescheduled: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30',
          }

          return (
            <Card
              key={followUp.id}
              className={cn(
                'overflow-hidden shadow-sm hover:shadow-md transition-shadow',
                overdue && 'ring-2 ring-red-200 dark:ring-red-800'
              )}
            >
              {/* Header with status-based gradient */}
              <div className={`bg-gradient-to-r ${statusGradients[followUp.status] || statusGradients.scheduled} px-4 py-3 border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                      <AvatarFallback className="bg-rose-500 text-white text-base font-semibold">
                        {getInitials(followUp.elderly?.name || 'Unknown')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-base text-foreground">{followUp.elderly?.name || 'Unknown'}</h3>
                      {followUp.elderly?.vayoId && (
                        <p className="text-sm text-muted-foreground">{followUp.elderly.vayoId}</p>
                      )}
                    </div>
                  </div>
                  <ActionMenu followUp={followUp} />
                </div>
              </div>

              <CardContent className="p-4">
                {/* Follow-up Title */}
                <div className="mb-3">
                  <h4 className="font-semibold text-sm text-foreground">{followUp.title}</h4>
                  {followUp.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {followUp.description}
                    </p>
                  )}
                </div>

                {/* Status Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    {FOLLOW_UP_TYPES[followUp.type as keyof typeof FOLLOW_UP_TYPES] ||
                      followUp.type}
                  </Badge>
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
                  {overdue && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      Overdue
                    </span>
                  )}
                </div>

                {/* Details Grid */}
                <div className="space-y-3">
                  {/* Scheduled Date/Time */}
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
                      <p className="text-xs text-muted-foreground mb-0.5">Scheduled</p>
                      <p className={cn("text-sm font-medium", overdue && "text-red-600 dark:text-red-400")}>
                        {formatDate(followUp.scheduledDate)}
                        <span className={cn("ml-2", overdue ? "text-red-500" : "text-muted-foreground")}>
                          at {formatTime(followUp.scheduledDate)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Assigned To</p>
                      {followUp.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-teal-500 text-white text-xs">
                              {getInitials(followUp.assignee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{followUp.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                          Unassigned
                        </span>
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
                    <ActionMenu followUp={followUp} />
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
