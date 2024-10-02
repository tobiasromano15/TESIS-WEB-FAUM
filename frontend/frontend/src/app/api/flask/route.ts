import { NextRequest } from 'next/server'

const FLASK_URL = 'http://localhost:5000'  // Ajusta esto a la URL de tu servidor Flask

async function handler(request: NextRequest) {
  const url = new URL(request.url)
  const flaskPath = url.pathname.replace('/api', '')
  const flaskUrl = `${FLASK_URL}${flaskPath}${url.search}`

  const headers = new Headers(request.headers)
  headers.set('Content-Type', 'application/json')

  const fetchOptions: RequestInit = {
    method: request.method,
    headers: headers,
    cache: 'no-store' as const,
  }

  // Solo incluye el body para métodos que lo permiten
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    fetchOptions.body = request.body
  }

  const flaskResponse = await fetch(flaskUrl, fetchOptions)

  const data = await flaskResponse.text()

  return new Response(data, {
    status: flaskResponse.status,
    headers: flaskResponse.headers,
  })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler