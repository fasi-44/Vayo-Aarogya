import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse, requireAuth, hasPermission } from '@/lib/api-utils'

// GET /api/locations - Get locations with optional filters
export async function GET(request: NextRequest) {
  try {
    requireAuth(request)

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const parentId = searchParams.get('parentId')

    const locations = await db.getAllLocations({
      type,
      parentId: parentId === 'null' ? null : parentId || undefined,
    })

    return NextResponse.json(successResponse(locations))
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }
    console.error('Get locations error:', error)
    return NextResponse.json(errorResponse('Failed to get locations'), { status: 500 })
  }
}

// POST /api/locations - Create a new location (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)

    if (!hasPermission(user.role, 'settings:update')) {
      return NextResponse.json(errorResponse('Forbidden'), { status: 403 })
    }

    const body = await request.json()
    const { type, name, parentId } = body

    if (!type || !name) {
      return NextResponse.json(errorResponse('Type and name are required'), { status: 400 })
    }

    const validTypes = ['state', 'district', 'taluk', 'village']
    if (!validTypes.includes(type)) {
      return NextResponse.json(errorResponse('Invalid location type'), { status: 400 })
    }

    const location = await db.createLocation({
      type,
      name,
      parentId: parentId || undefined,
    })

    // Audit log
    await db.createAuditLog({
      userId: user.userId,
      action: 'create',
      entity: 'Location',
      entityId: location.id,
      details: { type, name, parentId },
    })

    return NextResponse.json(successResponse(location), { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }
    console.error('Create location error:', error)
    return NextResponse.json(errorResponse('Failed to create location'), { status: 500 })
  }
}
