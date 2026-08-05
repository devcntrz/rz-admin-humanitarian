"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useToast } from "@/hooks/use-toast"
import Select from 'react-select'

type Village = { id: string; district_id: string; name: string; district_name: string; regency_name?: string; province_name?: string }
type District = { id: string; name: string }
type Regency = { id: string; name: string }
type Province = { id: string; name: string }

export default function VillagesPage() {
  const { toast } = useToast()
  const [villages, setVillages] = useState<Village[]>([])
  const [allVillages, setAllVillages] = useState<Village[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [regencies, setRegencies] = useState<Regency[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [provinceFilter, setProvinceFilter] = useState<{value: string, label: string} | null>(null)
  const [regencyFilter, setRegencyFilter] = useState<{value: string, label: string} | null>(null)
  const [districtFilter, setDistrictFilter] = useState<{value: string, label: string} | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [formData, setFormData] = useState({
    id: "",
    district_id: "",
    name: ""
  })
  const [editingVillage, setEditingVillage] = useState<Village | null>(null)

  const paginateRows = (data: Village[], page: number, pageSize: number) => {
    setAllVillages(data)
    setTotalItems(data.length)
    setTotalPages(Math.max(1, Math.ceil(data.length / pageSize) || 1))
    const startIndex = (page - 1) * pageSize
    setVillages(data.slice(startIndex, startIndex + pageSize))
    setCurrentPage(page)
  }

  const loadData = async (query?: string, page: number = 1, selectedProvince?: {value: string, label: string} | null, selectedRegency?: {value: string, label: string} | null, selectedDistrict?: {value: string, label: string} | null, pageSize: number = itemsPerPage) => {
    try {
      setLoading(true)
      
      // Load provinces for dropdown
      const provincesResponse = await apiClient.getProvinces()
      if (provincesResponse.success && provincesResponse.data) {
        setProvinces(provincesResponse.data)
      }
      
      // Load regencies based on province filter
      const regenciesResponse = await apiClient.getRegencies(undefined, selectedProvince?.value)
      if (regenciesResponse.success && regenciesResponse.data) {
        setRegencies(regenciesResponse.data)
      }
      
      // Load districts based on regency filter
      const districtsResponse = await apiClient.getDistricts(undefined, selectedRegency?.value, selectedProvince?.value)
      if (districtsResponse.success && districtsResponse.data) {
        setDistricts(districtsResponse.data)
      }
      
      // Load villages with filters
      const villagesResponse = await apiClient.getVillages(query, selectedDistrict?.value, selectedRegency?.value, selectedProvince?.value)
      
      if (villagesResponse.success && villagesResponse.data) {
        paginateRows(villagesResponse.data, page, pageSize)
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data desa/kelurahan.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading villages:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data desa/kelurahan.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      
      let response
      if (editingVillage) {
        response = await apiClient.updateVillage(editingVillage.id, {
          name: formData.name,
          district_id: formData.district_id
        })
      } else {
        response = await apiClient.createVillage({
          id: formData.id,
          district_id: formData.district_id,
          name: formData.name
        })
      }
      
      if (response.success) {
        setFormData({ id: "", district_id: "", name: "" })
        setEditingVillage(null)
        loadData(searchQuery, currentPage, provinceFilter, regencyFilter, districtFilter)
        
        toast({
          title: "Sukses",
          description: editingVillage ? "Desa/Kelurahan berhasil diupdate." : "Desa/Kelurahan berhasil ditambahkan.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: response.message || (editingVillage ? "Gagal mengupdate desa/kelurahan." : "Gagal menambahkan desa/kelurahan."),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving village:', error)
      toast({
        title: "Error",
        description: editingVillage ? "Gagal mengupdate desa/kelurahan." : "Gagal menambahkan desa/kelurahan.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus desa/kelurahan ini?')) return
    
    try {
      const response = await apiClient.deleteVillage(id)
      
      if (response.success) {
        loadData(searchQuery, currentPage, provinceFilter, regencyFilter, districtFilter)
        toast({
          title: "Sukses",
          description: "Desa/Kelurahan berhasil dihapus.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Gagal menghapus desa/kelurahan.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting village:', error)
      toast({
        title: "Error",
        description: "Gagal menghapus desa/kelurahan.",
        variant: "destructive",
      })
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadData(searchQuery, 1, provinceFilter, regencyFilter, districtFilter)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
    loadData(value, 1, provinceFilter, regencyFilter, districtFilter)
  }

  const handleProvinceFilter = (selectedOption: {value: string, label: string} | null) => {
    setProvinceFilter(selectedOption)
    setRegencyFilter(null) // Reset regency filter when province changes
    setDistrictFilter(null) // Reset district filter when province changes
    setCurrentPage(1)
    loadData(searchQuery, 1, selectedOption, null, null)
  }

  const handleRegencyFilter = (selectedOption: {value: string, label: string} | null) => {
    setRegencyFilter(selectedOption)
    setDistrictFilter(null) // Reset district filter when regency changes
    setCurrentPage(1)
    loadData(searchQuery, 1, provinceFilter, selectedOption, null)
  }

  const handleDistrictFilter = (selectedOption: {value: string, label: string} | null) => {
    setDistrictFilter(selectedOption)
    setCurrentPage(1)
    loadData(searchQuery, 1, provinceFilter, regencyFilter, selectedOption)
  }

  const handlePageChange = (page: number) => {
    paginateRows(allVillages, page, itemsPerPage)
  }

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size)
    paginateRows(allVillages, 1, size)
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
      <Card className="overflow-hidden min-w-0">
        <CardHeader>
          <CardTitle>Tambah Desa/Kelurahan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input 
              name="id" 
              placeholder="Kode (10 digit)" 
              required 
              maxLength={10}
              value={formData.id}
              onChange={(e) => setFormData({...formData, id: e.target.value})}
            />
            <select 
              name="district_id" 
              className="border rounded-md p-2" 
              required
              aria-label="Kecamatan"
              value={formData.district_id}
              onChange={(e) => setFormData({...formData, district_id: e.target.value})}
            >
              <option value="">Pilih Kecamatan</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <Input 
              name="name" 
              placeholder="Nama Desa/Kelurahan" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editingVillage ? "Updating..." : "Saving..."}
                </div>
              ) : (
                editingVillage ? "Update" : "Simpan"
              )}
            </Button>
            {editingVillage && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditingVillage(null)
                  setFormData({ id: "", district_id: "", name: "" })
                }}
              >
                Batal
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden min-w-0">
        <CardHeader>
          <CardTitle>Daftar Desa/Kelurahan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
            <Input 
              name="q" 
              value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari kode/nama desa/kelurahan..." 
                className="flex-1"
              />
              <Button 
                onClick={() => handleSearchChange("")} 
                variant="outline"
                disabled={!searchQuery}
              >
                Clear
            </Button>
            </div>
            
            <div className="flex gap-2 items-center">
              <div className="min-w-[150px]">
                <Select
                  value={provinceFilter}
                  onChange={handleProvinceFilter}
                  options={provinces.map(p => ({ value: p.id, label: p.name }))}
                  placeholder="Pilih Provinsi..."
                  isClearable
                  isSearchable
                  className="text-sm"
                  maxMenuHeight={200}
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
                    menu: (provided) => ({
                      ...provided,
                      maxHeight: '200px',
                    }),
                  }}
                />
              </div>
              
              <div className="min-w-[150px]">
                <Select
                  value={regencyFilter}
                  onChange={handleRegencyFilter}
                  options={regencies.map(r => ({ value: r.id, label: r.name }))}
                  placeholder="Pilih Kabupaten/Kota..."
                  isClearable
                  isSearchable
                  className="text-sm"
                  maxMenuHeight={200}
                  isDisabled={!provinceFilter}
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
                    menu: (provided) => ({
                      ...provided,
                      maxHeight: '200px',
                    }),
                  }}
                />
              </div>
              
              <div className="min-w-[150px]">
                <Select
                  value={districtFilter}
                  onChange={handleDistrictFilter}
                  options={districts.map(d => ({ value: d.id, label: d.name }))}
                  placeholder="Pilih Kecamatan..."
                  isClearable
                  isSearchable
                  className="text-sm"
                  maxMenuHeight={200}
                  isDisabled={!regencyFilter}
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
                    menu: (provided) => ({
                      ...provided,
                      maxHeight: '200px',
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
                  <DataTableTh>Kode</DataTableTh>
                  <DataTableTh>Nama</DataTableTh>
                  <DataTableTh>Kecamatan</DataTableTh>
                  <DataTableTh>Kota/Kabupaten</DataTableTh>
                  <DataTableTh>Provinsi</DataTableTh>
                  <DataTableTh>Aksi</DataTableTh>
                </DataTableHeadRow>
              </DataTableHead>
              <DataTableBody>
                {villages.map((v) => (
                  <DataTableRow key={v.id}>
                    <DataTableTd>{v.id}</DataTableTd>
                    <DataTableTd>{v.name}</DataTableTd>
                    <DataTableTd>{v.district_name}</DataTableTd>
                    <DataTableTd>{v.regency_name ?? '-'}</DataTableTd>
                    <DataTableTd>{v.province_name ?? '-'}</DataTableTd>
                    <DataTableTd>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingVillage(v)
                            setFormData({
                              id: v.id,
                              district_id: v.district_id,
                              name: v.name
                            })
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(v.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </DataTableTd>
                  </DataTableRow>
                ))}
                {villages.length === 0 && <DataTableEmpty colSpan={6} />}
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
          />
        </CardContent>
      </Card>
    </div>
  )
}
