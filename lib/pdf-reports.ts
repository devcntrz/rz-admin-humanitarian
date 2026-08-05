import path from "path"
import PDFDocument from "pdfkit"
import { formatDateId, formatIncidentAtId } from "@/lib/format-report"

const ORANGE = "#ff6600"
const TEXT = "#222222"
const MUTED = "#555555"

// Local TTF fonts — avoids pdfkit AFM files from pnpm symlinks (breaks Vercel packaging)
const FONT_REG = path.join(process.cwd(), "assets/fonts/Geist-Regular.ttf")
const FONT_BOLD = path.join(process.cwd(), "assets/fonts/Geist-Bold.ttf")
const FONT = "Body"
const FONT_BOLD_NAME = "BodyBold"

function createDoc(info: { Title: string; Author: string }) {
  const doc = new PDFDocument({
    margin: 48,
    size: "A4",
    info,
    font: FONT_REG,
  })
  doc.registerFont(FONT, FONT_REG)
  doc.registerFont(FONT_BOLD_NAME, FONT_BOLD)
  doc.font(FONT)
  return doc
}

function collectPdf(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on("data", (chunk) => chunks.push(chunk as Buffer))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
  })
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.6)
  const y = doc.y
  doc.rect(doc.page.margins.left, y, 4, 14).fill(ORANGE)
  doc
    .fillColor(ORANGE)
    .fontSize(11)
    .font("BodyBold")
    .text(title.toUpperCase(), doc.page.margins.left + 10, y)
  doc.fillColor(TEXT).font("Body").fontSize(10)
  doc.moveDown(0.3)
}

function ensureSpace(doc: PDFKit.PDFDocument, needed = 80) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage()
  }
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  opts: { reportLabel: string; reportDate: string; title: string; subtitle?: string }
) {
  doc.fillColor(ORANGE).fontSize(16).font("BodyBold").text("RUMAH ZAKAT", { continued: false })
  doc.fillColor(MUTED).fontSize(8).font("Body").text("www.rumahzakat.org")

  doc
    .fillColor(TEXT)
    .fontSize(10)
    .font("BodyBold")
    .text(opts.reportLabel, { align: "right" })
  doc.font("Body").fontSize(9).text(opts.reportDate, { align: "right" })

  doc.moveDown(0.4)
  doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor(ORANGE).lineWidth(2).stroke()
  doc.moveDown(0.5)

  doc.fillColor(ORANGE).fontSize(16).font("BodyBold").text(opts.title.toUpperCase())
  if (opts.subtitle) {
    doc.fillColor(MUTED).fontSize(9).font("Body").text(opts.subtitle)
  }
  doc.fillColor(TEXT).font("Body").fontSize(10)
  doc.moveDown(0.3)
}

type DocItem = { file_url: string; description?: string | null }

function parseCoord(value: unknown): number | null {
  if (value == null || value === "") return null
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function staticMapUrl(lat: number, lng: number) {
  // Yandex Static Maps — no API token required
  return `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&size=650,350&z=10&l=map&pt=${lng},${lat},pm2rdm`
}

async function fetchStaticMapBuffer(lat: number, lng: number): Promise<Buffer | null> {
  try {
    const res = await fetch(staticMapUrl(lat, lng), {
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": "RZAdminHumanitarian/1.0 (welcome@rumahzakat.org)",
      },
    })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") || ""
    if (!contentType.includes("image") && !contentType.includes("octet-stream")) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function drawLocationMap(
  doc: PDFKit.PDFDocument,
  latitude: unknown,
  longitude: unknown
) {
  const lat = parseCoord(latitude)
  const lng = parseCoord(longitude)
  sectionTitle(doc, "Peta Lokasi")
  if (lat == null || lng == null) {
    doc.text("-")
    return
  }

  const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=10/${lat}/${lng}`
  doc.text(`Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
  doc
    .fillColor(ORANGE)
    .fontSize(8)
    .text("Buka di OpenStreetMap", { link: osmLink, underline: true })
  doc.fillColor(TEXT).font("Body").fontSize(10)

  const buf = await fetchStaticMapBuffer(lat, lng)
  if (!buf) {
    doc.fillColor(MUTED).fontSize(9).text("Peta tidak dapat dimuat.")
    doc.fillColor(TEXT).fontSize(10)
    return
  }

  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const mapH = 190
  ensureSpace(doc, mapH + 28)
  const x = doc.page.margins.left
  const y = doc.y
  try {
    doc.image(buf, x, y, { fit: [contentWidth, mapH], align: "center" })
    doc.strokeColor("#dddddd").rect(x, y, contentWidth, mapH).stroke()
    doc.y = y + mapH + 4
    doc.fillColor(MUTED).fontSize(7).text("Sumber peta: Yandex")
  } catch {
    doc.fillColor(MUTED).fontSize(9).text("Peta tidak dapat ditampilkan.")
  }
  doc.fillColor(TEXT).font("Body").fontSize(10)
}

function isImageUrl(url: string, contentType?: string | null) {
  if (contentType && /image\/(jpeg|jpg|png|gif)/i.test(contentType)) return true
  return /\.(jpe?g|png|gif)(\?|$)/i.test(url)
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type")
    if (!isImageUrl(url, contentType)) return null
    const ab = await res.arrayBuffer()
    return Buffer.from(ab)
  } catch {
    return null
  }
}

async function drawDocumentation(doc: PDFKit.PDFDocument, documents: DocItem[]) {
  sectionTitle(doc, "Dokumentasi")
  if (!documents.length) {
    doc.text("-")
    return
  }

  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const gap = 12
  const imgWidth = (contentWidth - gap) / 2
  const imgHeight = 150
  let col = 0
  let rowY = doc.y

  for (let i = 0; i < documents.length; i++) {
    const item = documents[i]
    ensureSpace(doc, imgHeight + 36)
    if (col === 0) rowY = doc.y

    const x = doc.page.margins.left + col * (imgWidth + gap)
    const buf = await fetchImageBuffer(item.file_url)

    if (buf) {
      try {
        doc.image(buf, x, rowY, { fit: [imgWidth, imgHeight], align: "center", valign: "center" })
        doc
          .strokeColor("#dddddd")
          .rect(x, rowY, imgWidth, imgHeight)
          .stroke()
      } catch {
        doc
          .fillColor(TEXT)
          .fontSize(8)
          .text(`Dokumentasi ${i + 1} (gagal load gambar)`, x, rowY, { width: imgWidth })
        doc
          .fillColor(ORANGE)
          .text(item.file_url, x, rowY + 14, { width: imgWidth, link: item.file_url, underline: true })
      }
    } else {
      doc
        .fillColor(TEXT)
        .font("BodyBold")
        .fontSize(9)
        .text(`Dokumentasi ${i + 1}`, x, rowY, { width: imgWidth })
      doc
        .fillColor(MUTED)
        .font("Body")
        .fontSize(8)
        .text(item.description || "File dokumentasi", x, rowY + 14, { width: imgWidth })
      doc
        .fillColor(ORANGE)
        .text(item.file_url, x, rowY + 30, { width: imgWidth, link: item.file_url, underline: true })
    }

    if (item.description && buf) {
      doc
        .fillColor(MUTED)
        .font("Body")
        .fontSize(8)
        .text(item.description, x, rowY + imgHeight + 4, { width: imgWidth, ellipsis: true })
    }

    col += 1
    if (col >= 2) {
      col = 0
      doc.y = rowY + imgHeight + (item.description ? 22 : 12)
    }
  }

  if (col !== 0) {
    doc.y = rowY + imgHeight + 22
  }

  doc.fillColor(TEXT).font("Body").fontSize(10)
}

function drawTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  colWidths: number[]
) {
  ensureSpace(doc, 40 + rows.length * 18)
  const startX = doc.page.margins.left
  let y = doc.y
  const rowH = 16

  doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowH).fill("#fff3e6")
  doc.fillColor(ORANGE).font("BodyBold").fontSize(8)
  let x = startX
  headers.forEach((h, i) => {
    doc.text(h, x + 3, y + 4, { width: colWidths[i] - 6, ellipsis: true })
    x += colWidths[i]
  })
  y += rowH

  doc.fillColor(TEXT).font("Body").fontSize(8)
  rows.forEach((row) => {
    if (y + rowH > doc.page.height - doc.page.margins.bottom) {
      doc.addPage()
      y = doc.page.margins.top
    }
    x = startX
    row.forEach((cell, i) => {
      doc.text(cell || "-", x + 3, y + 4, { width: colWidths[i] - 6, ellipsis: true })
      x += colWidths[i]
    })
    doc
      .strokeColor("#eeeeee")
      .moveTo(startX, y + rowH)
      .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y + rowH)
      .stroke()
    y += rowH
  })
  doc.y = y + 6
  doc.fillColor(TEXT).font("Body").fontSize(10)
}

export type SitrepPdfData = {
  id: number
  subject?: string | null
  report_date?: string | null
  incident_at?: string | Date | null
  disaster_name?: string | null
  volunteer_name?: string | null
  chronology?: string | null
  disaster_status?: string | null
  latest_condition?: string | null
  information_source?: string | null
  full_address?: string | null
  field_coordinator_name?: string | null
  field_coordinator_phone?: string | null
  village_name?: string | null
  district_name?: string | null
  regency_name?: string | null
  province_name?: string | null
  victims: { victim_type: string; quantity: number; description?: string | null }[]
  damages: {
    damage_type: string
    quantity: number
    unit: string
    damage_level?: string | null
    description?: string | null
  }[]
  refugees: { location_name: string; number_of_refugees: number; description?: string | null }[]
  needs: { need_item: string; quantity: number; unit: string; description?: string | null }[]
  documents: DocItem[]
  latitude?: string | number | null
  longitude?: string | number | null
}

export async function buildSitrepPdf(data: SitrepPdfData): Promise<Buffer> {
  const doc = createDoc({ Title: `Sitrep #${data.id}`, Author: "Rumah Zakat" })
  const done = collectPdf(doc)

  const location = [data.village_name, data.district_name, data.regency_name, data.province_name]
    .filter(Boolean)
    .join(", ")
  const title = data.subject || `${data.disaster_name || "Bencana"} ${data.regency_name || ""}`.trim()

  drawHeader(doc, {
    reportLabel: "Situation Report",
    reportDate: formatDateId(data.report_date),
    title,
    subtitle: location || undefined,
  })

  sectionTitle(doc, "Informasi Kunci")
  doc.text(`1. Jenis Bencana: ${data.disaster_name || "-"}`)
  doc.text(`2. Waktu Kejadian: ${formatIncidentAtId(data.incident_at)}`)
  doc.text(`3. Volunteer: ${data.volunteer_name || "-"}`)

  sectionTitle(doc, "Kronologi Kejadian")
  doc.text(data.chronology || "-", { align: "justify" })

  sectionTitle(doc, "Status")
  doc.text(data.disaster_status || "-", { align: "justify" })

  sectionTitle(doc, "Kondisi Mutakhir")
  doc.text(data.latest_condition || "-", { align: "justify" })

  sectionTitle(doc, "Korban")
  if (data.victims.length === 0) {
    doc.text("-")
  } else {
    drawTable(
      doc,
      ["Kategori", "Jumlah", "Deskripsi"],
      data.victims.map((v) => [v.victim_type, String(v.quantity), v.description || "-"]),
      [160, 70, 265]
    )
  }

  sectionTitle(doc, "Kerugian Material")
  if (data.damages.length === 0) {
    doc.text("-")
  } else {
    drawTable(
      doc,
      ["Jenis", "Jumlah", "Satuan", "Tingkat", "Deskripsi"],
      data.damages.map((d) => [
        d.damage_type,
        String(d.quantity),
        d.unit,
        d.damage_level || "-",
        d.description || "-",
      ]),
      [110, 50, 55, 70, 210]
    )
  }

  sectionTitle(doc, "Pengungsi")
  if (data.refugees.length === 0) {
    doc.text("-")
  } else {
    drawTable(
      doc,
      ["Lokasi", "Jumlah", "Deskripsi"],
      data.refugees.map((r) => [r.location_name, String(r.number_of_refugees), r.description || "-"]),
      [160, 70, 265]
    )
  }

  sectionTitle(doc, "Wilayah Terdampak")
  drawTable(
    doc,
    ["Jenis", "Provinsi", "Kab/Kota", "Kecamatan", "Desa"],
    [
      [
        data.disaster_name || "-",
        data.province_name || "-",
        data.regency_name || "-",
        data.district_name || "-",
        data.village_name || "-",
      ],
    ],
    [80, 100, 110, 100, 105]
  )
  if (data.full_address) doc.text(`Alamat: ${data.full_address}`)

  await drawLocationMap(doc, data.latitude, data.longitude)

  sectionTitle(doc, "Kebutuhan Mendesak")
  if (data.needs.length === 0) {
    doc.text("-")
  } else {
    data.needs.forEach((n) => {
      doc.text(`• ${n.need_item} — ${n.quantity} ${n.unit}${n.description ? ` (${n.description})` : ""}`)
    })
  }

  sectionTitle(doc, "Kontak SDM")
  doc.text(
    `Koordinator Lapangan: ${data.field_coordinator_name || "-"}${
      data.field_coordinator_phone ? ` · ${data.field_coordinator_phone}` : ""
    }`
  )

  sectionTitle(doc, "Sumber Informasi")
  doc.text(data.information_source || "-")

  await drawDocumentation(doc, data.documents || [])

  sectionTitle(doc, "Penutup")
  doc.text(
    "Laporan ini disusun dengan tujuan menyediakan informasi dan diharapkan dapat menjadi pertimbangan dalam proses pengambilan keputusan.",
    { align: "justify" }
  )

  doc.moveDown(1)
  doc.fillColor(MUTED).fontSize(8)
  doc.text("Kantor Pusat — Jl. Turangga No.33, Lengkong, Kota Bandung, Jawa Barat 40275")
  doc.text("WA Center: 0815 7300 1555 · Email: welcome@rumahzakat.org")

  doc.end()
  return done
}

export type DistrepPdfData = {
  id: number
  event_name: string
  event_date?: string | null
  spk_number?: string | null
  disaster_name?: string | null
  volunteer_name?: string | null
  volunteer_phone?: string | null
  beneficiary_count?: number | null
  volunteer_count?: number | null
  full_address?: string | null
  village_name?: string | null
  district_name?: string | null
  regency_name?: string | null
  province_name?: string | null
  clusters: {
    cluster_name: string
    program_name: string
    quantity: number
    unit: string
    description?: string | null
  }[]
  partners: { partner_name: string; description?: string | null }[]
  documents: DocItem[]
  latitude?: string | number | null
  longitude?: string | number | null
}

export async function buildDistrepPdf(data: DistrepPdfData): Promise<Buffer> {
  const doc = createDoc({ Title: `Distrep #${data.id}`, Author: "Rumah Zakat" })
  const done = collectPdf(doc)

  const location = [data.village_name, data.district_name, data.regency_name, data.province_name]
    .filter(Boolean)
    .join(", ")

  drawHeader(doc, {
    reportLabel: "Distribution Report",
    reportDate: formatDateId(data.event_date),
    title: data.event_name,
    subtitle: location || undefined,
  })

  sectionTitle(doc, "Informasi Kegiatan")
  doc.text(`1. Nama Kegiatan: ${data.event_name}`)
  doc.text(`2. Tanggal: ${formatDateId(data.event_date)}`)
  doc.text(`3. No. SPK: ${data.spk_number || "-"}`)
  doc.text(`4. Jenis Bencana: ${data.disaster_name || "-"}`)
  doc.text(
    `5. PIC Volunteer: ${data.volunteer_name || "-"}${
      data.volunteer_phone ? ` · ${data.volunteer_phone}` : ""
    }`
  )
  doc.text(`6. Jumlah Penerima Manfaat: ${data.beneficiary_count ?? "-"}`)
  doc.text(`7. Jumlah Relawan: ${data.volunteer_count ?? "-"}`)
  if (data.full_address) doc.text(`Alamat: ${data.full_address}`)

  sectionTitle(doc, "Wilayah")
  drawTable(
    doc,
    ["Provinsi", "Kab/Kota", "Kecamatan", "Desa"],
    [
      [
        data.province_name || "-",
        data.regency_name || "-",
        data.district_name || "-",
        data.village_name || "-",
      ],
    ],
    [120, 130, 130, 115]
  )

  await drawLocationMap(doc, data.latitude, data.longitude)

  sectionTitle(doc, "Cluster / Program")
  if (data.clusters.length === 0) {
    doc.text("-")
  } else {
    drawTable(
      doc,
      ["Cluster", "Program", "Jumlah", "Satuan", "Deskripsi"],
      data.clusters.map((c) => [
        c.cluster_name,
        c.program_name,
        String(c.quantity),
        c.unit,
        c.description || "-",
      ]),
      [100, 120, 50, 55, 170]
    )
  }

  sectionTitle(doc, "Mitra")
  if (data.partners.length === 0) {
    doc.text("-")
  } else {
    data.partners.forEach((p) => {
      doc.text(`• ${p.partner_name}${p.description ? ` — ${p.description}` : ""}`)
    })
  }

  await drawDocumentation(doc, data.documents || [])

  sectionTitle(doc, "Penutup")
  doc.text(
    "Laporan ini disusun dengan tujuan menyediakan informasi dan diharapkan dapat menjadi pertimbangan dalam proses pengambilan keputusan.",
    { align: "justify" }
  )

  doc.moveDown(1)
  doc.fillColor(MUTED).fontSize(8)
  doc.text("Kantor Pusat — Jl. Turangga No.33, Lengkong, Kota Bandung, Jawa Barat 40275")
  doc.text("WA Center: 0815 7300 1555 · Email: welcome@rumahzakat.org")

  doc.end()
  return done
}
