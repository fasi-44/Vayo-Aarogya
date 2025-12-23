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

  return (
    <TooltipProvider>
      <div className="rounded-md border">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
