"use client"

import { useState, useEffect } from "react"
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { apiClient } from "@/lib/api"
import { Edit, Trash2, Eye, Download, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'
import Select from 'react-select'

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
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [volunteerFilter, setVolunteerFilter] = useState<{value: number, label: string} | null>(null)
  const [allReports, setAllReports] = useState<ReportRow[]>([])
  const [formData, setFormData] = useState({
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
    status: "draft"
  })
  const [editingReport, setEditingReport] = useState<ReportRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  const loadData = async (query?: string, page: number = 1, selectedVolunteer?: {value: number, label: string} | null) => {
    try {
      setLoading(true)
      const [reportsResponse, optionsResponse, provincesResponse] = await Promise.all([
        apiClient.getSiteReports(query),
        apiClient.getOptions(),
        apiClient.getProvinces()
      ])
      
      if (reportsResponse.success && reportsResponse.data) {
        let filteredReports = reportsResponse.data
        
        // Apply volunteer filter
        if (selectedVolunteer) {
          filteredReports = filteredReports.filter((report: ReportRow) => 
            report.volunteer_id === selectedVolunteer.value
          )
        }
        
        setAllReports(filteredReports)
        const startIndex = (page - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedReports = filteredReports.slice(startIndex, endIndex)
        
        setReports(paginatedReports)
        setTotalItems(filteredReports.length)
        setTotalPages(Math.ceil(filteredReports.length / itemsPerPage))
        setCurrentPage(page)
      }
      
      if (optionsResponse.success && optionsResponse.data) {
        setOptions(optionsResponse.data)
      }
      if (provincesResponse.success && provincesResponse.data) {
        setProvinces(provincesResponse.data)
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
    setCurrentPage(page)
    loadData(searchQuery, page, volunteerFilter)
  }

  const handleExportXLSX = () => {
    try {
      const exportData = allReports.map(report => ({
        'ID': report.id,
        'Tanggal Laporan': report.report_date,
        'Status': report.status,
        'Volunteer': report.volunteer || '-',
        'Jenis Bencana': report.disaster || '-',
        'Desa': report.village || '-'
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
        status: formData.status
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
        // Reset form and close modal
        setFormData({
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
          status: "draft"
        })
        setEditingReport(null)
        setIsModalOpen(false)
        // Reload data
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
        status: d.status || report.status || "draft"
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

  const openCreateModal = () => {
    setEditingReport(null)
    setFormData({
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
      status: "draft"
    })
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
    <div className="space-y-6">
      <Card>
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
        <CardContent className="space-y-3">
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
          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full border border-border rounded-md">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-medium">ID</th>
                  <th className="text-left p-3 font-medium">Subjek</th>
                  <th className="text-left p-3 font-medium">Tanggal</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Volunteer</th>
                  <th className="text-left p-3 font-medium">Bencana</th>
                  <th className="text-left p-3 font-medium">Desa</th>
                  <th className="text-left p-3 font-medium">Kecamatan</th>
                  <th className="text-left p-3 font-medium">Kab/Kota</th>
                  <th className="text-left p-3 font-medium">Provinsi</th>
                  <th className="text-left p-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="p-3">{r.id}</td>
                    <td className="p-3 max-w-[280px] truncate" title={r.subject || ''}>{r.subject ?? '-'}</td>
                    <td className="p-3">{r.report_date}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        r.status === 'submitted' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3">{r.volunteer ?? "-"}</td>
                    <td className="p-3">{r.disaster ?? "-"}</td>
                    <td className="p-3">{r.village ?? "-"}</td>
                    <td className="p-3">{r.district ?? "-"}</td>
                    <td className="p-3">{r.regency ?? "-"}</td>
                    <td className="p-3">{r.province ?? "-"}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleView(r.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(r)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={7}>
                      Tidak ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {totalItems > 0 ? (
                <>
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} sampai {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
                  {volunteerFilter && (
                    <span className="ml-2 text-blue-600">
                      (Filter: {volunteerFilter.label})
                    </span>
                  )}
                </>
              ) : (
                "Tidak ada data"
              )}
            </div>
            
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
        </CardContent>
      </Card>

      {/* Modal Form */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent className="max-w-2xl">
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
                <label className="text-sm font-medium mb-2 block">Status</label>
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
