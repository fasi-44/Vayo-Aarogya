'use client'

import { useState } from 'react'
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
import { MoreHorizontal, Pencil, Trash2, Eye, UserCheck, UserX, Phone, Calendar, Clock } from 'lucide-react'
import { type SafeUser } from '@/types'
import { getInitials, formatDate } from '@/lib/utils'

interface UserTableProps {
  users: SafeUser[]
  onEdit: (user: SafeUser) => void
  onDelete: (user: SafeUser) => void
  onView: (user: SafeUser) => void
  currentUserId?: string
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  professional: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  volunteer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  family: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  elderly: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  professional: 'Professional',
  volunteer: 'Volunteer',
  family: 'Family',
  elderly: 'Elderly',
}

export function UserTable({ users, onEdit, onDelete, onView, currentUserId }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No users found</p>
      </div>
    )
  }

  // Action menu component to reuse in both views
  const ActionMenu = ({ user }: { user: SafeUser }) => (
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
        <DropdownMenuItem onClick={() => onView(user)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(user)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        {user.id !== currentUserId && (
          <DropdownMenuItem
            onClick={() => onDelete(user)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {user.isActive ? 'Deactivate' : 'Delete'}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map((user) => {
          const roleGradients: Record<string, string> = {
            super_admin: 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30',
            professional: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
            volunteer: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30',
            family: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
            elderly: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30',
          }

          const avatarColors: Record<string, string> = {
            super_admin: 'bg-purple-500',
            professional: 'bg-blue-500',
            volunteer: 'bg-teal-500',
            family: 'bg-orange-500',
            elderly: 'bg-rose-500',
          }

          return (
            <Card key={user.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Header with role-based gradient */}
              <div className={`bg-gradient-to-r ${roleGradients[user.role] || roleGradients.elderly} px-4 py-3 border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 ring-2 ring-white shadow-sm">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className={`${avatarColors[user.role] || 'bg-primary'} text-white text-lg font-semibold`}>
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-base text-foreground">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <ActionMenu user={user} />
                </div>
              </div>

              <CardContent className="p-4">
                {/* Role and Status Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant="outline" className={roleColors[user.role]}>
                    {roleLabels[user.role] || user.role}
                  </Badge>
                  {user.isActive ? (
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
                  {/* Phone */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Contact Number</p>
                      {user.phone ? (
                        <a
                          href={`tel:${user.phone}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700"
                        >
                          {user.phone}
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Tap to call</span>
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not provided</span>
                      )}
                    </div>
                  </div>

                  {/* Account Info */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Last Login</p>
                      <p className="text-sm font-medium">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never logged in'}
                      </p>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center justify-between pt-2 border-t border-dashed">
                    <span className="text-xs text-muted-foreground">Member since</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(user.createdAt)}
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
              <TableHead className="w-[250px]">User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={roleColors[user.role]}>
                    {roleLabels[user.role] || user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.phone || '-'}
                </TableCell>
                <TableCell>
                  {user.isActive ? (
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
                <TableCell className="text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                </TableCell>
                <TableCell className="text-right">
                  <ActionMenu user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
