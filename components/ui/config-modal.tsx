import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import Select from 'react-select'

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'provinces' | 'regencies' | 'districts' | 'villages' | 'disaster-types' | 'admins'
  editingData?: any
}

export function ConfigModal({ isOpen, onClose, onSuccess, type, editingData }: ConfigModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [provinces, setProvinces] = useState<any[]>([])
  const [regencies, setRegencies] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])

  const isEditing = !!editingData

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData(editingData)
      } else {
        setFormData(getInitialFormData())
      }
      loadDependencies()
    }
  }, [isOpen, editingData])

  const getInitialFormData = () => {
    switch (type) {
      case 'provinces':
        return { id: "", name: "" }
      case 'regencies':
        return { id: "", province_id: "", name: "" }
      case 'districts':
        return { id: "", province_id: "", regency_id: "", name: "" }
      case 'villages':
        return { id: "", province_id: "", regency_id: "", district_id: "", name: "" }
      case 'disaster-types':
        return { name: "" }
      case 'admins':
        return { full_name: "", email: "", role: "" }
      default:
        return {}
    }
  }

  const loadDependencies = async () => {
    if (type === 'regencies' || type === 'districts' || type === 'villages') {
      try {
        setLoading(true)
        const provincesResponse = await apiClient.getProvinces()
        if (provincesResponse.success && provincesResponse.data) {
          setProvinces(provincesResponse.data)
        }
      } catch (error) {
        console.error('Error loading provinces:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const loadRegencies = async (provinceId: string) => {
    try {
      const regenciesResponse = await apiClient.getRegencies(undefined, provinceId)
      if (regenciesResponse.success && regenciesResponse.data) {
        setRegencies(regenciesResponse.data)
      }
    } catch (error) {
      console.error('Error loading regencies:', error)
    }
  }

  const loadDistricts = async (regencyId: string) => {
    try {
      const districtsResponse = await apiClient.getDistricts(undefined, regencyId)
      if (districtsResponse.success && districtsResponse.data) {
        setDistricts(districtsResponse.data)
      }
    } catch (error) {
      console.error('Error loading districts:', error)
    }
  }

  const handleProvinceChange = (selectedOption: {value: string, label: string} | null) => {
    const provinceId = selectedOption?.value || ""
    setFormData({ ...formData, province_id: provinceId, regency_id: "", district_id: "" })
    setRegencies([])
    setDistricts([])
    
    if (provinceId) {
      loadRegencies(provinceId)
    }
  }

  const handleRegencyChange = (selectedOption: {value: string, label: string} | null) => {
    const regencyId = selectedOption?.value || ""
    setFormData({ ...formData, regency_id: regencyId, district_id: "" })
    setDistricts([])
    
    if (regencyId) {
      loadDistricts(regencyId)
    }
  }

  const handleDistrictChange = (selectedOption: {value: string, label: string} | null) => {
    const districtId = selectedOption?.value || ""
    setFormData({ ...formData, district_id: districtId })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      
      let response
      switch (type) {
        case 'provinces':
          if (isEditing) {
            response = await apiClient.updateProvince(editingData.id, { name: formData.name })
          } else {
            response = await apiClient.createProvince(formData)
          }
          break
        case 'regencies':
          if (isEditing) {
            response = await apiClient.updateRegency(editingData.id, { name: formData.name, province_id: formData.province_id })
          } else {
            response = await apiClient.createRegency(formData)
          }
          break
        case 'districts':
          if (isEditing) {
            response = await apiClient.updateDistrict(editingData.id, { name: formData.name, regency_id: formData.regency_id })
          } else {
            response = await apiClient.createDistrict(formData)
          }
          break
        case 'villages':
          if (isEditing) {
            response = await apiClient.updateVillage(editingData.id, { name: formData.name, district_id: formData.district_id })
          } else {
            response = await apiClient.createVillage(formData)
          }
          break
        case 'disaster-types':
          if (isEditing) {
            response = await apiClient.updateDisasterType(editingData.id, { name: formData.name })
          } else {
            response = await apiClient.createDisasterType(formData)
          }
          break
        case 'admins':
          if (isEditing) {
            response = await apiClient.updateAdmin(editingData.id, { full_name: formData.full_name, email: formData.email, role: formData.role })
          } else {
            response = await apiClient.createAdmin(formData)
          }
          break
      }
      
      if (response.success) {
        onSuccess()
        onClose()
        toast({
          title: "Sukses",
          description: isEditing ? "Data berhasil diupdate." : "Data berhasil ditambahkan.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: response.message || (isEditing ? "Gagal mengupdate data." : "Gagal menambahkan data."),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving data:', error)
      toast({
        title: "Error",
        description: isEditing ? "Gagal mengupdate data." : "Gagal menambahkan data.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getTitle = () => {
    const action = isEditing ? "Edit" : "Tambah"
    switch (type) {
      case 'provinces':
        return `${action} Provinsi`
      case 'regencies':
        return `${action} Kabupaten/Kota`
      case 'districts':
        return `${action} Kecamatan`
      case 'villages':
        return `${action} Desa/Kelurahan`
      case 'disaster-types':
        return `${action} Jenis Bencana`
      case 'admins':
        return `${action} Admin`
      default:
        return `${action} Data`
    }
  }

  const renderFormFields = () => {
    switch (type) {
      case 'provinces':
        return (
          <>
            {!isEditing && (
              <Input
                name="id"
                placeholder="Kode (2 digit)"
                required
                maxLength={2}
                value={formData.id || ""}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
              />
            )}
            <Input
              name="name"
              placeholder="Nama Provinsi"
              required
              value={formData.name || ""}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </>
        )
      
      case 'regencies':
        return (
          <>
            {!isEditing && (
              <Input
                name="id"
                placeholder="Kode (4 digit)"
                required
                maxLength={4}
                value={formData.id || ""}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
              />
            )}
            <Select
              value={provinces.find(p => p.id === formData.province_id) ? { value: formData.province_id, label: provinces.find(p => p.id === formData.province_id)?.name } : null}
              onChange={handleProvinceChange}
              options={provinces.map(p => ({ value: p.id, label: p.name }))}
              placeholder="Pilih Provinsi..."
              isClearable
              isSearchable
              className="text-sm"
              maxMenuHeight={200}
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  minHeight: '40px',
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
            <Input
              name="name"
              placeholder="Nama Kabupaten/Kota"
              required
              value={formData.name || ""}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </>
        )
      
      case 'districts':
        return (
          <>
            {!isEditing && (
              <Input
                name="id"
                placeholder="Kode (7 digit)"
                required
                maxLength={7}
                value={formData.id || ""}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
              />
            )}
            <Select
              value={provinces.find(p => p.id === formData.province_id) ? { value: formData.province_id, label: provinces.find(p => p.id === formData.province_id)?.name } : null}
              onChange={handleProvinceChange}
              options={provinces.map(p => ({ value: p.id, label: p.name }))}
              placeholder="Pilih Provinsi..."
              isClearable
              isSearchable
              className="text-sm"
              maxMenuHeight={200}
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  minHeight: '40px',
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
            <Select
              value={regencies.find(r => r.id === formData.regency_id) ? { value: formData.regency_id, label: regencies.find(r => r.id === formData.regency_id)?.name } : null}
              onChange={handleRegencyChange}
              options={regencies.map(r => ({ value: r.id, label: r.name }))}
              placeholder="Pilih Kabupaten/Kota..."
              isClearable
              isSearchable
              className="text-sm"
              maxMenuHeight={200}
              isDisabled={!formData.province_id}
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  minHeight: '40px',
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
            <Input
              name="name"
              placeholder="Nama Kecamatan"
              required
              value={formData.name || ""}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </>
        )
      
      case 'villages':
        return (
          <>
            {!isEditing && (
              <Input
                name="id"
                placeholder="Kode (10 digit)"
                required
                maxLength={10}
                value={formData.id || ""}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
              />
            )}
            <Select
              value={provinces.find(p => p.id === formData.province_id) ? { value: formData.province_id, label: provinces.find(p => p.id === formData.province_id)?.name } : null}
              onChange={handleProvinceChange}
              options={provinces.map(p => ({ value: p.id, label: p.name }))}
              placeholder="Pilih Provinsi..."
              isClearable
              isSearchable
              className="text-sm"
              maxMenuHeight={200}
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  minHeight: '40px',
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
            <Select
              value={regencies.find(r => r.id === formData.regency_id) ? { value: formData.regency_id, label: regencies.find(r => r.id === formData.regency_id)?.name } : null}
              onChange={handleRegencyChange}
              options={regencies.map(r => ({ value: r.id, label: r.name }))}
              placeholder="Pilih Kabupaten/Kota..."
              isClearable
              isSearchable
              className="text-sm"
              maxMenuHeight={200}
              isDisabled={!formData.province_id}
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  minHeight: '40px',
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
            <Select
              value={districts.find(d => d.id === formData.district_id) ? { value: formData.district_id, label: districts.find(d => d.id === formData.district_id)?.name } : null}
              onChange={handleDistrictChange}
              options={districts.map(d => ({ value: d.id, label: d.name }))}
              placeholder="Pilih Kecamatan..."
              isClearable
              isSearchable
              className="text-sm"
              maxMenuHeight={200}
              isDisabled={!formData.regency_id}
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  minHeight: '40px',
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
            <Input
              name="name"
              placeholder="Nama Desa/Kelurahan"
              required
              value={formData.name || ""}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </>
        )
      
      case 'disaster-types':
        return (
          <Input
            name="name"
            placeholder="Nama Jenis Bencana"
            required
            value={formData.name || ""}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        )
      
      case 'admins':
        return (
          <>
            <Input
              name="full_name"
              placeholder="Nama Lengkap"
              required
              value={formData.full_name || ""}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
              value={formData.email || ""}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <select
              name="role"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
              value={formData.role || ""}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="">Pilih Role</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </>
        )
      
      default:
        return null
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {renderFormFields()}
        
        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isEditing ? "Updating..." : "Saving..."}
              </div>
            ) : (
              isEditing ? "Update" : "Simpan"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
        </div>
      </form>
    </Modal>
  )
}
