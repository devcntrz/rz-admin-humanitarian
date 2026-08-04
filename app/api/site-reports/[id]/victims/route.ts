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
      
      const victims = await sql`
        SELECT id, victim_type as category, quantity as count, description
        FROM sr_victim_counts
        WHERE site_report_id = ${siteReportId}
        ORDER BY id ASC
        LIMIT 10
      `
      
      return NextResponse.json({
        success: true,
        data: victims
      })
    } catch (error) {
      console.error('Error fetching victims:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch victims' },
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
      const { category, count, description } = body
      
      if (isNaN(siteReportId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid site report ID' },
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
        INSERT INTO sr_victim_counts (site_report_id, victim_type, quantity, description)
        VALUES (${siteReportId}, ${category}, ${count}, ${description || null})
        RETURNING id, victim_type as category, quantity as count, description
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Victim count added successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating victim count:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create victim count' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})