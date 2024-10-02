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
  const response = await fetch(`${API_URL}/logout`, {
    method: 'POST',
    credentials: 'include',  // Asegúrate de incluir las cookies al cerrar sesión
  })

  if (!response.ok) {
    throw new Error('Logout failed')
  }

  return response.json()
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
