"use client"

import { useState, useEffect, useRef } from "react"
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
import { Edit, Trash2, UserPlus, Eye, EyeOff, Upload, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

type Volunteer = {
  id: number
  full_name: string
  email: string
  phone: string | null
  created_at: string
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

export default function VolunteersPage() {
  const { toast } = useToast()
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: ""
  })
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [allVolunteers, setAllVolunteers] = useState<Volunteer[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success_count: number
    failed_count: number
    errors: { row: number; email?: string; reason: string }[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const paginateRows = (data: Volunteer[], page: number, pageSize: number) => {
    setAllVolunteers(data)
    setTotalItems(data.length)
    setTotalPages(Math.max(1, Math.ceil(data.length / pageSize) || 1))
    const startIndex = (page - 1) * pageSize
    setVolunteers(data.slice(startIndex, startIndex + pageSize))
    setCurrentPage(page)
  }

  const loadData = async (query?: string, page: number = 1, pageSize: number = itemsPerPage) => {
    try {
      setLoading(true)
      const response = await apiClient.getVolunteers(query)
      
      if (response.success && response.data) {
        paginateRows(response.data, page, pageSize)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data volunteers.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadData(searchQuery, 1)
  }

  const handlePageChange = (page: number) => {
    paginateRows(allVolunteers, page, itemsPerPage)
  }

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size)
    paginateRows(allVolunteers, 1, size)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      let response
      
      if (editingVolunteer) {
        const volunteerData = {
          id: editingVolunteer.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password || undefined
        }
        response = await apiClient.updateVolunteer(volunteerData)
      } else {
        const volunteerData = {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password || undefined
        }
        response = await apiClient.createVolunteer(volunteerData)
      }
      
      if (response.success) {
        toast({
          title: "Sukses",
          description: editingVolunteer ? "Volunteer berhasil diperbarui." : "Volunteer berhasil ditambahkan.",
          variant: "default",
        })
        // Reset form and close modal
        setFormData({
          full_name: "",
          email: "",
          phone: "",
          password: ""
        })
        setEditingVolunteer(null)
        setIsModalOpen(false)
        setShowPassword(false)
        // Reload data
        loadData(searchQuery, currentPage)
      } else {
        toast({
          title: "Error",
          description: "Gagal menyimpan volunteer.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving volunteer:', error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan volunteer.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (volunteer: Volunteer) => {
    setEditingVolunteer(volunteer)
    setFormData({
      full_name: volunteer.full_name,
      email: volunteer.email,
      phone: volunteer.phone || "",
      password: ""
    })
    setShowPassword(false)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus volunteer ini?')) {
      try {
        const response = await apiClient.deleteVolunteer(id)
        
        if (response.success) {
          toast({
            title: "Sukses",
            description: "Volunteer berhasil dihapus.",
            variant: "default",
          })
          loadData(searchQuery, currentPage)
        } else {
          toast({
            title: "Error",
            description: "Gagal menghapus volunteer.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error deleting volunteer:', error)
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat menghapus volunteer.",
          variant: "destructive",
        })
      }
    }
  }

  const openCreateModal = () => {
    setEditingVolunteer(null)
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      password: ""
    })
    setShowPassword(false)
    setIsModalOpen(true)
  }

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        full_name: "Contoh Nama",
        email: "contoh@email.com",
        password: "Password123!",
        phone: "081234567890",
      },
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Volunteers")
    XLSX.writeFile(wb, "volunteer-import-template.xlsx")
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setImporting(true)
      setImportResult(null)
      const response = await apiClient.importVolunteers(file)
      if (response.success && response.data) {
        setImportResult(response.data)
        toast({
          title: "Import selesai",
          description: `${response.data.success_count} berhasil, ${response.data.failed_count} gagal.`,
        })
        loadData(searchQuery, currentPage)
      } else {
        toast({
          title: "Error",
          description: response.error || "Gagal mengimpor volunteers.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error importing volunteers:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengimpor volunteers.",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
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
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-balance">Volunteers</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? "Mengimpor..." : "Import Excel"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImportFile}
            />
            <Button onClick={openCreateModal}>
              <UserPlus className="h-4 w-4 mr-2" />
              Tambah Volunteer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {importResult && (
            <div className="rounded-md border p-3 text-sm space-y-2 bg-muted/30">
              <p>
                Hasil import: <strong>{importResult.success_count}</strong> berhasil,{" "}
                <strong>{importResult.failed_count}</strong> gagal.
              </p>
              {importResult.errors.length > 0 && (
                <ul className="list-disc pl-5 space-y-1 max-h-40 overflow-y-auto">
                  {importResult.errors.slice(0, 20).map((err, idx) => (
                    <li key={`${err.row}-${idx}`}>
                      Baris {err.row}
                      {err.email ? ` (${err.email})` : ""}: {err.reason}
                    </li>
                  ))}
                  {importResult.errors.length > 20 && (
                    <li>...dan {importResult.errors.length - 20} error lainnya</li>
                  )}
                </ul>
              )}
            </div>
          )}
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama/email/telepon..." 
            />
            <Button type="submit" variant="secondary">
              Cari
            </Button>
          </form>
          <DataTableShell>
            <DataTable>
              <DataTableHead>
                <DataTableHeadRow>
                  <DataTableTh>ID</DataTableTh>
                  <DataTableTh>Nama</DataTableTh>
                  <DataTableTh>Email</DataTableTh>
                  <DataTableTh>Telepon</DataTableTh>
                  <DataTableTh>Tanggal Daftar</DataTableTh>
                  <DataTableTh stickyRight>Aksi</DataTableTh>
                </DataTableHeadRow>
              </DataTableHead>
              <DataTableBody>
                {volunteers.map((v) => (
                  <DataTableRow key={v.id}>
                    <DataTableTd className="whitespace-nowrap">{v.id}</DataTableTd>
                    <DataTableTd className="font-medium">{v.full_name}</DataTableTd>
                    <DataTableTd>{v.email}</DataTableTd>
                    <DataTableTd>{v.phone ?? "-"}</DataTableTd>
                    <DataTableTd className="whitespace-nowrap">{formatDate(v.created_at)}</DataTableTd>
                    <DataTableTd stickyRight>
                      <div className="flex gap-0.5">
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleEdit(v)} title="Edit">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleDelete(v.id)} title="Hapus">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </DataTableTd>
                  </DataTableRow>
                ))}
                {volunteers.length === 0 && <DataTableEmpty colSpan={6} />}
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

      {/* Modal Form */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>
              {editingVolunteer ? 'Edit Volunteer' : 'Tambah Volunteer'}
            </ModalTitle>
          </ModalHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nama Lengkap *</label>
              <Input 
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Nama lengkap volunteer"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Email *</label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="email@example.com"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">No. Telepon</label>
              <Input 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="081234567890"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Password {editingVolunteer ? "(Kosongkan jika tidak ingin mengubah)" : "*"}
              </label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder={editingVolunteer ? "Kosongkan jika tidak ingin mengubah password" : "Password untuk login volunteer"}
                  required={!editingVolunteer}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {editingVolunteer && (
                <p className="text-xs text-muted-foreground mt-1">
                  Kosongkan field ini jika tidak ingin mengubah password volunteer
                </p>
              )}
            </div>
            
            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {editingVolunteer ? 'Updating...' : 'Saving...'}
                  </div>
                ) : (
                  editingVolunteer ? 'Update' : 'Simpan'
                )}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  )
}