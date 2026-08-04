import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; needId: string } }
) {
  return withCors(async (req) => {
    try {
      const siteReportId = parseInt(params.id)
      const needId = parseInt(params.needId)
      const body = await req.json()
      const { need_item, quantity, unit } = body
      
      if (isNaN(siteReportId) || isNaN(needId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
          { status: 400 }
        )
      }
      
      if (!need_item || !quantity || !unit) {
        return NextResponse.json(
          { success: false, error: 'Need item, quantity, and unit are required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        UPDATE sr_urgent_needs 
        SET need_item = ${need_item}, quantity = ${quantity}, unit = ${unit}
        WHERE id = ${needId} AND site_report_id = ${siteReportId}
        RETURNING id, need_item, quantity, unit
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Urgent need not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Urgent need updated successfully'
      })
    } catch (error) {
      console.error('Error updating urgent need:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update urgent need' },
        { status: 500 }
      )
    }
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; needId: string } }
) {
  return withCors(async (req) => {
    try {
      const siteReportId = parseInt(params.id)
      const needId = parseInt(params.needId)
      
      if (isNaN(siteReportId) || isNaN(needId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        DELETE FROM sr_urgent_needs 
        WHERE id = ${needId} AND site_report_id = ${siteReportId}
        RETURNING id
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Urgent need not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Urgent need deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting urgent need:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete urgent need' },
        { status: 500 }
      )
    }
  })(request)
}






// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})