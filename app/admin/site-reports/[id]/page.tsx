"use client"

import { useState, useEffect, use } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SiteReportTabs } from "@/components/admin/site-report-tabs"
import { apiClient } from "@/lib/api"
import { ArrowLeft, MapPin, Calendar, User, AlertTriangle, FileText, Clipboard, ExternalLink } from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"

interface SituationReportDetailPageProps {
  params: Promise<{ id: string }>
}

export default function SituationReportDetailPage({ params }: SituationReportDetailPageProps) {
  const MapPreview = dynamic(() => import("@/components/admin/map-preview").then(m => m.MapPreview), { ssr: false })
  const router = useRouter()
  const [siteReport, setSiteReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const resolvedParams = use(params)
  const [copied, setCopied] = useState(false)

  const loadSiteReport = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getSiteReport(parseInt(resolvedParams.id))
      if (response.success && response.data) {
        setSiteReport(response.data)
      }
    } catch (error) {
      console.error('Error loading site report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSiteReport()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!siteReport) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-muted-foreground">Situation Report tidak ditemukan</h2>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Situation Report #{siteReport.id}</h1>
            <p className="text-muted-foreground">Detail laporan situasi bencana</p>
          </div>
        </div>
      </div>

      {/* Informasi Utama */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informasi Utama
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {siteReport.subject && (
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  Subjek Laporan
                </div>
                <p className="text-lg font-semibold tracking-tight">{siteReport.subject}</p>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Volunteer
          </div>
              <p className="text-lg">{siteReport.volunteer_name || '-'}</p>
              {siteReport.volunteer_email && (
                <p className="text-sm text-muted-foreground">{siteReport.volunteer_email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Lokasi
              </div>
              <p className="text-lg">{siteReport.village_name || '-'}</p>
              <p className="text-sm text-muted-foreground">
                {siteReport.district_name}, {siteReport.regency_name}, {siteReport.province_name}
            </p>
          </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                Jenis Bencana
              </div>
              <p className="text-lg">{siteReport.disaster_name || '-'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Tanggal Laporan
              </div>
              <p className="text-lg">{siteReport.report_date}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                Status
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                siteReport.status === 'submitted' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              }`}>
                {siteReport.status}
              </span>
            </div>

            {siteReport.full_address && (
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Alamat Lengkap
                </div>
                <p className="text-lg">{siteReport.full_address}</p>
              </div>
            )}
          </div>

          {(siteReport.latitude !== null && siteReport.latitude !== undefined && siteReport.longitude !== null && siteReport.longitude !== undefined) && (
            <>
              <div className="px-6 pb-4">
                <div className="space-y-3 w-full">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Koordinat
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="text-lg font-medium tracking-tight">
                      {Number(siteReport.latitude).toFixed(6)}, {Number(siteReport.longitude).toFixed(6)}
                      <span className="ml-2 text-xs text-muted-foreground align-middle">WGS84</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${siteReport.latitude}, ${siteReport.longitude}`)
                            setCopied(true)
                            setTimeout(() => setCopied(false), 1500)
                          } catch {}
                        }}
                        title="Salin koordinat"
                      >
                        <Clipboard className="h-4 w-4 mr-2" />
                        {copied ? 'Disalin' : 'Salin'}
                      </Button>
                      <a
                        href={`https://www.google.com/maps?q=${siteReport.latitude},${siteReport.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka di Google Maps"
                        className="inline-flex"
                      >
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Buka di Maps
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full -mx-6 mb-6">
                <MapPreview 
                  latitude={Number(siteReport.latitude)} 
                  longitude={Number(siteReport.longitude)} 
                  label={`Situation Report #${siteReport.id}`} 
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs Content */}
      <SiteReportTabs siteReportId={parseInt(resolvedParams.id)} />
    </div>
  )
}