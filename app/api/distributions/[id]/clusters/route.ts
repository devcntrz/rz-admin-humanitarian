import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const distributionId = parseInt(resolvedParams.id)
      
      if (isNaN(distributionId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid distribution ID' },
          { status: 400 }
        )
      }
      
      const clusters = await sql`
        SELECT id, cluster_name, program_name, quantity, unit, description
        FROM dr_clusters
        WHERE distribution_report_id = ${distributionId}
        ORDER BY id ASC
        LIMIT 10
      `
      
      return NextResponse.json({
        success: true,
        data: clusters
      })
    } catch (error) {
      console.error('Error fetching clusters:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch clusters' },
        { status: 500 }
      )
    }
  })(request)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const distributionId = parseInt(resolvedParams.id)
      const body = await req.json()
      const { cluster_name, program_name, quantity, unit, description } = body
      
      if (isNaN(distributionId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid distribution ID' },
          { status: 400 }
        )
      }
      
      if (!cluster_name || !program_name || !quantity || !unit) {
        return NextResponse.json(
          { success: false, error: 'Cluster name, program name, quantity, and unit are required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        INSERT INTO dr_clusters (distribution_report_id, cluster_name, program_name, quantity, unit, description)
        VALUES (${distributionId}, ${cluster_name}, ${program_name}, ${quantity}, ${unit}, ${description || null})
        RETURNING id, cluster_name, program_name, quantity, unit, description
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Cluster added successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating cluster:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create cluster' },
        { status: 500 }
      )
    }
  })(request)
}


// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})