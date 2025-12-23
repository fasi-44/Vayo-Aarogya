'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { ArrowLeft, Loader2, Calendar } from 'lucide-react'
import { createFollowUp, FOLLOW_UP_TYPES } from '@/services/followups'
import { getElderly } from '@/services/elderly'
import { getUsers } from '@/services/users'
import type { SafeUser } from '@/types'

export default function NewFollowUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedElderlyId = searchParams.get('elderlyId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elderly, setElderly] = useState<SafeUser[]>([])
  const [volunteers, setVolunteers] = useState<SafeUser[]>([])

  // Form data
  const [formData, setFormData] = useState({
    elderlyId: preselectedElderlyId || '',
    assigneeId: '',
    type: 'routine' as keyof typeof FOLLOW_UP_TYPES,
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '10:00',
    notes: '',
  })

  // Load elderly and volunteers
  useEffect(() => {
    const loadData = async () => {
      try {
        const [elderlyRes, volunteersRes] = await Promise.all([
          getElderly({ limit: 1000 }),
          getUsers({ role: 'volunteer', limit: 1000 }),
        ])

        if (elderlyRes.success && elderlyRes.data) {
          setElderly(elderlyRes.data.users)
        }

        if (volunteersRes.success && volunteersRes.data) {
          setVolunteers(volunteersRes.data.users)
        }
      } catch (err) {
        console.error('Error loading data:', err)
      }
    }
    loadData()
  }, [])

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setFormData(prev => ({
      ...prev,
      scheduledDate: tomorrow.toISOString().split('T')[0],
    }))
  }, [])

  // Auto-generate title based on type
  useEffect(() => {
    if (formData.type && !formData.title) {
      setFormData(prev => ({
        ...prev,
        title: FOLLOW_UP_TYPES[prev.type] || '',
      }))
    }
  }, [formData.type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.elderlyId || !formData.title || !formData.scheduledDate) {
        throw new Error('Elder, title, and scheduled date are required')
      }

      const scheduledDate = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)

      const result = await createFollowUp({
        elderlyId: formData.elderlyId,
        assigneeId: formData.assigneeId || undefined,
        type: formData.type,
        title: formData.title,
        description: formData.description || undefined,
        scheduledDate: scheduledDate.toISOString(),
        notes: formData.notes || undefined,
      })

      if (result.success) {
        router.push('/dashboard/followups')
      } else {
        setError(result.error || 'Failed to schedule follow-up')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (value: string) => {
    const typedValue = value as keyof typeof FOLLOW_UP_TYPES
    setFormData(prev => ({
      ...prev,
      type: typedValue,
      title: FOLLOW_UP_TYPES[typedValue] || prev.title,
    }))
  }

  return (
    <DashboardLayout
      title="Schedule Follow-up"
      subtitle="Schedule a new follow-up visit for an elder"
    >
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              New Follow-up
            </CardTitle>
            <CardDescription>
              Schedule a follow-up visit for an elder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}

              {/* Elder Selection */}
              <div className="space-y-2">
                <Label htmlFor="elderlyId">Elder *</Label>
                <Select
                  value={formData.elderlyId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, elderlyId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an elder" />
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

              {/* Type and Assignee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Follow-up Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={handleTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FOLLOW_UP_TYPES).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigneeId">Assign To</Label>
                  <Select
                    value={formData.assigneeId || 'unassigned'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value === 'unassigned' ? '' : value }))}
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

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter follow-up title"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this follow-up"
                  rows={2}
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Date *</Label>
                  <DateInput
                    id="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Time *</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes..."
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !formData.elderlyId}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Schedule Follow-up
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
