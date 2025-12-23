'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Search, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import type { SafeUser } from '@/types'

interface AssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  volunteer: SafeUser | null
  elderly: SafeUser[]
  onAssign: (elderlyIds: string[]) => Promise<void>
}

export function AssignmentDialog({
  open,
  onOpenChange,
  volunteer,
  elderly,
  onAssign,
}: AssignmentDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Get current assigned elderly IDs
  const currentAssigned = volunteer?.assignedElderly || []
  const assignedCount = currentAssigned.length
  const maxAssignments = volunteer?.maxAssignments || 10
  const remainingCapacity = maxAssignments - assignedCount

  useEffect(() => {
    if (open) {
      setSelectedIds([])
      setSearchQuery('')
    }
  }, [open])

  // Filter unassigned elderly (elderly array already contains only elderly role from getElderly)
  const unassignedElderly = elderly.filter((e) => !e.assignedVolunteer)

  // Filter by search query
  const filteredElderly = searchQuery.trim()
    ? unassignedElderly.filter(
        (e) =>
          e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.vayoId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.villageName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : unassignedElderly

  const handleToggle = (elderlyId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(elderlyId)) {
        return prev.filter((id) => id !== elderlyId)
      }
      if (prev.length >= remainingCapacity) {
        return prev
      }
      return [...prev, elderlyId]
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredElderly.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredElderly.slice(0, remainingCapacity).map((e) => e.id))
    }
  }

  const handleAssign = async () => {
    if (selectedIds.length === 0) return

    setLoading(true)
    try {
      await onAssign(selectedIds)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const isOverCapacity = selectedIds.length > remainingCapacity

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Elders to {volunteer?.name}</DialogTitle>
          <DialogDescription>
            Select elderly individuals to assign to this volunteer.
            Current: {assignedCount}/{maxAssignments} (
            {remainingCapacity} remaining)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Capacity Warning */}
          {remainingCapacity <= 2 && remainingCapacity > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-700">
                Only {remainingCapacity} more elder{remainingCapacity > 1 ? 's' : ''} can be assigned
              </p>
            </div>
          )}

          {remainingCapacity === 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700">
                This volunteer is at maximum capacity
              </p>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search unassigned elders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select All */}
          {filteredElderly.length > 0 && remainingCapacity > 0 && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedIds.length === Math.min(filteredElderly.length, remainingCapacity)}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm cursor-pointer">
                  Select All ({Math.min(filteredElderly.length, remainingCapacity)})
                </Label>
              </div>
              <Badge variant="outline">
                {selectedIds.length} selected
              </Badge>
            </div>
          )}

          {/* Elderly List */}
          <ScrollArea className="h-[300px] rounded-lg border p-2">
            {filteredElderly.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No unassigned elderly found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredElderly.map((elder) => {
                  const isSelected = selectedIds.includes(elder.id)
                  const isDisabled = !isSelected && selectedIds.length >= remainingCapacity

                  return (
                    <div
                      key={elder.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        isSelected && 'bg-primary/5 border-primary',
                        isDisabled && 'opacity-50 cursor-not-allowed',
                        !isSelected && !isDisabled && 'hover:bg-muted/50'
                      )}
                      onClick={() => !isDisabled && handleToggle(elder.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => handleToggle(elder.id)}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-rose-100 text-rose-700 text-sm">
                          {getInitials(elder.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{elder.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {elder.vayoId && <span>{elder.vayoId}</span>}
                          {elder.age && <span>• {elder.age} years</span>}
                          {elder.villageName && <span>• {elder.villageName}</span>}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={loading || selectedIds.length === 0 || isOverCapacity}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign {selectedIds.length} Elder{selectedIds.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
