import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'
import { del } from '@vercel/blob'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const distributionId = parseInt(resolvedParams.id)
      const docId = parseInt(resolvedParams.docId)
      
      if (isNaN(distributionId) || isNaN(docId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IDs' },
          { status: 400 }
        )
      }
      
      // Get file URL before deleting
      const doc = await sql`
        SELECT file_url FROM dr_documentations 
        WHERE id = ${docId} AND distribution_report_id = ${distributionId}
      `
      
      if (doc.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        )
      }
      
      // Delete from database
      const result = await sql`
        DELETE FROM dr_documentations 
        WHERE id = ${docId} AND distribution_report_id = ${distributionId}
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