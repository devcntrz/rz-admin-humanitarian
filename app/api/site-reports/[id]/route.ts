import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'
import { normalizeIncidentAt, todayJakartaDate } from '@/lib/incident-at'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async () => {
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
          to_char(r.incident_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD"T"HH24:MI') as incident_at_local,
          to_char(r.incident_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI') as incident_at_display,
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
          reg.province_id as regency_province_id,
          fc.full_name as field_coordinator_name,
          fc.phone_number as field_coordinator_phone
        FROM site_reports r
        LEFT JOIN volunteers v ON v.id = r.volunteer_id
        LEFT JOIN disaster_types d ON d.id = r.disaster_type_id
        LEFT JOIN villages vill ON vill.id = r.village_id
        LEFT JOIN districts dist ON dist.id = COALESCE(r.district_id, vill.district_id)
        LEFT JOIN regencies reg ON reg.id = COALESCE(r.regency_id, dist.regency_id)
        LEFT JOIN provinces prov ON prov.id = COALESCE(r.province_id, reg.province_id)
        LEFT JOIN field_coordinators fc ON fc.id = r.field_coordinator_id
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
        data: result[0],
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
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const id = parseInt(resolvedParams.id)
      const body = await req.json()

      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid ID format' },
          { status: 400 }
        )
      }

      const {
        volunteer_id,
        disaster_type_id,
        village_id,
        report_date,
        status,
        full_address,
        latitude,
        longitude,
        province_id,
        regency_id,
        district_id,
        subject,
        incident_at,
        chronology,
        disaster_status,
        latest_condition,
        field_coordinator_id,
        information_source,
      } = body

      const incidentAtValue = normalizeIncidentAt(incident_at)

      const result = await sql`
        UPDATE site_reports
        SET
          volunteer_id = ${volunteer_id || null},
          disaster_type_id = ${disaster_type_id || null},
          village_id = ${village_id || null},
          report_date = ${report_date || todayJakartaDate()},
          status = ${status || 'draft'},
          full_address = ${full_address || null},
          latitude = ${latitude || null},
          longitude = ${longitude || null},
          province_id = ${province_id || null},
          regency_id = ${regency_id || null},
          district_id = ${district_id || null},
          subject = ${subject || null},
          incident_at = ${incidentAtValue},
          chronology = ${chronology || null},
          disaster_status = ${disaster_status || null},
          latest_condition = ${latest_condition || null},
          field_coordinator_id = ${field_coordinator_id || null},
          information_source = ${information_source || null}
        WHERE id = ${id}
        RETURNING id, volunteer_id, disaster_type_id, village_id, report_date, status, subject,
          incident_at, chronology, disaster_status, latest_condition, field_coordinator_id,
          information_source, full_address, latitude, longitude, province_id, regency_id, district_id
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
        message: 'Situation report updated successfully',
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
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async () => {
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
        message: 'Situation report deleted successfully',
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

export const OPTIONS = withCors(async () => {
  return new NextResponse(null, { status: 200 })
})
