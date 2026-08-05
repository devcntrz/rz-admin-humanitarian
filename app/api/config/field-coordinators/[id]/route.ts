import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const id = parseInt(resolvedParams.id)
      const body = await req.json()
      const { full_name, phone_number, phone } = body
      const phoneValue = phone_number || phone || null

      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid ID format' },
          { status: 400 }
        )
      }

      if (!full_name) {
        return NextResponse.json(
          { success: false, error: 'Full name is required' },
          { status: 400 }
        )
      }

      const result = await sql`
        UPDATE field_coordinators
        SET full_name = ${full_name}, phone_number = ${phoneValue}
        WHERE id = ${id}
        RETURNING id, full_name, phone_number as phone
      `

      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Field coordinator not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Field coordinator updated successfully',
      })
    } catch (error) {
      console.error('Error updating field coordinator:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update field coordinator' },
        { status: 500 }
      )
    }
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async () => {
    try {
      const resolvedParams = await params
      const id = parseInt(resolvedParams.id)

      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid ID format' },
          { status: 400 }
        )
      }

      const result = await sql`
        DELETE FROM field_coordinators
        WHERE id = ${id}
        RETURNING id
      `

      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Field coordinator not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Field coordinator deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting field coordinator:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete field coordinator' },
        { status: 500 }
      )
    }
  })(request)
}

export const OPTIONS = withCors(async () => {
  return new NextResponse(null, { status: 200 })
})
