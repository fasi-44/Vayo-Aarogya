import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, validatePassword, validateEmail } from '@/lib/auth'
import { type ApiResponse, type SafeUser, type UserRole, rolePermissions } from '@/types'

// Helper to get user from request headers (set by middleware)
function getUserFromHeaders(request: NextRequest) {
  return {
    userId: request.headers.get('x-user-id'),
    email: request.headers.get('x-user-email'),
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

    if (!hasPermission(user.role, 'users:read')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || undefined
    const search = searchParams.get('search') || undefined
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100) // Max 100 per page

    // Use server-side filtering and pagination
    const { users, total } = await db.getAllUsers({
      role,
      search,
      page,
      limit,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    })

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

// Role prefix mapping for Vayo ID
const ROLE_PREFIX_MAP: Record<string, string> = {
  elderly: 'VAEL',
  family: 'VAFM',
  volunteer: 'VAVL',
  super_admin: 'VAAD',
  professional: 'VAHP',
}

// Helper to generate next Vayo ID based on role
async function generateVayoId(role: string): Promise<string> {
  const prefix = ROLE_PREFIX_MAP[role] || 'VAXX'

  // Get the highest existing vayoId for this role prefix
  const result = await db.getHighestVayoIdByPrefix(prefix)
  let nextNumber = 1

  if (result) {
    // Extract number from VAEL0001 format
    const match = result.match(new RegExp(`${prefix}(\\d+)`))
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  // Format: VAEL0001, VAFM0001, etc.
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

// POST /api/users - Create a new user (admin only)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<SafeUser>>> {
  try {
    const requestUser = getUserFromHeaders(request)

    if (!hasPermission(requestUser.role, 'users:create')) {
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
      // Assignment
      assignedVolunteer,
      assignedFamily,
      // Volunteer-specific
      maxAssignments,
    } = body

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: 'Email, password, name, and role are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.errors.join('. ') },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
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

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Auto-generate Vayo ID for all users based on role
    const vayoId = await generateVayoId(role)

    // Determine family assignment
    // If family user creates elderly, automatically assign to themselves
    let familyAssignment = assignedFamily
    let finalCaregiverName = caregiverName
    let finalCaregiverPhone = caregiverPhone
    let finalCaregiverRelation = caregiverRelation

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
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      phone: phone?.trim(),
      role,
      isActive,
      emailVerified: true, // Admin-created users are pre-verified
      // Elderly-specific fields
      vayoId,
      age: age ? Number(age) : undefined,
      gender,
      dateOfBirth,
      address,
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
      // Assignment
      assignedVolunteer,
      assignedFamily: familyAssignment,
      // Volunteer-specific
      maxAssignments: maxAssignments ? Number(maxAssignments) : undefined,
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
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}
