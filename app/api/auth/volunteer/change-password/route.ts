import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'
import { hashPassword, validatePasswordStrength } from '@/lib/auth'

interface JWTPayload {
  id: number
  email: string
  name: string
  type: string
}

interface ChangePasswordRequest {
  newPassword: string
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
    const payload = verifyJWTToken(token)
    
    if (!payload || payload.type !== 'volunteer') {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Token tidak valid' 
        },
        { status: 401 }
      )
    }

    const body: ChangePasswordRequest = await request.json()
    const { newPassword } = body

    // Validasi input
    if (!newPassword) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Password baru diperlukan' 
        },
        { status: 400 }
      )
    }

    // Validasi kekuatan password baru
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Password baru tidak memenuhi kriteria keamanan',
          errors: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Verifikasi bahwa volunteer masih ada di database
    const volunteers = await sql<{ id: number }>`
      SELECT id 
      FROM volunteers 
      WHERE id = ${payload.id}
    `

    if (volunteers.length === 0) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Volunteer tidak ditemukan' 
        },
        { status: 404 }
      )
    }

    // Hash password baru
    const newPasswordHash = await hashPassword(newPassword)

    // Update password di database
    await sql`
      UPDATE volunteers 
      SET password_hash = ${newPasswordHash}
      WHERE id = ${payload.id}
    `

    return NextResponse.json({
      status: 'success',
      message: 'Password berhasil diubah'
    })

  } catch (error) {
    console.error('Change password error:', error)
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
