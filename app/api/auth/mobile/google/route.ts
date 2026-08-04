import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

interface GoogleTokenPayload {
  email: string
  name: string
  sub: string
  email_verified: boolean
}

interface Volunteer {
  id: number
  full_name: string
  email: string
}

async function verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    
    const payload = ticket.getPayload()
    if (!payload) return null
    
    return {
      email: payload.email || '',
      name: payload.name || '',
      sub: payload.sub || '',
      email_verified: payload.email_verified || false
    }
  } catch (error) {
    console.error('Error verifying Google token:', error)
    return null
  }
}

async function findVolunteerByEmail(email: string): Promise<Volunteer | null> {
  try {
    const volunteers = await sql<Volunteer>`
      SELECT id, full_name, email 
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
    const body = await request.json()
    const { idToken } = body

    if (!idToken) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'idToken diperlukan' 
        },
        { status: 400 }
      )
    }

    // Verifikasi Google ID token
    const googlePayload = await verifyGoogleToken(idToken)
    if (!googlePayload) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Token Google tidak valid' 
        },
        { status: 401 }
      )
    }

    if (!googlePayload.email_verified) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Email Google belum diverifikasi' 
        },
        { status: 401 }
      )
    }

    // Cari volunteer berdasarkan email
    const volunteer = await findVolunteerByEmail(googlePayload.email)
    if (!volunteer) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Email tidak terdaftar sebagai volunteer. Silakan hubungi admin untuk pendaftaran.' 
        },
        { status: 404 }
      )
    }

    // Generate JWT token untuk sesi mobile
    const token = generateJWTToken(volunteer)

    return NextResponse.json({
      status: 'success',
      message: 'Relawan ditemukan dan diautentikasi.',
      token,
      user: {
        id: volunteer.id.toString(),
        nama: volunteer.full_name,
        email: volunteer.email
      }
    })

  } catch (error) {
    console.error('Auth error:', error)
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
