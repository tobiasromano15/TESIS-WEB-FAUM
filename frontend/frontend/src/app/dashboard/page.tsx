"use client"  // Esto convierte el componente en un Client Component

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'  // Cambiamos next/router por next/navigation
import { getDashboardData } from '../services/api'
import Dashboard from '@/components/Dashboard'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await getDashboardData()
        setData(dashboardData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Redirige al login si no está autenticado
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return <p>Loading...</p>
  }

  return data ? <Dashboard /> : null
}
