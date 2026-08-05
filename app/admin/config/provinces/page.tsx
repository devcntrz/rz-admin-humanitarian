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

type Province = { id: string; name: string }

export default function ProvincesPage() {
  const { toast } = useToast()
  const [provinces, setProvinces] = useState<Province[]>([])
  const [allProvinces, setAllProvinces] = useState<Province[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProvince, setEditingProvince] = useState<Province | null>(null)

  const paginateRows = (data: Province[], page: number, pageSize: number) => {
    setAllProvinces(data)
    setTotalItems(data.length)
    setTotalPages(Math.max(1, Math.ceil(data.length / pageSize) || 1))
    const startIndex = (page - 1) * pageSize
    setProvinces(data.slice(startIndex, startIndex + pageSize))
    setCurrentPage(page)
  }

  const loadData = async (query?: string, page: number = 1, pageSize: number = itemsPerPage) => {
    try {
      setLoading(true)
      
      const response = await apiClient.getProvinces(query)
      
      if (response.success && response.data) {
        paginateRows(response.data, page, pageSize)
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data provinsi.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading provinces:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data provinsi.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = () => {
    setEditingProvince(null)
    setIsModalOpen(true)
  }

  const handleEdit = (province: Province) => {
    setEditingProvince(province)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus provinsi ini?')) return
    
    try {
      const response = await apiClient.deleteProvince(id)
      
      if (response.success) {
        loadData(searchQuery, currentPage)
        toast({
          title: "Sukses",
          description: "Provinsi berhasil dihapus.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Gagal menghapus provinsi.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting province:', error)
      toast({
        title: "Error",
        description: "Gagal menghapus provinsi.",
        variant: "destructive",
      })
    }
  }

  const handleModalSuccess = () => {
    loadData(searchQuery, currentPage)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadData(searchQuery, 1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
    loadData(value, 1)
  }

  const handlePageChange = (page: number) => {
    paginateRows(allProvinces, page, itemsPerPage)
  }

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size)
    paginateRows(allProvinces, 1, size)
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
      <div className="flex justify-end">
        <Button onClick={handleAdd}>
          Tambah Provinsi
        </Button>
      </div>

      <Card className="overflow-hidden min-w-0">
        <CardHeader>
          <CardTitle>Daftar Provinsi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input 
              name="q" 
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari kode/nama..." 
            />
            <Button 
              onClick={() => handleSearchChange("")} 
              variant="outline"
              disabled={!searchQuery}
            >
              Clear
            </Button>
          </div>
          <DataTableShell>
            <DataTable>
              <DataTableHead>
                <DataTableHeadRow>
                  <DataTableTh>Kode</DataTableTh>
                  <DataTableTh>Nama</DataTableTh>
                  <DataTableTh>Aksi</DataTableTh>
                </DataTableHeadRow>
              </DataTableHead>
              <DataTableBody>
                {provinces.map((p) => (
                  <DataTableRow key={p.id}>
                    <DataTableTd>{p.id}</DataTableTd>
                    <DataTableTd>{p.name}</DataTableTd>
                    <DataTableTd>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(p)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(p.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </DataTableTd>
                  </DataTableRow>
                ))}
                {provinces.length === 0 && <DataTableEmpty colSpan={3} />}
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
