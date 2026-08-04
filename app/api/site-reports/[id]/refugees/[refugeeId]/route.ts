import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; refugeeId: string } }
) {
  return withCors(async (req) => {
    try {
      const siteReportId = parseInt(params.id)
      const refugeeId = parseInt(params.refugeeId)
      const body = await req.json()
      const { location, count, condition_description } = body
      
      if (isNaN(siteReportId) || isNaN(refugeeId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
          { status: 400 }
        )
      }
      
      if (!location || !count) {
        return NextResponse.json(
          { success: false, error: 'Location and count are required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        UPDATE sr_refugee_infos 
        SET location_name = ${location}, number_of_refugees = ${count}, description = ${condition_description || null}
        WHERE id = ${refugeeId} AND site_report_id = ${siteReportId}
        RETURNING id, location_name as location, number_of_refugees as count, description as condition_description
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Refugee info not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Refugee info updated successfully'
      })
    } catch (error) {
      console.error('Error updating refugee info:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update refugee info' },
        { status: 500 }
      )
    }
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; refugeeId: string } }
) {
  return withCors(async (req) => {
    try {
      const siteReportId = parseInt(params.id)
      const refugeeId = parseInt(params.refugeeId)
      
      if (isNaN(siteReportId) || isNaN(refugeeId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        DELETE FROM sr_refugee_infos 
        WHERE id = ${refugeeId} AND site_report_id = ${siteReportId}
        RETURNING id
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Refugee info not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Refugee info deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting refugee info:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete refugee info' },
        { status: 500 }
      )
    }
  })(request)
}






// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})