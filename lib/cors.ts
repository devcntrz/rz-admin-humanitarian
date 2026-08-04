import { NextRequest, NextResponse } from 'next/server'

export function corsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin')
  
  // Allow all origins for mobile app compatibility
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    // Additional localhost ports
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    // Production domain
    'https://rz-humanitarian-admin.vercel.app',
    // Mobile app origins
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost',
    // Expo development
    'exp://localhost:19000',
    'exp://localhost:19001',
    'exp://localhost:19002',
    // React Native development
    'http://localhost:19006',
  ]
  
  // Allow all origins in development, or if origin is in allowed list
  const isAllowedOrigin = !origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development' || process.env.ALLOW_ALL_ORIGINS === 'true'
  
  // For web browsers, be more permissive with localhost origins
  const isWebBrowser = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))
  const shouldAllowOrigin = isAllowedOrigin || isWebBrowser
  
  return {
    'Access-Control-Allow-Origin': shouldAllowOrigin ? (origin || '*') : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

export function handleCors(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders(request),
    })
  }
  
  return null
}

export function withCors(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    // Handle CORS preflight
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse
    
    try {
      const response = await handler(request)
      
      // Add CORS headers to the response
      Object.entries(corsHeaders(request)).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    } catch (error) {
      console.error('API Error:', error)
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
      
      // Add CORS headers to error response
      Object.entries(corsHeaders(request)).forEach(([key, value]) => {
        errorResponse.headers.set(key, value)
      })
      
      return errorResponse
    }
  }
}

