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
import { Edit, Trash2, UserPlus, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  const [showPassword, setShowPassword] = useState(false)
  const itemsPerPage = 10

  const loadData = async (query?: string, page: number = 1) => {
    try {
      setLoading(true)
      const response = await apiClient.getVolunteers(query)
      
      if (response.success && response.data) {
        const allVolunteers = response.data
        const startIndex = (page - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedVolunteers = allVolunteers.slice(startIndex, endIndex)
        
        setVolunteers(paginatedVolunteers)
        setTotalItems(allVolunteers.length)
        setTotalPages(Math.ceil(allVolunteers.length / itemsPerPage))
        setCurrentPage(page)
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
    setCurrentPage(page)
    loadData(searchQuery, page)
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
          <CardTitle className="text-balance">Volunteers</CardTitle>
          <Button onClick={openCreateModal}>
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah Volunteer
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full border border-border rounded-md">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-medium">ID</th>
                  <th className="text-left p-3 font-medium">Nama</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Telepon</th>
                  <th className="text-left p-3 font-medium">Tanggal Daftar</th>
                  <th className="text-left p-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map((v) => (
                  <tr key={v.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="p-3">{v.id}</td>
                    <td className="p-3 font-medium">{v.full_name}</td>
                    <td className="p-3">{v.email}</td>
                    <td className="p-3">{v.phone ?? "-"}</td>
                    <td className="p-3">{formatDate(v.created_at)}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(v)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDelete(v.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {volunteers.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={6}>
                      Tidak ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1} sampai {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
              </div>
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
            </div>
          )}
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