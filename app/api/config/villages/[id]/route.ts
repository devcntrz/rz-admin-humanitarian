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
      const { name, district_id } = body

      if (!name || !district_id) {
        return NextResponse.json(
          { success: false, message: 'Name and district_id are required' },
          { status: 400 }
        )
      }

      // Check if village exists
      const existingVillage = await query(
        'SELECT id FROM villages WHERE id = ?',
        [id]
      )

      if (existingVillage.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Village not found' },
          { status: 404 }
        )
      }

      // Update village
      await query(
        'UPDATE villages SET name = ?, district_id = ? WHERE id = ?',
        [name, district_id, id]
      )

      return NextResponse.json({
        success: true,
        message: 'Village updated successfully'
      })
    } catch (error) {
      console.error('Error updating village:', error)
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

      // Check if village exists
      const existingVillage = await query(
        'SELECT id FROM villages WHERE id = ?',
        [id]
      )

      if (existingVillage.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Village not found' },
          { status: 404 }
        )
      }

      // Delete village
      await query('DELETE FROM villages WHERE id = ?', [id])

      return NextResponse.json({
        success: true,
        message: 'Village deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting village:', error)
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