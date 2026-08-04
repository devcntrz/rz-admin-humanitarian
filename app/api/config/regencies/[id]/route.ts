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
      const { name, province_id } = body

      if (!name || !province_id) {
        return NextResponse.json(
          { success: false, message: 'Name and province_id are required' },
          { status: 400 }
        )
      }

      // Check if regency exists
      const existingRegency = await query(
        'SELECT id FROM regencies WHERE id = ?',
        [id]
      )

      if (existingRegency.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Regency not found' },
          { status: 404 }
        )
      }

      // Update regency
      await query(
        'UPDATE regencies SET name = ?, province_id = ? WHERE id = ?',
        [name, province_id, id]
      )

      return NextResponse.json({
        success: true,
        message: 'Regency updated successfully'
      })
    } catch (error) {
      console.error('Error updating regency:', error)
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

      // Check if regency exists
      const existingRegency = await query(
        'SELECT id FROM regencies WHERE id = ?',
        [id]
      )

      if (existingRegency.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Regency not found' },
          { status: 404 }
        )
      }

      // Delete regency
      await query('DELETE FROM regencies WHERE id = ?', [id])

      return NextResponse.json({
        success: true,
        message: 'Regency deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting regency:', error)
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