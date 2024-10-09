import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    console.log('Logout request received in Next.js API route')
    try {
      // Call your backend logout endpoint
      const response = await fetch('http://localhost:5000/logout', {
        method: 'POST',
        headers: {
          'Cookie': req.headers.cookie || '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      console.log('Flask backend response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Logout successful:', data)

        // Clear any client-side cookies
        res.setHeader('Set-Cookie', [
          'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
          // Add any other cookies you need to clear
        ])

        res.status(200).json(data)
      } else {
        const errorText = await response.text()
        console.error('Logout failed:', response.status, errorText)
        res.status(response.status).json({ message: 'Logout failed', error: errorText })
      }
    } catch (error) {
      console.error('Logout error:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}