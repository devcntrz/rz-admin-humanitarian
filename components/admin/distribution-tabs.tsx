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
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import { Edit, Trash2, Plus, Upload, Download, Eye, X } from "lucide-react"

interface DistributionTabsProps {
  distributionId: number
}

export function DistributionTabs({ distributionId }: DistributionTabsProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("clusters")
  const [clusters, setClusters] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [tabLoading, setTabLoading] = useState<string | null>(null)

  const loadData = async (tab?: string) => {
    try {
      if (tab) {
        setTabLoading(tab)
      } else {
        setLoading(true)
      }
      
      const promises = []
      
      if (!tab || tab === 'clusters') {
        promises.push(apiClient.getDistributionClusters(distributionId))
      }
      if (!tab || tab === 'partners') {
        promises.push(apiClient.getDistributionPartners(distributionId))
      }
      if (!tab || tab === 'documents') {
        promises.push(apiClient.getDistributionDocuments(distributionId))
      }
      
      const results = await Promise.all(promises)
      
      if (!tab || tab === 'clusters') {
        const clustersRes = results[0]
        if (clustersRes.success) setClusters(clustersRes.data || [])
      }
      if (!tab || tab === 'partners') {
        const partnersRes = results[tab ? 0 : 1]
        if (partnersRes.success) setPartners(partnersRes.data || [])
      }
      if (!tab || tab === 'documents') {
        const documentsRes = results[tab ? 0 : 2]
        if (documentsRes.success) setDocuments(documentsRes.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
      setTabLoading(null)
    }
  }

  useEffect(() => {
    loadData()
  }, [distributionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let response
      const data = { ...formData }
      
      switch (activeTab) {
        case 'clusters':
          if (editingItem) {
            response = await apiClient.updateDistributionCluster(distributionId, editingItem.id, data)
          } else {
            response = await apiClient.createDistributionCluster(distributionId, data)
          }
          break
        case 'partners':
          if (editingItem) {
            response = await apiClient.updateDistributionPartner(distributionId, editingItem.id, data)
          } else {
            response = await apiClient.createDistributionPartner(distributionId, data)
          }
          break
      }
      
      if (response?.success) {
        setIsModalOpen(false)
        setEditingItem(null)
        setFormData({})
        loadData()
        toast({
          title: "Berhasil!",
          description: editingItem ? "Data berhasil diperbarui" : "Data berhasil ditambahkan",
          variant: "success",
        })
      } else {
        toast({
          title: "Gagal!",
          description: "Terjadi kesalahan saat menyimpan data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving data:', error)
      toast({
        title: "Gagal!",
        description: "Terjadi kesalahan saat menyimpan data",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setFormData(item)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        let response
        switch (activeTab) {
          case 'clusters':
            response = await apiClient.deleteDistributionCluster(distributionId, id)
            break
          case 'partners':
            response = await apiClient.deleteDistributionPartner(distributionId, id)
            break
          case 'documents':
            response = await apiClient.deleteDistributionDocument(distributionId, id)
            break
        }
        
        if (response?.success) {
          loadData()
          toast({
            title: "Berhasil!",
            description: "Data berhasil dihapus",
            variant: "success",
          })
        } else {
          toast({
            title: "Gagal!",
            description: "Terjadi kesalahan saat menghapus data",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error deleting data:', error)
        toast({
          title: "Gagal!",
          description: "Terjadi kesalahan saat menghapus data",
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
      
      if (file) {
        const response = await apiClient.uploadDistributionDocument(distributionId, file)
        if (response.success) {
          loadData()
          setIsModalOpen(false)
          toast({
            title: "Berhasil!",
            description: "File berhasil diupload",
            variant: "success",
          })
        } else {
          toast({
            title: "Gagal!",
            description: "Terjadi kesalahan saat mengupload file",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Gagal!",
        description: "Terjadi kesalahan saat mengupload file",
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

  const getTableHeaders = () => {
    switch (activeTab) {
      case 'clusters':
        return ['Cluster', 'Program', 'Jumlah', 'Satuan', 'Deskripsi', 'Aksi']
      case 'partners':
        return ['Nama Mitra', 'Deskripsi', 'Aksi']
      case 'documents':
        return ['File', 'Deskripsi', 'Aksi']
      default:
        return []
    }
  }

  const getFormFields = () => {
    switch (activeTab) {
      case 'clusters':
        return (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Nama Cluster *</label>
              <Input 
                value={formData.cluster_name || ''}
                onChange={(e) => setFormData({...formData, cluster_name: e.target.value})}
                placeholder="Nama cluster"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Nama Program *</label>
              <Input 
                value={formData.program_name || ''}
                onChange={(e) => setFormData({...formData, program_name: e.target.value})}
                placeholder="Nama program"
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
                placeholder="Contoh: kg, liter, paket"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Deskripsi</label>
              <textarea 
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Deskripsi cluster/program"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </>
        )
      case 'partners':
        return (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Nama Mitra *</label>
              <Input 
                value={formData.partner_name || ''}
                onChange={(e) => setFormData({...formData, partner_name: e.target.value})}
                placeholder="Nama mitra"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Deskripsi</label>
              <textarea 
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Deskripsi/keterangan mitra"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </>
        )
      default:
        return null
    }
  }

  const getCurrentData = () => {
    switch (activeTab) {
      case 'clusters': return clusters
      case 'partners': return partners
      case 'documents': return documents
      default: return []
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'clusters', label: 'Cluster/Program' },
            { id: 'partners', label: 'Mitra' },
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
              disabled={tabLoading === tab.id}
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
            {activeTab === 'clusters' && 'Cluster/Program'}
            {activeTab === 'partners' && 'Mitra'}
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
          {loading || tabLoading ? (
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
                    {activeTab === 'clusters' && (
                      <>
                        <td className="p-3">{item.cluster_name}</td>
                        <td className="p-3">{item.program_name}</td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3">{item.unit}</td>
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
                    {activeTab === 'partners' && (
                      <>
                        <td className="p-3">{item.partner_name}</td>
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
                    {activeTab === 'documents' && (
                      <>
                        <td className="p-3">
                          {item.file_url && (
                            <div className="flex items-center gap-3">
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
                                <div className="flex items-center gap-2">
                                  <Download className="h-4 w-4" />
                                  <a 
                                    href={item.file_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    Lihat File
                                  </a>
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{item.description || 'Dokumentasi'}</p>
                                <p className="text-xs text-muted-foreground">{item.file_url.split('/').pop()}</p>
                              </div>
                            </div>
                          )}
                        </td>
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
                  ? `Edit ${activeTab === 'clusters' ? 'Cluster' : 'Mitra'}`
                  : `Tambah ${activeTab === 'clusters' ? 'Cluster' : 'Mitra'}`
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
