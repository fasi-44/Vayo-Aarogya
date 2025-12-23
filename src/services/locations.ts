import type { ApiResponse } from '@/types'

export interface LocationOption {
  id: string
  name: string
  type?: string
  parentId?: string | null
}

export interface LocationFilters {
  type?: string
  parentId?: string | null
}

// Named export for getLocations
export async function getLocations(type: string, parentId?: string): Promise<ApiResponse<LocationOption[]>> {
  try {
    const params = new URLSearchParams()
    params.set('type', type)
    if (parentId) {
      params.set('parentId', parentId)
    }

    const response = await fetch(`/api/locations?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data = await response.json()
    return {
      success: true,
      data: data.data || [],
    }
  } catch (error) {
    console.error('Error fetching locations:', error)
    return {
      success: false,
      error: 'Failed to fetch locations',
      data: [],
    }
  }
}

export const locationsService = {
  async getLocations(filters?: LocationFilters): Promise<LocationOption[]> {
    const params = new URLSearchParams()
    if (filters?.type) params.set('type', filters.type)
    if (filters?.parentId !== undefined) {
      params.set('parentId', filters.parentId === null ? 'null' : filters.parentId)
    }

    const query = params.toString()
    const response = await fetch(`/api/locations${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data = await response.json()
    return data.data || []
  },

  async getStates(): Promise<LocationOption[]> {
    return this.getLocations({ type: 'state', parentId: null })
  },

  async getDistricts(stateId: string): Promise<LocationOption[]> {
    return this.getLocations({ type: 'district', parentId: stateId })
  },

  async getTaluks(districtId: string): Promise<LocationOption[]> {
    return this.getLocations({ type: 'taluk', parentId: districtId })
  },

  async getVillages(talukId: string): Promise<LocationOption[]> {
    return this.getLocations({ type: 'village', parentId: talukId })
  },

  async createLocation(data: {
    type: string
    name: string
    parentId?: string
  }): Promise<LocationOption> {
    const response = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    const result = await response.json()
    if (!result.data) {
      throw new Error('Failed to create location')
    }
    return result.data
  },

  async deleteLocation(id: string): Promise<void> {
    await fetch(`/api/locations/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
  },
}
