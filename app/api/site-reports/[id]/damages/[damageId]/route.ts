import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; damageId: string } }
) {
  return withCors(async (req) => {
    try {
      const siteReportId = parseInt(params.id)
      const damageId = parseInt(params.damageId)
      const body = await req.json()
      const { infrastructure_type, damage_level, description } = body
      
      if (isNaN(siteReportId) || isNaN(damageId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
          { status: 400 }
        )
      }
      
      if (!infrastructure_type || !damage_level) {
        return NextResponse.json(
          { success: false, error: 'Infrastructure type and damage level are required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        UPDATE sr_infrastructure_damages 
        SET damage_type = ${infrastructure_type}, damage_level = ${damage_level}, description = ${description || null}
        WHERE id = ${damageId} AND site_report_id = ${siteReportId}
        RETURNING id, damage_type as infrastructure_type, damage_level, description
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Infrastructure damage not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Infrastructure damage updated successfully'
      })
    } catch (error) {
      console.error('Error updating infrastructure damage:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update infrastructure damage' },
        { status: 500 }
      )
    }
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; damageId: string } }
) {
  return withCors(async (req) => {
    try {
      const siteReportId = parseInt(params.id)
      const damageId = parseInt(params.damageId)
      
      if (isNaN(siteReportId) || isNaN(damageId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        DELETE FROM sr_infrastructure_damages 
        WHERE id = ${damageId} AND site_report_id = ${siteReportId}
        RETURNING id
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Infrastructure damage not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Infrastructure damage deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting infrastructure damage:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete infrastructure damage' },
        { status: 500 }
      )
    }
  })(request)
}






// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})