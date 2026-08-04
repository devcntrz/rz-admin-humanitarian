import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; partnerId: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const distributionId = parseInt(resolvedParams.id)
      const partnerId = parseInt(resolvedParams.partnerId)
      const body = await req.json()
      const { partner_name, description } = body
      
      if (isNaN(distributionId) || isNaN(partnerId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
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
        UPDATE dr_partners 
        SET partner_name = ${partner_name}, description = ${description || null}
        WHERE id = ${partnerId} AND distribution_report_id = ${distributionId}
        RETURNING id, partner_name, description
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Partner not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Partner updated successfully'
      })
    } catch (error) {
      console.error('Error updating partner:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update partner' },
        { status: 500 }
      )
    }
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; partnerId: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const distributionId = parseInt(resolvedParams.id)
      const partnerId = parseInt(resolvedParams.partnerId)
      
      if (isNaN(distributionId) || isNaN(partnerId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        DELETE FROM dr_partners 
        WHERE id = ${partnerId} AND distribution_report_id = ${distributionId}
        RETURNING id
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Partner not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Partner deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting partner:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete partner' },
        { status: 500 }
      )
    }
  })(request)
}


// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})