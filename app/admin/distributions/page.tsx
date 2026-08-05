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

type DistRow = {
  id: number
  distribution_date: string
  status: string
  recipient_name: string
  recipient_phone: string | null
  items: string
  quantity: number
  notes: string | null
  volunteer_id: number | null
  volunteer: string | null
  village: string | null
  district?: string | null
  regency?: string | null
  province?: string | null
}

type Options = {
  volunteers: { id: number; full_name: string }[]
  villages: { id: string; name: string }[]
  disasterTypes?: { id: number; name: string }[]
}

export default function DistributionsPage() {
  const { toast } = useToast()
  const [distributions, setDistributions] = useState<DistRow[]>([])
  const [options, setOptions] = useState<Options>({
    volunteers: [],
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
  const [allDistributions, setAllDistributions] = useState<DistRow[]>([])
  const [formData, setFormData] = useState({
    spk_number: "",
    event_name: "",
    event_date: new Date().toISOString().slice(0, 10),
    disaster_type_id: "",
    volunteer_id: "",
    full_address: "",
    latitude: "",
    longitude: "",
    beneficiary_count: "",
    volunteer_count: "",
    province_id: "",
    regency_id: "",
    district_id: "",
    village_id: "",
    notes: ""
  })
  const [editingDistribution, setEditingDistribution] = useState<DistRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const paginateRows = (data: DistRow[], page: number, pageSize: number) => {
    setAllDistributions(data)
    setTotalItems(data.length)
    setTotalPages(Math.max(1, Math.ceil(data.length / pageSize) || 1))
    const startIndex = (page - 1) * pageSize
    setDistributions(data.slice(startIndex, startIndex + pageSize))
    setCurrentPage(page)
  }

  const loadData = async (query?: string, page: number = 1, selectedVolunteer?: {value: number, label: string} | null, pageSize: number = itemsPerPage) => {
    try {
      setLoading(true)
      const [distributionsResponse, optionsResponse, provincesResponse] = await Promise.all([
        apiClient.getDistributions(query),
        apiClient.getOptions(),
        apiClient.getProvinces()
      ])
      
      if (distributionsResponse.success && distributionsResponse.data) {
        let filteredDistributions = distributionsResponse.data
        
        // Apply volunteer filter
        if (selectedVolunteer) {
          filteredDistributions = filteredDistributions.filter((distribution: DistRow) => 
            distribution.volunteer_id === selectedVolunteer.value
          )
        }
        
        paginateRows(filteredDistributions, page, pageSize)
      }
      
      if (optionsResponse.success && optionsResponse.data) {
        setOptions({
          volunteers: optionsResponse.data.volunteers,
          villages: optionsResponse.data.villages,
          disasterTypes: optionsResponse.data.disasterTypes,
        })
      }
      if (provincesResponse.success && provincesResponse.data) setProvinces(provincesResponse.data)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data distribution reports.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Cascading wilayah
  useEffect(() => {
    const fetchRegencies = async () => {
      if (!formData.province_id) { setRegencies([]); setDistricts([]); setVillages([]); return }
      const res = await apiClient.getRegencies(undefined, formData.province_id)
      if (res.success && res.data) setRegencies(res.data)
      setDistricts([]); setVillages([])
    }
    fetchRegencies()
  }, [formData.province_id])

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!formData.regency_id) { setDistricts([]); setVillages([]); return }
      const res = await apiClient.getDistricts(undefined, formData.regency_id, formData.province_id || undefined)
      if (res.success && res.data) setDistricts(res.data)
      setVillages([])
    }
    fetchDistricts()
  }, [formData.regency_id, formData.province_id])

  useEffect(() => {
    const fetchVillages = async () => {
      if (!formData.district_id) { setVillages([]); return }
      const res = await apiClient.getVillages(undefined, formData.district_id, formData.regency_id || undefined, formData.province_id || undefined)
      if (res.success && res.data) setVillages(res.data)
    }
    fetchVillages()
  }, [formData.district_id, formData.regency_id, formData.province_id])

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
    paginateRows(allDistributions, page, itemsPerPage)
  }

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size)
    paginateRows(allDistributions, 1, size)
  }

  const handleExportXLSX = () => {
    try {
      const exportData = allDistributions.map(distribution => ({
        'ID': distribution.id,
        'Tanggal Distribusi': distribution.distribution_date,
        'Status': distribution.status,
        'Nama Penerima': distribution.recipient_name,
        'Telepon Penerima': distribution.recipient_phone || '-',
        'Items': distribution.items,
        'Quantity': distribution.quantity,
        'Volunteer': distribution.volunteer || '-',
        'Desa': distribution.village || '-',
        'Catatan': distribution.notes || '-'
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Distributions')
      
      const fileName = `distributions-${new Date().toISOString().slice(0, 10)}.xlsx`
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
    
    // Validasi field wajib
    if (!formData.event_name || formData.event_name.trim() === '') {
      toast({
        title: "Error",
        description: "Nama kegiatan wajib diisi.",
        variant: "destructive",
      })
      return
    }
    
    if (!formData.event_date) {
      toast({
        title: "Error",
        description: "Tanggal kegiatan wajib diisi.",
        variant: "destructive",
      })
      return
    }
    
    try {
      setSubmitting(true)
      const distributionData = {
        spk_number: formData.spk_number || null,
        event_name: formData.event_name,
        event_date: formData.event_date,
        disaster_type_id: formData.disaster_type_id ? Number(formData.disaster_type_id) : null,
        pic_volunteer_id: formData.volunteer_id ? Number(formData.volunteer_id) : null,
        volunteer_id: formData.volunteer_id ? Number(formData.volunteer_id) : null, // Tambahan untuk kompatibilitas
        full_address: formData.full_address || null,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        beneficiary_count: formData.beneficiary_count ? Number(formData.beneficiary_count) : null,
        volunteer_count: formData.volunteer_count ? Number(formData.volunteer_count) : null,
        province_id: formData.province_id || null,
        regency_id: formData.regency_id || null,
        district_id: formData.district_id || null,
        village_id: formData.village_id || null,
        notes: formData.notes || null,
      }

      console.log('Distribution data being sent:', distributionData)

      let response
      if (editingDistribution) {
        response = await apiClient.updateDistribution(editingDistribution.id, distributionData)
      } else {
        response = await apiClient.createDistribution(distributionData)
      }
      
      if (response.success) {
        toast({
          title: "Sukses",
          description: editingDistribution ? "Distribution report berhasil diperbarui." : "Distribution report berhasil ditambahkan.",
          variant: "default",
        })
        // Reset form and close modal
        setFormData({
          spk_number: "",
          event_name: "",
          event_date: new Date().toISOString().slice(0, 10),
          disaster_type_id: "",
          volunteer_id: "",
          full_address: "",
          latitude: "",
          longitude: "",
          beneficiary_count: "",
          volunteer_count: "",
          province_id: "",
          regency_id: "",
          district_id: "",
          village_id: "",
          notes: ""
        })
        setEditingDistribution(null)
        setIsModalOpen(false)
        // Reload data
        loadData(searchQuery, currentPage, volunteerFilter)
      } else {
        toast({
          title: "Error",
          description: response.error || "Gagal menyimpan distribution report.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving distribution:', error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan distribution report.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (distribution: DistRow) => {
    setEditingDistribution(distribution)
    // reset opsi untuk kestabilan
    setRegencies([]); setDistricts([]); setVillages([])
    // fetch detail lengkap agar id wilayah tersedia
    const detail = await apiClient.getDistribution(distribution.id)
    const d: any = detail?.data || {}
    setFormData({
      spk_number: d.spk_number || "",
      event_name: d.event_name || d.recipient_name || distribution.recipient_name,
      event_date: d.event_date || d.distribution_date || distribution.distribution_date,
      disaster_type_id: d.disaster_type_id ? String(d.disaster_type_id) : "",
      volunteer_id: d.pic_volunteer_id ? String(d.pic_volunteer_id) : (d.volunteer_id ? String(d.volunteer_id) : (distribution.volunteer_id ? String(distribution.volunteer_id) : "")),
      full_address: d.full_address || d.notes || distribution.notes || "",
      latitude: d.latitude != null ? String(d.latitude) : "",
      longitude: d.longitude != null ? String(d.longitude) : "",
      beneficiary_count: String(d.beneficiary_count ?? d.quantity ?? distribution.quantity ?? ''),
      volunteer_count: d.volunteer_count ? String(d.volunteer_count) : "",
      province_id: d.province_id || "",
      regency_id: d.regency_id || "",
      district_id: d.district_id || "",
      village_id: d.village_id || "",
      notes: d.full_address || d.notes || distribution.notes || ""
    })
    setIsModalOpen(true)
    // muat opsi cascading sesuai id
    if (d.province_id) {
      const regs = await apiClient.getRegencies(undefined, d.province_id)
      if (regs.success && regs.data) setRegencies(regs.data)
    }
    if (d.regency_id) {
      const dists = await apiClient.getDistricts(undefined, d.regency_id, d.province_id)
      if (dists.success && dists.data) setDistricts(dists.data)
    }
    if (d.district_id) {
      const vills = await apiClient.getVillages(undefined, d.district_id, d.regency_id, d.province_id)
      if (vills.success && vills.data) setVillages(vills.data)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus distribusi ini?')) {
      try {
        const response = await apiClient.deleteDistribution(id)
        if (response.success) {
          toast({
            title: "Sukses",
            description: "Distribution report berhasil dihapus.",
            variant: "default",
          })
          loadData(searchQuery, currentPage, volunteerFilter)
        } else {
          toast({
            title: "Error",
            description: "Gagal menghapus distribution report.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error deleting distribution:', error)
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat menghapus distribution report.",
          variant: "destructive",
        })
      }
    }
  }

  const handleView = (id: number) => {
    window.location.href = `/admin/distributions/${id}`
  }

  const handlePrint = (id: number) => {
    window.open(`/api/distributions/${id}/pdf`, "_blank")
  }

  const openCreateModal = () => {
    setEditingDistribution(null)
    setFormData({
      spk_number: "",
      event_name: "",
      event_date: new Date().toISOString().slice(0, 10),
      disaster_type_id: "",
      volunteer_id: "",
      full_address: "",
      latitude: "",
      longitude: "",
      beneficiary_count: "",
      volunteer_count: "",
      province_id: "",
      regency_id: "",
      district_id: "",
      village_id: "",
      notes: ""
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
    <div className="space-y-6 min-w-0 max-w-full">
      <Card className="min-w-0 max-w-full overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-balance">Distributions</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleExportXLSX} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={openCreateModal}>
              Tambah Distribution
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID/recipient/items/volunteer/village..." 
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
                  <DataTableTh>Tanggal</DataTableTh>
                  <DataTableTh>Status</DataTableTh>
                  <DataTableTh>Kegiatan / Penerima</DataTableTh>
                  <DataTableTh>Items</DataTableTh>
                  <DataTableTh>Volunteer</DataTableTh>
                  <DataTableTh>Wilayah</DataTableTh>
                  <DataTableTh stickyRight>Aksi</DataTableTh>
                </DataTableHeadRow>
              </DataTableHead>
              <DataTableBody>
                {distributions.map((d) => {
                  const wilayah = [d.village, d.district, d.regency, d.province]
                    .filter(Boolean)
                    .join(", ")
                  return (
                  <DataTableRow key={d.id}>
                    <DataTableTd className="whitespace-nowrap">{d.id}</DataTableTd>
                    <DataTableTd className="whitespace-nowrap">{d.distribution_date}</DataTableTd>
                    <DataTableTd>
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        d.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : d.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {d.status}
                      </span>
                    </DataTableTd>
                    <DataTableTd className="max-w-[160px] truncate" title={d.recipient_name || ''}>
                      <div className="font-medium truncate">{d.recipient_name}</div>
                      {d.recipient_phone && (
                        <div className="text-[10px] text-muted-foreground">{d.recipient_phone}</div>
                      )}
                    </DataTableTd>
                    <DataTableTd className="max-w-[120px] truncate" title={`${d.items} Qty: ${d.quantity}`}>
                      <div className="truncate">{d.items}</div>
                      <div className="text-[10px] text-muted-foreground">Qty: {d.quantity}</div>
                    </DataTableTd>
                    <DataTableTd className="max-w-[110px] truncate" title={d.volunteer || ''}>
                      {d.volunteer ?? "-"}
                    </DataTableTd>
                    <DataTableTd className="max-w-[180px] truncate" title={wilayah || ''}>
                      {wilayah || "-"}
                    </DataTableTd>
                    <DataTableTd stickyRight>
                      <div className="flex gap-0.5">
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleView(d.id)} title="Lihat">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handlePrint(d.id)} title="Print">
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleEdit(d)} title="Edit">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleDelete(d.id)} title="Hapus">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </DataTableTd>
                  </DataTableRow>
                  )
                })}
                {distributions.length === 0 && <DataTableEmpty colSpan={8} />}
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
              {editingDistribution ? 'Edit Distribution' : 'Tambah Distribution'}
            </ModalTitle>
          </ModalHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">No. SPK</label>
                <Input value={formData.spk_number} onChange={(e) => setFormData({ ...formData, spk_number: e.target.value })} placeholder="Nomor SPK" />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Nama Kegiatan</label>
                <Input value={formData.event_name} onChange={(e) => setFormData({ ...formData, event_name: e.target.value })} placeholder="Nama kegiatan" />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tanggal Kegiatan</label>
                <Input type="date" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Jenis Bencana</label>
                <Select
                  value={formData.disaster_type_id ? { value: Number(formData.disaster_type_id), label: options.disasterTypes?.find(d => d.id === Number(formData.disaster_type_id))?.name || '' } : null}
                  onChange={(opt) => setFormData({ ...formData, disaster_type_id: opt ? String((opt as any).value) : '' })}
                  options={(options.disasterTypes || []).map(d => ({ value: d.id, label: d.name }))}
                  placeholder="Pilih Jenis Bencana"
                  isClearable isSearchable className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Volunteer PIC</label>
                <Select
                  value={formData.volunteer_id ? { value: Number(formData.volunteer_id), label: options.volunteers.find(v => v.id === Number(formData.volunteer_id))?.full_name || '' } : null}
                  onChange={(opt) => setFormData({ ...formData, volunteer_id: opt ? String((opt as any).value) : '' })}
                  options={options.volunteers.map(v => ({ value: v.id, label: v.full_name }))}
                  placeholder="Pilih Volunteer"
                  isClearable isSearchable className="text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Alamat Lengkap</label>
                <Input value={formData.full_address} onChange={(e) => setFormData({ ...formData, full_address: e.target.value })} placeholder="Alamat lengkap" />
              </div>

              {isModalOpen && (
                <div className="md:col-span-2 space-y-2">
                  <MapPicker
                    key={`dist-map-${editingDistribution?.id ?? "new"}-${isModalOpen}`}
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    height={280}
                    onChange={({ latitude, longitude, label }) => {
                      setFormData((prev) => ({
                        ...prev,
                        latitude,
                        longitude,
                        // Fill address from search selection; keep manual edits if already typed
                        full_address: label || prev.full_address,
                      }))
                    }}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Latitude</label>
                <Input type="number" step="0.00000001" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Longitude</label>
                <Input type="number" step="0.00000001" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Provinsi</label>
                <Select
                  value={formData.province_id ? { value: formData.province_id, label: provinces.find(p => p.id === formData.province_id)?.name || '' } : null}
                  onChange={(opt) => setFormData({ ...formData, province_id: opt ? String((opt as any).value) : '', regency_id: '', district_id: '', village_id: '' })}
                  options={provinces.map(p => ({ value: p.id, label: p.name }))}
                  placeholder="Pilih Provinsi" isClearable isSearchable className="text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Kabupaten/Kota</label>
                <Select
                  value={formData.regency_id ? { value: formData.regency_id, label: regencies.find(r => r.id === formData.regency_id)?.name || '' } : null}
                  onChange={(opt) => setFormData({ ...formData, regency_id: opt ? String((opt as any).value) : '', district_id: '', village_id: '' })}
                  options={regencies.map(r => ({ value: r.id, label: r.name }))}
                  placeholder="Pilih Kabupaten/Kota" isClearable isSearchable isDisabled={!formData.province_id} className="text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Kecamatan</label>
                <Select
                  value={formData.district_id ? { value: formData.district_id, label: districts.find(d => d.id === formData.district_id)?.name || '' } : null}
                  onChange={(opt) => setFormData({ ...formData, district_id: opt ? String((opt as any).value) : '', village_id: '' })}
                  options={districts.map(d => ({ value: d.id, label: d.name }))}
                  placeholder="Pilih Kecamatan" isClearable isSearchable isDisabled={!formData.regency_id} className="text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Desa</label>
                <Select
                  value={formData.village_id ? { value: formData.village_id, label: villages.find(v => v.id === formData.village_id)?.name || '' } : null}
                  onChange={(opt) => setFormData({ ...formData, village_id: opt ? String((opt as any).value) : '' })}
                  options={villages.map(v => ({ value: v.id, label: v.name }))}
                  placeholder="Pilih Desa" isClearable isSearchable isDisabled={!formData.district_id} className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Jumlah Penerima Manfaat</label>
                <Input type="number" value={formData.beneficiary_count} onChange={(e) => setFormData({ ...formData, beneficiary_count: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Jumlah Relawan</label>
                <Input type="number" value={formData.volunteer_count} onChange={(e) => setFormData({ ...formData, volunteer_count: e.target.value })} />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Catatan</label>
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Catatan tambahan (opsional)"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {editingDistribution ? 'Updating...' : 'Saving...'}
                  </div>
                ) : (
                  editingDistribution ? 'Update' : 'Simpan'
                )}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  )
}