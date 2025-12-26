// User roles for Vayo Aarogya RBAC
export type UserRole = 'super_admin' | 'professional' | 'volunteer' | 'family' | 'elderly'

// Permission types for elderly care platform
export type Permission =
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'assessments:read'
  | 'assessments:create'
  | 'assessments:update'
  | 'assessments:delete'
  | 'elderly:read'
  | 'elderly:create'
  | 'elderly:update'
  | 'elderly:delete'
  | 'elderly:assign'
  | 'interventions:read'
  | 'interventions:create'
  | 'interventions:update'
  | 'reports:read'
  | 'reports:export'
  | 'settings:read'
  | 'settings:update'

// Role permissions mapping
export const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    'users:read', 'users:create', 'users:update', 'users:delete',
    'assessments:read', 'assessments:create', 'assessments:update', 'assessments:delete',
    'elderly:read', 'elderly:create', 'elderly:update', 'elderly:delete', 'elderly:assign',
    'interventions:read', 'interventions:create', 'interventions:update',
    'reports:read', 'reports:export',
    'settings:read', 'settings:update',
  ],
  professional: [
    'users:read',
    'assessments:read', 'assessments:create', 'assessments:update',
    'elderly:read', 'elderly:create', 'elderly:update', 'elderly:assign',
    'interventions:read', 'interventions:create', 'interventions:update',
    'reports:read', 'reports:export',
  ],
  volunteer: [
    'assessments:read', 'assessments:create', 'assessments:update',
    'elderly:read', 'elderly:create', 'elderly:update',
    'interventions:read',
  ],
  family: [
    'assessments:read',
    'assessments:create',
    'assessments:update',
    'elderly:read',
    'elderly:create',
    'elderly:update',
    'interventions:read',
  ],
  elderly: [
    'assessments:read',
    'assessments:create',
    'assessments:update',
    'interventions:read',
  ],
}

// User interface for database
export interface User {
  id: string
  email: string
  password: string // hashed
  name: string
  phone?: string
  role: UserRole
  avatar?: string
  createdAt: string
  updatedAt: string
  lastLogin?: string
  isActive: boolean
  emailVerified: boolean
  // Elderly-specific fields
  vayoId?: string // Auto-generated VA00001, VA00002, etc.
  age?: number
  gender?: 'male' | 'female' | 'other'
  address?: string
  emergencyContact?: string
  dateOfBirth?: string
  // Location fields
  stateName?: string
  districtName?: string
  talukName?: string
  villageName?: string
  // Caregiver details
  caregiverName?: string
  caregiverPhone?: string
  caregiverRelation?: string
  // Relationships
  assignedVolunteer?: string
  assignedFamily?: string
  // Volunteer-specific fields
  assignedElderly?: string[]
  // Family-specific fields
  familyElders?: string[]
  maxAssignments?: number
}

// Location interface
export interface Location {
  id: string
  type: 'state' | 'district' | 'taluk' | 'village'
  name: string
  parentId?: string
  parent?: { id: string; name: string; type: string }
  children?: { id: string; name: string; type: string }[]
  createdAt: string
}

// Risk level type
export type RiskLevel = 'healthy' | 'at_risk' | 'intervention'

// Assessment status type
export type AssessmentStatus = 'draft' | 'completed'

// Assessment interface
export interface Assessment {
  id: string
  subjectId: string
  assessorId: string
  assessedAt: string
  status: AssessmentStatus
  currentStep?: number
  overallRisk: RiskLevel
  cumulativeScore?: number
  notes?: string
  domainScores?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  // Relations
  subject?: { id: string; name: string; vayoId?: string }
  assessor?: { id: string; name: string; role: string }
  domains?: AssessmentDomain[]
  interventions?: Intervention[]
  // Computed properties for frontend
  totalScore?: number
  domainsHealthy?: number
  domainsAtRisk?: number
  domainsIntervention?: number
}

// Assessment domain interface
export interface AssessmentDomain {
  id: string
  assessmentId: string
  domain: string
  riskLevel: RiskLevel
  score?: number
  answers?: Record<string, unknown>
  notes?: string
  createdAt: string
}

// Intervention interface
export interface Intervention {
  id: string
  userId: string
  assessmentId?: string
  assigneeId?: string
  title: string
  description?: string
  domain: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  dueDate?: string
  completedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
  // Relations
  user?: { id: string; name: string; vayoId?: string }
  assessment?: { id: string; overallRisk: RiskLevel }
  assignee?: { id: string; name: string; role: string }
}

// Follow-up interface
export interface FollowUp {
  id: string
  elderlyId: string
  assigneeId?: string
  type: 'routine' | 'assessment' | 'intervention' | 'medication' | 'other'
  title: string
  description?: string
  scheduledDate: string
  completedDate?: string
  status: 'scheduled' | 'completed' | 'missed' | 'rescheduled' | 'cancelled'
  assessmentId?: string
  notes?: string
  createdAt: string
  updatedAt: string
  elderly?: { id: string; name: string; vayoId?: string; phone?: string }
  assignee?: { id: string; name: string; role: string; phone?: string }
}

// User without password for API responses
export type SafeUser = Omit<User, 'password'>

// JWT Payload
export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  type: 'access' | 'refresh'
  iat?: number
  exp?: number
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Auth API types
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  user: SafeUser
  accessToken: string
  refreshToken: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  phone?: string
  role?: UserRole
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}
