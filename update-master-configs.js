const fs = require('fs');
const path = require('path');

// Template untuk pagination dan total data
const paginationTemplate = `
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"`;

const stateTemplate = `
  const [allItems, setAllItems] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10`;

const loadDataTemplate = `
  const loadData = async (query?: string, page: number = 1) => {
    try {
      setLoading(true)
      
      // Mock data - akan diganti dengan data yang sesuai
      const mockData = []
      
      let filteredData = mockData
      
      if (query && query.trim() !== "") {
        filteredData = mockData.filter(item => 
          // Filter logic akan disesuaikan
          item.name.toLowerCase().includes(query.toLowerCase())
        )
      }
      
      setAllItems(filteredData)
      setTotalItems(filteredData.length)
      setTotalPages(Math.ceil(filteredData.length / itemsPerPage))
      
      const startIndex = (page - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedData = filteredData.slice(startIndex, endIndex)
      
      setItems(paginatedData)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }`;

const handlersTemplate = `
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadData(searchQuery, 1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadData(searchQuery, page)
  }`;

const paginationUITemplate = `
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {totalItems > 0 ? (
                \`Menampilkan \${((currentPage - 1) * itemsPerPage) + 1} sampai \${Math.min(currentPage * itemsPerPage, totalItems)} dari \${totalItems} data\`
              ) : (
                "Tidak ada data"
              )}
            </div>
            
            {totalPages > 1 && (
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
            )}
          </div>`;

// Files yang akan diupdate
const files = [
  {
    path: 'app/admin/config/districts/page.tsx',
    type: 'District',
    mockData: [
      { id: "1101010", regency_id: "1101", name: "Bakongan", regency_name: "Aceh Selatan" },
      { id: "1101020", regency_id: "1101", name: "Kluet Utara", regency_name: "Aceh Selatan" },
      { id: "1102010", regency_id: "1102", name: "Lawe Alas", regency_name: "Aceh Tenggara" },
      { id: "1102020", regency_id: "1102", name: "Babul Rahmah", regency_name: "Aceh Tenggara" },
      { id: "1201010", regency_id: "1201", name: "Angkola Barat", regency_name: "Tapanuli Selatan" },
      { id: "1201020", regency_id: "1201", name: "Batang Toru", regency_name: "Tapanuli Selatan" },
      { id: "1202010", regency_id: "1202", name: "Andam Dewi", regency_name: "Tapanuli Tengah" },
      { id: "1202020", regency_id: "1202", name: "Badiri", regency_name: "Tapanuli Tengah" },
      { id: "1301010", regency_id: "1301", name: "IV Angkek", regency_name: "Agam" },
      { id: "1301020", regency_id: "1301", name: "IV Koto", regency_name: "Agam" },
      { id: "1101030", regency_id: "1101", name: "Kluet Selatan", regency_name: "Aceh Selatan" },
      { id: "1101040", regency_id: "1101", name: "Kluet Tengah", regency_name: "Aceh Selatan" },
      { id: "1101050", regency_id: "1101", name: "Kluet Timur", regency_name: "Aceh Selatan" },
      { id: "1101060", regency_id: "1101", name: "Kota Bahagia", regency_name: "Aceh Selatan" },
      { id: "1101070", regency_id: "1101", name: "Trumon", regency_name: "Aceh Selatan" },
      { id: "1101080", regency_id: "1101", name: "Trumon Timur", regency_name: "Aceh Selatan" },
      { id: "1101090", regency_id: "1101", name: "Trumon Tengah", regency_name: "Aceh Selatan" },
      { id: "1101100", regency_id: "1101", name: "Bakongan Timur", regency_name: "Aceh Selatan" },
      { id: "1101110", regency_id: "1101", name: "Bakongan Barat", regency_name: "Aceh Selatan" },
      { id: "1101120", regency_id: "1101", name: "Kluet Utara", regency_name: "Aceh Selatan" }
    ],
    filterFields: ['id', 'name', 'regency_name']
  },
  {
    path: 'app/admin/config/villages/page.tsx',
    type: 'Village',
    mockData: [
      { id: "1101010001", district_id: "1101010", name: "Kampung Baru", district_name: "Bakongan" },
      { id: "1101010002", district_id: "1101010", name: "Kampung Lama", district_name: "Bakongan" },
      { id: "1101020001", district_id: "1101020", name: "Kluet Tengah", district_name: "Kluet Utara" },
      { id: "1101020002", district_id: "1101020", name: "Kluet Selatan", district_name: "Kluet Utara" },
      { id: "1102010001", district_id: "1102010", name: "Lawe Alas", district_name: "Lawe Alas" },
      { id: "1102010002", district_id: "1102010", name: "Lawe Sigala", district_name: "Lawe Alas" },
      { id: "1201010001", district_id: "1201010", name: "Angkola Barat", district_name: "Angkola Barat" },
      { id: "1201010002", district_id: "1201010", name: "Angkola Selatan", district_name: "Angkola Barat" },
      { id: "1202010001", district_id: "1202010", name: "Andam Dewi", district_name: "Andam Dewi" },
      { id: "1202010002", district_id: "1202010", name: "Andam Utara", district_name: "Andam Dewi" },
      { id: "1101010003", district_id: "1101010", name: "Kampung Tengah", district_name: "Bakongan" },
      { id: "1101010004", district_id: "1101010", name: "Kampung Atas", district_name: "Bakongan" },
      { id: "1101010005", district_id: "1101010", name: "Kampung Bawah", district_name: "Bakongan" },
      { id: "1101010006", district_id: "1101010", name: "Kampung Kiri", district_name: "Bakongan" },
      { id: "1101010007", district_id: "1101010", name: "Kampung Kanan", district_name: "Bakongan" },
      { id: "1101010008", district_id: "1101010", name: "Kampung Depan", district_name: "Bakongan" },
      { id: "1101010009", district_id: "1101010", name: "Kampung Belakang", district_name: "Bakongan" },
      { id: "1101010010", district_id: "1101010", name: "Kampung Samping", district_name: "Bakongan" },
      { id: "1101010011", district_id: "1101010", name: "Kampung Dalam", district_name: "Bakongan" },
      { id: "1101010012", district_id: "1101010", name: "Kampung Luar", district_name: "Bakongan" }
    ],
    filterFields: ['id', 'name', 'district_name']
  },
  {
    path: 'app/admin/config/disaster-types/page.tsx',
    type: 'DisasterType',
    mockData: [
      { id: 1, name: "Gempa Bumi" },
      { id: 2, name: "Tsunami" },
      { id: 3, name: "Gunung Meletus" },
      { id: 4, name: "Banjir" },
      { id: 5, name: "Tanah Longsor" },
      { id: 6, name: "Kekeringan" },
      { id: 7, name: "Angin Topan" },
      { id: 8, name: "Kebakaran Hutan" },
      { id: 9, name: "Badai" },
      { id: 10, name: "Epidemi" },
      { id: 11, name: "Pandemi" },
      { id: 12, name: "Kebakaran" },
      { id: 13, name: "Bencana Teknologi" },
      { id: 14, name: "Bencana Lingkungan" },
      { id: 15, name: "Konflik Sosial" },
      { id: 16, name: "Terrorisme" },
      { id: 17, name: "Kecelakaan Transportasi" },
      { id: 18, name: "Bencana Industri" },
      { id: 19, name: "Bencana Nuklir" },
      { id: 20, name: "Bencana Kimia" }
    ],
    filterFields: ['name']
  },
  {
    path: 'app/admin/config/admins/page.tsx',
    type: 'Admin',
    mockData: [
      { id: 1, full_name: "Admin Utama", email: "admin@example.com", role: "super_admin", created_at: "2024-01-01" },
      { id: 2, full_name: "Admin Regional", email: "regional@example.com", role: "regional_admin", created_at: "2024-01-02" },
      { id: 3, full_name: "Staff Admin", email: "staff@example.com", role: "staff", created_at: "2024-01-03" },
      { id: 4, full_name: "John Doe", email: "john@example.com", role: "staff", created_at: "2024-01-04" },
      { id: 5, full_name: "Jane Smith", email: "jane@example.com", role: "regional_admin", created_at: "2024-01-05" },
      { id: 6, full_name: "Ahmad Rahman", email: "ahmad@example.com", role: "staff", created_at: "2024-01-06" },
      { id: 7, full_name: "Siti Nurhaliza", email: "siti@example.com", role: "regional_admin", created_at: "2024-01-07" },
      { id: 8, full_name: "Budi Santoso", email: "budi@example.com", role: "staff", created_at: "2024-01-08" },
      { id: 9, full_name: "Maya Indira", email: "maya@example.com", role: "regional_admin", created_at: "2024-01-09" },
      { id: 10, full_name: "Rizki Pratama", email: "rizki@example.com", role: "staff", created_at: "2024-01-10" },
      { id: 11, full_name: "Dewi Sartika", email: "dewi@example.com", role: "regional_admin", created_at: "2024-01-11" },
      { id: 12, full_name: "Fajar Nugroho", email: "fajar@example.com", role: "staff", created_at: "2024-01-12" },
      { id: 13, full_name: "Indira Sari", email: "indira@example.com", role: "regional_admin", created_at: "2024-01-13" },
      { id: 14, full_name: "Kurniawan", email: "kurniawan@example.com", role: "staff", created_at: "2024-01-14" },
      { id: 15, full_name: "Lestari Putri", email: "lestari@example.com", role: "regional_admin", created_at: "2024-01-15" },
      { id: 16, full_name: "Muhammad Ali", email: "ali@example.com", role: "staff", created_at: "2024-01-16" },
      { id: 17, full_name: "Nina Sari", email: "nina@example.com", role: "regional_admin", created_at: "2024-01-17" },
      { id: 18, full_name: "Oscar Wijaya", email: "oscar@example.com", role: "staff", created_at: "2024-01-18" },
      { id: 19, full_name: "Putri Maharani", email: "putri@example.com", role: "regional_admin", created_at: "2024-01-19" },
      { id: 20, full_name: "Qori Sandria", email: "qori@example.com", role: "staff", created_at: "2024-01-20" }
    ],
    filterFields: ['full_name', 'email', 'role']
  }
];

console.log('Script untuk update master config files telah dibuat.');
console.log('Files yang akan diupdate:', files.map(f => f.path));
