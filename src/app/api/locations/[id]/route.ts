import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse, requireAuth, hasPermission } from '@/lib/api-utils'

// GET /api/locations/[id] - Get a single location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request) // Verify auth

    const { id } = await params
    const location = await db.getLocationById(id)

    if (!location) {
      return NextResponse.json(errorResponse('Location not found'), { status: 404 })
    }

    return NextResponse.json(successResponse(location))
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }
    console.error('Get location error:', error)
    return NextResponse.json(errorResponse('Failed to get location'), { status: 500 })
  }
}

// DELETE /api/locations/[id] - Delete a location (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requestUser = requireAuth(request)

    if (!hasPermission(requestUser.role, 'settings:update')) {
      return NextResponse.json(errorResponse('Forbidden'), { status: 403 })
    }

    const { id } = await params
    const location = await db.getLocationById(id)

    if (!location) {
      return NextResponse.json(errorResponse('Location not found'), { status: 404 })
    }

    await db.deleteLocation(id)

    return NextResponse.json(successResponse({ message: 'Location deleted successfully' }))
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }
    console.error('Delete location error:', error)
    return NextResponse.json(errorResponse('Failed to delete location'), { status: 500 })
  }
}
