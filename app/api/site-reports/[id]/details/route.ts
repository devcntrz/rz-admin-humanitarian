import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async (_req) => {
    try {
      const resolvedParams = await params
      const siteReportId = parseInt(resolvedParams.id)

      if (isNaN(siteReportId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid site report ID format' },
          { status: 400 }
        )
      }

      // Ambil data utama site report
      const siteReport = await sql`
        SELECT
          r.*,
          to_char(r.report_date, 'YYYY-MM-DD') as report_date,
          to_char(r.incident_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD"T"HH24:MI') as incident_at_local,
          to_char(r.incident_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI') as incident_at_display,
          v.full_name as volunteer_name,
          v.email as volunteer_email,
          v.phone_number as volunteer_phone,
          d.name as disaster_name,
          vill.name as village_name,
          dist.name as district_name,
          reg.name as regency_name,
          prov.name as province_name,
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
        WHERE r.id = ${siteReportId}
      `

      if (siteReport.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Site report not found' },
          { status: 404 }
        )
      }

      // Ambil semua detail dalam satu query menggunakan UNION
      const details = await sql`
        -- Victims
        SELECT
          'victim' as type,
          id,
          victim_type as name,
          quantity as count,
          NULL as unit,
          description
        FROM sr_victim_counts
        WHERE site_report_id = ${siteReportId}

        UNION ALL

        -- Damages
        SELECT
          'damage' as type,
          id,
          damage_type as name,
          quantity as count,
          unit,
          description
        FROM sr_infrastructure_damages
        WHERE site_report_id = ${siteReportId}

        UNION ALL

        -- Refugees
        SELECT
          'refugee' as type,
          id,
          location_name as name,
          number_of_refugees as count,
          NULL as unit,
          description as condition_description
        FROM sr_refugee_infos
        WHERE site_report_id = ${siteReportId}

        UNION ALL

        -- Needs
        SELECT
          'need' as type,
          id,
          need_item as name,
          quantity as count,
          unit,
          description
        FROM sr_urgent_needs
        WHERE site_report_id = ${siteReportId}

        ORDER BY type, id
      `

      // Ambil documents terpisah karena strukturnya berbeda
      const documents = await sql`
        SELECT id, file_url, description
        FROM sr_documentations
        WHERE site_report_id = ${siteReportId}
        ORDER BY id ASC
      `

      // Group details berdasarkan type
      const groupedDetails = {
        victims: details.filter((d) => d.type === 'victim'),
        damages: details.filter((d) => d.type === 'damage'),
        refugees: details.filter((d) => d.type === 'refugee'),
        needs: details.filter((d) => d.type === 'need'),
      }

      return NextResponse.json({
        success: true,
        data: {
          siteReport: siteReport[0],
          details: groupedDetails,
          documents: documents,
        },
      })
    } catch (error) {
      console.error('Error fetching site report details:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch site report details' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (_request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})
