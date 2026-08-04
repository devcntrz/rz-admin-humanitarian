import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const siteReportId = parseInt(resolvedParams.id)
      
      if (isNaN(siteReportId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid site report ID' },
          { status: 400 }
        )
      }
      
      const damages = await sql`
        SELECT id, damage_type as infrastructure_type, damage_level, description
        FROM sr_infrastructure_damages
        WHERE site_report_id = ${siteReportId}
        ORDER BY id ASC
        LIMIT 10
      `
      
      return NextResponse.json({
        success: true,
        data: damages
      })
    } catch (error) {
      console.error('Error fetching damages:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch damages' },
        { status: 500 }
      )
    }
  })(request)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withCors(async (req) => {
    try {
      const siteReportId = parseInt(params.id)
      const body = await req.json()
      const { infrastructure_type, damage_level, description } = body
      
      if (isNaN(siteReportId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid site report ID' },
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
        INSERT INTO sr_infrastructure_damages (site_report_id, damage_type, quantity, unit, damage_level, description)
        VALUES (${siteReportId}, ${infrastructure_type}, 1, 'unit', ${damage_level}, ${description || null})
        RETURNING id, damage_type as infrastructure_type, damage_level, description
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Infrastructure damage added successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating infrastructure damage:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create infrastructure damage' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})