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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Eye, UserCheck, UserX } from 'lucide-react'
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

  return (
    <div className="rounded-md border">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
