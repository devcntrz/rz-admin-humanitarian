import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'
import { verifyPassword, isValidEmail } from '@/lib/auth'

interface Volunteer {
  id: number
  full_name: string
  email: string
  password_hash: string
}

interface LoginRequest {
  email: string
  password: string
}

async function findVolunteerByEmail(email: string): Promise<Volunteer | null> {
  try {
    const volunteers = await sql<Volunteer>`
      SELECT id, full_name, email, password_hash 
      FROM volunteers 
      WHERE email = ${email}
    `
    return volunteers.length > 0 ? volunteers[0] : null
  } catch (error) {
    console.error('Error finding volunteer:', error)
    return null
  }
}


function generateJWTToken(volunteer: Volunteer): string {
  const payload = {
    id: volunteer.id,
    email: volunteer.email,
    name: volunteer.full_name,
    type: 'volunteer'
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  })
}

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
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // Validasi input
    if (!email || !password) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Email dan password diperlukan' 
        },
        { status: 400 }
      )
    }

    // Validasi format email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Format email tidak valid' 
        },
        { status: 400 }
      )
    }

    // Cari volunteer berdasarkan email
    const volunteer = await findVolunteerByEmail(email)
    if (!volunteer) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Email tidak terdaftar sebagai volunteer' 
        },
        { status: 404 }
      )
    }

    // Verifikasi password
    const isPasswordValid = await verifyPassword(password, volunteer.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Password salah' 
        },
        { status: 401 }
      )
    }

    // Generate JWT token untuk sesi
    const token = generateJWTToken(volunteer)

    return NextResponse.json({
      status: 'success',
      message: 'Login berhasil',
      token,
      user: {
        id: volunteer.id.toString(),
        nama: volunteer.full_name,
        email: volunteer.email
      }
    })

  } catch (error) {
    console.error('Login error:', error)
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
