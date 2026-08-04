import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

function parseBodyUrl(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  const raw = o.url ?? o.file_url
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const distributionId = parseInt(resolvedParams.id, 10)
      if (Number.isNaN(distributionId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid distribution ID' },
          { status: 400 }
        )
      }

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON body' },
          { status: 400 }
        )
      }

      const fileUrl = parseBodyUrl(body)
      if (!fileUrl) {
        return NextResponse.json(
          { success: false, error: 'Field "url" (or "file_url") is required' },
          { status: 400 }
        )
      }

      try {
        new URL(fileUrl)
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid URL' },
          { status: 400 }
        )
      }

      const description =
        body &&
        typeof body === 'object' &&
        typeof (body as { description?: unknown }).description === 'string'
          ? (body as { description: string }).description.trim() || null
          : null

      const parent = await sql`
        SELECT id FROM distribution_reports WHERE id = ${distributionId} LIMIT 1
      `
      if (parent.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Distribution report not found' },
          { status: 404 }
        )
      }

      const result = await sql`
        INSERT INTO dr_documentations (distribution_report_id, file_url, description)
        VALUES (${distributionId}, ${fileUrl}, ${description})
        RETURNING id, file_url, description
      `

      return NextResponse.json(
        {
          success: true,
          data: result[0],
          message: 'Document record created',
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('documents_insert distribution:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to insert document' },
        { status: 500 }
      )
    }
  })(request)
}

export const OPTIONS = withCors(async () => new NextResponse(null, { status: 200 }))
