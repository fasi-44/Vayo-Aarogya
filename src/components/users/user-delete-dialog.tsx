'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { type SafeUser } from '@/types'
import { getInitials } from '@/lib/utils'

interface UserDeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  user: SafeUser | null
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  professional: 'Professional',
  volunteer: 'Volunteer',
  family: 'Family',
  elderly: 'Elderly',
}

export function UserDeleteDialog({ open, onClose, onConfirm, user }: UserDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!user) return null

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {user.isActive ? 'Deactivate User' : 'Confirm Action'}
          </DialogTitle>
          <DialogDescription>
            {user.isActive
              ? 'This will deactivate the user account. The user will no longer be able to log in.'
              : 'Are you sure you want to proceed with this action?'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="outline" className="mt-1">
                {roleLabels[user.role] || user.role}
              </Badge>
            </div>
          </div>

          {user.role === 'volunteer' && (
            <p className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Warning: This volunteer may have elderly users assigned to them.
              Deactivating will not automatically reassign those users.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {user.isActive ? 'Deactivate' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
