import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(request: NextRequest) {
  return withCors(async (req) => {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    
    try {
      let reports
      
      if (q && q.trim() !== '') {
        const like = `%${q.trim()}%`
        reports = await sql`
          SELECT r.id,
            to_char(r.report_date, 'YYYY-MM-DD') as report_date,
            r.status,
            r.subject,
            r.volunteer_id,
            v.full_name as volunteer,
            d.name as disaster,
            vill.name as village,
            dist.name as district,
            reg.name as regency,
            prov.name as province
          FROM site_reports r
          LEFT JOIN volunteers v ON v.id = r.volunteer_id
          LEFT JOIN disaster_types d ON d.id = r.disaster_type_id
          LEFT JOIN villages vill ON vill.id = r.village_id
          LEFT JOIN districts dist ON dist.id = vill.district_id
          LEFT JOIN regencies reg ON reg.id = dist.regency_id
          LEFT JOIN provinces prov ON prov.id = reg.province_id
          WHERE v.full_name ILIKE ${like}
            OR d.name ILIKE ${like}
            OR vill.name ILIKE ${like}
            OR CAST(r.id AS TEXT) ILIKE ${like}
            OR r.subject ILIKE ${like}
          ORDER BY r.id DESC
          LIMIT 10
        `
      } else {
        reports = await sql`
          SELECT r.id,
            to_char(r.report_date, 'YYYY-MM-DD') as report_date,
            r.status,
            r.subject,
            r.volunteer_id,
            v.full_name as volunteer,
            d.name as disaster,
            vill.name as village,
            dist.name as district,
            reg.name as regency,
            prov.name as province
          FROM site_reports r
          LEFT JOIN volunteers v ON v.id = r.volunteer_id
          LEFT JOIN disaster_types d ON d.id = r.disaster_type_id
          LEFT JOIN villages vill ON vill.id = r.village_id
          LEFT JOIN districts dist ON dist.id = vill.district_id
          LEFT JOIN regencies reg ON reg.id = dist.regency_id
          LEFT JOIN provinces prov ON prov.id = reg.province_id
          ORDER BY r.id DESC
          LIMIT 10
        `
      }
      
      return NextResponse.json({
        success: true,
        data: reports,
        total: reports.length
      })
    } catch (error) {
      console.error('Error fetching situation reports:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch situation reports' },
        { status: 500 }
      )
    }
  })(request)
}

export async function POST(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const body = await req.json()
      const { volunteer_id, disaster_type_id, village_id, report_date, status, full_address, latitude, longitude, province_id, regency_id, district_id, subject } = body
      
      const result = await sql`
        INSERT INTO site_reports (
          volunteer_id, disaster_type_id, village_id, report_date, status,
          full_address, latitude, longitude, province_id, regency_id, district_id,
          subject
        )
        VALUES (
          ${volunteer_id || null}, 
          ${disaster_type_id || null}, 
          ${village_id || null}, 
          ${report_date || new Date().toISOString().slice(0, 10)}, 
          ${status || 'draft'},
          ${full_address || null},
          ${latitude || null},
          ${longitude || null},
          ${province_id || null},
          ${regency_id || null},
          ${district_id || null},
          ${subject || null}
        )
        RETURNING id, volunteer_id, disaster_type_id, village_id, report_date, status, full_address, latitude, longitude, province_id, regency_id, district_id, subject, created_at
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Situation report created successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating situation report:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create situation report' },
        { status: 500 }
      )
    }
  })(request)
}

export async function PUT(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const body = await req.json()
      const { id, volunteer_id, disaster_type_id, village_id, report_date, status, full_address, latitude, longitude, province_id, regency_id, district_id, subject } = body
      if (!id) {
        return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
      }
      const result = await sql`
        UPDATE site_reports SET
          volunteer_id = ${volunteer_id || null},
          disaster_type_id = ${disaster_type_id || null},
          village_id = ${village_id || null},
          report_date = ${report_date || new Date().toISOString().slice(0, 10)},
          status = ${status || 'draft'},
          full_address = ${full_address || null},
          latitude = ${latitude || null},
          longitude = ${longitude || null},
          province_id = ${province_id || null},
          regency_id = ${regency_id || null},
          district_id = ${district_id || null},
          subject = ${subject || null}
        WHERE id = ${id}
        RETURNING id
      `
      if (result.length === 0) {
        return NextResponse.json({ success: false, error: 'Situation report not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, message: 'Situation report updated successfully' })
    } catch (error) {
      console.error('Error updating situation report:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update situation report' },
        { status: 500 }
      )
    }
  })(request)
}


// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})