import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { type ApiResponse, type SafeUser, type UserRole, rolePermissions } from '@/types'

function getUserFromHeaders(request: NextRequest) {
  return {
    userId: request.headers.get('x-user-id'),
    email: request.headers.get('x-user-email'),
    role: request.headers.get('x-user-role') as UserRole | null,
  }
}

function hasPermission(role: UserRole | null, permission: string): boolean {
  if (!role) return false
  const permissions = rolePermissions[role] || []
  return permissions.includes(permission as never)
}

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/users/[id]/approve - Approve or reject a user
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<SafeUser>>> {
  try {
    const { id } = await params
    const requestUser = getUserFromHeaders(request)

    // Only admins can approve/reject users
    if (!hasPermission(requestUser.role, 'users:update')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, category } = body // action: 'approve' or 'reject', category: 'community' or 'clinic'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject".' },
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

    if (existingUser.approvalStatus !== 'pending') {
      return NextResponse.json(
        { success: false, error: `User has already been ${existingUser.approvalStatus}` },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = {
      approvalStatus: action === 'approve' ? 'approved' : 'rejected',
      isActive: action === 'approve',
    }

    // For elderly users being approved, require category and generate patient number
    if (action === 'approve' && existingUser.role === 'elderly') {
      if (!category || !['community', 'clinic'].includes(category)) {
        return NextResponse.json(
          { success: false, error: 'Category (community or clinic) is required to approve elderly users' },
          { status: 400 }
        )
      }

      const patientNumber = await db.generateElderlyPatientNumber(category)
      updates.vayoId = patientNumber
      updates.category = category
    }

    const updatedUser = await db.updateUser(id, updates)
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      )
    }

    // Log the approval action
    await db.createAuditLog({
      userId: requestUser.userId || undefined,
      action: action === 'approve' ? 'user_approved' : 'user_rejected',
      entity: 'User',
      entityId: id,
      details: {
        targetUser: existingUser.email,
        targetRole: existingUser.role,
        action,
        ...(category && { category }),
        ...(updates.vayoId ? { patientNumber: String(updates.vayoId) } : {}),
      },
    })

    const safeUser = db.toSafeUser(updatedUser)

    return NextResponse.json({
      success: true,
      data: safeUser,
      message: `User ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    })
  } catch (error) {
    console.error('Approve user error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}
