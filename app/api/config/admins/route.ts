import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(request: NextRequest) {
  return withCors(async (req) => {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    
    try {
      let admins
      
      if (q && q.trim() !== '') {
        const like = `%${q.trim()}%`
        admins = await sql`
          SELECT id, full_name, email, role, created_at
          FROM admins
          WHERE full_name ILIKE ${like} OR email ILIKE ${like} OR role ILIKE ${like}
          ORDER BY created_at DESC
        `
      } else {
        admins = await sql`
          SELECT id, full_name, email, role, created_at
          FROM admins
          ORDER BY created_at DESC
        `
      }
      
      return NextResponse.json({
        success: true,
        data: admins,
        total: admins.length
      })
    } catch (error) {
      console.error('Error fetching admins:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch admins' },
        { status: 500 }
      )
    }
  })(request)
}

export async function POST(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const body = await req.json()
      const { full_name, email, role } = body
      
      if (!full_name || !email || !role) {
        return NextResponse.json(
          { success: false, error: 'Full name, email and role are required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        INSERT INTO admins (full_name, email, role)
        VALUES (${full_name}, ${email}, ${role})
        RETURNING id, full_name, email, role, created_at
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Admin created successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating admin:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create admin' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})