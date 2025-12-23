import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, validatePassword } from '@/lib/auth'
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

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<SafeUser>>> {
  try {
    const { id } = await params
    const requestUser = getUserFromHeaders(request)

    // Users can view their own profile, or admins can view anyone
    const isOwnProfile = requestUser.userId === id
    const canViewOthers = hasPermission(requestUser.role, 'users:read')

    if (!isOwnProfile && !canViewOthers) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const user = await db.findUserById(id)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const safeUser = db.toSafeUser(user)

    return NextResponse.json({
      success: true,
      data: safeUser,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<SafeUser>>> {
  try {
    const { id } = await params
    const requestUser = getUserFromHeaders(request)
    const body = await request.json()

    // Users can update their own profile (limited fields), or admins can update anyone
    const isOwnProfile = requestUser.userId === id
    const canUpdateOthers = hasPermission(requestUser.role, 'users:update')

    if (!isOwnProfile && !canUpdateOthers) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const existingUser = await db.findUserById(id)
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare updates
    const updates: Record<string, unknown> = {}

    // Fields that users can update themselves
    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.phone !== undefined) updates.phone = body.phone?.trim()
    if (body.avatar !== undefined) updates.avatar = body.avatar

    // Password change
    if (body.password) {
      const passwordValidation = validatePassword(body.password)
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { success: false, error: passwordValidation.errors.join('. ') },
          { status: 400 }
        )
      }
      updates.password = await hashPassword(body.password)
    }

    // Admin-only fields
    if (canUpdateOthers && !isOwnProfile) {
      if (body.role !== undefined) {
        // Only super_admin can change roles to super_admin or professional
        if (
          (body.role === 'super_admin' || body.role === 'professional') &&
          requestUser.role !== 'super_admin'
        ) {
          return NextResponse.json(
            { success: false, error: 'Only super admins can assign admin or professional roles' },
            { status: 403 }
          )
        }
        updates.role = body.role
      }
      if (body.isActive !== undefined) updates.isActive = body.isActive
      if (body.emailVerified !== undefined) updates.emailVerified = body.emailVerified
    }

    // Elderly-specific fields
    if (body.age !== undefined) updates.age = body.age ? Number(body.age) : null
    if (body.gender !== undefined) updates.gender = body.gender || null
    if (body.dateOfBirth !== undefined) updates.dateOfBirth = body.dateOfBirth || null
    if (body.address !== undefined) updates.address = body.address || null
    if (body.emergencyContact !== undefined) updates.emergencyContact = body.emergencyContact || null

    // Location fields
    if (body.stateName !== undefined) updates.stateName = body.stateName || null
    if (body.districtName !== undefined) updates.districtName = body.districtName || null
    if (body.talukName !== undefined) updates.talukName = body.talukName || null
    if (body.villageName !== undefined) updates.villageName = body.villageName || null

    // Caregiver fields
    if (body.caregiverName !== undefined) updates.caregiverName = body.caregiverName || null
    if (body.caregiverPhone !== undefined) updates.caregiverPhone = body.caregiverPhone || null
    if (body.caregiverRelation !== undefined) updates.caregiverRelation = body.caregiverRelation || null

    // Assignment fields (admin only)
    if (body.assignedVolunteer !== undefined && canUpdateOthers) {
      updates.assignedVolunteer = body.assignedVolunteer || null
    }
    if (body.assignedElderly !== undefined && canUpdateOthers) {
      updates.assignedElderly = body.assignedElderly
    }
    if (body.maxAssignments !== undefined && canUpdateOthers) {
      updates.maxAssignments = body.maxAssignments ? Number(body.maxAssignments) : null
    }

    const updatedUser = await db.updateUser(id, updates)
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      )
    }

    const safeUser = db.toSafeUser(updatedUser)

    return NextResponse.json({
      success: true,
      data: safeUser,
      message: 'User updated successfully',
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete a user (soft delete by deactivating)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params
    const requestUser = getUserFromHeaders(request)

    if (!hasPermission(requestUser.role, 'users:delete')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Prevent self-deletion
    if (requestUser.userId === id) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    const existingUser = await db.findUserById(id)
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of super_admin by non-super_admin
    if (existingUser.role === 'super_admin' && requestUser.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super admins can delete admin accounts' },
        { status: 403 }
      )
    }

    // Soft delete - just deactivate
    await db.updateUser(id, { isActive: false })

    // Revoke all refresh tokens for this user
    await db.revokeAllUserRefreshTokens(id)

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully',
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}
