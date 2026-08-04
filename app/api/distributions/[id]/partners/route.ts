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
      const distributionId = parseInt(resolvedParams.id)
      
      if (isNaN(distributionId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid distribution ID' },
          { status: 400 }
        )
      }
      
      const partners = await sql`
        SELECT id, partner_name, description
        FROM dr_partners
        WHERE distribution_report_id = ${distributionId}
        ORDER BY id ASC
        LIMIT 10
      `
      
      return NextResponse.json({
        success: true,
        data: partners
      })
    } catch (error) {
      console.error('Error fetching partners:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch partners' },
        { status: 500 }
      )
    }
  })(request)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const distributionId = parseInt(resolvedParams.id)
      const body = await req.json()
      const { partner_name, description } = body
      
      if (isNaN(distributionId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid distribution ID' },
          { status: 400 }
        )
      }
      
      if (!partner_name) {
        return NextResponse.json(
          { success: false, error: 'Partner name is required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        INSERT INTO dr_partners (distribution_report_id, partner_name, description)
        VALUES (${distributionId}, ${partner_name}, ${description || null})
        RETURNING id, partner_name, description
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Partner added successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating partner:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create partner' },
        { status: 500 }
      )
    }
  })(request)
}


// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})