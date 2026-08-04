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
import { apiClient } from "@/lib/api"
import { Edit, Trash2, Plus, Upload, Download, Eye, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SiteReportTabsProps {
  siteReportId: number
}

export function SiteReportTabs({ siteReportId }: SiteReportTabsProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("victims")
  const [victims, setVictims] = useState<any[]>([])
  const [damages, setDamages] = useState<any[]>([])
  const [refugees, setRefugees] = useState<any[]>([])
  const [needs, setNeeds] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>('')

  const loadData = async (tab?: string) => {
    try {
      if (tab) {
        setTabLoading(tab)
      } else {
        setLoading(true)
      }

      if (!tab) {
        // Muat semua tab sekaligus
        const [victimsRes, damagesRes, refugeesRes, needsRes, documentsRes] = await Promise.all([
          apiClient.getSiteReportVictims(siteReportId),
          apiClient.getSiteReportDamages(siteReportId),
          apiClient.getSiteReportRefugees(siteReportId),
          apiClient.getSiteReportNeeds(siteReportId),
          apiClient.getSiteReportDocuments(siteReportId),
        ])

        if (victimsRes && victimsRes.success) setVictims(victimsRes.data || [])
        if (damagesRes && damagesRes.success) setDamages(damagesRes.data || [])
        if (refugeesRes && refugeesRes.success) setRefugees(refugeesRes.data || [])
        if (needsRes && needsRes.success) setNeeds(needsRes.data || [])
        if (documentsRes && documentsRes.success) setDocuments(documentsRes.data || [])
      } else {
        // Muat hanya tab yang diminta dan update state yang sesuai
        switch (tab) {
          case 'victims': {
            const res = await apiClient.getSiteReportVictims(siteReportId)
            if (res.success) setVictims(res.data || [])
            break
          }
          case 'damages': {
            const res = await apiClient.getSiteReportDamages(siteReportId)
            if (res.success) setDamages(res.data || [])
            break
          }
          case 'refugees': {
            const res = await apiClient.getSiteReportRefugees(siteReportId)
            if (res.success) setRefugees(res.data || [])
            break
          }
          case 'needs': {
            const res = await apiClient.getSiteReportNeeds(siteReportId)
            if (res.success) setNeeds(res.data || [])
            break
          }
          case 'documents': {
            const res = await apiClient.getSiteReportDocuments(siteReportId)
            if (res.success) setDocuments(res.data || [])
            break
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setTabLoading(null)
    }
  }

  useEffect(() => {
    loadData()
  }, [siteReportId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let response
      const data = { ...formData }
      
      switch (activeTab) {
        case 'victims':
          if (editingItem) {
            response = await apiClient.updateSiteReportVictim(siteReportId, editingItem.id, data)
          } else {
            response = await apiClient.createSiteReportVictim(siteReportId, data)
          }
          break
        case 'damages':
          if (editingItem) {
            response = await apiClient.updateSiteReportDamage(siteReportId, editingItem.id, data)
          } else {
            response = await apiClient.createSiteReportDamage(siteReportId, data)
          }
          break
        case 'refugees':
          if (editingItem) {
            response = await apiClient.updateSiteReportRefugee(siteReportId, editingItem.id, data)
          } else {
            response = await apiClient.createSiteReportRefugee(siteReportId, data)
          }
          break
        case 'needs':
          if (editingItem) {
            response = await apiClient.updateSiteReportNeed(siteReportId, editingItem.id, data)
          } else {
            response = await apiClient.createSiteReportNeed(siteReportId, data)
          }
          break
      }
      
      if (response?.success) {
        toast({
          title: "Sukses",
          description: editingItem ? "Data berhasil diperbarui." : "Data berhasil ditambahkan.",
          variant: "default",
        })
        setIsModalOpen(false)
        setEditingItem(null)
        setFormData({})
        await loadData(activeTab)
      } else {
        toast({
          title: "Error",
          description: "Gagal menyimpan data.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving data:', error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan data.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    // Normalisasi data khusus per tab untuk menjaga kompatibilitas BE/FE
    if (activeTab === 'refugees') {
      setFormData({
        ...item,
        // FE memakai condition_description, BE bisa kirim description
        condition_description: item?.condition_description ?? item?.description ?? ''
      })
    } else {
      setFormData(item)
    }
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        let response
        switch (activeTab) {
          case 'victims':
            response = await apiClient.deleteSiteReportVictim(siteReportId, id)
            break
          case 'damages':
            response = await apiClient.deleteSiteReportDamage(siteReportId, id)
            break
          case 'refugees':
            response = await apiClient.deleteSiteReportRefugee(siteReportId, id)
            break
          case 'needs':
            response = await apiClient.deleteSiteReportNeed(siteReportId, id)
            break
          case 'documents':
            response = await apiClient.deleteSiteReportDocument(siteReportId, id)
            break
        }
        
        if (response?.success) {
          toast({
            title: "Sukses",
            description: "Data berhasil dihapus.",
            variant: "default",
          })
          await loadData(activeTab)
        } else {
          toast({
            title: "Error",
            description: "Gagal menghapus data.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error deleting data:', error)
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat menghapus data.",
          variant: "destructive",
        })
      }
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const file = formData.get('file') as File
      const description = formData.get('description') as string
      
      if (file) {
        const response = await apiClient.uploadSiteReportDocument(siteReportId, file, description)
        if (response.success) {
          toast({
            title: "Sukses",
            description: "File berhasil diupload.",
            variant: "default",
          })
          setIsModalOpen(false)
          await loadData(activeTab)
        } else {
          toast({
            title: "Error",
            description: "Gagal mengupload file.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengupload file.",
        variant: "destructive",
      })
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({})
    setIsModalOpen(true)
  }

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setIsImageModalOpen(true)
  }

  const closeImageModal = () => {
    setIsImageModalOpen(false)
    setSelectedImage('')
  }

  const getCurrentData = () => {
    switch (activeTab) {
      case 'victims': return victims
      case 'damages': return damages
      case 'refugees': return refugees
      case 'needs': return needs
      case 'documents': return documents
      default: return []
    }
  }

  const getTableHeaders = () => {
    switch (activeTab) {
      case 'victims':
        return ['Kategori', 'Jumlah', 'Deskripsi', 'Aksi']
      case 'damages':
        return ['Jenis Infrastruktur', 'Tingkat Kerusakan', 'Deskripsi', 'Aksi']
      case 'refugees':
        return ['Lokasi', 'Jumlah', 'Kondisi', 'Aksi']
      case 'needs':
        return ['Item Kebutuhan', 'Jumlah', 'Satuan', 'Aksi']
      case 'documents':
        return ['File', 'Deskripsi', 'Aksi']
      default:
        return []
    }
  }

  const getFormFields = () => {
    switch (activeTab) {
      case 'victims':
        return (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Kategori *</label>
              <Input 
                value={formData.category || ''}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Contoh: Meninggal, Luka-luka, Hilang"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Jumlah *</label>
              <Input 
                type="number"
                value={formData.count || ''}
                onChange={(e) => setFormData({...formData, count: Number(e.target.value)})}
                min="0"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Deskripsi</label>
              <textarea 
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Deskripsi tambahan"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </>
        )
      case 'damages':
        return (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Jenis Infrastruktur *</label>
              <Input 
                value={formData.infrastructure_type || ''}
                onChange={(e) => setFormData({...formData, infrastructure_type: e.target.value})}
                placeholder="Contoh: Jalan, Jembatan, Rumah"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tingkat Kerusakan *</label>
              <select 
                value={formData.damage_level || ''}
                onChange={(e) => setFormData({...formData, damage_level: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                required
                title="Pilih tingkat kerusakan"
                aria-label="Tingkat kerusakan"
              >
                <option value="">Pilih Tingkat Kerusakan</option>
                <option value="ringan">Ringan</option>
                <option value="sedang">Sedang</option>
                <option value="berat">Berat</option>
                <option value="rusak_total">Rusak Total</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Deskripsi</label>
              <textarea 
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Deskripsi kerusakan"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </>
        )
      case 'refugees':
        return (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Lokasi *</label>
              <Input 
                value={formData.location || ''}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Lokasi pengungsian"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Jumlah *</label>
              <Input 
                type="number"
                value={formData.count || ''}
                onChange={(e) => setFormData({...formData, count: Number(e.target.value)})}
                min="0"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Deskripsi Kondisi</label>
              <textarea 
                value={formData.condition_description || ''}
                onChange={(e) => setFormData({...formData, condition_description: e.target.value})}
                placeholder="Kondisi pengungsi"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </>
        )
      case 'needs':
        return (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Item Kebutuhan *</label>
              <Input 
                value={formData.need_item || ''}
                onChange={(e) => setFormData({...formData, need_item: e.target.value})}
                placeholder="Contoh: Beras, Air, Obat-obatan"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Jumlah *</label>
              <Input 
                type="number"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                min="0"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Satuan *</label>
              <Input 
                value={formData.unit || ''}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                placeholder="Contoh: kg, liter, kotak"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Deskripsi</label>
              <textarea 
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Deskripsi tambahan kebutuhan"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'victims', label: 'Korban' },
            { id: 'damages', label: 'Kerusakan' },
            { id: 'refugees', label: 'Pengungsi' },
            { id: 'needs', label: 'Kebutuhan Mendesak' },
            { id: 'documents', label: 'Dokumentasi' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                loadData(tab.id)
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              {tabLoading === tab.id ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  {tab.label}
                </div>
              ) : (
                tab.label
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {activeTab === 'victims' && 'Data Korban'}
            {activeTab === 'damages' && 'Kerusakan Infrastruktur'}
            {activeTab === 'refugees' && 'Data Pengungsi'}
            {activeTab === 'needs' && 'Kebutuhan Mendesak'}
            {activeTab === 'documents' && 'Dokumentasi'}
          </CardTitle>
          {activeTab !== 'documents' && (
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Data
            </Button>
          )}
          {activeTab === 'documents' && (
            <Button onClick={openCreateModal}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {tabLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">Loading data...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full border border-border rounded-md">
              <thead>
                <tr className="bg-muted/50">
                  {getTableHeaders().map((header) => (
                    <th key={header} className="text-left p-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getCurrentData().map((item) => (
                  <tr key={item.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    {activeTab === 'victims' && (
                      <>
                        <td className="p-3">{item.category}</td>
                        <td className="p-3">{item.count}</td>
                        <td className="p-3">{item.description || '-'}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                    {activeTab === 'damages' && (
                      <>
                        <td className="p-3">{item.infrastructure_type}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            item.damage_level === 'berat' || item.damage_level === 'rusak_total'
                              ? 'bg-red-100 text-red-800'
                              : item.damage_level === 'sedang'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.damage_level}
                          </span>
                        </td>
                        <td className="p-3">{item.description || '-'}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                    {activeTab === 'refugees' && (
                      <>
                        <td className="p-3">{item.location}</td>
                        <td className="p-3">{item.count}</td>
                        <td className="p-3">{item.condition_description || item.description || '-'}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                    {activeTab === 'needs' && (
                      <>
                        <td className="p-3">{item.need_item}</td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3">{item.unit}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                    {activeTab === 'documents' && (
                      <>
                        <td className="p-3">
                          {item.file_url && (
                            <div className="space-y-2">
                              {item.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <div 
                                  className="relative group cursor-pointer p-2 -m-2 border-2 border-transparent hover:border-blue-500 rounded-lg min-w-[80px] min-h-[80px]"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    openImageModal(item.file_url)
                                  }}
                                  title="Klik untuk melihat gambar dalam ukuran penuh"
                                >
                                  <img 
                                    src={item.file_url} 
                                    alt={item.description || 'Dokumentasi'}
                                    className="w-20 h-20 object-cover rounded-md border border-border hover:opacity-80 transition-opacity pointer-events-none"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-md flex items-center justify-center pointer-events-none">
                                    <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ) : (
                                <a 
                                  href={item.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  Lihat File
                                </a>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3">{item.description || '-'}</td>
                        <td className="p-3">
                          <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {getCurrentData().length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={getTableHeaders().length}>
                      Tidak ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>
              {activeTab === 'documents' 
                ? 'Upload Dokumentasi'
                : editingItem 
                  ? `Edit ${activeTab === 'victims' ? 'Korban' : activeTab === 'damages' ? 'Kerusakan' : activeTab === 'refugees' ? 'Pengungsi' : 'Kebutuhan'}`
                  : `Tambah ${activeTab === 'victims' ? 'Korban' : activeTab === 'damages' ? 'Kerusakan' : activeTab === 'refugees' ? 'Pengungsi' : 'Kebutuhan'}`
              }
            </ModalTitle>
          </ModalHeader>
          
          {activeTab === 'documents' ? (
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">File *</label>
                <Input 
                  type="file"
                  name="file"
                  accept="image/*,.pdf,.doc,.docx"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Deskripsi</label>
                <textarea 
                  name="description"
                  placeholder="Deskripsi file"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <ModalFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  Upload
                </Button>
              </ModalFooter>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {getFormFields()}
              <ModalFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingItem ? 'Update' : 'Simpan'}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              title="Tutup gambar"
              aria-label="Tutup gambar"
            >
              <X className="h-5 w-5" />
            </button>
            {selectedImage && (
              <img 
                src={selectedImage} 
                alt="Dokumentasi"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
