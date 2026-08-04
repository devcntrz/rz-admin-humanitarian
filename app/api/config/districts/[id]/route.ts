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
      const { name, regency_id } = body

      if (!name || !regency_id) {
        return NextResponse.json(
          { success: false, message: 'Name and regency_id are required' },
          { status: 400 }
        )
      }

      // Check if district exists
      const existingDistrict = await query(
        'SELECT id FROM districts WHERE id = ?',
        [id]
      )

      if (existingDistrict.length === 0) {
        return NextResponse.json(
          { success: false, message: 'District not found' },
          { status: 404 }
        )
      }

      // Update district
      await query(
        'UPDATE districts SET name = ?, regency_id = ? WHERE id = ?',
        [name, regency_id, id]
      )

      return NextResponse.json({
        success: true,
        message: 'District updated successfully'
      })
    } catch (error) {
      console.error('Error updating district:', error)
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

      // Check if district exists
      const existingDistrict = await query(
        'SELECT id FROM districts WHERE id = ?',
        [id]
      )

      if (existingDistrict.length === 0) {
        return NextResponse.json(
          { success: false, message: 'District not found' },
          { status: 404 }
        )
      }

      // Delete district
      await query('DELETE FROM districts WHERE id = ?', [id])

      return NextResponse.json({
        success: true,
        message: 'District deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting district:', error)
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