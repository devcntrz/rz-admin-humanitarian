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

      // Check if province exists
      const existingProvince = await query(
        'SELECT id FROM provinces WHERE id = ?',
        [id]
      )

      if (existingProvince.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Province not found' },
          { status: 404 }
        )
      }

      // Update province
      await query(
        'UPDATE provinces SET name = ? WHERE id = ?',
        [name, id]
      )

      return NextResponse.json({
        success: true,
        message: 'Province updated successfully'
      })
    } catch (error) {
      console.error('Error updating province:', error)
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

      // Check if province exists
      const existingProvince = await query(
        'SELECT id FROM provinces WHERE id = ?',
        [id]
      )

      if (existingProvince.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Province not found' },
          { status: 404 }
        )
      }

      // Delete province
      await query('DELETE FROM provinces WHERE id = ?', [id])

      return NextResponse.json({
        success: true,
        message: 'Province deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting province:', error)
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