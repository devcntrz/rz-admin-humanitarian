// Use relative base URL by default to avoid cross-origin/port mismatch in dev
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  total?: number
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const isFormData = options.body instanceof FormData
    const config: RequestInit = {
      ...options,
      // Only set JSON content-type when not uploading FormData
      headers: isFormData
        ? { ...options.headers }
        : {
            'Content-Type': 'application/json',
            ...options.headers,
          },
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
      
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Volunteers
  async getVolunteers(query?: string): Promise<ApiResponse<any[]>> {
    const params = query ? `?q=${encodeURIComponent(query)}` : ''
    return this.request(`/volunteers${params}`)
  }

  async createVolunteer(data: {
    full_name: string
    email: string
    phone?: string
    password?: string
  }): Promise<ApiResponse<any>> {
    return this.request('/volunteers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateVolunteer(data: {
    id: number
    full_name: string
    email: string
    phone?: string
    password?: string
  }): Promise<ApiResponse<any>> {
    return this.request('/volunteers', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteVolunteer(id: number): Promise<ApiResponse<any>> {
    return this.request(`/volunteers?id=${id}`, {
      method: 'DELETE',
    })
  }

  async importVolunteers(file: File): Promise<ApiResponse<{
    success_count: number
    failed_count: number
    errors: { row: number; email?: string; reason: string }[]
  }>> {
    const formData = new FormData()
    formData.append('file', file)
    return this.request('/volunteers/import', {
      method: 'POST',
      body: formData,
    })
  }

  async getFieldCoordinators(query?: string): Promise<ApiResponse<any[]>> {
    const params = query ? `?q=${encodeURIComponent(query)}` : ''
    return this.request(`/config/field-coordinators${params}`)
  }

  // Site Reports
  async getSiteReports(query?: string): Promise<ApiResponse<any[]>> {
    const params = query ? `?q=${encodeURIComponent(query)}` : ''
    return this.request(`/site-reports${params}`)
  }

  async getSiteReport(id: number): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${id}`)
  }

  async createSiteReport(data: {
    subject?: string
    volunteer_id?: number
    disaster_type_id?: number
    village_id?: string
    report_date?: string
    status?: string
    full_address?: string
    latitude?: number
    longitude?: number
    province_id?: string
    regency_id?: string
    district_id?: string
    incident_at?: string
    chronology?: string
    disaster_status?: string
    latest_condition?: string
    field_coordinator_id?: number
    information_source?: string
  }): Promise<ApiResponse<any>> {
    return this.request('/site-reports', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSiteReport(
    id: number,
    data: {
      subject?: string
      volunteer_id?: number
      disaster_type_id?: number
      village_id?: string
      report_date?: string
      status?: string
      full_address?: string
      latitude?: number
      longitude?: number
      province_id?: string
      regency_id?: string
      district_id?: string
      incident_at?: string
      chronology?: string
      disaster_status?: string
      latest_condition?: string
      field_coordinator_id?: number
      information_source?: string
    }
  ): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSiteReport(id: number): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${id}`, {
      method: 'DELETE',
    })
  }

  // Distributions
  async getDistributions(query?: string): Promise<ApiResponse<any[]>> {
    const params = query ? `?q=${encodeURIComponent(query)}` : ''
    return this.request(`/distributions${params}`)
  }

  async getDistribution(id: number): Promise<ApiResponse<any>> {
    return this.request(`/distributions/${id}`)
  }

  async createDistribution(data: {
    // legacy fields (backcompat):
    volunteer_id?: number
    village_id?: string
    recipient_name?: string
    recipient_phone?: string
    items?: string
    quantity?: number
    distribution_date?: string
    status?: string
    notes?: string
    // new schema fields
    spk_number?: string
    event_name?: string
    event_date?: string
    disaster_type_id?: number
    pic_volunteer_id?: number
    full_address?: string
    latitude?: number
    longitude?: number
    beneficiary_count?: number
    volunteer_count?: number
    province_id?: string
    regency_id?: string
    district_id?: string
  }): Promise<ApiResponse<any>> {
    return this.request('/distributions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDistribution(
    id: number,
    data: {
      volunteer_id?: number
      village_id?: string
      recipient_name?: string
      recipient_phone?: string
      items?: string
      quantity?: number
      distribution_date?: string
      status?: string
      notes?: string
      spk_number?: string
      event_name?: string
      event_date?: string
      disaster_type_id?: number
      pic_volunteer_id?: number
      full_address?: string
      latitude?: number
      longitude?: number
      beneficiary_count?: number
      volunteer_count?: number
      province_id?: string
      regency_id?: string
      district_id?: string
    }
  ): Promise<ApiResponse<any>> {
    return this.request(`/distributions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteDistribution(id: number): Promise<ApiResponse<any>> {
    return this.request(`/distributions/${id}`, {
      method: 'DELETE',
    })
  }

  // Options (dropdown data)
  async getOptions(): Promise<ApiResponse<{
    volunteers: any[]
    disasterTypes: any[]
    villages: any[]
    provinces: any[]
    regencies: any[]
    districts: any[]
  }>> {
    return this.request('/options')
  }

  // Site Report Details CRUD
  async getSiteReportVictims(siteReportId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/site-reports/${siteReportId}/victims`)
  }

  async createSiteReportVictim(siteReportId: number, data: {
    category: string
    count: number
    description?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${siteReportId}/victims`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSiteReportVictim(siteReportId: number, victimId: number, data: {
    category: string
    count: number
    description?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${siteReportId}/victims/${victimId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSiteReportVictim(siteReportId: number, victimId: number): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${siteReportId}/victims/${victimId}`, {
      method: 'DELETE',
    })
  }

  async getSiteReportDamages(siteReportId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/site-reports/${siteReportId}/damages`)
  }

  async createSiteReportDamage(siteReportId: number, data: {
    infrastructure_type: string
    damage_level: string
    description?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${siteReportId}/damages`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSiteReportDamage(siteReportId: number, damageId: number, data: {
    infrastructure_type: string
    damage_level: string
    description?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${siteReportId}/damages/${damageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSiteReportDamage(siteReportId: number, damageId: number): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${siteReportId}/damages/${damageId}`, {
      method: 'DELETE',
    })
  }

  async getSiteReportRefugees(siteReportId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/site-reports/${siteReportId}/refugees`)
  }

  async createSiteReportRefugee(siteReportId: number, data: {
    location: string
    count: number
    condition_description?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${siteReportId}/refugees`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSiteReportRefugee(siteReportId: number, refugeeId: number, data: {
    location: string
    count: number
    condition_description?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${siteReportId}/refugees/${refugeeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSiteReportRefugee(siteReportId: number, refugeeId: number): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${siteReportId}/refugees/${refugeeId}`, {
      method: 'DELETE',
    })
  }

  async getSiteReportNeeds(siteReportId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/site-reports/${siteReportId}/needs`)
  }

  async createSiteReportNeed(siteReportId: number, data: {
    need_item: string
    quantity: number
    unit: string
    description?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${siteReportId}/needs`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSiteReportNeed(siteReportId: number, needId: number, data: {
    need_item: string
    quantity: number
    unit: string
    description?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${siteReportId}/needs/${needId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSiteReportNeed(siteReportId: number, needId: number): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${siteReportId}/needs/${needId}`, {
      method: 'DELETE',
    })
  }

  async getSiteReportDocuments(siteReportId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/site-reports/${siteReportId}/documents`)
  }

  async uploadSiteReportDocument(siteReportId: number, file: File, description?: string): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)

    return this.request(`/site-reports/${siteReportId}/documents`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    })
  }

  async updateSiteReportDocument(siteReportId: number, docId: number, data: {
    description?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${siteReportId}/documents/${docId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSiteReportDocument(siteReportId: number, docId: number): Promise<ApiResponse<any>> {
    return this.request(`/site-reports/${siteReportId}/documents/${docId}`, {
      method: 'DELETE',
    })
  }

  // Distribution Details CRUD
  async getDistributionClusters(distributionId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/distributions/${distributionId}/clusters`)
  }

  async createDistributionCluster(distributionId: number, data: {
    cluster_name: string
    program_name: string
    quantity: number
    unit: string
    description?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/distributions/${distributionId}/clusters`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDistributionCluster(distributionId: number, clusterId: number, data: {
    cluster_name: string
    program_name: string
    quantity: number
    unit: string
    description?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/distributions/${distributionId}/clusters/${clusterId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteDistributionCluster(distributionId: number, clusterId: number): Promise<ApiResponse<any>> {
    return this.request(`/distributions/${distributionId}/clusters/${clusterId}`, {
      method: 'DELETE',
    })
  }

  async getDistributionPartners(distributionId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/distributions/${distributionId}/partners`)
  }

  async createDistributionPartner(distributionId: number, data: {
    partner_name: string
    description?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/distributions/${distributionId}/partners`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDistributionPartner(distributionId: number, partnerId: number, data: {
    partner_name: string
    description?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/distributions/${distributionId}/partners/${partnerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteDistributionPartner(distributionId: number, partnerId: number): Promise<ApiResponse<any>> {
    return this.request(`/distributions/${distributionId}/partners/${partnerId}`, {
      method: 'DELETE',
    })
  }

  async getDistributionDocuments(distributionId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/distributions/${distributionId}/documents`)
  }

  async uploadDistributionDocument(distributionId: number, file: File, description?: string): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)

    return this.request(`/distributions/${distributionId}/documents`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    })
  }

  async deleteDistributionDocument(distributionId: number, docId: number): Promise<ApiResponse<any>> {
    return this.request(`/distributions/${distributionId}/documents/${docId}`, {
      method: 'DELETE',
    })
  }

  // Config APIs
  async getProvinces(query?: string): Promise<ApiResponse<any[]>> {
    const params = query ? `?q=${encodeURIComponent(query)}` : ''
    return this.request(`/config/provinces${params}`)
  }

  async createProvince(data: {
    id: string
    name: string
  }): Promise<ApiResponse<any>> {
    return this.request('/config/provinces', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProvince(id: string, data: { name: string }): Promise<ApiResponse<any>> {
    return this.request(`/config/provinces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProvince(id: string): Promise<ApiResponse<any>> {
    return this.request(`/config/provinces/${id}`, {
      method: 'DELETE',
    })
  }

  async getRegencies(query?: string, provinceId?: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (provinceId) params.append('province_id', provinceId)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/config/regencies${queryString}`)
  }

  async createRegency(data: {
    id: string
    province_id: string
    name: string
  }): Promise<ApiResponse<any>> {
    return this.request('/config/regencies', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateRegency(id: string, data: { name: string; province_id: string }): Promise<ApiResponse<any>> {
    return this.request(`/config/regencies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteRegency(id: string): Promise<ApiResponse<any>> {
    return this.request(`/config/regencies/${id}`, {
      method: 'DELETE',
    })
  }

  async getDistricts(query?: string, regencyId?: string, provinceId?: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (regencyId) params.append('regency_id', regencyId)
    if (provinceId) params.append('province_id', provinceId)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/config/districts${queryString}`)
  }

  async createDistrict(data: {
    id: string
    regency_id: string
    name: string
  }): Promise<ApiResponse<any>> {
    return this.request('/config/districts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDistrict(id: string, data: { name: string; regency_id: string }): Promise<ApiResponse<any>> {
    return this.request(`/config/districts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteDistrict(id: string): Promise<ApiResponse<any>> {
    return this.request(`/config/districts/${id}`, {
      method: 'DELETE',
    })
  }

  async getVillages(query?: string, districtId?: string, regencyId?: string, provinceId?: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (districtId) params.append('district_id', districtId)
    if (regencyId) params.append('regency_id', regencyId)
    if (provinceId) params.append('province_id', provinceId)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/config/villages${queryString}`)
  }

  async createVillage(data: {
    id: string
    district_id: string
    name: string
  }): Promise<ApiResponse<any>> {
    return this.request('/config/villages', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateVillage(id: string, data: { name: string; district_id: string }): Promise<ApiResponse<any>> {
    return this.request(`/config/villages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteVillage(id: string): Promise<ApiResponse<any>> {
    return this.request(`/config/villages/${id}`, {
      method: 'DELETE',
    })
  }

  async getDisasterTypes(query?: string): Promise<ApiResponse<any[]>> {
    const params = query ? `?q=${encodeURIComponent(query)}` : ''
    return this.request(`/config/disaster-types${params}`)
  }

  async createDisasterType(data: {
    name: string
  }): Promise<ApiResponse<any>> {
    return this.request('/config/disaster-types', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDisasterType(id: string, data: { name: string }): Promise<ApiResponse<any>> {
    return this.request(`/config/disaster-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteDisasterType(id: string): Promise<ApiResponse<any>> {
    return this.request(`/config/disaster-types/${id}`, {
      method: 'DELETE',
    })
  }

  async getAdmins(query?: string): Promise<ApiResponse<any[]>> {
    const params = query ? `?q=${encodeURIComponent(query)}` : ''
    return this.request(`/config/admins${params}`)
  }

  async createAdmin(data: {
    full_name: string
    email: string
    role: string
  }): Promise<ApiResponse<any>> {
    return this.request('/config/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAdmin(id: string, data: { full_name: string; email: string; role: string }): Promise<ApiResponse<any>> {
    return this.request(`/config/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAdmin(id: string): Promise<ApiResponse<any>> {
    return this.request(`/config/admins/${id}`, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient()
export default apiClient
