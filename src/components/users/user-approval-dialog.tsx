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
import { CheckCircle, Loader2, Mail, Phone } from 'lucide-react'
import { type SafeUser } from '@/types'
import { getInitials } from '@/lib/utils'

interface UserApprovalDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (userId: string, category: 'community' | 'clinic') => Promise<void>
  user: SafeUser | null
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  professional: 'Professional',
  volunteer: 'Volunteer',
  family: 'Family',
  elderly: 'Elderly',
}

export function UserApprovalDialog({ open, onClose, onConfirm, user }: UserApprovalDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'community' | 'clinic' | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  const isElderly = user.role === 'elderly'

  const handleConfirm = async () => {
    if (isElderly && !selectedCategory) {
      setError('Please select a category to generate the patient number')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await onConfirm(user.id, selectedCategory || 'community')
      setSelectedCategory(null)
      onClose()
    } catch {
      setError('Failed to approve user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedCategory(null)
      setError(null)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Approve User
          </DialogTitle>
          <DialogDescription>
            {isElderly
              ? 'Select a patient category to generate the Vayo ID before approving.'
              : 'Confirm approval for this user.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium">{user.name}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {user.phone}
                  </span>
                )}
              </div>
              <Badge variant="outline" className="mt-1">
                {roleLabels[user.role] || user.role}
              </Badge>
            </div>
          </div>

          {/* Category Selection (elderly only) */}
          {isElderly && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Patient Category *
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('community')
                    setError(null)
                  }}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all text-left ${
                    selectedCategory === 'community'
                      ? 'border-green-500 bg-green-50'
                      : 'border-border hover:border-green-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedCategory === 'community' ? 'border-green-500' : 'border-muted-foreground/40'
                  }`}>
                    {selectedCategory === 'community' && (
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">Community</p>
                    <p className="text-xs text-muted-foreground">Referred through NGO / Community outreach</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('clinic')
                    setError(null)
                  }}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all text-left ${
                    selectedCategory === 'clinic'
                      ? 'border-green-500 bg-green-50'
                      : 'border-border hover:border-green-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedCategory === 'clinic' ? 'border-green-500' : 'border-muted-foreground/40'
                  }`}>
                    {selectedCategory === 'clinic' && (
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">Clinic</p>
                    <p className="text-xs text-muted-foreground">Referral from Clinic / OPD</p>
                  </div>
                </button>
              </div>
              {isElderly && selectedCategory && (
                <p className="text-xs text-muted-foreground">
                  Vayo ID format: {new Date().getFullYear()}{selectedCategory === 'community' ? 'COM' : 'CLI'}001
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleConfirm}
            disabled={isLoading || (isElderly && !selectedCategory)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
