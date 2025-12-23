import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { ApiResponse, SafeUser } from '@/types'

// Helper to get user from request headers
function getUserFromHeaders(request: NextRequest) {
  return {
    userId: request.headers.get('x-user-id'),
    email: request.headers.get('x-user-email'),
    role: request.headers.get('x-user-role'),
  }
}

// GET /api/family/elders - Get elders for the logged-in family member
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<SafeUser[]>>> {
  try {
    const user = getUserFromHeaders(request)

    if (!user.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only family users can access this endpoint
    if (user.role !== 'family') {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for family members' },
        { status: 403 }
      )
    }

    // Get elders associated with this family member
    const elders = await db.getElderlyByFamily(user.userId)

    return NextResponse.json({
      success: true,
      data: elders,
      message: `Found ${elders.length} associated elders`,
    })
  } catch (error) {
    console.error('Get family elders error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}
