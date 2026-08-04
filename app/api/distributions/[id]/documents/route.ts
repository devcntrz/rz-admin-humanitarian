import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'
import { put } from '@vercel/blob'

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
      
      const documents = await sql`
        SELECT id, file_url, description
        FROM dr_documentations
        WHERE distribution_report_id = ${distributionId}
        ORDER BY id ASC
        LIMIT 10
      `
      
      return NextResponse.json({
        success: true,
        data: documents
      })
    } catch (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch documents' },
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
      
      if (isNaN(distributionId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid distribution ID' },
          { status: 400 }
        )
      }
      
      const formData = await req.formData()
      const file = formData.get('file') as File
      const description = formData.get('description') as string
      
      if (!file) {
        return NextResponse.json(
          { success: false, error: 'File is required' },
          { status: 400 }
        )
      }
      
      // Upload file to Vercel Blob
      const blob = await put(`distributions/${distributionId}/${file.name}`, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      
      const result = await sql`
        INSERT INTO dr_documentations (distribution_report_id, file_url, description)
        VALUES (${distributionId}, ${blob.url}, ${description || null})
        RETURNING id, file_url, description
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Document uploaded successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error uploading document:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to upload document' },
        { status: 500 }
      )
    }
  })(request)
}


// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})