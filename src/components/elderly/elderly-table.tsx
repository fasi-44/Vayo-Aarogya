'use client'

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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  ClipboardCheck,
  Phone,
  MapPin,
  HandHeart,
  Users,
  Calendar,
} from 'lucide-react'
import { type SafeUser } from '@/types'
import { getInitials, formatDate } from '@/lib/utils'

// Extended type for elderly with relations
export interface ElderlyWithRelations extends Omit<SafeUser, 'assignedFamily' | 'assignedVolunteer'> {
  assignedFamily?: { id: string; name: string; phone?: string; email?: string } | string
  assignedVolunteer?: { id: string; name: string; phone?: string } | string
}

interface ElderlyTableProps {
  elderly: ElderlyWithRelations[]
  volunteers?: SafeUser[]
  onEdit: (elderly: ElderlyWithRelations) => void
  onDelete: (elderly: ElderlyWithRelations) => void
  onView: (elderly: ElderlyWithRelations) => void
  onAssessment?: (elderly: ElderlyWithRelations) => void
  onViewAssessments?: (elderly: ElderlyWithRelations) => void
}

export function ElderlyTable({
  elderly,
  volunteers = [],
  onEdit,
  onDelete,
  onView,
  onAssessment,
  onViewAssessments,
}: ElderlyTableProps) {
  const getVolunteerName = (volunteer?: ElderlyWithRelations['assignedVolunteer']) => {
    if (!volunteer) return null
    if (typeof volunteer === 'string') {
      const vol = volunteers.find(v => v.id === volunteer)
      return vol?.name || 'Unknown'
    }
    return volunteer.name || 'Unknown'
  }

  const getFamilyInfo = (elder: ElderlyWithRelations) => {
    // Check if assignedFamily relation is available
    if (elder.assignedFamily && typeof elder.assignedFamily === 'object') {
      return {
        name: elder.assignedFamily.name,
        phone: elder.assignedFamily.phone,
        relation: 'Family Member',
      }
    }
    // Fall back to caregiver fields
    if (elder.caregiverName || elder.caregiverPhone) {
      return {
        name: elder.caregiverName,
        phone: elder.caregiverPhone,
        relation: elder.caregiverRelation || 'Caregiver',
      }
    }
    return null
  }

  if (elderly.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No elderly records found</p>
      </div>
    )
  }

  // Action menu component to reuse in both views
  const ActionMenu = ({ elder }: { elder: ElderlyWithRelations }) => (
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
        <DropdownMenuItem onClick={() => onView(elder)}>
          <Eye className="mr-2 h-4 w-4" />
          View Profile
        </DropdownMenuItem>
        {onViewAssessments && (
          <DropdownMenuItem onClick={() => onViewAssessments(elder)}>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            View Assessments
          </DropdownMenuItem>
        )}
        {onAssessment && (
          <DropdownMenuItem onClick={() => onAssessment(elder)}>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            New Assessment
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onEdit(elder)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(elder)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {elder.isActive ? 'Deactivate' : 'Delete'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <TooltipProvider>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {elderly.map((elder) => {
          const familyInfo = getFamilyInfo(elder)
          return (
            <Card key={elder.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Header with gradient background */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 ring-2 ring-white shadow-sm">
                      <AvatarImage src={elder.avatar} alt={elder.name} />
                      <AvatarFallback className="bg-rose-500 text-white text-lg font-semibold">
                        {getInitials(elder.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-base text-foreground">{elder.name}</h3>
                      <p className="text-sm text-muted-foreground">{elder.email}</p>
                    </div>
                  </div>
                  <ActionMenu elder={elder} />
                </div>
              </div>

              <CardContent className="p-4">
                {/* Quick Info Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {elder.age && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                      {elder.age} years old
                    </span>
                  )}
                  {elder.gender && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 capitalize">
                      {elder.gender}
                    </span>
                  )}
                  {elder.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Inactive
                    </span>
                  )}
                </div>

                {/* Details Grid */}
                <div className="space-y-3">
                  {/* Caretaker/Family */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Caretaker / Family</p>
                      {familyInfo ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">{familyInfo.name}</span>
                          {familyInfo.phone && (
                            <a
                              href={`tel:${familyInfo.phone}`}
                              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 text-xs font-medium transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              Call
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Volunteer */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center shrink-0">
                      <HandHeart className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Assigned Volunteer</p>
                      {elder.assignedVolunteer ? (
                        <span className="text-sm font-medium">{getVolunteerName(elder.assignedVolunteer)}</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Registered Date */}
                  <div className="flex items-center justify-between pt-2 border-t border-dashed">
                    <span className="text-xs text-muted-foreground">Registered</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(elder.createdAt)}
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
              <TableHead className="w-[220px]">Elder</TableHead>
              <TableHead>Age / Gender</TableHead>
              <TableHead>Caretaker / Family</TableHead>
              <TableHead>Volunteer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {elderly.map((elder) => (
              <TableRow key={elder.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={elder.avatar} alt={elder.name} />
                      <AvatarFallback className="bg-rose-100 text-rose-700 text-sm font-medium">
                        {getInitials(elder.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{elder.name}</div>
                      <div className="text-sm text-muted-foreground">{elder.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {elder.age && (
                      <span className="font-medium">{elder.age} years</span>
                    )}
                    {elder.gender && (
                      <Badge variant="outline" className="ml-2 capitalize text-xs">
                        {elder.gender}
                      </Badge>
                    )}
                    {!elder.age && !elder.gender && (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {(() => {
                    const familyInfo = getFamilyInfo(elder)
                    if (familyInfo) {
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">{familyInfo.name}</span>
                          </div>
                          {familyInfo.relation && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {familyInfo.relation}
                            </Badge>
                          )}
                          {familyInfo.phone && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={`tel:${familyInfo.phone}`}
                                  className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 hover:underline"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  {familyInfo.phone}
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Click to call</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      )
                    }
                    return (
                      <span className="text-muted-foreground text-sm">No caretaker</span>
                    )
                  })()}
                </TableCell>
                <TableCell>
                  {elder.assignedVolunteer ? (
                    <div className="flex items-center gap-2">
                      <HandHeart className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium">
                        {getVolunteerName(elder.assignedVolunteer)}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                      Unassigned
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {elder.isActive ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <UserX className="w-3 h-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(elder.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <ActionMenu elder={elder} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
