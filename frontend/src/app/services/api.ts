const API_URL = '/api'

export async function login(username: string, password: string) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
    credentials: 'include',  // Incluye las credenciales (cookies)
  })

  if (!response.ok) {
    throw new Error('Login failed')
  }

  return response.json()
}

export async function register(username: string, password: string, email: string) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password, email }),
    credentials: 'include',  // Incluye las credenciales (cookies)
  })

  if (!response.ok) {
    throw new Error('Registration failed')
  }

  return response.json()
}

export async function logout() {
  console.log('Initiating logout from frontend')
    const response = await fetch(`http://backend:5000/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })

    console.log('Logout response status:', response.status)

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Logout error:', response.status, errorData)
      throw new Error(errorData || 'Logout failed')
    }

    const data = await response.json()
    console.log('Logout successful:', data)
    return data
}

export async function getDashboardData() {
  const response = await fetch(`${API_URL}/dashboard`, {
    method: 'GET',
    credentials: 'include',  // Incluye las credenciales para validar la sesión
  })

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data')
  }

  return response.json()
}
