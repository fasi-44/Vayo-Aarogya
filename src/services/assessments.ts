import { apiClient } from '@/lib/api-client'
import type { Assessment, AssessmentDomain, ApiResponse, RiskLevel, AssessmentStatus } from '@/types'

// Assessment list response type
export interface AssessmentListResponse {
  assessments: Assessment[]
  total: number
  page: number
  limit: number
}

// Draft list response type
export interface DraftListResponse {
  drafts: Assessment[]
  total: number
}

// Assessment create data
export interface AssessmentFormData {
  subjectId: string
  assessedAt?: string
  overallRisk: RiskLevel
  status?: AssessmentStatus
  currentStep?: number
  notes?: string
  domainScores?: Record<string, unknown>
  domains?: {
    domain: string
    riskLevel: RiskLevel
    score?: number
    answers?: Record<string, unknown>
    notes?: string
  }[]
}

// Filter options for assessment list
export interface AssessmentFilters {
  subjectId?: string
  assessorId?: string
  overallRisk?: RiskLevel
  status?: AssessmentStatus
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

// API base URL
const API_BASE = '/api/assessments'

// Get all assessments with filters
export async function getAssessments(filters?: AssessmentFilters): Promise<ApiResponse<AssessmentListResponse>> {
  const params = new URLSearchParams()

  if (filters?.subjectId) params.append('subjectId', filters.subjectId)
  if (filters?.assessorId) params.append('assessorId', filters.assessorId)
  if (filters?.overallRisk) params.append('overallRisk', filters.overallRisk)
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

// Get all draft assessments for the current user
export async function getDraftAssessments(): Promise<ApiResponse<DraftListResponse>> {
  const response = await fetch(`${API_BASE}/drafts`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  return response.json()
}

// Check for existing draft for a specific elderly
export async function checkExistingDraft(elderlyId: string): Promise<ApiResponse<Assessment | null>> {
  const response = await fetch(`${API_BASE}/drafts?subjectId=${elderlyId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  const result = await response.json()
  if (result.success && result.data?.drafts?.length > 0) {
    // Return the first draft for this elderly
    return { success: true, data: result.data.drafts[0] }
  }
  return { success: true, data: null }
}

// Save assessment as draft
export async function saveDraft(data: Omit<AssessmentFormData, 'overallRisk'> & { overallRisk?: RiskLevel }): Promise<ApiResponse<Assessment>> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      ...data,
      status: 'draft',
      overallRisk: data.overallRisk || 'healthy',
    }),
  })

  return response.json()
}

// Update an existing draft
export async function updateDraft(id: string, data: Partial<AssessmentFormData>): Promise<ApiResponse<Assessment>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      ...data,
      status: 'draft',
    }),
  })

  return response.json()
}

// Complete a draft assessment (convert from draft to completed)
export async function completeDraft(id: string, data: AssessmentFormData): Promise<ApiResponse<Assessment>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      ...data,
      status: 'completed',
    }),
  })

  return response.json()
}

// Get single assessment by ID
export async function getAssessmentById(id: string): Promise<ApiResponse<Assessment>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  return response.json()
}

// Get assessments for a specific elderly
export async function getElderlyAssessments(elderlyId: string): Promise<ApiResponse<AssessmentListResponse>> {
  return getAssessments({ subjectId: elderlyId, limit: 100 })
}

// Get latest assessment for an elderly
export async function getLatestAssessment(elderlyId: string): Promise<ApiResponse<Assessment | null>> {
  const result = await getAssessments({ subjectId: elderlyId, limit: 1 })
  if (result.success && result.data?.assessments.length) {
    return { success: true, data: result.data.assessments[0] }
  }
  return { success: true, data: null }
}

// Create new assessment
export async function createAssessment(data: AssessmentFormData): Promise<ApiResponse<Assessment>> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  return response.json()
}

// Update assessment
export async function updateAssessment(id: string, data: Partial<AssessmentFormData>): Promise<ApiResponse<Assessment>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  return response.json()
}

// Delete assessment
export async function deleteAssessment(id: string): Promise<ApiResponse<null>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  return response.json()
}

// Get assessment comparison between two assessments
export async function compareAssessments(
  assessmentId1: string,
  assessmentId2: string
): Promise<ApiResponse<{ previous: Assessment; current: Assessment; comparison: DomainComparison[] }>> {
  const [result1, result2] = await Promise.all([
    getAssessmentById(assessmentId1),
    getAssessmentById(assessmentId2),
  ])

  if (!result1.success || !result1.data || !result2.success || !result2.data) {
    return { success: false, error: 'Failed to fetch assessments for comparison' }
  }

  const previous = result1.data
  const current = result2.data

  const comparison = compareAssessmentDomains(previous, current)

  return {
    success: true,
    data: { previous, current, comparison },
  }
}

// Domain comparison result
export interface DomainComparison {
  domain: string
  domainName: string
  previousScore?: number
  currentScore?: number
  previousRisk?: RiskLevel
  currentRisk?: RiskLevel
  trend: 'improved' | 'declined' | 'same' | 'new'
  change: number
}

// Compare domains between two assessments
function compareAssessmentDomains(previous: Assessment, current: Assessment): DomainComparison[] {
  const comparisons: DomainComparison[] = []
  const domainNames: Record<string, string> = {
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
  }

  const previousDomains = new Map(
    (previous.domains || []).map(d => [d.domain, d])
  )
  const currentDomains = new Map(
    (current.domains || []).map(d => [d.domain, d])
  )

  // Get all unique domains
  const allDomains = new Set([
    ...Array.from(previousDomains.keys()),
    ...Array.from(currentDomains.keys()),
  ])

  for (const domain of Array.from(allDomains)) {
    const prevDomain = previousDomains.get(domain)
    const currDomain = currentDomains.get(domain)

    const prevScore = prevDomain?.score ?? 0
    const currScore = currDomain?.score ?? 0
    const change = currScore - prevScore

    let trend: DomainComparison['trend'] = 'same'
    if (!prevDomain && currDomain) {
      trend = 'new'
    } else if (change < 0) {
      trend = 'improved' // Lower score = better
    } else if (change > 0) {
      trend = 'declined'
    }

    comparisons.push({
      domain,
      domainName: domainNames[domain] || domain,
      previousScore: prevDomain?.score,
      currentScore: currDomain?.score,
      previousRisk: prevDomain?.riskLevel,
      currentRisk: currDomain?.riskLevel,
      trend,
      change,
    })
  }

  return comparisons
}

// Get assessment statistics for dashboard
export interface AssessmentStats {
  total: number
  thisMonth: number
  riskDistribution: {
    healthy: number
    at_risk: number
    intervention: number
  }
  averageScore: number
}

export async function getAssessmentStats(): Promise<ApiResponse<AssessmentStats>> {
  try {
    const result = await getAssessments({ limit: 1000 })

    if (!result.success || !result.data) {
      return { success: false, error: 'Failed to fetch assessments' }
    }

    const assessments = result.data.assessments
    const total = assessments.length

    // This month's assessments
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonth = assessments.filter(
      a => new Date(a.assessedAt) >= startOfMonth
    ).length

    // Risk distribution
    const riskDistribution = {
      healthy: assessments.filter(a => a.overallRisk === 'healthy').length,
      at_risk: assessments.filter(a => a.overallRisk === 'at_risk').length,
      intervention: assessments.filter(a => a.overallRisk === 'intervention').length,
    }

    return {
      success: true,
      data: {
        total,
        thisMonth,
        riskDistribution,
        averageScore: 0, // Would need domain scores to calculate
      },
    }
  } catch (error) {
    return { success: false, error: 'Failed to calculate statistics' }
  }
}
