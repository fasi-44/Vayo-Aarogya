import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse, requireAuth, hasPermission } from '@/lib/api-utils'

// GET /api/locations/[id] - Get a single location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const location = await db.getLocationById(id)

    if (!location) {
      return errorResponse('Location not found', 404)
    }

    return successResponse(location)
  } catch (error) {
    console.error('Get location error:', error)
    return errorResponse('Failed to get location', 500)
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
      return errorResponse('Forbidden', 403)
    }

    const { id } = await params
    const location = await db.getLocationById(id)

    if (!location) {
      return errorResponse('Location not found', 404)
    }

    await db.deleteLocation(id)

    return successResponse({ message: 'Location deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Unauthorized', 401)
    }
    console.error('Delete location error:', error)
    return errorResponse('Failed to delete location', 500)
  }
}
