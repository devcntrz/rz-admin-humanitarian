import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  return withCors(async (req) => {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    
    try {
      let volunteers
      
      if (q && q.trim() !== '') {
        const like = `%${q.trim()}%`
        volunteers = await sql`
          SELECT id, full_name, email, phone_number as phone, created_at
          FROM volunteers
          WHERE full_name ILIKE ${like}
             OR email ILIKE ${like}
             OR COALESCE(phone_number,'') ILIKE ${like}
          ORDER BY id DESC
          LIMIT 2000
        `
      } else {
        volunteers = await sql`
          SELECT id, full_name, email, phone_number as phone, created_at
          FROM volunteers
          ORDER BY id DESC
          LIMIT 2000
        `
      }
      
      return NextResponse.json({
        success: true,
        data: volunteers,
        total: volunteers.length
      })
    } catch (error) {
      console.error('Error fetching volunteers:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch volunteers' },
        { status: 500 }
      )
    }
  })(request)
}

export async function POST(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const body = await req.json()
      const { full_name, email, phone, password } = body
      
      if (!full_name || !email) {
        return NextResponse.json(
          { success: false, error: 'Full name and email are required' },
          { status: 400 }
        )
      }
      
      if (!password) {
        return NextResponse.json(
          { success: false, error: 'Password is required' },
          { status: 400 }
        )
      }
      
      // Hash password sebelum disimpan
      const hashedPassword = await hashPassword(password)
      
      const result = await sql`
        INSERT INTO volunteers (full_name, email, phone_number, password_hash)
        VALUES (${full_name}, ${email}, ${phone || null}, ${hashedPassword})
        RETURNING id, full_name, email, phone_number as phone, created_at
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Volunteer created successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating volunteer:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create volunteer' },
        { status: 500 }
      )
    }
  })(request)
}

export async function PUT(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const body = await req.json()
      const { id, full_name, email, phone, password } = body
      
      if (!id || !full_name || !email) {
        return NextResponse.json(
          { success: false, error: 'ID, full name and email are required' },
          { status: 400 }
        )
      }
      
      let result
      
      // Jika password diberikan, update password juga
      if (password && password.trim() !== '') {
        const hashedPassword = await hashPassword(password)
        result = await sql`
          UPDATE volunteers 
          SET full_name = ${full_name}, email = ${email}, phone_number = ${phone || null}, password_hash = ${hashedPassword}
          WHERE id = ${id}
          RETURNING id, full_name, email, phone_number as phone, created_at
        `
      } else {
        // Jika password tidak diberikan, hanya update data lainnya
        result = await sql`
          UPDATE volunteers 
          SET full_name = ${full_name}, email = ${email}, phone_number = ${phone || null}
          WHERE id = ${id}
          RETURNING id, full_name, email, phone_number as phone, created_at
        `
      }
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Volunteer not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Volunteer updated successfully'
      })
    } catch (error) {
      console.error('Error updating volunteer:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update volunteer' },
        { status: 500 }
      )
    }
  })(request)
}

export async function DELETE(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'ID is required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        DELETE FROM volunteers 
        WHERE id = ${id}
        RETURNING id
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Volunteer not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Volunteer deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting volunteer:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete volunteer' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})