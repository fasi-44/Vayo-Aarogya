import { type ApiResponse, type SafeUser } from '@/types'

// Elderly list response type
export interface ElderlyListResponse {
  users: SafeUser[]
  total: number
  page: number
  limit: number
}

// Elderly create/update data
export interface ElderlyFormData {
  email: string
  password?: string
  name: string
  phone?: string
  isActive?: boolean
  // Elderly-specific fields
  age?: number
  gender?: 'male' | 'female' | 'other'
  address?: string
  pincode?: string
  emergencyContact?: string
  dateOfBirth?: string
  assignedVolunteer?: string
  assignedProfessional?: string
  assignedFamily?: string
  // Location fields
  stateName?: string
  districtName?: string
  talukName?: string
  villageName?: string
  // Caregiver fields
  caregiverName?: string
  caregiverPhone?: string
  caregiverRelation?: string
  caregiverRelationOther?: string
  // Support requirements
  needsFinancialAssistance?: boolean
  needsLegalSupport?: boolean
}

// Filter options for elderly list
export interface ElderlyFilters {
  search?: string
  isActive?: boolean
  assignedVolunteer?: string
  hasVolunteer?: boolean
  ageMin?: number
  ageMax?: number
  gender?: string
  page?: number
  limit?: number
}

// Elderly stats
export interface ElderlyStats {
  total: number
  active: number
  inactive: number
  withVolunteer: number
  withoutVolunteer: number
  averageAge: number
  genderDistribution: {
    male: number
    female: number
    other: number
  }
}

// API base URL
const API_BASE = '/api/users'

// Get all elderly with filters
export async function getElderly(filters?: ElderlyFilters): Promise<ApiResponse<ElderlyListResponse>> {
  const params = new URLSearchParams()

  // Always filter by elderly role
  params.append('role', 'elderly')

  if (filters?.search) params.append('search', filters.search)
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive))
  if (filters?.assignedVolunteer) params.append('assignedVolunteer', filters.assignedVolunteer)
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

// Get single elderly by ID
export async function getElderlyById(id: string): Promise<ApiResponse<SafeUser>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  return response.json()
}

// Create new elderly
export async function createElderly(data: ElderlyFormData): Promise<ApiResponse<SafeUser>> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      ...data,
      role: 'elderly', // Always set role to elderly
    }),
  })

  return response.json()
}

// Update elderly
export async function updateElderly(id: string, data: Partial<ElderlyFormData>): Promise<ApiResponse<SafeUser>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  return response.json()
}

// Delete (deactivate) elderly
export async function deleteElderly(id: string): Promise<ApiResponse<null>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  return response.json()
}

// Get elderly assigned to a specific volunteer
export async function getElderlyByVolunteer(volunteerId: string): Promise<ApiResponse<ElderlyListResponse>> {
  return getElderly({ assignedVolunteer: volunteerId, limit: 100 })
}

// Get unassigned elderly (no volunteer)
export async function getUnassignedElderly(): Promise<ApiResponse<ElderlyListResponse>> {
  return getElderly({ hasVolunteer: false, isActive: true, limit: 100 })
}

// Assign volunteer to elderly
export async function assignVolunteer(elderlyId: string, volunteerId: string | null): Promise<ApiResponse<SafeUser>> {
  return updateElderly(elderlyId, { assignedVolunteer: volunteerId || undefined })
}

// Get elderly statistics
export async function getElderlyStats(): Promise<ApiResponse<ElderlyStats>> {
  // For now, we'll calculate stats from the list
  // In production, this should be a dedicated API endpoint
  try {
    const result = await getElderly({ limit: 1000 })

    if (!result.success || !result.data) {
      return { success: false, error: 'Failed to fetch elderly data' }
    }

    const elderly = result.data.users
    const total = elderly.length
    const active = elderly.filter(e => e.isActive).length
    const withVolunteer = elderly.filter(e => e.assignedVolunteer).length

    const ages = elderly.filter(e => e.age).map(e => e.age as number)
    const averageAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0

    const genderDistribution = {
      male: elderly.filter(e => e.gender === 'male').length,
      female: elderly.filter(e => e.gender === 'female').length,
      other: elderly.filter(e => e.gender === 'other').length,
    }

    return {
      success: true,
      data: {
        total,
        active,
        inactive: total - active,
        withVolunteer,
        withoutVolunteer: total - withVolunteer,
        averageAge,
        genderDistribution,
      },
    }
  } catch (error) {
    return { success: false, error: 'Failed to calculate statistics' }
  }
}
