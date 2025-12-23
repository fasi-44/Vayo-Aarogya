'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
  Shield,
  Clock,
  UserCheck,
  UserX,
  Users,
  AlertCircle,
} from 'lucide-react'
import { type SafeUser } from '@/types'
import { getInitials, formatDate } from '@/lib/utils'

interface UserViewDialogProps {
  open: boolean
  onClose: () => void
  user: SafeUser | null
  onEdit?: () => void
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  professional: 'Professional',
  volunteer: 'Volunteer',
  family: 'Family',
  elderly: 'Elderly',
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  professional: 'bg-blue-100 text-blue-800',
  volunteer: 'bg-green-100 text-green-800',
  family: 'bg-orange-100 text-orange-800',
  elderly: 'bg-amber-100 text-amber-800',
}

export function UserViewDialog({ open, onClose, user, onEdit }: UserViewDialogProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={roleColors[user.role]}>
                  {roleLabels[user.role] || user.role}
                </Badge>
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
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
                {user.emailVerified && (
                  <Badge variant="outline" className="text-xs">Verified</Badge>
                )}
              </div>
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Elderly-specific Information */}
          {user.role === 'elderly' && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Personal Information
              </h4>
              <div className="grid gap-3">
                {user.age && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Age: {user.age} years</span>
                    {user.gender && <span className="text-muted-foreground">({user.gender})</span>}
                  </div>
                )}
                {user.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.address}</span>
                  </div>
                )}
                {user.emergencyContact && (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span>Emergency: {user.emergencyContact}</span>
                  </div>
                )}
                {user.assignedVolunteer && (
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Assigned Volunteer ID: {user.assignedVolunteer}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Volunteer-specific Information */}
          {user.role === 'volunteer' && user.maxAssignments && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Volunteer Settings
              </h4>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Max Assignments: {user.maxAssignments}</span>
              </div>
            </div>
          )}

          {/* Account Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Account Information
            </h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Created: {formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Last Login: {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {onEdit && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={onEdit}>
                Edit User
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
