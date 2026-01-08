'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { cn, getInitials } from '@/lib/utils'
import {
  Phone,
  Mail,
  Users,
  UserPlus,
  MapPin,
  AlertCircle,
  Eye,
} from 'lucide-react'
import type { SafeUser } from '@/types'

interface CareTeamCardProps {
  member: SafeUser & { assignedCount?: number }
  onView?: () => void
  onAssign?: () => void
  onViewAssigned?: () => void
  compact?: boolean
}

export function CareTeamCard({
  member,
  onView,
  onAssign,
  onViewAssigned,
  compact = false,
}: CareTeamCardProps) {
  const assignedCount = member.role === 'volunteer'
    ? (member.assignedElderly?.length || member.assignedCount || 0)
    : (member.professionalElders?.length || member.assignedCount || 0)
  const maxAssignments = member.maxAssignments || 10
  const capacityPercentage = (assignedCount / maxAssignments) * 100
  const isFull = assignedCount >= maxAssignments
  const isNearCapacity = capacityPercentage >= 80

  const getCapacityColor = () => {
    if (isFull) return 'bg-red-500'
    if (isNearCapacity) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback className={cn(
            "text-sm",
            member.role === 'volunteer' ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"
          )}>
            {getInitials(member.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{member.name}</p>
          <p className="text-xs text-muted-foreground">
            {assignedCount}/{maxAssignments} assigned
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-xs shrink-0',
            isFull && 'bg-red-50 text-red-700 border-red-200',
            !isFull && isNearCapacity && 'bg-yellow-50 text-yellow-700 border-yellow-200',
            !isFull && !isNearCapacity && 'bg-green-50 text-green-700 border-green-200'
          )}
        >
          {isFull ? 'Full' : isNearCapacity ? 'Near Capacity' : 'Available'}
        </Badge>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-soft hover:shadow-soft-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback className={cn(
              "text-lg font-medium",
              member.role === 'volunteer' ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"
            )}>
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{member.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={cn(
                "text-xs",
                member.role === 'volunteer' && "bg-teal-50 text-teal-700 border-teal-200",
                member.role === 'professional' && "bg-blue-50 text-blue-700 border-blue-200"
              )}>
                {member.role === 'volunteer' ? 'Volunteer' : 'Professional'}
              </Badge>
              {isFull && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  At Capacity
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          {member.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <a href={`tel:${member.phone}`} className="hover:text-primary">
                {member.phone}
              </a>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            <a href={`mailto:${member.email}`} className="hover:text-primary truncate">
              {member.email}
            </a>
          </div>
          {(member.villageName || member.districtName) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>
                {[member.villageName, member.talukName, member.districtName]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Assignment Capacity</span>
            <span className="font-medium">
              {assignedCount}/{maxAssignments}
            </span>
          </div>
          <Progress value={capacityPercentage} className={cn('h-2', getCapacityColor())} />
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {onView && (
            <Button variant="outline" size="sm" className="w-full" onClick={onView}>
              <Eye className="w-4 h-4 mr-1" />
              View Profile
            </Button>
          )}
          <div className="flex items-center gap-2">
            {onViewAssigned && (
              <Button variant="outline" size="sm" className="flex-1" onClick={onViewAssigned}>
                <Users className="w-4 h-4 mr-1" />
                Elders ({assignedCount})
              </Button>
            )}
            {onAssign && (
              <Button size="sm" className="flex-1" onClick={onAssign} disabled={isFull}>
                <UserPlus className="w-4 h-4 mr-1" />
                Assign
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
