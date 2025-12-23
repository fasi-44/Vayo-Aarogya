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
import type { Intervention, SafeUser } from '@/types'
import { DOMAIN_NAMES } from '@/services/interventions'

interface InterventionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: InterventionFormData) => Promise<void>
  intervention?: Intervention | null
  elderly?: SafeUser[]
  preselectedElderlyId?: string
  preselectedDomain?: string
}

export interface InterventionFormData {
  userId: string
  title: string
  description: string
  domain: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  dueDate: string
  notes: string
}

const domains = Object.entries(DOMAIN_NAMES).map(([value, label]) => ({
  value,
  label,
}))

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const statuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function InterventionForm({
  open,
  onOpenChange,
  onSubmit,
  intervention,
  elderly = [],
  preselectedElderlyId,
  preselectedDomain,
}: InterventionFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<InterventionFormData>({
    userId: '',
    title: '',
    description: '',
    domain: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    notes: '',
  })

  useEffect(() => {
    if (intervention) {
      setFormData({
        userId: intervention.userId,
        title: intervention.title,
        description: intervention.description || '',
        domain: intervention.domain,
        priority: intervention.priority as InterventionFormData['priority'],
        status: intervention.status as InterventionFormData['status'],
        dueDate: intervention.dueDate
          ? new Date(intervention.dueDate).toISOString().split('T')[0]
          : '',
        notes: intervention.notes || '',
      })
    } else {
      setFormData({
        userId: preselectedElderlyId || '',
        title: '',
        description: '',
        domain: preselectedDomain || '',
        priority: 'medium',
        status: 'pending',
        dueDate: '',
        notes: '',
      })
    }
  }, [intervention, preselectedElderlyId, preselectedDomain, open])

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

  const isEdit = !!intervention

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Intervention' : 'Create New Intervention'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the intervention details below.'
              : 'Create a new intervention for the selected elderly.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">Elder</Label>
            <Select
              value={formData.userId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, userId: value }))
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

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter intervention title"
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
              placeholder="Describe the intervention"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Select
                value={formData.domain}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, domain: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((domain) => (
                    <SelectItem key={domain.value} value={domain.value}>
                      {domain.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: value as InterventionFormData['priority'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as InterventionFormData['status'],
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

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <DateInput
                id="dueDate"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Clinical Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Add clinical notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.userId || !formData.title}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update' : 'Create'} Intervention
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
