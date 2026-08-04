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
      
      const refugees = await sql`
        SELECT id, location_name as location, number_of_refugees as count, description
        FROM sr_refugee_infos
        WHERE site_report_id = ${siteReportId}
        ORDER BY id ASC
        LIMIT 10
      `
      
      return NextResponse.json({
        success: true,
        data: refugees
      })
    } catch (error) {
      console.error('Error fetching refugees:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch refugees' },
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
      const { location, count, condition_description } = body
      
      if (isNaN(siteReportId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid site report ID' },
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
        INSERT INTO sr_refugee_infos (site_report_id, location_name, number_of_refugees, description)
        VALUES (${siteReportId}, ${location}, ${count}, ${condition_description || null})
        RETURNING id, location_name as location, number_of_refugees as count, description as condition_description
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Refugee info added successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating refugee info:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create refugee info' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})