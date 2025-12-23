import type { Intervention, ApiResponse, RiskLevel } from '@/types'

// Intervention list response type
export interface InterventionListResponse {
  interventions: Intervention[]
  total: number
  page: number
  limit: number
}

// Intervention create/update data
export interface InterventionFormData {
  userId: string
  assessmentId?: string
  title: string
  description?: string
  domain: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  dueDate?: string
  notes?: string
}

// Filter options for intervention list
export interface InterventionFilters {
  userId?: string
  assessmentId?: string
  domain?: string
  priority?: string
  status?: string
  page?: number
  limit?: number
}

// API base URL
const API_BASE = '/api/interventions'

// Get all interventions with filters
export async function getInterventions(
  filters?: InterventionFilters
): Promise<ApiResponse<InterventionListResponse>> {
  const params = new URLSearchParams()

  if (filters?.userId) params.append('userId', filters.userId)
  if (filters?.assessmentId) params.append('assessmentId', filters.assessmentId)
  if (filters?.domain) params.append('domain', filters.domain)
  if (filters?.priority) params.append('priority', filters.priority)
  if (filters?.status) params.append('status', filters.status)
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

// Get single intervention by ID
export async function getInterventionById(
  id: string
): Promise<ApiResponse<Intervention>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  return response.json()
}

// Get interventions for a specific elderly
export async function getElderlyInterventions(
  elderlyId: string
): Promise<ApiResponse<InterventionListResponse>> {
  return getInterventions({ userId: elderlyId, limit: 100 })
}

// Get interventions by assessment
export async function getAssessmentInterventions(
  assessmentId: string
): Promise<ApiResponse<InterventionListResponse>> {
  return getInterventions({ assessmentId, limit: 100 })
}

// Create new intervention
export async function createIntervention(
  data: InterventionFormData
): Promise<ApiResponse<Intervention>> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  return response.json()
}

// Update intervention
export async function updateIntervention(
  id: string,
  data: Partial<InterventionFormData>
): Promise<ApiResponse<Intervention>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  return response.json()
}

// Delete intervention
export async function deleteIntervention(id: string): Promise<ApiResponse<null>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  return response.json()
}

// Mark intervention as complete
export async function completeIntervention(
  id: string,
  notes?: string
): Promise<ApiResponse<Intervention>> {
  return updateIntervention(id, {
    status: 'completed',
    notes,
  })
}

// Bulk create interventions from assessment
export async function createInterventionsFromAssessment(
  interventions: InterventionFormData[]
): Promise<ApiResponse<Intervention[]>> {
  const results: Intervention[] = []

  for (const intervention of interventions) {
    const result = await createIntervention(intervention)
    if (result.success && result.data) {
      results.push(result.data)
    }
  }

  return {
    success: true,
    data: results,
  }
}

// Get intervention statistics
export interface InterventionStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
  byPriority: {
    urgent: number
    high: number
    medium: number
    low: number
  }
  byDomain: Record<string, number>
}

export async function getInterventionStats(): Promise<ApiResponse<InterventionStats>> {
  try {
    const result = await getInterventions({ limit: 1000 })

    if (!result.success || !result.data) {
      return { success: false, error: 'Failed to fetch interventions' }
    }

    const interventions = result.data.interventions
    const now = new Date()

    const stats: InterventionStats = {
      total: interventions.length,
      pending: interventions.filter(i => i.status === 'pending').length,
      inProgress: interventions.filter(i => i.status === 'in_progress').length,
      completed: interventions.filter(i => i.status === 'completed').length,
      overdue: interventions.filter(
        i =>
          i.status !== 'completed' &&
          i.status !== 'cancelled' &&
          i.dueDate &&
          new Date(i.dueDate) < now
      ).length,
      byPriority: {
        urgent: interventions.filter(i => i.priority === 'urgent').length,
        high: interventions.filter(i => i.priority === 'high').length,
        medium: interventions.filter(i => i.priority === 'medium').length,
        low: interventions.filter(i => i.priority === 'low').length,
      },
      byDomain: {},
    }

    // Count by domain
    for (const intervention of interventions) {
      if (intervention.domain) {
        stats.byDomain[intervention.domain] =
          (stats.byDomain[intervention.domain] || 0) + 1
      }
    }

    return { success: true, data: stats }
  } catch (error) {
    return { success: false, error: 'Failed to calculate statistics' }
  }
}

// Domain names for display
export const DOMAIN_NAMES: Record<string, string> = {
  cognition: 'Cognition',
  depression: 'Depression',
  mobility: 'Mobility',
  vision: 'Vision',
  hearing: 'Hearing',
  falls: 'Falls Risk',
  sleep: 'Sleep',
  nutrition: 'Appetite/Nutrition',
  weight: 'Weight Management',
  incontinence: 'Incontinence',
  social: 'Social Engagement',
  loneliness: 'Loneliness',
  iadl: 'Instrumental Activities',
  adl: 'Basic Activities',
  diabetes: 'Diabetes Management',
  hypertension: 'Hypertension Management',
  substance: 'Substance Use',
  healthcare: 'Healthcare Access',
  oral: 'Oral Health',
  pain: 'Pain Management',
  general: 'General',
}

// Priority colors
export const PRIORITY_COLORS = {
  urgent: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  low: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
}

// Status colors
export const STATUS_COLORS = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
}
