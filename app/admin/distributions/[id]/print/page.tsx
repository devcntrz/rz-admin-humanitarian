import { notFound } from "next/navigation"
import { sql } from "@/lib/db"
import { ReportPrintShell, PrintSection } from "@/components/admin/report-print-shell"
import { formatDateId } from "@/lib/format-report"

export const dynamic = "force-dynamic"
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function DistributionPrintPage({ params }: PageProps) {
  const { id } = await params
  const distributionId = parseInt(id)
  if (Number.isNaN(distributionId)) notFound()

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
    SELECT dr.*,
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

  if (reports.length === 0) notFound()
  const report = reports[0]

  const [clusters, partners, documents] = await Promise.all([
    sql`
      SELECT cluster_name, program_name, quantity, unit, description
      FROM dr_clusters WHERE distribution_report_id = ${distributionId} ORDER BY id
    `,
    sql`
      SELECT partner_name, description
      FROM dr_partners WHERE distribution_report_id = ${distributionId} ORDER BY id
    `,
    sql`
      SELECT file_url, description
      FROM dr_documentations WHERE distribution_report_id = ${distributionId} ORDER BY id
    `,
  ])

  const locationParts = [
    report.village_name,
    report.district_name,
    report.regency_name,
    report.province_name,
  ].filter(Boolean)

  return (
    <ReportPrintShell
      title={report.event_name}
      subtitle={locationParts.join(", ")}
      reportLabel="Distribution Report"
      reportDate={formatDateId(report.event_date)}
      reportId={distributionId}
      fetchedAt={fetchedAt}
    >
      <PrintSection title="Informasi Kegiatan">
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <strong>Nama Kegiatan:</strong> {report.event_name}
          </li>
          <li>
            <strong>Tanggal:</strong> {formatDateId(report.event_date)}
          </li>
          <li>
            <strong>No. SPK:</strong> {report.spk_number || "-"}
          </li>
          <li>
            <strong>Jenis Bencana:</strong> {report.disaster_name || "-"}
          </li>
          <li>
            <strong>PIC Volunteer:</strong> {report.volunteer_name || "-"}
            {report.volunteer_phone ? ` · ${report.volunteer_phone}` : ""}
          </li>
          <li>
            <strong>Jumlah Penerima Manfaat:</strong> {report.beneficiary_count ?? "-"}
          </li>
          <li>
            <strong>Jumlah Relawan:</strong> {report.volunteer_count ?? "-"}
          </li>
        </ol>
        {report.full_address && (
          <p className="mt-2">
            <strong>Alamat:</strong> {report.full_address}
          </p>
        )}
      </PrintSection>

      <PrintSection title="Wilayah">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border p-2 text-left">Provinsi</th>
              <th className="border p-2 text-left">Kab/Kota</th>
              <th className="border p-2 text-left">Kecamatan</th>
              <th className="border p-2 text-left">Desa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">{report.province_name || "-"}</td>
              <td className="border p-2">{report.regency_name || "-"}</td>
              <td className="border p-2">{report.district_name || "-"}</td>
              <td className="border p-2">{report.village_name || "-"}</td>
            </tr>
          </tbody>
        </table>
      </PrintSection>

      <PrintSection title="Cluster / Program">
        {clusters.length === 0 ? (
          <p>-</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-100">
                <th className="border p-2 text-left">Cluster</th>
                <th className="border p-2 text-left">Program</th>
                <th className="border p-2 text-left">Jumlah</th>
                <th className="border p-2 text-left">Satuan</th>
                <th className="border p-2 text-left">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {clusters.map((c: any, i: number) => (
                <tr key={i}>
                  <td className="border p-2">{c.cluster_name}</td>
                  <td className="border p-2">{c.program_name}</td>
                  <td className="border p-2">{c.quantity}</td>
                  <td className="border p-2">{c.unit}</td>
                  <td className="border p-2">{c.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PrintSection>

      <PrintSection title="Mitra">
        {partners.length === 0 ? (
          <p>-</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {partners.map((p: any, i: number) => (
              <li key={i}>
                {p.partner_name}
                {p.description ? ` — ${p.description}` : ""}
              </li>
            ))}
          </ul>
        )}
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
