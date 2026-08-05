import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ volunteerId: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const volunteerId = parseInt(resolvedParams.volunteerId)

      if (isNaN(volunteerId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid volunteer ID format' },
          { status: 400 }
        )
      }

      // Pagination params
      const { searchParams } = new URL(req.url)
      const pageParam = parseInt(searchParams.get('page') || '1')
      const limitParam = parseInt(searchParams.get('limit') || '5')
      const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
      const limit = isNaN(limitParam) || limitParam < 1 ? 5 : Math.min(limitParam, 100)
      const offset = (page - 1) * limit

      // Cek apakah volunteer ada
      const volunteer = await sql`
        SELECT id, full_name, email
        FROM volunteers
        WHERE id = ${volunteerId}
      `

      if (volunteer.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Volunteer not found' },
          { status: 404 }
        )
      }

      // Hitung total records untuk pagination
      const totalResult = await sql<{ count: string }>`
        SELECT COUNT(*)::text as count
        FROM site_reports r
        WHERE r.volunteer_id = ${volunteerId}
      `
      const totalItems = parseInt(totalResult[0]?.count || '0')
      const totalPages = Math.max(1, Math.ceil(totalItems / limit))

      // Ambil page data
      const siteReports = await sql`
        SELECT
          r.id,
          to_char(r.report_date, 'YYYY-MM-DD') as report_date,
          r.status,
          r.subject,
          r.full_address,
          r.latitude,
          r.longitude,
          r.created_at,
          r.chronology,
          r.disaster_status,
          r.latest_condition,
          r.information_source,
          r.field_coordinator_id,
          to_char(r.incident_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD"T"HH24:MI') as incident_at_local,
          to_char(r.incident_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI') as incident_at,
          fc.full_name as field_coordinator_name,
          fc.phone_number as field_coordinator_phone,
          d.name as disaster_name,
          vill.name as village_name,
          dist.name as district_name,
          reg.name as regency_name,
          prov.name as province_name
        FROM site_reports r
        LEFT JOIN disaster_types d ON d.id = r.disaster_type_id
        LEFT JOIN villages vill ON vill.id = r.village_id
        LEFT JOIN districts dist ON dist.id = COALESCE(r.district_id, vill.district_id)
        LEFT JOIN regencies reg ON reg.id = COALESCE(r.regency_id, dist.regency_id)
        LEFT JOIN provinces prov ON prov.id = COALESCE(r.province_id, reg.province_id)
        LEFT JOIN field_coordinators fc ON fc.id = r.field_coordinator_id
        WHERE r.volunteer_id = ${volunteerId}
        ORDER BY r.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `

      return NextResponse.json({
        success: true,
        data: {
          volunteer: volunteer[0],
          siteReports: siteReports,
          pagination: {
            totalItems,
            totalPages,
            currentPage: page,
            pageSize: limit,
            hasPrev: page > 1,
            hasNext: page < totalPages,
            nextPage: page < totalPages ? page + 1 : null,
            prevPage: page > 1 ? page - 1 : null,
          },
        },
      })
    } catch (error) {
      console.error('Error fetching situation reports by volunteer:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch situation reports' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (_request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})
