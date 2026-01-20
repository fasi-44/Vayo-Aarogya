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

interface CareTeamMemberWithStats extends SafeUser {
  assignedCount?: number
}

interface CareTeamTableProps {
  members: CareTeamMemberWithStats[]
  onView: (member: SafeUser) => void
  onAssign: (member: SafeUser) => void
  onViewAssigned: (member: SafeUser) => void
}

export function CareTeamTable({
  members,
  onView,
  onAssign,
  onViewAssigned,
}: CareTeamTableProps) {
  const getCapacityStatus = (assigned: number, max: number) => {
    const percentage = (assigned / max) * 100
    if (percentage >= 100) return { color: 'bg-coral-500', status: 'Full' }
    if (percentage >= 80) return { color: 'bg-smoked-500', status: 'Near Capacity' }
    return { color: 'bg-moss-500', status: 'Available' }
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
        <p>No care team members found</p>
      </div>
    )
  }

  // Action menu component to reuse in both views
  const ActionMenu = ({ member, assignedCount, maxAssignments }: { member: SafeUser; assignedCount: number; maxAssignments: number }) => (
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
        <DropdownMenuItem onClick={() => onView(member)}>
          <Eye className="mr-2 h-4 w-4" />
          View Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewAssigned(member)}>
          <Users className="mr-2 h-4 w-4" />
          View Assigned Elders
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onAssign(member)}
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
        {members.map((member) => {
          const assignedCount = member.role === 'volunteer'
            ? (member.assignedElderly?.length || member.assignedCount || 0)
            : (member.professionalElders?.length || member.assignedCount || 0)
          const maxAssignments = member.maxAssignments || 10
          const capacityPercentage = (assignedCount / maxAssignments) * 100
          const capacityStatus = getCapacityStatus(assignedCount, maxAssignments)

          const statusGradients: Record<string, string> = {
            'Full': 'from-coral-50 to-rose-50 dark:from-coral-950/30 dark:to-rose-950/30',
            'Near Capacity': 'from-smoked-50 to-amber-50 dark:from-smoked-950/30 dark:to-amber-950/30',
            'Available': 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30',
          }

          return (
            <Card key={member.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Header with status-based gradient */}
              <div className={`bg-gradient-to-r ${statusGradients[capacityStatus.status]} px-4 py-3 border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 ring-2 ring-white shadow-sm">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className={cn(
                        "text-white text-lg font-semibold",
                        member.role === 'volunteer' ? "bg-teal-500" : "bg-blue-500"
                      )}>
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base text-foreground">{member.name}</h3>
                        <Badge className={cn(
                          'text-xs',
                          member.role === 'volunteer' && 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
                          member.role === 'professional' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                        )}>
                          {member.role === 'volunteer' ? 'Volunteer' : 'Professional'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <ActionMenu member={member} assignedCount={assignedCount} maxAssignments={maxAssignments} />
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
                        capacityStatus.status === 'Full' && 'bg-coral-100 text-coral-700 border-coral-200 dark:bg-coral-900/50 dark:text-coral-300',
                        capacityStatus.status === 'Near Capacity' && 'bg-smoked-100 text-smoked-700 border-smoked-200 dark:bg-smoked-900/50 dark:text-smoked-300',
                        capacityStatus.status === 'Available' && 'bg-moss-100 text-moss-700 border-moss-200 dark:bg-moss-900/50 dark:text-moss-300'
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
                        capacityStatus.status === 'Full' && '[&>div]:bg-coral-500',
                        capacityStatus.status === 'Near Capacity' && '[&>div]:bg-smoked-500',
                        capacityStatus.status === 'Available' && '[&>div]:bg-moss-500'
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
                      {member.phone ? (
                        <a
                          href={`tel:${member.phone}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700"
                        >
                          {member.phone}
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
                        onClick={() => onViewAssigned(member)}
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
                      {formatDate(member.createdAt)}
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
              <TableHead className="w-[250px]">Care Team Member</TableHead>
              <TableHead className="w-[100px]">Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Assigned Elders</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const assignedCount = member.role === 'volunteer'
                ? (member.assignedElderly?.length || member.assignedCount || 0)
                : (member.professionalElders?.length || member.assignedCount || 0)
              const maxAssignments = member.maxAssignments || 10
              const capacityPercentage = (assignedCount / maxAssignments) * 100
              const capacityStatus = getCapacityStatus(assignedCount, maxAssignments)

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className={cn(
                          "text-sm font-medium",
                          member.role === 'volunteer' ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      'text-xs',
                      member.role === 'volunteer' && 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
                      member.role === 'professional' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                    )}>
                      {member.role === 'volunteer' ? 'Volunteer' : 'Professional'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {member.phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          {member.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        {member.email}
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
                      onClick={() => onViewAssigned(member)}
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
                        capacityStatus.status === 'Full' && 'bg-coral-50 text-coral-700 border-coral-200',
                        capacityStatus.status === 'Near Capacity' && 'bg-smoked-50 text-smoked-700 border-smoked-200',
                        capacityStatus.status === 'Available' && 'bg-moss-50 text-moss-700 border-moss-200'
                      )}
                    >
                      {capacityStatus.status === 'Full' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {capacityStatus.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(member.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionMenu member={member} assignedCount={assignedCount} maxAssignments={maxAssignments} />
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
