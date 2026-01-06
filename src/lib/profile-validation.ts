import { type SafeUser } from '@/types'

export interface ProfileCompleteness {
  isComplete: boolean
  missingFields: string[]
  completionPercentage: number
}

export function checkProfileCompleteness(user: SafeUser): ProfileCompleteness {
  const requiredFields: (keyof SafeUser)[] = [
    'name',
    'email',
    'age',
    'gender',
    'address',
    'pincode',
  ]

  const recommendedFields: (keyof SafeUser)[] = [
    'dateOfBirth',
    'emergencyContact',
    'stateName',
    'districtName',
    'talukName',
    'villageName',
    'caregiverName',
    'caregiverPhone',
    'caregiverRelation',
  ]

  const allFieldsToCheck = [...requiredFields, ...recommendedFields]
  const missingFields: string[] = []

  // Check required fields
  for (const field of requiredFields) {
    const value = user[field]
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(formatFieldName(field))
    }
  }

  // Calculate completion based on recommended fields
  let completedRecommended = 0
  for (const field of recommendedFields) {
    const value = user[field]
    if (value && (typeof value !== 'string' || value.trim() !== '')) {
      completedRecommended++
    }
  }

  const completedRequired = requiredFields.length - missingFields.length
  const totalPossible = allFieldsToCheck.length
  const completionPercentage = Math.round(
    ((completedRequired + completedRecommended) / totalPossible) * 100
  )

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completionPercentage,
  }
}

export function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim()
}

export function getDaysOldProfile(createdAt: Date | string): number {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - created.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function isProfileOverOneWeekOld(createdAt: Date | string): boolean {
  return getDaysOldProfile(createdAt) > 7
}
