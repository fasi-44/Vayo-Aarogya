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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Search, AlertTriangle, Users, CheckCircle2 } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import type { SafeUser } from '@/types'

interface BulkAssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  volunteers: SafeUser[]
  elderly: SafeUser[]
  onBulkAssign: (volunteerId: string, elderlyIds: string[], assignmentType: 'volunteer' | 'professional') => Promise<void>
  assignmentType?: 'volunteer' | 'professional'
}

export function BulkAssignDialog({
  open,
  onOpenChange,
  volunteers,
  elderly,
  onBulkAssign,
  assignmentType = 'volunteer',
}: BulkAssignDialogProps) {
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('')
  const [selectedElderlyIds, setSelectedElderlyIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedVolunteer = volunteers.find((v) => v.id === selectedVolunteerId)

  // Auto-detect assignment type based on selected member's role
  const detectedAssignmentType = selectedVolunteer?.role as 'volunteer' | 'professional' || assignmentType

  const assignedCount = detectedAssignmentType === 'volunteer'
    ? (selectedVolunteer?.assignedElderly?.length || 0)
    : ((selectedVolunteer as any)?.professionalElders?.length || 0)
  const maxAssignments = selectedVolunteer?.maxAssignments || 10
  const remainingCapacity = maxAssignments - assignedCount

  useEffect(() => {
    if (open) {
      setSelectedVolunteerId('')
      setSelectedElderlyIds([])
      setSearchQuery('')
    }
  }, [open])

  // Filter unassigned elderly based on detected assignment type
  const unassignedElderly = elderly.filter((e) => {
    if (detectedAssignmentType === 'volunteer') {
      return !e.assignedVolunteer
    } else {
      return !e.assignedProfessional
    }
  })

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

  // Filter available volunteers/professionals based on their role
  const availableVolunteers = volunteers.filter((v) => {
    const assigned = v.role === 'volunteer'
      ? (v.assignedElderly?.length || 0)
      : ((v as any).professionalElders?.length || 0)
    const max = v.maxAssignments || 10
    return assigned < max
  })

  const handleToggle = (elderlyId: string) => {
    setSelectedElderlyIds((prev) => {
      if (prev.includes(elderlyId)) {
        return prev.filter((id) => id !== elderlyId)
      }
      if (selectedVolunteerId && prev.length >= remainingCapacity) {
        return prev
      }
      return [...prev, elderlyId]
    })
  }

  const handleSelectAll = () => {
    if (selectedElderlyIds.length === filteredElderly.length) {
      setSelectedElderlyIds([])
    } else {
      const limit = selectedVolunteerId ? remainingCapacity : filteredElderly.length
      setSelectedElderlyIds(filteredElderly.slice(0, limit).map((e) => e.id))
    }
  }

  const handleAssign = async () => {
    if (!selectedVolunteerId || selectedElderlyIds.length === 0) return

    setLoading(true)
    try {
      await onBulkAssign(selectedVolunteerId, selectedElderlyIds, detectedAssignmentType)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Assign Elders</DialogTitle>
          <DialogDescription>
            Select multiple elders and assign them to a {assignmentType === 'volunteer' ? 'volunteer' : 'professional'} at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Volunteer/Professional Selection */}
          <div className="space-y-2">
            <Label>Select Care Team Member</Label>
            <Select value={selectedVolunteerId} onValueChange={setSelectedVolunteerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a care team member" />
              </SelectTrigger>
              <SelectContent>
                {availableVolunteers.map((volunteer) => {
                  const assigned = volunteer.role === 'volunteer'
                    ? (volunteer.assignedElderly?.length || 0)
                    : ((volunteer as any).professionalElders?.length || 0)
                  const max = volunteer.maxAssignments || 10
                  return (
                    <SelectItem key={volunteer.id} value={volunteer.id}>
                      <div className="flex items-center gap-2">
                        <span>{volunteer.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {assigned}/{max}
                        </Badge>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {selectedVolunteer && (
              <p className="text-sm text-muted-foreground">
                Can assign {remainingCapacity} more elder{remainingCapacity !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Capacity Warning */}
          {selectedVolunteerId && remainingCapacity <= 2 && remainingCapacity > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-700">
                Limited capacity remaining
              </p>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search unassigned elders for ${assignmentType === 'volunteer' ? 'volunteer' : 'professional'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select All */}
          {filteredElderly.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all-bulk"
                  checked={
                    selectedElderlyIds.length > 0 &&
                    selectedElderlyIds.length === Math.min(filteredElderly.length, selectedVolunteerId ? remainingCapacity : Infinity)
                  }
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all-bulk" className="text-sm cursor-pointer">
                  Select All
                </Label>
              </div>
              <Badge variant="outline">
                <Users className="w-3 h-3 mr-1" />
                {selectedElderlyIds.length} selected
              </Badge>
            </div>
          )}

          {/* Elderly List */}
          <ScrollArea className="h-[250px] rounded-lg border p-2">
            {filteredElderly.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No unassigned elderly found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredElderly.map((elder) => {
                  const isSelected = selectedElderlyIds.includes(elder.id)
                  const isDisabled =
                    !isSelected &&
                    !!selectedVolunteerId &&
                    selectedElderlyIds.length >= remainingCapacity

                  return (
                    <div
                      key={elder.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
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
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
                          {getInitials(elder.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{elder.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {elder.vayoId && <span>{elder.vayoId}</span>}
                          {elder.age && <span>{elder.vayoId ? '•' : ''} {elder.age} yrs</span>}
                          {!elder.vayoId && !elder.age && <span>—</span>}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
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
            disabled={loading || !selectedVolunteerId || selectedElderlyIds.length === 0}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign {selectedElderlyIds.length} Elder{selectedElderlyIds.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
