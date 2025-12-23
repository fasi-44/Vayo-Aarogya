'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getInitials, formatDate } from '@/lib/utils'
import {
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Pencil,
  Trash2,
  User,
} from 'lucide-react'
import type { Intervention } from '@/types'
import { DOMAIN_NAMES, PRIORITY_COLORS, STATUS_COLORS } from '@/services/interventions'

interface InterventionCardProps {
  intervention: Intervention
  onEdit?: () => void
  onDelete?: () => void
  onComplete?: () => void
  compact?: boolean
}

export function InterventionCard({
  intervention,
  onEdit,
  onDelete,
  onComplete,
  compact = false,
}: InterventionCardProps) {
  const priorityColors = PRIORITY_COLORS[intervention.priority as keyof typeof PRIORITY_COLORS]
  const statusColors = STATUS_COLORS[intervention.status as keyof typeof STATUS_COLORS]

  const isOverdue = () => {
    if (intervention.status === 'completed' || intervention.status === 'cancelled') {
      return false
    }
    if (!intervention.dueDate) return false
    return new Date(intervention.dueDate) < new Date()
  }

  const getPriorityIcon = () => {
    switch (intervention.priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4" />
      case 'high':
        return <AlertTriangle className="w-4 h-4" />
      case 'medium':
        return <Clock className="w-4 h-4" />
      default:
        return <CheckCircle className="w-4 h-4" />
    }
  }

  const overdue = isOverdue()

  if (compact) {
    return (
      <div
        className={cn(
          'p-3 rounded-lg border hover:shadow-sm transition-shadow',
          overdue && 'border-red-300 bg-red-50/50'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{intervention.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  priorityColors?.bg,
                  priorityColors?.text,
                  priorityColors?.border
                )}
              >
                {intervention.priority}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {DOMAIN_NAMES[intervention.domain] || intervention.domain}
              </Badge>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-xs shrink-0',
              statusColors?.bg,
              statusColors?.text,
              statusColors?.border
            )}
          >
            {intervention.status.replace('_', ' ')}
          </Badge>
        </div>
        {intervention.dueDate && (
          <div className={cn('text-xs mt-2 flex items-center gap-1', overdue && 'text-red-600')}>
            <Calendar className="w-3 h-3" />
            {formatDate(intervention.dueDate)}
            {overdue && <span className="font-medium"> (Overdue)</span>}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={cn(overdue && 'border-red-300')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                priorityColors?.bg
              )}
            >
              {getPriorityIcon()}
            </div>
            <div>
              <CardTitle className="text-base">{intervention.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {DOMAIN_NAMES[intervention.domain] || intervention.domain}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    priorityColors?.bg,
                    priorityColors?.text,
                    priorityColors?.border
                  )}
                >
                  {intervention.priority}
                </Badge>
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              statusColors?.bg,
              statusColors?.text,
              statusColors?.border
            )}
          >
            {intervention.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {intervention.user && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(intervention.user.name || '')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{intervention.user.name}</p>
              {intervention.user.vayoId && (
                <p className="text-xs text-muted-foreground">{intervention.user.vayoId}</p>
              )}
            </div>
          </div>
        )}

        {intervention.description && (
          <p className="text-sm text-muted-foreground">{intervention.description}</p>
        )}

        {intervention.dueDate && (
          <div className={cn('flex items-center gap-2 text-sm', overdue && 'text-red-600')}>
            <Calendar className="w-4 h-4" />
            <span>Due: {formatDate(intervention.dueDate)}</span>
            {overdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
          </div>
        )}

        {intervention.notes && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">Clinical Notes</p>
            <p className="text-sm">{intervention.notes}</p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          {onComplete && intervention.status !== 'completed' && (
            <Button size="sm" onClick={onComplete}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Complete
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" className="text-red-600" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
