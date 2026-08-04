import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(request: NextRequest) {
  return withCors(async (req) => {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    
    try {
      let provinces
      
      if (q && q.trim() !== '') {
        const like = `%${q.trim()}%`
        provinces = await sql`
          SELECT id, name
          FROM provinces
          WHERE id ILIKE ${like} OR name ILIKE ${like}
          ORDER BY id ASC
        `
      } else {
        provinces = await sql`
          SELECT id, name
          FROM provinces
          ORDER BY id ASC
        `
      }
      
      return NextResponse.json({
        success: true,
        data: provinces,
        total: provinces.length
      })
    } catch (error) {
      console.error('Error fetching provinces:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch provinces' },
        { status: 500 }
      )
    }
  })(request)
}

export async function POST(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const body = await req.json()
      const { id, name } = body
      
      if (!id || !name) {
        return NextResponse.json(
          { success: false, error: 'ID and name are required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        INSERT INTO provinces (id, name)
        VALUES (${id}, ${name})
        RETURNING id, name
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Province created successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating province:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create province' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})