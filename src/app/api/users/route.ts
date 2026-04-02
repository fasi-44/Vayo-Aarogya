import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, validatePassword, validatePhone } from '@/lib/auth'
import { type ApiResponse, type SafeUser, type UserRole, rolePermissions } from '@/types'

// Helper to get user from request headers (set by middleware)
function getUserFromHeaders(request: NextRequest) {
  return {
    userId: request.headers.get('x-user-id'),
    phone: request.headers.get('x-user-phone'),
    role: request.headers.get('x-user-role') as UserRole | null,
  }
}

// Helper to check permission
function hasPermission(role: UserRole | null, permission: string): boolean {
  if (!role) return false
  const permissions = rolePermissions[role] || []
  return permissions.includes(permission as never)
}

// GET /api/users - List all users (with pagination and filters)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ users: SafeUser[]; total: number; page: number; limit: number }>>> {
  try {
    const user = getUserFromHeaders(request)
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || undefined

    // Check permissions based on requested role filter
    // - 'elderly:read' allows reading elderly, volunteer, professional, and family users
    //   (needed for elderly management: viewing care team, assignments, etc.)
    // - 'users:read' allows reading all users (admin/professional)
    const canReadElderly = hasPermission(user.role, 'elderly:read')
    const canReadUsers = hasPermission(user.role, 'users:read')

    // Roles that elderly:read holders can access (for care team management)
    const elderlyRelatedRoles = ['elderly', 'volunteer', 'professional', 'family']

    if (!canReadUsers) {
      if (!canReadElderly || (role && !elderlyRelatedRoles.includes(role))) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    const search = searchParams.get('search') || undefined
    const isActive = searchParams.get('isActive')
    const approvalStatus = searchParams.get('approvalStatus') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 1000) // Max 1000 per page

    // Build filter options
    const filterOptions: {
      role?: string
      search?: string
      page: number
      limit: number
      isActive?: boolean
      approvalStatus?: string
      assignedVolunteerId?: string
      assignedProfessionalId?: string
      assignedFamilyId?: string
    } = {
      role,
      search,
      page,
      limit,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      approvalStatus,
    }

    // Volunteers can only see elderly assigned to them
    if (user.role === 'volunteer' && role === 'elderly' && user.userId) {
      filterOptions.assignedVolunteerId = user.userId
    }

    // Professionals can see all elderly (they have users:read permission)
    // No filtering needed for professionals

    // Family members can only see elderly assigned to them
    if (user.role === 'family' && role === 'elderly' && user.userId) {
      filterOptions.assignedFamilyId = user.userId
    }

    // Use server-side filtering and pagination
    const { users, total } = await db.getAllUsers(filterOptions)

    return NextResponse.json({
      success: true,
      data: {
        users,
        total,
        page,
        limit,
      },
      message: `Found ${total} users`,
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// Role prefix mapping for Vayo ID (non-elderly roles)
const ROLE_PREFIX_MAP: Record<string, string> = {
  family: 'VAFM',
  volunteer: 'VAVL',
  super_admin: 'VAAD',
  professional: 'VAHP',
}

// Helper to generate next Vayo ID for non-elderly roles
async function generateVayoId(role: string): Promise<string> {
  const prefix = ROLE_PREFIX_MAP[role] || 'VAXX'

  const result = await db.getHighestVayoIdByPrefix(prefix)
  let nextNumber = 1

  if (result) {
    const match = result.match(new RegExp(`${prefix}(\\d+)`))
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

// Elderly patient number generation is handled by db.generateElderlyPatientNumber()

// POST /api/users - Create a new user
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<SafeUser>>> {
  try {
    const requestUser = getUserFromHeaders(request)

    // Check permissions - 'users:create' for any user, 'elderly:create' for elderly only
    const canCreateUsers = hasPermission(requestUser.role, 'users:create')
    const canCreateElderly = hasPermission(requestUser.role, 'elderly:create')

    if (!canCreateUsers && !canCreateElderly) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      email,
      password,
      name,
      phone,
      role,
      isActive = true,
      // Elderly-specific fields
      age,
      gender,
      dateOfBirth,
      address,
      pincode,
      emergencyContact,
      // Location fields
      stateName,
      districtName,
      talukName,
      villageName,
      // Caregiver fields
      caregiverName,
      caregiverPhone,
      caregiverRelation,
      caregiverRelationOther,
      // Assignment
      assignedVolunteer,
      assignedFamily,
      // Support requirements
      needsFinancialAssistance,
      needsLegalSupport,
      // Volunteer-specific
      maxAssignments,
      // Elderly category
      category,
    } = body

    // Validate required fields
    if (!phone || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: 'Phone number, password, name, and role are required' },
        { status: 400 }
      )
    }

    // Validate phone format
    if (!validatePhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format. Must be at least 10 digits.' },
        { status: 400 }
      )
    }

    // Validate password (4-digit PIN)
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.errors.join('. ') },
        { status: 400 }
      )
    }

    // Check for duplicate phone numbers
    // For non-elderly roles (admin, professional, volunteer, family): only 1 account per phone+role
    // For elderly: multiple elders can share the same phone (e.g. husband & wife using daughter's phone)
    const normalizedPhone = phone.replace(/[\s\-]/g, '')
    const existingUsers = await db.findUsersByPhone(normalizedPhone)
    if (role !== 'elderly') {
      const existingSameRole = existingUsers.find(u => u.role === role)
      if (existingSameRole) {
        return NextResponse.json(
          { success: false, error: `An account with this phone number already exists for the role: ${role}` },
          { status: 409 }
        )
      }
    }

    // Users with only 'elderly:create' permission can only create elderly
    if (!canCreateUsers && canCreateElderly && role !== 'elderly') {
      return NextResponse.json(
        { success: false, error: 'You can only create elderly records' },
        { status: 403 }
      )
    }

    // Only super_admin can create super_admin or professional users
    if (
      (role === 'super_admin' || role === 'professional') &&
      requestUser.role !== 'super_admin'
    ) {
      return NextResponse.json(
        { success: false, error: 'Only super admins can create admin or professional accounts' },
        { status: 403 }
      )
    }

    // Validate category for elderly
    if (role === 'elderly') {
      if (!category || !['community', 'clinic'].includes(category)) {
        return NextResponse.json(
          { success: false, error: 'Category (community or clinic) is required for elderly users' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate Vayo ID based on role
    // Elderly: YYYYCOM001 / YYYYCLI001 based on category
    // Others: VAFM0001, VAVL0001, etc.
    const vayoId = role === 'elderly'
      ? await db.generateElderlyPatientNumber(category)
      : await generateVayoId(role)

    // Determine assignments
    // If volunteer creates elderly, automatically assign to themselves
    // If family user creates elderly, automatically assign to themselves
    let volunteerAssignment = assignedVolunteer
    let familyAssignment = assignedFamily
    let finalCaregiverName = caregiverName
    let finalCaregiverPhone = caregiverPhone
    let finalCaregiverRelation = caregiverRelation

    if (role === 'elderly' && requestUser.role === 'volunteer' && requestUser.userId) {
      volunteerAssignment = requestUser.userId
    }

    if (role === 'elderly' && requestUser.role === 'family' && requestUser.userId) {
      familyAssignment = requestUser.userId
      // Get family user details for caregiver info if not provided
      if (!caregiverName || !caregiverPhone) {
        const familyUser = await db.findUserById(requestUser.userId)
        if (familyUser) {
          finalCaregiverName = caregiverName || familyUser.name
          finalCaregiverPhone = caregiverPhone || familyUser.phone
          finalCaregiverRelation = caregiverRelation || 'Family Member'
        }
      }
    }

    // Create user with all fields
    const user = await db.createUser({
      email: email?.toLowerCase().trim() || undefined,
      password: hashedPassword,
      name: name.trim(),
      phone: normalizedPhone,
      role,
      isActive,
      emailVerified: true, // Admin-created users are pre-verified
      approvalStatus: 'approved',
      // Elderly-specific fields
      vayoId,
      age: age ? Number(age) : undefined,
      gender,
      dateOfBirth,
      address,
      pincode,
      emergencyContact,
      // Location fields
      stateName,
      districtName,
      talukName,
      villageName,
      // Caregiver fields
      caregiverName: finalCaregiverName,
      caregiverPhone: finalCaregiverPhone,
      caregiverRelation: finalCaregiverRelation,
      caregiverRelationOther,
      // Assignment
      assignedVolunteer: volunteerAssignment,
      assignedFamily: familyAssignment,
      // Support requirements
      needsFinancialAssistance,
      needsLegalSupport,
      // Volunteer-specific
      maxAssignments: maxAssignments ? Number(maxAssignments) : undefined,
      // Elderly category
      category: role === 'elderly' ? category : undefined,
    })

    const safeUser = db.toSafeUser(user)

    return NextResponse.json(
      {
        success: true,
        data: safeUser,
        message: 'User created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create user error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
