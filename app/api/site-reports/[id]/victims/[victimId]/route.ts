import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; victimId: string } }
) {
  return withCors(async (req) => {
    try {
      const siteReportId = parseInt(params.id)
      const victimId = parseInt(params.victimId)
      const body = await req.json()
      const { category, count, description } = body
      
      if (isNaN(siteReportId) || isNaN(victimId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
          { status: 400 }
        )
      }
      
      if (!category || !count) {
        return NextResponse.json(
          { success: false, error: 'Category and count are required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        UPDATE sr_victim_counts 
        SET victim_type = ${category}, quantity = ${count}, description = ${description || null}
        WHERE id = ${victimId} AND site_report_id = ${siteReportId}
        RETURNING id, victim_type as category, quantity as count, description
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Victim count not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Victim count updated successfully'
      })
    } catch (error) {
      console.error('Error updating victim count:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update victim count' },
        { status: 500 }
      )
    }
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; victimId: string } }
) {
  return withCors(async (req) => {
    try {
      const siteReportId = parseInt(params.id)
      const victimId = parseInt(params.victimId)
      
      if (isNaN(siteReportId) || isNaN(victimId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        DELETE FROM sr_victim_counts 
        WHERE id = ${victimId} AND site_report_id = ${siteReportId}
        RETURNING id
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Victim count not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Victim count deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting victim count:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete victim count' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})