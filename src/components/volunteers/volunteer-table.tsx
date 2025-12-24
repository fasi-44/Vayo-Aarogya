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
  Eye,
  UserPlus,
  Users,
  Phone,
  Mail,
  AlertCircle,
  Calendar,
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

  // Action menu component to reuse in both views
  const ActionMenu = ({ volunteer, assignedCount, maxAssignments }: { volunteer: SafeUser; assignedCount: number; maxAssignments: number }) => (
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
  )

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {volunteers.map((volunteer) => {
          const assignedCount = volunteer.assignedElderly?.length || volunteer.assignedCount || 0
          const maxAssignments = volunteer.maxAssignments || 10
          const capacityPercentage = (assignedCount / maxAssignments) * 100
          const capacityStatus = getCapacityStatus(assignedCount, maxAssignments)

          const statusGradients: Record<string, string> = {
            'Full': 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
            'Near Capacity': 'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30',
            'Available': 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30',
          }

          return (
            <Card key={volunteer.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Header with status-based gradient */}
              <div className={`bg-gradient-to-r ${statusGradients[capacityStatus.status]} px-4 py-3 border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 ring-2 ring-white shadow-sm">
                      <AvatarImage src={volunteer.avatar} alt={volunteer.name} />
                      <AvatarFallback className="bg-teal-500 text-white text-lg font-semibold">
                        {getInitials(volunteer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-base text-foreground">{volunteer.name}</h3>
                      <p className="text-sm text-muted-foreground">{volunteer.email}</p>
                    </div>
                  </div>
                  <ActionMenu volunteer={volunteer} assignedCount={assignedCount} maxAssignments={maxAssignments} />
                </div>
              </div>

              <CardContent className="p-4">
                {/* Capacity Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Capacity</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        capacityStatus.status === 'Full' && 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300',
                        capacityStatus.status === 'Near Capacity' && 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300',
                        capacityStatus.status === 'Available' && 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300'
                      )}
                    >
                      {capacityStatus.status === 'Full' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {capacityStatus.status}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Progress
                      value={capacityPercentage}
                      className={cn(
                        'h-3 rounded-full',
                        capacityStatus.status === 'Full' && '[&>div]:bg-red-500',
                        capacityStatus.status === 'Near Capacity' && '[&>div]:bg-yellow-500',
                        capacityStatus.status === 'Available' && '[&>div]:bg-green-500'
                      )}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {assignedCount}/{maxAssignments}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-3">
                  {/* Contact */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Contact Number</p>
                      {volunteer.phone ? (
                        <a
                          href={`tel:${volunteer.phone}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700"
                        >
                          {volunteer.phone}
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Tap to call</span>
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not provided</span>
                      )}
                    </div>
                  </div>

                  {/* Assigned Elders */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Assigned Elders</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewAssigned(volunteer)}
                        className="h-auto p-0 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-transparent"
                      >
                        {assignedCount} elder{assignedCount !== 1 ? 's' : ''} assigned
                        <span className="ml-1 text-xs">→</span>
                      </Button>
                    </div>
                  </div>

                  {/* Joined Date */}
                  <div className="flex items-center justify-between pt-2 border-t border-dashed">
                    <span className="text-xs text-muted-foreground">Member since</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(volunteer.createdAt)}
                    </span>
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
                    <ActionMenu volunteer={volunteer} assignedCount={assignedCount} maxAssignments={maxAssignments} />
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
