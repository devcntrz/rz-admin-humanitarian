import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clusterId: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const distributionId = parseInt(resolvedParams.id)
      const clusterId = parseInt(resolvedParams.clusterId)
      const body = await req.json()
      const { cluster_name, program_name, quantity, unit, description } = body
      
      if (isNaN(distributionId) || isNaN(clusterId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
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
        UPDATE dr_clusters 
        SET cluster_name = ${cluster_name}, program_name = ${program_name}, quantity = ${quantity}, unit = ${unit}, description = ${description || null}
        WHERE id = ${clusterId} AND distribution_report_id = ${distributionId}
        RETURNING id, cluster_name, program_name, quantity, unit, description
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Cluster not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Cluster updated successfully'
      })
    } catch (error) {
      console.error('Error updating cluster:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update cluster' },
        { status: 500 }
      )
    }
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clusterId: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const distributionId = parseInt(resolvedParams.id)
      const clusterId = parseInt(resolvedParams.clusterId)
      
      if (isNaN(distributionId) || isNaN(clusterId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        DELETE FROM dr_clusters 
        WHERE id = ${clusterId} AND distribution_report_id = ${distributionId}
        RETURNING id
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Cluster not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Cluster deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting cluster:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete cluster' },
        { status: 500 }
      )
    }
  })(request)
}


// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})