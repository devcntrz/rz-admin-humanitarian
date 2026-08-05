import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { buildDistrepPdf } from "@/lib/pdf-reports"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const distributionId = parseInt(id)
    if (Number.isNaN(distributionId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    const reports = await sql`
      SELECT
        dr.id, dr.event_name, dr.spk_number, dr.full_address,
        dr.beneficiary_count, dr.volunteer_count,
        dr.latitude, dr.longitude,
        to_char(dr.event_date, 'YYYY-MM-DD') as event_date,
        v.full_name as volunteer_name,
        v.phone_number as volunteer_phone,
        d.name as disaster_name,
        vill.name as village_name,
        dist.name as district_name,
        reg.name as regency_name,
        prov.name as province_name
      FROM distribution_reports dr
      LEFT JOIN volunteers v ON v.id = dr.pic_volunteer_id
      LEFT JOIN disaster_types d ON d.id = dr.disaster_type_id
      LEFT JOIN villages vill ON vill.id = dr.village_id
      LEFT JOIN districts dist ON dist.id = COALESCE(dr.district_id, vill.district_id)
      LEFT JOIN regencies reg ON reg.id = COALESCE(dr.regency_id, dist.regency_id)
      LEFT JOIN provinces prov ON prov.id = COALESCE(dr.province_id, reg.province_id)
      WHERE dr.id = ${distributionId}
    `

    if (reports.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }

    const report = reports[0]
    const [clusters, partners, documents] = await Promise.all([
      sql`SELECT cluster_name, program_name, quantity, unit, description FROM dr_clusters WHERE distribution_report_id = ${distributionId} ORDER BY id`,
      sql`SELECT partner_name, description FROM dr_partners WHERE distribution_report_id = ${distributionId} ORDER BY id`,
      sql`SELECT file_url, description FROM dr_documentations WHERE distribution_report_id = ${distributionId} ORDER BY id`,
    ])

    const pdf = await buildDistrepPdf({
      ...report,
      id: distributionId,
      clusters,
      partners,
      documents,
    })

    const filename = `distrep-${distributionId}.pdf`
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error generating distrep PDF:", error)
    return NextResponse.json({ success: false, error: "Failed to generate PDF" }, { status: 500 })
  }
}
