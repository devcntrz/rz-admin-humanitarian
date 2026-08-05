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

type District = { id: string; regency_id: string; name: string; regency_name: string; province_name?: string }
type Regency = { id: string; name: string }
type Province = { id: string; name: string }

export default function DistrictsPage() {
  const { toast } = useToast()
  const [districts, setDistricts] = useState<District[]>([])
  const [allDistricts, setAllDistricts] = useState<District[]>([])
  const [regencies, setRegencies] = useState<Regency[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [provinceFilter, setProvinceFilter] = useState<{value: string, label: string} | null>(null)
  const [regencyFilter, setRegencyFilter] = useState<{value: string, label: string} | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [formData, setFormData] = useState({
    id: "",
    regency_id: "",
    name: ""
  })
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null)

  const paginateRows = (data: District[], page: number, pageSize: number) => {
    setAllDistricts(data)
    setTotalItems(data.length)
    setTotalPages(Math.max(1, Math.ceil(data.length / pageSize) || 1))
    const startIndex = (page - 1) * pageSize
    setDistricts(data.slice(startIndex, startIndex + pageSize))
    setCurrentPage(page)
  }

  const loadData = async (query?: string, page: number = 1, selectedProvince?: {value: string, label: string} | null, selectedRegency?: {value: string, label: string} | null, pageSize: number = itemsPerPage) => {
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
      
      // Load districts with filters
      const districtsResponse = await apiClient.getDistricts(query, selectedRegency?.value, selectedProvince?.value)
      
      if (districtsResponse.success && districtsResponse.data) {
        paginateRows(districtsResponse.data, page, pageSize)
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data kecamatan.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading districts:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data kecamatan.",
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
      if (editingDistrict) {
        response = await apiClient.updateDistrict(editingDistrict.id, {
        name: formData.name,
          regency_id: formData.regency_id
        })
      } else {
        response = await apiClient.createDistrict(formData)
      }
      
      if (response.success) {
      setFormData({ id: "", regency_id: "", name: "" })
        setEditingDistrict(null)
        loadData(searchQuery, currentPage, provinceFilter, regencyFilter)
      
      toast({
        title: "Sukses",
          description: editingDistrict ? "Kecamatan berhasil diupdate." : "Kecamatan berhasil ditambahkan.",
        variant: "default",
      })
      } else {
        toast({
          title: "Error",
          description: response.message || (editingDistrict ? "Gagal mengupdate kecamatan." : "Gagal menambahkan kecamatan."),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving district:', error)
      toast({
        title: "Error",
        description: editingDistrict ? "Gagal mengupdate kecamatan." : "Gagal menambahkan kecamatan.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kecamatan ini?')) return
    
    try {
      const response = await apiClient.deleteDistrict(id)
      
      if (response.success) {
        loadData(searchQuery, currentPage, provinceFilter, regencyFilter)
        toast({
          title: "Sukses",
          description: "Kecamatan berhasil dihapus.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Gagal menghapus kecamatan.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting district:', error)
      toast({
        title: "Error",
        description: "Gagal menghapus kecamatan.",
        variant: "destructive",
      })
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadData(searchQuery, 1, provinceFilter, regencyFilter)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
    loadData(value, 1, provinceFilter, regencyFilter)
  }

  const handleProvinceFilter = (selectedOption: {value: string, label: string} | null) => {
    setProvinceFilter(selectedOption)
    setRegencyFilter(null) // Reset regency filter when province changes
    setCurrentPage(1)
    loadData(searchQuery, 1, selectedOption, null)
  }

  const handleRegencyFilter = (selectedOption: {value: string, label: string} | null) => {
    setRegencyFilter(selectedOption)
    setCurrentPage(1)
    loadData(searchQuery, 1, provinceFilter, selectedOption)
  }

  const handlePageChange = (page: number) => {
    paginateRows(allDistricts, page, itemsPerPage)
  }

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size)
    paginateRows(allDistricts, 1, size)
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
          <CardTitle>Tambah Kecamatan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input 
              name="id" 
              placeholder="Kode (7 digit)" 
              required 
              maxLength={7}
              value={formData.id}
              onChange={(e) => setFormData({...formData, id: e.target.value})}
            />
            <select 
              name="regency_id" 
              className="border rounded-md p-2" 
              required
              aria-label="Kabupaten/Kota"
              value={formData.regency_id}
              onChange={(e) => setFormData({...formData, regency_id: e.target.value})}
            >
              <option value="">Pilih Kabupaten/Kota</option>
              {regencies.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <Input 
              name="name" 
              placeholder="Nama Kecamatan" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editingDistrict ? "Updating..." : "Saving..."}
                </div>
              ) : (
                editingDistrict ? "Update" : "Simpan"
              )}
            </Button>
            {editingDistrict && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditingDistrict(null)
                  setFormData({ id: "", regency_id: "", name: "" })
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
          <CardTitle>Daftar Kecamatan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
            <Input 
              name="q" 
              value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari kode/nama kecamatan..." 
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
            </div>
          </div>
          <DataTableShell>
            <DataTable>
              <DataTableHead>
                <DataTableHeadRow>
                  <DataTableTh>Kode</DataTableTh>
                  <DataTableTh>Nama</DataTableTh>
                  <DataTableTh>Kabupaten/Kota</DataTableTh>
                  <DataTableTh>Provinsi</DataTableTh>
                  <DataTableTh>Aksi</DataTableTh>
                </DataTableHeadRow>
              </DataTableHead>
              <DataTableBody>
                {districts.map((d) => (
                  <DataTableRow key={d.id}>
                    <DataTableTd>{d.id}</DataTableTd>
                    <DataTableTd>{d.name}</DataTableTd>
                    <DataTableTd>{d.regency_name}</DataTableTd>
                    <DataTableTd>{d.province_name ?? '-'}</DataTableTd>
                    <DataTableTd>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingDistrict(d)
                            setFormData({
                              id: d.id,
                              regency_id: d.regency_id,
                              name: d.name
                            })
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(d.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </DataTableTd>
                  </DataTableRow>
                ))}
                {districts.length === 0 && <DataTableEmpty colSpan={5} />}
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
