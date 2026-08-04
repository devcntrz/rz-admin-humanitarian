import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'
import { del } from '@vercel/blob'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  return withCors(async (req) => {
    try {
      const siteReportId = parseInt(params.id)
      const docId = parseInt(params.docId)
      const body = await req.json()
      const { description } = body
      
      if (isNaN(siteReportId) || isNaN(docId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        UPDATE sr_documentations 
        SET description = ${description || null}
        WHERE id = ${docId} AND site_report_id = ${siteReportId}
        RETURNING id, file_url, description
      `
      
      if (result.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Document updated successfully'
      })
    } catch (error) {
      console.error('Error updating document:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update document' },
        { status: 500 }
      )
    }
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  return withCors(async (req) => {
    try {
      const siteReportId = parseInt(params.id)
      const docId = parseInt(params.docId)
      
      if (isNaN(siteReportId) || isNaN(docId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
          { status: 400 }
        )
      }
      
      // Get file URL before deleting
      const doc = await sql`
        SELECT file_url FROM sr_documentations 
        WHERE id = ${docId} AND site_report_id = ${siteReportId}
      `
      
      if (doc.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        )
      }
      
      // Delete from database
      const result = await sql`
        DELETE FROM sr_documentations 
        WHERE id = ${docId} AND site_report_id = ${siteReportId}
        RETURNING id
      `
      
      // Delete from Vercel Blob
      try {
        await del(doc[0].file_url, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })
      } catch (blobError) {
        console.error('Error deleting from blob:', blobError)
        // Continue even if blob deletion fails
      }
      
      return NextResponse.json({
        success: true,
        message: 'Document deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete document' },
        { status: 500 }
      )
    }
  })(request)
}






// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})