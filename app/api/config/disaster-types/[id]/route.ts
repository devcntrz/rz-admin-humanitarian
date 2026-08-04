import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/cors'
import { query } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withCors(async () => {
    try {
      const { id } = params
      const body = await request.json()
      const { name } = body

      if (!name) {
        return NextResponse.json(
          { success: false, message: 'Name is required' },
          { status: 400 }
        )
      }

      // Check if disaster type exists
      const existingDisasterType = await query(
        'SELECT id FROM disaster_types WHERE id = ?',
        [id]
      )

      if (existingDisasterType.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Disaster type not found' },
          { status: 404 }
        )
      }

      // Update disaster type
      await query(
        'UPDATE disaster_types SET name = ? WHERE id = ?',
        [name, id]
      )

      return NextResponse.json({
        success: true,
        message: 'Disaster type updated successfully'
      })
    } catch (error) {
      console.error('Error updating disaster type:', error)
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withCors(async () => {
    try {
      const { id } = params

      // Check if disaster type exists
      const existingDisasterType = await query(
        'SELECT id FROM disaster_types WHERE id = ?',
        [id]
      )

      if (existingDisasterType.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Disaster type not found' },
          { status: 404 }
        )
      }

      // Delete disaster type
      await query('DELETE FROM disaster_types WHERE id = ?', [id])

      return NextResponse.json({
        success: true,
        message: 'Disaster type deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting disaster type:', error)
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})