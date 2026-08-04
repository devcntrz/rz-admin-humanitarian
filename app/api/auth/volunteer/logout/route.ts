import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/cors'

async function handler(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Method not allowed' 
      },
      { status: 405 }
    )
  }

  try {
    // Untuk logout, kita hanya perlu mengembalikan response sukses
    // Token akan dihapus di sisi client (mobile app)
    // Jika ingin implementasi server-side token blacklist, bisa ditambahkan di sini
    
    return NextResponse.json({
      status: 'success',
      message: 'Logout berhasil'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Terjadi kesalahan server' 
      },
      { status: 500 }
    )
  }
}

export const POST = withCors(handler)

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})
