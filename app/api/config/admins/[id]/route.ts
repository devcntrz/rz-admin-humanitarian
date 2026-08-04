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
      const { full_name, email, role } = body

      if (!full_name || !email || !role) {
        return NextResponse.json(
          { success: false, message: 'Full name, email, and role are required' },
          { status: 400 }
        )
      }

      // Check if admin exists
      const existingAdmin = await query(
        'SELECT id FROM admins WHERE id = ?',
        [id]
      )

      if (existingAdmin.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Admin not found' },
          { status: 404 }
        )
      }

      // Update admin
      await query(
        'UPDATE admins SET full_name = ?, email = ?, role = ? WHERE id = ?',
        [full_name, email, role, id]
      )

      return NextResponse.json({
        success: true,
        message: 'Admin updated successfully'
      })
    } catch (error) {
      console.error('Error updating admin:', error)
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

      // Check if admin exists
      const existingAdmin = await query(
        'SELECT id FROM admins WHERE id = ?',
        [id]
      )

      if (existingAdmin.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Admin not found' },
          { status: 404 }
        )
      }

      // Delete admin
      await query('DELETE FROM admins WHERE id = ?', [id])

      return NextResponse.json({
        success: true,
        message: 'Admin deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting admin:', error)
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