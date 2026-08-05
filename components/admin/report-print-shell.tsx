"use client"

import Image from "next/image"
import { ReactNode } from "react"
import { PrintAuto } from "@/components/admin/print-auto"

type ReportPrintShellProps = {
  title: string
  subtitle?: string
  reportLabel?: string
  reportDate?: string | null
  children: ReactNode
  /** Shown in toolbar — when data was fetched from DB */
  fetchedAt?: string
  reportId?: number | string
}

export function ReportPrintShell({
  title,
  subtitle,
  reportLabel = "Situation Report",
  reportDate,
  children,
  fetchedAt,
  reportId,
}: ReportPrintShellProps) {
  return (
    <div className="report-print-root bg-neutral-100 text-black min-h-screen">
      <PrintAuto />
      <style>{`
        @media print {
          @page { margin: 12mm; size: A4; }
          body { background: white !important; }
          body * { visibility: hidden; }
          .report-print-root, .report-print-root * { visibility: visible; }
          .report-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
          }
          .report-print-paper {
            box-shadow: none !important;
            margin: 0 !important;
            max-width: none !important;
            padding: 0 !important;
          }
          .no-print { display: none !important; }
        }
        body.print-page-mode aside,
        body.print-page-mode main > div:first-child {
          display: none !important;
        }
        body.print-page-mode main {
          padding: 0 !important;
          margin: 0 !important;
          background: #f5f5f5 !important;
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 border-b bg-white/95 backdrop-blur px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[900px] flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#ff6600]">
              Live PDF Preview
              {reportId != null ? ` · #${reportId}` : ""}
            </p>
            <p className="text-xs text-neutral-500">
              Data diambil langsung dari database
              {fetchedAt ? ` · ${fetchedAt}` : ""}. Isi field kosong lewat Edit Sitrep,
              lalu klik Refresh.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-100"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-[#ff6600] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#e65c00]"
            >
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      <div className="report-print-paper mx-auto my-6 max-w-[900px] bg-white px-8 py-10 shadow-md print:my-0 print:shadow-none">
        <header className="mb-6 border-b-2 border-[#ff6600] pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 bg-[#ff6600] rounded-md p-1">
                <Image
                  src="/images/rz_whote.png"
                  alt="Rumah Zakat"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>
              <div>
                <p className="text-lg font-bold tracking-wide text-[#ff6600]">RUMAH ZAKAT</p>
                <p className="text-xs text-neutral-600">www.rumahzakat.org</p>
              </div>
            </div>
            {reportDate && (
              <div className="text-right text-sm">
                <p className="font-semibold">{reportLabel}</p>
                <p>{reportDate}</p>
              </div>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold uppercase leading-tight text-[#ff6600]">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-neutral-700">{subtitle}</p>}
        </header>
        {children}
        <footer className="mt-10 border-t pt-4 text-xs text-neutral-600">
          <p className="font-semibold text-neutral-800">ALAMAT KANTOR</p>
          <p>
            Kantor Pusat — Jl. Turangga No.33 Kelurahan Lingkar Selatan, Kec. Lengkong, Kota Bandung,
            Jawa Barat 40275
          </p>
          <p>WA Center: 0815 7300 1555 · Email: welcome@rumahzakat.org</p>
        </footer>
      </div>
    </div>
  )
}

export function PrintSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-2 border-l-4 border-[#ff6600] pl-2 text-sm font-bold uppercase tracking-wide text-[#ff6600]">
        {title}
      </h2>
      <div className="text-sm leading-relaxed text-neutral-800">{children}</div>
    </section>
  )
}
