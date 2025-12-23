import type { FollowUp, ApiResponse } from '@/types'

// Follow-up list response type
export interface FollowUpListResponse {
  followUps: FollowUp[]
  total: number
  page: number
  limit: number
}

// Follow-up create/update data
export interface FollowUpFormData {
  elderlyId: string
  assigneeId?: string
  type: 'routine' | 'assessment' | 'intervention' | 'medication' | 'other'
  title: string
  description?: string
  scheduledDate: string
  status?: 'scheduled' | 'completed' | 'missed' | 'rescheduled' | 'cancelled'
  assessmentId?: string
  notes?: string
}

// Filter options for follow-up list
export interface FollowUpFilters {
  elderlyId?: string
  assigneeId?: string
  type?: string
  status?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

// API base URL
const API_BASE = '/api/followups'

// Get all follow-ups with filters
export async function getFollowUps(
  filters?: FollowUpFilters
): Promise<ApiResponse<FollowUpListResponse>> {
  const params = new URLSearchParams()

  if (filters?.elderlyId) params.append('elderlyId', filters.elderlyId)
  if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId)
  if (filters?.type) params.append('type', filters.type)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.limit) params.append('limit', String(filters.limit))

  const url = `${API_BASE}?${params}`

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  return response.json()
}

// Get single follow-up by ID
export async function getFollowUpById(
  id: string
): Promise<ApiResponse<FollowUp>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  return response.json()
}

// Get follow-ups for a specific elderly
export async function getElderlyFollowUps(
  elderlyId: string
): Promise<ApiResponse<FollowUpListResponse>> {
  return getFollowUps({ elderlyId, limit: 100 })
}

// Get upcoming follow-ups
export async function getUpcomingFollowUps(
  days: number = 7
): Promise<ApiResponse<FollowUpListResponse>> {
  const startDate = new Date().toISOString().split('T')[0]
  const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  return getFollowUps({
    startDate,
    endDate,
    status: 'scheduled',
    limit: 100,
  })
}

// Get overdue follow-ups
export async function getOverdueFollowUps(): Promise<
  ApiResponse<FollowUpListResponse>
> {
  const endDate = new Date().toISOString().split('T')[0]

  return getFollowUps({
    endDate,
    status: 'scheduled',
    limit: 100,
  })
}

// Create new follow-up
export async function createFollowUp(
  data: FollowUpFormData
): Promise<ApiResponse<FollowUp>> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  return response.json()
}

// Update follow-up
export async function updateFollowUp(
  id: string,
  data: Partial<FollowUpFormData>
): Promise<ApiResponse<FollowUp>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  return response.json()
}

// Delete follow-up
export async function deleteFollowUp(id: string): Promise<ApiResponse<null>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  return response.json()
}

// Mark follow-up as complete
export async function completeFollowUp(
  id: string,
  notes?: string,
  assessmentId?: string
): Promise<ApiResponse<FollowUp>> {
  return updateFollowUp(id, {
    status: 'completed',
    notes,
    assessmentId,
  })
}

// Reschedule follow-up
export async function rescheduleFollowUp(
  id: string,
  newDate: string,
  notes?: string
): Promise<ApiResponse<FollowUp>> {
  return updateFollowUp(id, {
    scheduledDate: newDate,
    status: 'rescheduled',
    notes,
  })
}

// Get follow-up statistics
export interface FollowUpStats {
  total: number
  scheduled: number
  completed: number
  missed: number
  overdue: number
  upcoming7Days: number
  byType: Record<string, number>
}

export async function getFollowUpStats(): Promise<ApiResponse<FollowUpStats>> {
  try {
    const result = await getFollowUps({ limit: 1000 })

    if (!result.success || !result.data) {
      return { success: false, error: 'Failed to fetch follow-ups' }
    }

    const followUps = result.data.followUps
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const stats: FollowUpStats = {
      total: followUps.length,
      scheduled: followUps.filter((f) => f.status === 'scheduled').length,
      completed: followUps.filter((f) => f.status === 'completed').length,
      missed: followUps.filter((f) => f.status === 'missed').length,
      overdue: followUps.filter(
        (f) =>
          f.status === 'scheduled' && new Date(f.scheduledDate) < now
      ).length,
      upcoming7Days: followUps.filter(
        (f) =>
          f.status === 'scheduled' &&
          new Date(f.scheduledDate) >= now &&
          new Date(f.scheduledDate) <= sevenDaysLater
      ).length,
      byType: {},
    }

    // Count by type
    for (const followUp of followUps) {
      stats.byType[followUp.type] = (stats.byType[followUp.type] || 0) + 1
    }

    return { success: true, data: stats }
  } catch (error) {
    return { success: false, error: 'Failed to calculate statistics' }
  }
}

// Follow-up type labels
export const FOLLOW_UP_TYPES = {
  routine: 'Routine Check',
  assessment: 'Assessment',
  intervention: 'Intervention',
  medication: 'Medication Review',
  other: 'Other',
}

// Status colors
export const FOLLOW_UP_STATUS_COLORS = {
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  missed: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  rescheduled: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
}
