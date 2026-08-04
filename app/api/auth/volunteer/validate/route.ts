import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

interface JWTPayload {
  id: number
  email: string
  name: string
  type: string
  iat: number
  exp: number
}

interface Volunteer {
  id: number
  full_name: string
  email: string
}

function verifyJWTToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JWTPayload
    return payload
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}

async function findVolunteerById(id: number): Promise<Volunteer | null> {
  try {
    const volunteers = await sql<Volunteer>`
      SELECT id, full_name, email 
      FROM volunteers 
      WHERE id = ${id}
    `
    return volunteers.length > 0 ? volunteers[0] : null
  } catch (error) {
    console.error('Error finding volunteer:', error)
    return null
  }
}

async function handler(request: NextRequest) {
  if (request.method !== 'GET') {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Method not allowed' 
      },
      { status: 405 }
    )
  }

  try {
    // Ambil token dari header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Token tidak ditemukan' 
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verifikasi JWT token
    const payload = verifyJWTToken(token)
    if (!payload) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Token tidak valid atau sudah expired' 
        },
        { status: 401 }
      )
    }

    // Pastikan token adalah untuk volunteer
    if (payload.type !== 'volunteer') {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Token tidak valid untuk volunteer' 
        },
        { status: 401 }
      )
    }

    // Cek apakah volunteer masih ada di database
    const volunteer = await findVolunteerById(payload.id)
    if (!volunteer) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Volunteer tidak ditemukan' 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: 'success',
      message: 'Token valid',
      user: {
        id: volunteer.id.toString(),
        nama: volunteer.full_name,
        email: volunteer.email
      },
      tokenInfo: {
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        issuedAt: new Date(payload.iat * 1000).toISOString()
      }
    })

  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Terjadi kesalahan server' 
      },
      { status: 500 }
    )
  }
}

export const GET = withCors(handler)

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})
