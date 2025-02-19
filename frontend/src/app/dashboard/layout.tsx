'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {LeafIcon, LayersIcon, BarChartIcon, LogOutIcon, MapPin, Image, Database} from 'lucide-react'
import MobileMenu from '@/components/MobileMenu'
import AnalizadorMalezas from '@/components/AnalizadorDeMalezas'
import { logout } from '../services/api'
import {frame} from "framer-motion";

const menuItems = [
  { name: 'Faum WEB', icon: LeafIcon, href: '/dashboard/analizador-malezas' },
  { name: 'Malezas', icon: Database, href: '/dashboard/analizador-malezas-automatico' },
  { name: 'ODM - Ortomosaico', icon: Image, href: '/dashboard/odm' },
  { name: 'Mapa de Prescripcion', icon: MapPin, href: '/dashboard/mapa-prescripcion' },
  { name: 'Almacenamiento', icon: Database, href: '/dashboard/almacenamiento' },
]

function SidebarContent() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async (event: React.MouseEvent) => {
    event.preventDefault()
    console.log('Logout button clicked')
    try {
      await logout()
      console.log('Logout successful, redirecting to home')
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="space-y-1">
      {menuItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`flex items-center rounded-lg px-3 py-2 transition-all hover:bg-green-100 ${
            pathname === item.href ? 'bg-green-100 text-green-800' : 'text-gray-700 hover:text-green-800'
          }`}
        >
          <item.icon className="h-5 w-5 mr-2" />
          {item.name}
        </Link>
      ))}
      <Button
        variant="ghost"
        className="w-full justify-start px-3 py-2 text-gray-700 hover:text-green-800 hover:bg-green-100"
        onClick={handleLogout}
      >
        <LogOutIcon className="h-5 w-5 mr-2" />
        Cerrar sesión
      </Button>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-50 to-green-100">
      <aside className="hidden w-64 overflow-y-auto border-r border-green-200 bg-white/80 backdrop-blur-sm lg:block">
        <nav className="flex flex-col p-4">
          <div className="py-1">
            <Link href="/dashboard" className="flex items-center gap-1 px-0.01 mb-6">
              <img src="/mi-logo.png" alt="Logo" className="h-20 w-20" />
              <h1 className="text-xl font-bold text-green-800">VIBANO</h1>
            </Link>
            <SidebarContent />
          </div>
        </nav>
      </aside>
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-green-200 bg-white/80 backdrop-blur-sm px-6">
          <MobileMenu />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-green-800">Panel de Usuario</h1>
          </div>
          <Button
            variant="outline"
            className="hidden sm:flex"
            onClick={() => router.push('/dashboard/analizador-malezas')}
          >
            <LeafIcon className="mr-2 h-4 w-4" />
            Nuevo Análisis
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {pathname === '/dashboard/analizador-malezas' ? <AnalizadorMalezas /> : children}
        </main>
      </div>
    </div>
  )
}