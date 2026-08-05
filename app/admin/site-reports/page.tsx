"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalTitle, 
  ModalFooter, 
  ModalTrigger 
} from "@/components/ui/modal"
import { ElegantPagination } from "@/components/ui/elegant-pagination"
import {
  DataTable,
  DataTableBody,
  DataTableEmpty,
  DataTableHead,
  DataTableHeadRow,
  DataTableRow,
  DataTableShell,
  DataTableTd,
  DataTableTh,
} from "@/components/ui/data-table"
import { apiClient } from "@/lib/api"
import { Edit, Trash2, Eye, Download, Filter, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'
import Select from 'react-select'

const MapPicker = dynamic(
  () => import("@/components/admin/map-picker").then((m) => m.MapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="md:col-span-2 h-[260px] rounded-lg border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground">
        Memuat peta...
      </div>
    ),
  }
)

type ReportRow = {
  id: number
  report_date: string
  status: string
  subject?: string | null
  volunteer_id: number | null
  volunteer: string | null
  disaster: string | null
  village: string | null
  district?: string | null
  regency?: string | null
  province?: string | null
  incident_at?: string | null
  disaster_status?: string | null
  field_coordinator_id?: number | null
  field_coordinator?: string | null
}

type FieldCoordinator = { id: number; full_name: string; phone?: string | null }

const emptyFormData = {
  subject: "",
  volunteer_id: "",
  disaster_type_id: "",
  province_id: "",
  regency_id: "",
  district_id: "",
  village_id: "",
  full_address: "",
  latitude: "",
  longitude: "",
  report_date: new Date().toISOString().slice(0, 10),
  status: "draft",
  incident_date: "",
  incident_time: "",
  chronology: "",
  disaster_status: "",
  latest_condition: "",
  field_coordinator_id: "",
  information_source: "",
}

type Options = {
  volunteers: { id: number; full_name: string }[]
  disasterTypes: { id: number; name: string }[]
  villages: { id: string; name: string }[]
}

export default function SituationReportsPage() {
  const { toast } = useToast()
  const [reports, setReports] = useState<ReportRow[]>([])
  const [options, setOptions] = useState<Options>({
    volunteers: [],
    disasterTypes: [],
    villages: []
  })
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([])
  const [regencies, setRegencies] = useState<{ id: string; name: string }[]>([])
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([])
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([])
  const [fieldCoordinators, setFieldCoordinators] = useState<FieldCoordinator[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [volunteerFilter, setVolunteerFilter] = useState<{value: number, label: string} | null>(null)
  const [allReports, setAllReports] = useState<ReportRow[]>([])
  const [formData, setFormData] = useState({ ...emptyFormData })
  const [editingReport, setEditingReport] = useState<ReportRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const paginateReports = (data: ReportRow[], page: number, pageSize: number) => {
    setAllReports(data)
    setTotalItems(data.length)
    setTotalPages(Math.max(1, Math.ceil(data.length / pageSize) || 1))
    const startIndex = (page - 1) * pageSize
    setReports(data.slice(startIndex, startIndex + pageSize))
    setCurrentPage(page)
  }

  const loadData = async (query?: string, page: number = 1, selectedVolunteer?: {value: number, label: string} | null, pageSize: number = itemsPerPage) => {
    try {
      setLoading(true)
      const [reportsResponse, optionsResponse, provincesResponse, coordinatorsResponse] = await Promise.all([
        apiClient.getSiteReports(query),
        apiClient.getOptions(),
        apiClient.getProvinces(),
        apiClient.getFieldCoordinators(),
      ])
      
      if (reportsResponse.success && reportsResponse.data) {
        let filteredReports = reportsResponse.data
        
        // Apply volunteer filter
        if (selectedVolunteer) {
          filteredReports = filteredReports.filter((report: ReportRow) => 
            report.volunteer_id === selectedVolunteer.value
          )
        }
        
        paginateReports(filteredReports, page, pageSize)
      }
      
      if (optionsResponse.success && optionsResponse.data) {
        setOptions(optionsResponse.data)
      }
      if (provincesResponse.success && provincesResponse.data) {
        setProvinces(provincesResponse.data)
      }
      if (coordinatorsResponse.success && coordinatorsResponse.data) {
        setFieldCoordinators(coordinatorsResponse.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data situation reports.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Cascading Wilayah Effects
  useEffect(() => {
    const fetchRegencies = async () => {
      if (!formData.province_id) {
        setRegencies([])
        return
      }
      const res = await apiClient.getRegencies(undefined, formData.province_id)
      if (res.success && res.data) setRegencies(res.data)
    }
    fetchRegencies()
  }, [formData.province_id])

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!formData.regency_id) {
        setDistricts([])
        return
      }
      const res = await apiClient.getDistricts(undefined, formData.regency_id, formData.province_id || undefined)
      if (res.success && res.data) setDistricts(res.data)
    }
    fetchDistricts()
  }, [formData.regency_id, formData.province_id])

  useEffect(() => {
    const fetchVillages = async () => {
      if (!formData.district_id) {
        setVillages([])
        return
      }
      const res = await apiClient.getVillages(undefined, formData.district_id, formData.regency_id || undefined, formData.province_id || undefined)
      if (res.success && res.data) setVillages(res.data)
    }
    fetchVillages()
  }, [formData.district_id])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadData(searchQuery, 1, volunteerFilter)
  }

  const handleVolunteerFilter = (selectedOption: {value: number, label: string} | null) => {
    setVolunteerFilter(selectedOption)
    setCurrentPage(1)
    loadData(searchQuery, 1, selectedOption)
  }

  const handlePageChange = (page: number) => {
    paginateReports(allReports, page, itemsPerPage)
  }

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size)
    paginateReports(allReports, 1, size)
  }

  const handleExportXLSX = () => {
    try {
      const exportData = allReports.map(report => ({
        'ID': report.id,
        'Subjek': report.subject || '-',
        'Tanggal Laporan': report.report_date,
        'Waktu Kejadian': report.incident_at || '-',
        'Status': report.status,
        'Status Bencana': report.disaster_status || '-',
        'Koordinator Lapangan': report.field_coordinator || '-',
        'Volunteer': report.volunteer || '-',
        'Jenis Bencana': report.disaster || '-',
        'Desa': report.village || '-',
        'Kecamatan': report.district || '-',
        'Kab/Kota': report.regency || '-',
        'Provinsi': report.province || '-',
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Situation Reports')
      
      const fileName = `situation-reports-${new Date().toISOString().slice(0, 10)}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      toast({
        title: "Sukses",
        description: "Data berhasil diekspor ke Excel.",
        variant: "default",
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "Error",
        description: "Gagal mengekspor data.",
        variant: "destructive",
      })
    }
  }

  const buildIncidentAt = () => {
    if (!formData.incident_date) return undefined
    const time = formData.incident_time || "00:00"
    return `${formData.incident_date}T${time}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const reportData = {
        subject: formData.subject || undefined,
        volunteer_id: formData.volunteer_id ? Number(formData.volunteer_id) : undefined,
        disaster_type_id: formData.disaster_type_id ? Number(formData.disaster_type_id) : undefined,
        province_id: formData.province_id || undefined,
        regency_id: formData.regency_id || undefined,
        district_id: formData.district_id || undefined,
        village_id: formData.village_id || undefined,
        full_address: formData.full_address || undefined,
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
        report_date: formData.report_date,
        status: formData.status,
        incident_at: buildIncidentAt(),
        chronology: formData.chronology || undefined,
        disaster_status: formData.disaster_status || undefined,
        latest_condition: formData.latest_condition || undefined,
        field_coordinator_id: formData.field_coordinator_id
          ? Number(formData.field_coordinator_id)
          : undefined,
        information_source: formData.information_source || undefined,
      }

      let response
      if (editingReport) {
        response = await apiClient.updateSiteReport(editingReport.id, reportData)
      } else {
        response = await apiClient.createSiteReport(reportData)
      }
      
      if (response.success) {
        toast({
          title: "Sukses",
          description: editingReport ? "Situation report berhasil diperbarui." : "Situation report berhasil ditambahkan.",
          variant: "default",
        })
        setFormData({ ...emptyFormData, report_date: new Date().toISOString().slice(0, 10) })
        setEditingReport(null)
        setIsModalOpen(false)
        loadData(searchQuery, currentPage, volunteerFilter)
      } else {
        toast({
          title: "Error",
          description: "Gagal menyimpan situation report.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving report:', error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan situation report.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (report: ReportRow) => {
    try {
      setEditingReport(report)
      // reset options terlebih dahulu agar re-render select stabil
      setRegencies([])
      setDistricts([])
      setVillages([])
      // Ambil data detail lengkap agar cascading terisi
      const detail = await apiClient.getSiteReport(report.id)
      const d = detail?.data || {}

      const incidentLocal = d.incident_at_local || ""
      const [incidentDate = "", incidentTime = ""] = incidentLocal
        ? incidentLocal.split("T")
        : ["", ""]

      setFormData({
        subject: d.subject || report.subject || "",
        volunteer_id: d.volunteer_id ? String(d.volunteer_id) : "",
        disaster_type_id: d.disaster_type_id ? String(d.disaster_type_id) : "",
        province_id: d.regency_province_id || d.province_id || "",
        regency_id: d.district_regency_id || d.regency_id || "",
        district_id: d.village_district_id || d.district_id || "",
        village_id: d.village_id || "",
        full_address: d.full_address || "",
        latitude: d.latitude != null ? String(d.latitude) : "",
        longitude: d.longitude != null ? String(d.longitude) : "",
        report_date: d.report_date || report.report_date,
        status: d.status || report.status || "draft",
        incident_date: incidentDate,
        incident_time: incidentTime ? incidentTime.slice(0, 5) : "",
        chronology: d.chronology || "",
        disaster_status: d.disaster_status || "",
        latest_condition: d.latest_condition || "",
        field_coordinator_id: d.field_coordinator_id ? String(d.field_coordinator_id) : "",
        information_source: d.information_source || "",
      })

      setIsModalOpen(true)
      // setelah open, fetch bertingkat secara berurutan untuk menjaga konsistensi
      if (d.regency_province_id || d.province_id) {
        const regRes = await apiClient.getRegencies(undefined, (d.regency_province_id || d.province_id) as string)
        if (regRes.success && regRes.data) setRegencies(regRes.data)
      }
      if (d.district_regency_id || d.regency_id) {
        const distRes = await apiClient.getDistricts(undefined, (d.district_regency_id || d.regency_id) as string, (d.regency_province_id || d.province_id) as string)
        if (distRes.success && distRes.data) setDistricts(distRes.data)
      }
      if (d.village_district_id || d.district_id) {
        const villRes = await apiClient.getVillages(undefined, (d.village_district_id || d.district_id) as string, (d.district_regency_id || d.regency_id) as string, (d.regency_province_id || d.province_id) as string)
        if (villRes.success && villRes.data) setVillages(villRes.data)
      }
    } catch (err) {
      console.error('Failed to load report detail for edit:', err)
      setIsModalOpen(true)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus laporan ini?')) {
      try {
        const response = await apiClient.deleteSiteReport(id)
        if (response.success) {
          toast({
            title: "Sukses",
            description: "Situation report berhasil dihapus.",
            variant: "default",
          })
          loadData(searchQuery, currentPage, volunteerFilter)
        } else {
          toast({
            title: "Error",
            description: "Gagal menghapus situation report.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error deleting report:', error)
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat menghapus situation report.",
          variant: "destructive",
        })
      }
    }
  }

  const handleView = (id: number) => {
    window.location.href = `/admin/site-reports/${id}`
  }

  const handlePrint = (id: number) => {
    window.open(`/api/site-reports/${id}/pdf`, "_blank")
  }

  const openCreateModal = () => {
    setEditingReport(null)
    setFormData({ ...emptyFormData, report_date: new Date().toISOString().slice(0, 10) })
    setIsModalOpen(true)
  }

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

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <Card className="min-w-0 max-w-full overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-balance">Situation Reports</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleExportXLSX} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={openCreateModal}>
              Tambah Situation Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 min-w-0">
          <div className="flex gap-2 flex-wrap">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID/volunteer/bencana/desa..." 
                className="min-w-[200px]"
              />
              <Button type="submit" variant="secondary">
                Cari
              </Button>
            </form>
            
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-[200px]">
                <Select
                  value={volunteerFilter}
                  onChange={handleVolunteerFilter}
                  options={options.volunteers.map(v => ({ value: v.id, label: v.full_name }))}
                  placeholder="Pilih Volunteer..."
                  isClearable
                  isSearchable
                  className="text-sm"
                  styles={{
                    control: (provided, state) => ({
                      ...provided,
                      minHeight: '36px',
                      fontSize: '14px',
                      borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--border))',
                      boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--ring))' : 'none',
                      '&:hover': {
                        borderColor: 'hsl(var(--border))',
                      },
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      fontSize: '14px',
                      backgroundColor: state.isSelected 
                        ? 'hsl(var(--primary))' 
                        : state.isFocused 
                        ? 'hsl(var(--muted))' 
                        : 'transparent',
                      color: state.isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: 'hsl(var(--muted-foreground))',
                    }),
                  }}
                />
              </div>
            </div>
          </div>
          <DataTableShell>
            <DataTable>
              <DataTableHead>
                <DataTableHeadRow>
                  <DataTableTh>ID</DataTableTh>
                  <DataTableTh>Subjek</DataTableTh>
                  <DataTableTh>Tanggal</DataTableTh>
                  <DataTableTh>Waktu Kejadian</DataTableTh>
                  <DataTableTh>Status</DataTableTh>
                  <DataTableTh>Status Bencana</DataTableTh>
                  <DataTableTh>Koordinator</DataTableTh>
                  <DataTableTh>Volunteer</DataTableTh>
                  <DataTableTh>Bencana</DataTableTh>
                  <DataTableTh>Wilayah</DataTableTh>
                  <DataTableTh stickyRight>Aksi</DataTableTh>
                </DataTableHeadRow>
              </DataTableHead>
              <DataTableBody>
                {reports.map((r) => {
                  const wilayah = [r.village, r.district, r.regency, r.province]
                    .filter(Boolean)
                    .join(", ")
                  return (
                  <DataTableRow key={r.id}>
                    <DataTableTd className="whitespace-nowrap">{r.id}</DataTableTd>
                    <DataTableTd className="max-w-[140px] truncate" title={r.subject || ''}>{r.subject ?? '-'}</DataTableTd>
                    <DataTableTd className="whitespace-nowrap">{r.report_date}</DataTableTd>
                    <DataTableTd className="whitespace-nowrap">{r.incident_at ?? "-"}</DataTableTd>
                    <DataTableTd>
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        r.status === 'submitted' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {r.status}
                      </span>
                    </DataTableTd>
                    <DataTableTd className="max-w-[120px] truncate" title={r.disaster_status || ''}>
                      {r.disaster_status ?? "-"}
                    </DataTableTd>
                    <DataTableTd className="max-w-[110px] truncate" title={r.field_coordinator || ''}>
                      {r.field_coordinator ?? "-"}
                    </DataTableTd>
                    <DataTableTd className="max-w-[110px] truncate" title={r.volunteer || ''}>
                      {r.volunteer ?? "-"}
                    </DataTableTd>
                    <DataTableTd className="whitespace-nowrap">{r.disaster ?? "-"}</DataTableTd>
                    <DataTableTd className="max-w-[180px] truncate" title={wilayah || ''}>
                      {wilayah || "-"}
                    </DataTableTd>
                    <DataTableTd stickyRight>
                      <div className="flex gap-0.5">
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleView(r.id)} title="Lihat">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handlePrint(r.id)} title="Print">
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleEdit(r)} title="Edit">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleDelete(r.id)} title="Hapus">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </DataTableTd>
                  </DataTableRow>
                  )
                })}
                {reports.length === 0 && <DataTableEmpty colSpan={11} />}
              </DataTableBody>
            </DataTable>
          </DataTableShell>

          <ElegantPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageSizeChange={handlePageSizeChange}
            extraInfo={
              volunteerFilter ? (
                <span className="text-blue-600">(Filter: {volunteerFilter.label})</span>
              ) : null
            }
          />
        </CardContent>
      </Card>

      {/* Modal Form */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>
              {editingReport ? 'Edit Situation Report' : 'Tambah Situation Report'}
            </ModalTitle>
          </ModalHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Subjek Laporan</label>
                <Input 
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="Cth: Banjir Bandang di Desa X"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Volunteer</label>
                <Select
                  value={formData.volunteer_id ? { value: Number(formData.volunteer_id), label: options.volunteers.find(v => v.id === Number(formData.volunteer_id))?.full_name || '' } : null}
                  onChange={(opt) => setFormData({ ...formData, volunteer_id: opt ? String((opt as any).value) : '' })}
                  options={options.volunteers.map(v => ({ value: v.id, label: v.full_name }))}
                  placeholder="Pilih Volunteer (opsional)"
                  isClearable
                  isSearchable
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Jenis Bencana</label>
                <Select
                  value={formData.disaster_type_id ? { value: Number(formData.disaster_type_id), label: options.disasterTypes.find(d => d.id === Number(formData.disaster_type_id))?.name || '' } : null}
                  onChange={(opt) => setFormData({ ...formData, disaster_type_id: opt ? String((opt as any).value) : '' })}
                  options={options.disasterTypes.map(d => ({ value: d.id, label: d.name }))}
                  placeholder="Pilih Jenis Bencana (opsional)"
                  isClearable
                  isSearchable
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Koordinator Lapangan</label>
                <Select
                  value={
                    formData.field_coordinator_id
                      ? {
                          value: Number(formData.field_coordinator_id),
                          label:
                            fieldCoordinators.find(
                              (c) => c.id === Number(formData.field_coordinator_id)
                            )?.full_name || "",
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setFormData({
                      ...formData,
                      field_coordinator_id: opt ? String((opt as any).value) : "",
                    })
                  }
                  options={fieldCoordinators.map((c) => ({
                    value: c.id,
                    label: c.phone ? `${c.full_name} (${c.phone})` : c.full_name,
                  }))}
                  placeholder="Pilih Koordinator Lapangan"
                  isClearable
                  isSearchable
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Provinsi</label>
                <Select
                  value={formData.province_id ? { value: formData.province_id, label: provinces.find(p => p.id === formData.province_id)?.name || '' } : null}
                  onChange={(opt) => {
                    setFormData({ ...formData, province_id: opt ? String((opt as any).value) : '', regency_id: '', district_id: '', village_id: '' })
                  }}
                  options={provinces.map(p => ({ value: p.id, label: p.name }))}
                  placeholder="Pilih Provinsi"
                  isClearable
                  isSearchable
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Kabupaten/Kota</label>
                <Select
                  value={formData.regency_id ? { value: formData.regency_id, label: regencies.find(r => r.id === formData.regency_id)?.name || '' } : null}
                  onChange={(opt) => setFormData({ ...formData, regency_id: opt ? String((opt as any).value) : '', district_id: '', village_id: '' })}
                  options={regencies.map(r => ({ value: r.id, label: r.name }))}
                  placeholder="Pilih Kabupaten/Kota"
                  isClearable
                  isSearchable
                  isDisabled={!formData.province_id}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Kecamatan</label>
                <Select
                  value={formData.district_id ? { value: formData.district_id, label: districts.find(d => d.id === formData.district_id)?.name || '' } : null}
                  onChange={(opt) => setFormData({ ...formData, district_id: opt ? String((opt as any).value) : '', village_id: '' })}
                  options={districts.map(d => ({ value: d.id, label: d.name }))}
                  placeholder="Pilih Kecamatan"
                  isClearable
                  isSearchable
                  isDisabled={!formData.regency_id}
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Desa</label>
                <Select
                  value={formData.village_id ? { value: formData.village_id, label: villages.find(v => v.id === formData.village_id)?.name || '' } : null}
                  onChange={(opt) => setFormData({ ...formData, village_id: opt ? String((opt as any).value) : '' })}
                  options={villages.map(v => ({ value: v.id, label: v.name }))}
                  placeholder="Pilih Desa"
                  isClearable
                  isSearchable
                  isDisabled={!formData.district_id}
                  className="text-sm"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Alamat Lengkap</label>
                <Input 
                  value={formData.full_address}
                  onChange={(e) => setFormData({...formData, full_address: e.target.value})}
                  placeholder="Cth: Jl. Sudirman No. 1, RT 01 RW 02"
                />
              </div>

              <MapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={({ latitude, longitude, label }) => {
                  setFormData((prev) => ({
                    ...prev,
                    latitude,
                    longitude,
                    full_address: label && !prev.full_address ? label : prev.full_address,
                  }))
                }}
              />

              <div>
                <label className="text-sm font-medium mb-2 block">Latitude</label>
                <Input type="number" step="0.00000001" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Longitude</label>
                <Input type="number" step="0.00000001" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Tanggal Laporan</label>
                <Input 
                  type="date" 
                  value={formData.report_date}
                  onChange={(e) => setFormData({...formData, report_date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Status Laporan</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  title="Pilih status"
                  aria-label="Pilih status"
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Waktu Kejadian (Tanggal)</label>
                <Input
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Waktu Kejadian (Jam)</label>
                <Input
                  type="time"
                  value={formData.incident_time}
                  onChange={(e) => setFormData({ ...formData, incident_time: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Status Bencana</label>
                <Input
                  value={formData.disaster_status}
                  onChange={(e) => setFormData({ ...formData, disaster_status: e.target.value })}
                  placeholder="Cth: Siaga Darurat Bencana Alam Banjir..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Kronologi</label>
                <textarea
                  value={formData.chronology}
                  onChange={(e) => setFormData({ ...formData, chronology: e.target.value })}
                  placeholder="Deskripsi kejadian..."
                  className="flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Kondisi Mutakhir</label>
                <textarea
                  value={formData.latest_condition}
                  onChange={(e) => setFormData({ ...formData, latest_condition: e.target.value })}
                  placeholder="Update kondisi terbaru di lapangan..."
                  className="flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Sumber Informasi</label>
                <textarea
                  value={formData.information_source}
                  onChange={(e) => setFormData({ ...formData, information_source: e.target.value })}
                  placeholder="Cth: Relawan Rumah Zakat, Masyarakat Setempat, BPBD..."
                  className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
            
            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {editingReport ? 'Updating...' : 'Saving...'}
                  </div>
                ) : (
                  editingReport ? 'Update' : 'Simpan'
                )}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  )
}
