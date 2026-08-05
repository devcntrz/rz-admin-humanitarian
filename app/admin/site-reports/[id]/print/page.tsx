import { notFound } from "next/navigation"
import { sql } from "@/lib/db"
import { ReportPrintShell, PrintSection } from "@/components/admin/report-print-shell"
import { formatDateId, formatIncidentAtId } from "@/lib/format-report"

export const dynamic = "force-dynamic"
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function SiteReportPrintPage({ params }: PageProps) {
  const { id } = await params
  const reportId = parseInt(id)
  if (Number.isNaN(reportId)) notFound()

  const fetchedAt = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  const reports = await sql`
    SELECT
      r.id,
      r.subject,
      r.chronology,
      r.disaster_status,
      r.latest_condition,
      r.information_source,
      r.full_address,
      r.field_coordinator_id,
      to_char(r.report_date, 'YYYY-MM-DD') as report_date,
      r.incident_at,
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

  if (reports.length === 0) notFound()
  const report = reports[0]

  const [victims, damages, refugees, needs, documents] = await Promise.all([
    sql`
      SELECT victim_type, quantity, description
      FROM sr_victim_counts WHERE site_report_id = ${reportId} ORDER BY id
    `,
    sql`
      SELECT damage_type, quantity, unit, damage_level, description
      FROM sr_infrastructure_damages WHERE site_report_id = ${reportId} ORDER BY id
    `,
    sql`
      SELECT location_name, number_of_refugees, description
      FROM sr_refugee_infos WHERE site_report_id = ${reportId} ORDER BY id
    `,
    sql`
      SELECT need_item, quantity, unit, description
      FROM sr_urgent_needs WHERE site_report_id = ${reportId} ORDER BY id
    `,
    sql`
      SELECT file_url, description
      FROM sr_documentations WHERE site_report_id = ${reportId} ORDER BY id
    `,
  ])

  const locationParts = [
    report.village_name,
    report.district_name,
    report.regency_name,
    report.province_name,
  ].filter(Boolean)

  const title =
    report.subject ||
    `${report.disaster_name || "Bencana"} ${report.regency_name || ""}`.trim()

  return (
    <ReportPrintShell
      title={title}
      subtitle={locationParts.join(", ")}
      reportLabel="Situation Report"
      reportDate={formatDateId(report.report_date)}
      reportId={reportId}
      fetchedAt={fetchedAt}
    >
      <PrintSection title="Informasi Kunci">
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <strong>Jenis Bencana:</strong> {report.disaster_name || "-"}
          </li>
          <li>
            <strong>Waktu Kejadian:</strong> {formatIncidentAtId(report.incident_at)}
          </li>
          <li>
            <strong>Volunteer:</strong> {report.volunteer_name || "-"}
          </li>
        </ol>
      </PrintSection>

      <PrintSection title="Kronologi Kejadian">
        <p className="whitespace-pre-wrap">{report.chronology || "-"}</p>
      </PrintSection>

      <PrintSection title="Status">
        <p className="whitespace-pre-wrap">{report.disaster_status || "-"}</p>
      </PrintSection>

      <PrintSection title="Kondisi Mutakhir">
        <p className="whitespace-pre-wrap">{report.latest_condition || "-"}</p>
      </PrintSection>

      <PrintSection title="Korban">
        {victims.length === 0 ? (
          <p>-</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-100">
                <th className="border p-2 text-left">Kategori</th>
                <th className="border p-2 text-left">Jumlah</th>
                <th className="border p-2 text-left">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {victims.map((v: any, i: number) => (
                <tr key={i}>
                  <td className="border p-2">{v.victim_type}</td>
                  <td className="border p-2">{v.quantity}</td>
                  <td className="border p-2">{v.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PrintSection>

      <PrintSection title="Kerugian Material">
        {damages.length === 0 ? (
          <p>-</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-100">
                <th className="border p-2 text-left">Jenis</th>
                <th className="border p-2 text-left">Jumlah</th>
                <th className="border p-2 text-left">Satuan</th>
                <th className="border p-2 text-left">Tingkat</th>
                <th className="border p-2 text-left">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {damages.map((d: any, i: number) => (
                <tr key={i}>
                  <td className="border p-2">{d.damage_type}</td>
                  <td className="border p-2">{d.quantity}</td>
                  <td className="border p-2">{d.unit}</td>
                  <td className="border p-2">{d.damage_level || "-"}</td>
                  <td className="border p-2">{d.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PrintSection>

      <PrintSection title="Pengungsi">
        {refugees.length === 0 ? (
          <p>-</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-100">
                <th className="border p-2 text-left">Lokasi</th>
                <th className="border p-2 text-left">Jumlah</th>
                <th className="border p-2 text-left">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {refugees.map((r: any, i: number) => (
                <tr key={i}>
                  <td className="border p-2">{r.location_name}</td>
                  <td className="border p-2">{r.number_of_refugees}</td>
                  <td className="border p-2">{r.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PrintSection>

      <PrintSection title="Wilayah Terdampak">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border p-2 text-left">Jenis</th>
              <th className="border p-2 text-left">Provinsi</th>
              <th className="border p-2 text-left">Kota</th>
              <th className="border p-2 text-left">Kecamatan</th>
              <th className="border p-2 text-left">Desa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">{report.disaster_name || "-"}</td>
              <td className="border p-2">{report.province_name || "-"}</td>
              <td className="border p-2">{report.regency_name || "-"}</td>
              <td className="border p-2">{report.district_name || "-"}</td>
              <td className="border p-2">{report.village_name || "-"}</td>
            </tr>
          </tbody>
        </table>
        {report.full_address && (
          <p className="mt-2">
            <strong>Alamat:</strong> {report.full_address}
          </p>
        )}
      </PrintSection>

      <PrintSection title="Kebutuhan Mendesak">
        {needs.length === 0 ? (
          <p>-</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {needs.map((n: any, i: number) => (
              <li key={i}>
                {n.need_item} — {n.quantity} {n.unit}
                {n.description ? ` (${n.description})` : ""}
              </li>
            ))}
          </ul>
        )}
      </PrintSection>

      <PrintSection title="Kontak SDM">
        <p>
          <strong>Koordinator Lapangan:</strong>{" "}
          {report.field_coordinator_name || "-"}
          {report.field_coordinator_phone ? ` · ${report.field_coordinator_phone}` : ""}
        </p>
      </PrintSection>

      <PrintSection title="Sumber Informasi">
        <p className="whitespace-pre-wrap">{report.information_source || "-"}</p>
      </PrintSection>

      <PrintSection title="Dokumentasi">
        {documents.length === 0 ? (
          <p>-</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {documents.map((doc: any, i: number) => {
              const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(doc.file_url || "")
              return (
                <div key={i} className="border p-2 break-inside-avoid">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.file_url}
                      alt={doc.description || `Dokumentasi ${i + 1}`}
                      className="max-h-48 w-full object-cover"
                    />
                  ) : (
                    <a href={doc.file_url} className="text-[#ff6600] underline break-all">
                      {doc.file_url}
                    </a>
                  )}
                  {doc.description && (
                    <p className="mt-1 text-xs text-neutral-600">{doc.description}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </PrintSection>

      <PrintSection title="Penutup">
        <p>
          Laporan ini disusun dengan tujuan menyediakan informasi dan diharapkan dapat menjadi
          pertimbangan dalam proses pengambilan keputusan.
        </p>
      </PrintSection>
    </ReportPrintShell>
  )
}
