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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
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
  Eye,
  UserPlus,
  Users,
  Phone,
  Mail,
  AlertCircle,
} from 'lucide-react'
import { cn, getInitials, formatDate } from '@/lib/utils'
import type { SafeUser } from '@/types'

interface VolunteerWithStats extends SafeUser {
  assignedCount?: number
}

interface VolunteerTableProps {
  volunteers: VolunteerWithStats[]
  onView: (volunteer: SafeUser) => void
  onAssign: (volunteer: SafeUser) => void
  onViewAssigned: (volunteer: SafeUser) => void
}

export function VolunteerTable({
  volunteers,
  onView,
  onAssign,
  onViewAssigned,
}: VolunteerTableProps) {
  const getCapacityStatus = (assigned: number, max: number) => {
    const percentage = (assigned / max) * 100
    if (percentage >= 100) return { color: 'bg-red-500', status: 'Full' }
    if (percentage >= 80) return { color: 'bg-yellow-500', status: 'Near Capacity' }
    return { color: 'bg-green-500', status: 'Available' }
  }

  if (volunteers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
        <p>No volunteers found</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Volunteer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Assigned Elders</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {volunteers.map((volunteer) => {
            const assignedCount = volunteer.assignedElderly?.length || volunteer.assignedCount || 0
            const maxAssignments = volunteer.maxAssignments || 10
            const capacityPercentage = (assignedCount / maxAssignments) * 100
            const capacityStatus = getCapacityStatus(assignedCount, maxAssignments)

            return (
              <TableRow key={volunteer.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={volunteer.avatar} alt={volunteer.name} />
                      <AvatarFallback className="bg-teal-100 text-teal-700 text-sm font-medium">
                        {getInitials(volunteer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{volunteer.name}</div>
                      <div className="text-sm text-muted-foreground">{volunteer.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    {volunteer.phone && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {volunteer.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      {volunteer.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-[120px] space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {assignedCount}/{maxAssignments}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(capacityPercentage)}%
                      </span>
                    </div>
                    <Progress value={capacityPercentage} className={cn('h-2', capacityStatus.color)} />
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewAssigned(volunteer)}
                    className="text-primary hover:text-primary"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    {assignedCount} elders
                  </Button>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      capacityStatus.status === 'Full' && 'bg-red-50 text-red-700 border-red-200',
                      capacityStatus.status === 'Near Capacity' && 'bg-yellow-50 text-yellow-700 border-yellow-200',
                      capacityStatus.status === 'Available' && 'bg-green-50 text-green-700 border-green-200'
                    )}
                  >
                    {capacityStatus.status === 'Full' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {capacityStatus.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(volunteer.createdAt)}
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
                      <DropdownMenuItem onClick={() => onView(volunteer)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewAssigned(volunteer)}>
                        <Users className="mr-2 h-4 w-4" />
                        View Assigned Elders
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onAssign(volunteer)}
                        disabled={assignedCount >= maxAssignments}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign Elders
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
