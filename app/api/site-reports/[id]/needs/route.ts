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
      
      const needs = await sql`
        SELECT id, need_item, quantity, unit, description
        FROM sr_urgent_needs
        WHERE site_report_id = ${siteReportId}
        ORDER BY id ASC
        LIMIT 10
      `
      
      return NextResponse.json({
        success: true,
        data: needs
      })
    } catch (error) {
      console.error('Error fetching urgent needs:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch urgent needs' },
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
      const { need_item, quantity, unit, description } = body
      
      if (isNaN(siteReportId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid site report ID' },
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
        INSERT INTO sr_urgent_needs (site_report_id, need_item, quantity, unit, description)
        VALUES (${siteReportId}, ${need_item}, ${quantity}, ${unit}, ${description || null})
        RETURNING id, need_item, quantity, unit, description
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Urgent need added successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating urgent need:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create urgent need' },
        { status: 500 }
      )
    }
  })(request)
}


// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})