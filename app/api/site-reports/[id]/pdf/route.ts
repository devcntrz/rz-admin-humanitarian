import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { buildSitrepPdf } from "@/lib/pdf-reports"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reportId = parseInt(id)
    if (Number.isNaN(reportId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    const reports = await sql`
      SELECT
        r.id, r.subject, r.chronology, r.disaster_status, r.latest_condition,
        r.information_source, r.full_address, r.incident_at,
        r.latitude, r.longitude,
        to_char(r.report_date, 'YYYY-MM-DD') as report_date,
        v.full_name as volunteer_name,
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
      WHERE r.id = ${reportId}
    `

    if (reports.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }

    const report = reports[0]
    const [victims, damages, refugees, needs, documents] = await Promise.all([
      sql`SELECT victim_type, quantity, description FROM sr_victim_counts WHERE site_report_id = ${reportId} ORDER BY id`,
      sql`SELECT damage_type, quantity, unit, damage_level, description FROM sr_infrastructure_damages WHERE site_report_id = ${reportId} ORDER BY id`,
      sql`SELECT location_name, number_of_refugees, description FROM sr_refugee_infos WHERE site_report_id = ${reportId} ORDER BY id`,
      sql`SELECT need_item, quantity, unit, description FROM sr_urgent_needs WHERE site_report_id = ${reportId} ORDER BY id`,
      sql`SELECT file_url, description FROM sr_documentations WHERE site_report_id = ${reportId} ORDER BY id`,
    ])

    const pdf = await buildSitrepPdf({
      ...report,
      id: reportId,
      victims,
      damages,
      refugees,
      needs,
      documents,
    })

    const filename = `sitrep-${reportId}.pdf`
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error generating sitrep PDF:", error)
    return NextResponse.json({ success: false, error: "Failed to generate PDF" }, { status: 500 })
  }
}
