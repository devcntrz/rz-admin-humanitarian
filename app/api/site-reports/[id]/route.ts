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
      const id = parseInt(resolvedParams.id)
      
      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid ID format' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        SELECT r.*, 
          to_char(r.report_date, 'YYYY-MM-DD') as report_date,
          v.full_name as volunteer_name,
          v.email as volunteer_email,
          v.phone_number as volunteer_phone,
          d.name as disaster_name,
          vill.name as village_name,
          vill.district_id as village_district_id,
          prov.name as province_name,
          reg.name as regency_name,
          dist.name as district_name,
          dist.regency_id as district_regency_id,
          reg.province_id as regency_province_id
        FROM site_reports r
        LEFT JOIN volunteers v ON v.id = r.volunteer_id
        LEFT JOIN disaster_types d ON d.id = r.disaster_type_id
        LEFT JOIN villages vill ON vill.id = r.village_id
        LEFT JOIN districts dist ON dist.id = vill.district_id
        LEFT JOIN regencies reg ON reg.id = dist.regency_id
        LEFT JOIN provinces prov ON prov.id = reg.province_id
        WHERE r.id = ${id}
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Situation report not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: result[0]
      })
    } catch (error) {
      console.error('Error fetching situation report:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch situation report' },
        { status: 500 }
      )
    }
  })(request)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withCors(async (req) => {
    try {
      const id = parseInt(params.id)
      const body = await req.json()
      
      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid ID format' },
          { status: 400 }
        )
      }
      
      const { volunteer_id, disaster_type_id, village_id, report_date, status, subject } = body
      
      const result = await sql`
        UPDATE site_reports 
        SET 
          volunteer_id = ${volunteer_id || null},
          disaster_type_id = ${disaster_type_id || null},
          village_id = ${village_id || null},
          report_date = ${report_date || new Date().toISOString().slice(0, 10)},
          status = ${status || 'draft'},
          subject = ${subject || null},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, volunteer_id, disaster_type_id, village_id, report_date, status, subject, updated_at
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Situation report not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Situation report updated successfully'
      })
    } catch (error) {
      console.error('Error updating situation report:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update situation report' },
        { status: 500 }
      )
    }
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withCors(async (req) => {
    try {
      const id = parseInt(params.id)
      
      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid ID format' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        DELETE FROM site_reports 
        WHERE id = ${id}
        RETURNING id
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Situation report not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Situation report deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting situation report:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete situation report' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})