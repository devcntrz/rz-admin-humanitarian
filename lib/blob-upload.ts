import { put } from '@vercel/blob'

const SAFE_NAME_MAX = 200

export function safeBlobFileName(name: string): string {
  const trimmed = name.trim() || 'file'
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, '_')
  return safe.slice(0, SAFE_NAME_MAX) || 'file'
}

export async function uploadPublicBlob(
  file: File,
  pathPrefix: string
): Promise<{ url: string; pathname: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured')
  }
  const base = pathPrefix.replace(/^\/+|\/+$/g, '')
  const pathname = `${base}/${Date.now()}-${safeBlobFileName(file.name)}`
  const blob = await put(pathname, file, {
    access: 'public',
    token,
  })
  return { url: blob.url, pathname }
}
