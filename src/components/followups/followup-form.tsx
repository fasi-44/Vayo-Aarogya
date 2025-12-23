'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateInput } from '@/components/ui/date-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import type { FollowUp, SafeUser } from '@/types'
import { FOLLOW_UP_TYPES } from '@/services/followups'

interface FollowUpFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FollowUpFormData) => Promise<void>
  followUp?: FollowUp | null
  elderly?: SafeUser[]
  volunteers?: SafeUser[]
  preselectedElderlyId?: string
}

export interface FollowUpFormData {
  elderlyId: string
  assigneeId: string
  type: 'routine' | 'assessment' | 'intervention' | 'medication' | 'other'
  title: string
  description: string
  scheduledDate: string
  scheduledTime: string
  status: 'scheduled' | 'completed' | 'missed' | 'rescheduled' | 'cancelled'
  notes: string
}

const types = Object.entries(FOLLOW_UP_TYPES).map(([value, label]) => ({
  value,
  label,
}))

const statuses = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'missed', label: 'Missed' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function FollowUpForm({
  open,
  onOpenChange,
  onSubmit,
  followUp,
  elderly = [],
  volunteers = [],
  preselectedElderlyId,
}: FollowUpFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FollowUpFormData>({
    elderlyId: '',
    assigneeId: '',
    type: 'routine',
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '10:00',
    status: 'scheduled',
    notes: '',
  })

  useEffect(() => {
    if (followUp) {
      const scheduledDate = new Date(followUp.scheduledDate)
      setFormData({
        elderlyId: followUp.elderlyId,
        assigneeId: followUp.assigneeId || '',
        type: followUp.type as FollowUpFormData['type'],
        title: followUp.title,
        description: followUp.description || '',
        scheduledDate: scheduledDate.toISOString().split('T')[0],
        scheduledTime: scheduledDate.toTimeString().slice(0, 5),
        status: followUp.status as FollowUpFormData['status'],
        notes: followUp.notes || '',
      })
    } else {
      // Default to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      setFormData({
        elderlyId: preselectedElderlyId || '',
        assigneeId: '',
        type: 'routine',
        title: '',
        description: '',
        scheduledDate: tomorrow.toISOString().split('T')[0],
        scheduledTime: '10:00',
        status: 'scheduled',
        notes: '',
      })
    }
  }, [followUp, preselectedElderlyId, open])

  // Auto-generate title based on type
  useEffect(() => {
    if (!followUp && formData.type && !formData.title) {
      setFormData((prev) => ({
        ...prev,
        title: FOLLOW_UP_TYPES[prev.type as keyof typeof FOLLOW_UP_TYPES] || '',
      }))
    }
  }, [formData.type, followUp])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const isEdit = !!followUp

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {isEdit ? 'Edit Follow-up' : 'Schedule Follow-up'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the follow-up details below.'
              : 'Schedule a new follow-up visit for an elder.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-1">
          <form id="followup-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="elderlyId">Elder</Label>
            <Select
              value={formData.elderlyId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, elderlyId: value }))
              }
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select elder" />
              </SelectTrigger>
              <SelectContent>
                {elderly.map((elder) => (
                  <SelectItem key={elder.id} value={elder.id}>
                    {elder.name} {elder.vayoId && `(${elder.vayoId})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: value as FollowUpFormData['type'],
                    title: FOLLOW_UP_TYPES[value as keyof typeof FOLLOW_UP_TYPES] || prev.title,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigneeId">Assigned To</Label>
              <Select
                value={formData.assigneeId || 'unassigned'}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, assigneeId: value === 'unassigned' ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {volunteers.map((volunteer) => (
                    <SelectItem key={volunteer.id} value={volunteer.id}>
                      {volunteer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter follow-up title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe the follow-up purpose"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Date</Label>
              <DateInput
                id="scheduledDate"
                value={formData.scheduledDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Time</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, scheduledTime: e.target.value }))
                }
                required
              />
            </div>
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as FollowUpFormData['status'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Add any notes..."
              rows={2}
            />
          </div>

          </form>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="followup-form"
            disabled={loading || !formData.elderlyId || !formData.title}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update' : 'Schedule'} Follow-up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
