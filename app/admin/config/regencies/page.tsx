"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ElegantPagination } from "@/components/ui/elegant-pagination"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Select from 'react-select'

type Regency = { id: string; province_id: string; name: string; province_name: string }
type Province = { id: string; name: string }

export default function RegenciesPage() {
  const { toast } = useToast()
  const [regencies, setRegencies] = useState<Regency[]>([])
  const [allRegencies, setAllRegencies] = useState<Regency[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [provinceFilter, setProvinceFilter] = useState<{value: string, label: string} | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10
  const [formData, setFormData] = useState({
    id: "",
    province_id: "",
    name: ""
  })
  const [editingRegency, setEditingRegency] = useState<Regency | null>(null)

  const loadData = async (query?: string, page: number = 1, selectedProvince?: {value: string, label: string} | null) => {
    try {
      setLoading(true)
      
      // Load provinces for dropdown
      const provincesResponse = await apiClient.getProvinces()
      if (provincesResponse.success && provincesResponse.data) {
        setProvinces(provincesResponse.data)
      }
      
      // Load regencies with filters
      const regenciesResponse = await apiClient.getRegencies(query, selectedProvince?.value)
      
      if (regenciesResponse.success && regenciesResponse.data) {
        const allRegenciesData = regenciesResponse.data
        setAllRegencies(allRegenciesData)
        setTotalItems(allRegenciesData.length)
        setTotalPages(Math.ceil(allRegenciesData.length / itemsPerPage))
        
        const startIndex = (page - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedData = allRegenciesData.slice(startIndex, endIndex)
        
        setRegencies(paginatedData)
        setCurrentPage(page)
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data kabupaten/kota.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading regencies:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data kabupaten/kota.",
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
      if (editingRegency) {
        response = await apiClient.updateRegency(editingRegency.id, {
        name: formData.name,
          province_id: formData.province_id
        })
      } else {
        response = await apiClient.createRegency(formData)
      }
      
      if (response.success) {
      setFormData({ id: "", province_id: "", name: "" })
        setEditingRegency(null)
        loadData(searchQuery, currentPage, provinceFilter)
      
      toast({
        title: "Sukses",
          description: editingRegency ? "Kabupaten/Kota berhasil diupdate." : "Kabupaten/Kota berhasil ditambahkan.",
        variant: "default",
      })
      } else {
        toast({
          title: "Error",
          description: response.message || (editingRegency ? "Gagal mengupdate kabupaten/kota." : "Gagal menambahkan kabupaten/kota."),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving regency:', error)
      toast({
        title: "Error",
        description: editingRegency ? "Gagal mengupdate kabupaten/kota." : "Gagal menambahkan kabupaten/kota.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kabupaten/kota ini?')) return
    
    try {
      const response = await apiClient.deleteRegency(id)
      
      if (response.success) {
        loadData(searchQuery, currentPage, provinceFilter)
        toast({
          title: "Sukses",
          description: "Kabupaten/Kota berhasil dihapus.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Gagal menghapus kabupaten/kota.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting regency:', error)
      toast({
        title: "Error",
        description: "Gagal menghapus kabupaten/kota.",
        variant: "destructive",
      })
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadData(searchQuery, 1, provinceFilter)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
    loadData(value, 1, provinceFilter)
  }

  const handleProvinceFilter = (selectedOption: {value: string, label: string} | null) => {
    setProvinceFilter(selectedOption)
    setCurrentPage(1)
    loadData(searchQuery, 1, selectedOption)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadData(searchQuery, page, provinceFilter)
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
        <CardHeader>
          <CardTitle>Tambah Kabupaten/Kota</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input 
              name="id" 
              placeholder="Kode (4 digit)" 
              required 
              maxLength={4}
              value={formData.id}
              onChange={(e) => setFormData({...formData, id: e.target.value})}
            />
            <select 
              name="province_id" 
              className="border rounded-md p-2" 
              required
              value={formData.province_id}
              onChange={(e) => setFormData({...formData, province_id: e.target.value})}
            >
              <option value="">Pilih Provinsi</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Input 
              name="name" 
              placeholder="Nama Kabupaten/Kota" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editingRegency ? "Updating..." : "Saving..."}
                </div>
              ) : (
                editingRegency ? "Update" : "Simpan"
              )}
            </Button>
            {editingRegency && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditingRegency(null)
                  setFormData({ id: "", province_id: "", name: "" })
                }}
              >
                Batal
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kabupaten/Kota</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
            <Input 
              name="q" 
              value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari kode/nama kabupaten/kota..." 
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
              <div className="min-w-[200px]">
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
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border rounded-md">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-2">Kode</th>
                  <th className="text-left p-2">Nama</th>
                  <th className="text-left p-2">Provinsi</th>
                  <th className="text-left p-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {regencies.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-2">{r.id}</td>
                    <td className="p-2">{r.name}</td>
                    <td className="p-2">{r.province_name}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingRegency(r)
                            setFormData({
                              id: r.id,
                              province_id: r.province_id,
                              name: r.name
                            })
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(r.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {regencies.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={4}>
                      Tidak ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <ElegantPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
