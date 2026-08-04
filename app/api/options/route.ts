import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const [volunteers, disasterTypes, villages, provinces, regencies, districts] = await Promise.all([
        sql<{ id: number; full_name: string }>`
          SELECT id, full_name 
          FROM volunteers 
          ORDER BY full_name ASC 
          LIMIT 200
        `,
        sql<{ id: number; name: string }>`
          SELECT id, name 
          FROM disaster_types 
          ORDER BY name ASC
        `,
        sql<{ id: string; name: string }>`
          SELECT id, name 
          FROM villages 
          ORDER BY name ASC 
          LIMIT 500
        `,
        sql<{ id: string; name: string }>`
          SELECT id, name 
          FROM provinces 
          ORDER BY name ASC
        `,
        sql<{ id: string; name: string; province_id: string }>`
          SELECT id, name, province_id 
          FROM regencies 
          ORDER BY name ASC
        `,
        sql<{ id: string; name: string; regency_id: string }>`
          SELECT id, name, regency_id 
          FROM districts 
          ORDER BY name ASC
        `
      ])
      
      return NextResponse.json({
        success: true,
        data: {
          volunteers,
          disasterTypes,
          villages,
          provinces,
          regencies,
          districts
        }
      })
    } catch (error) {
      console.error('Error fetching options:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch options' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})