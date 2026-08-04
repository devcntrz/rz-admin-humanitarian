import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/cors'
import { uploadPublicBlob } from '@/lib/blob-upload'

export async function POST(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { success: false, error: 'Field "file" is required' },
          { status: 400 }
        )
      }

      const { url } = await uploadPublicBlob(file, 'uploads')

      return NextResponse.json({
        success: true,
        data: { url },
      })
    } catch (error) {
      console.error('Blob upload error:', error)
      const missingToken =
        error instanceof Error && error.message.includes('BLOB_READ_WRITE_TOKEN')
      return NextResponse.json(
        {
          success: false,
          error: missingToken ? 'File storage is not configured' : 'Failed to upload file',
        },
        { status: missingToken ? 503 : 500 }
      )
    }
  })(request)
}

export const OPTIONS = withCors(async () => new NextResponse(null, { status: 200 }))
