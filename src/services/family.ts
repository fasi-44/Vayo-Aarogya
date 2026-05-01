import { type ApiResponse, type SafeUser } from '@/types'

export interface ActiveElderResponse {
  activeElder: SafeUser | null
}

export async function getActiveElder(): Promise<ApiResponse<ActiveElderResponse>> {
  const response = await fetch('/api/family/active-elder', {
    method: 'GET',
    credentials: 'include',
  })
  return response.json()
}

export async function setActiveElder(elderId: string): Promise<ApiResponse<ActiveElderResponse>> {
  const response = await fetch('/api/family/active-elder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ elderId }),
  })
  return response.json()
}

export async function clearActiveElder(): Promise<ApiResponse<ActiveElderResponse>> {
  const response = await fetch('/api/family/active-elder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ elderId: null }),
  })
  return response.json()
}
