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

interface ElderlyDeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  elderly: SafeUser | null
}

export function ElderlyDeleteDialog({
  open,
  onClose,
  onConfirm,
  elderly
}: ElderlyDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!elderly) return null

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
            {elderly.isActive ? 'Deactivate Elder' : 'Confirm Action'}
          </DialogTitle>
          <DialogDescription>
            {elderly.isActive
              ? 'This will deactivate the elder account. They will no longer be able to log in or appear in active lists.'
              : 'Are you sure you want to proceed with this action?'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={elderly.avatar} alt={elderly.name} />
              <AvatarFallback className="bg-rose-100 text-rose-700">
                {getInitials(elderly.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{elderly.name}</p>
              <p className="text-sm text-muted-foreground">{elderly.email}</p>
              {elderly.age && (
                <Badge variant="outline" className="mt-1">
                  {elderly.age} years old
                </Badge>
              )}
            </div>
          </div>

          {elderly.assignedVolunteer && (
            <p className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Note: This elder has an assigned volunteer. Deactivating will not
              automatically update the volunteer's assignment count.
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
            {elderly.isActive ? 'Deactivate' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
