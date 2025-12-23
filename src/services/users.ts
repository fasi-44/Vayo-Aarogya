import { type ApiResponse, type SafeUser, type UserRole } from '@/types'

// User list response type
export interface UsersListResponse {
  users: SafeUser[]
  total: number
  page: number
  limit: number
}

// User create/update data
export interface UserFormData {
  email: string
  password?: string
  name: string
  phone?: string
  role: UserRole
  isActive?: boolean
  // Elderly fields
  age?: number
  gender?: 'male' | 'female' | 'other'
  address?: string
  emergencyContact?: string
  dateOfBirth?: string
  assignedVolunteer?: string
  // Volunteer fields
  maxAssignments?: number
}

// Filter options for user list
export interface UserFilters {
  role?: string
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

// API base URL
const API_BASE = '/api/users'

// Get all users with filters
export async function getUsers(filters?: UserFilters): Promise<ApiResponse<UsersListResponse>> {
  const params = new URLSearchParams()

  if (filters?.role) params.append('role', filters.role)
  if (filters?.search) params.append('search', filters.search)
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive))
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.limit) params.append('limit', String(filters.limit))

  const url = params.toString() ? `${API_BASE}?${params}` : API_BASE

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  return response.json()
}

// Get single user by ID
export async function getUserById(id: string): Promise<ApiResponse<SafeUser>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  return response.json()
}

// Create new user
export async function createUser(data: UserFormData): Promise<ApiResponse<SafeUser>> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  return response.json()
}

// Update user
export async function updateUser(id: string, data: Partial<UserFormData>): Promise<ApiResponse<SafeUser>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  return response.json()
}

// Delete (deactivate) user
export async function deleteUser(id: string): Promise<ApiResponse<null>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  return response.json()
}

// Get users by role
export async function getUsersByRole(role: UserRole): Promise<ApiResponse<UsersListResponse>> {
  return getUsers({ role, limit: 100 })
}

// Get volunteers (for assignment dropdown)
export async function getVolunteers(): Promise<ApiResponse<UsersListResponse>> {
  return getUsers({ role: 'volunteer', isActive: true, limit: 100 })
}

// Get elderly users
export async function getElderlyUsers(): Promise<ApiResponse<UsersListResponse>> {
  return getUsers({ role: 'elderly', isActive: true, limit: 100 })
}

// Get family members (caregivers)
export async function getFamilyMembers(): Promise<ApiResponse<UsersListResponse>> {
  return getUsers({ role: 'family', isActive: true, limit: 100 })
}

// Get elders for logged-in family member
export async function getFamilyElders(): Promise<ApiResponse<SafeUser[]>> {
  const response = await fetch('/api/family/elders', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  return response.json()
}
