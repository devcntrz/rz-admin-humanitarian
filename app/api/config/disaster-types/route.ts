import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(request: NextRequest) {
  return withCors(async (req) => {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    
    try {
      let disasterTypes
      
      if (q && q.trim() !== '') {
        const like = `%${q.trim()}%`
        disasterTypes = await sql`
          SELECT id, name
          FROM disaster_types
          WHERE name ILIKE ${like}
          ORDER BY name ASC
        `
      } else {
        disasterTypes = await sql`
          SELECT id, name
          FROM disaster_types
          ORDER BY name ASC
        `
      }
      
      return NextResponse.json({
        success: true,
        data: disasterTypes,
        total: disasterTypes.length
      })
    } catch (error) {
      console.error('Error fetching disaster types:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch disaster types' },
        { status: 500 }
      )
    }
  })(request)
}

export async function POST(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const body = await req.json()
      const { name } = body
      
      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Name is required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        INSERT INTO disaster_types (name)
        VALUES (${name})
        RETURNING id, name
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Disaster type created successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating disaster type:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create disaster type' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})