'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { MenuIcon, LeafIcon, LayersIcon, BarChartIcon, LogOutIcon } from 'lucide-react'
import { logout } from '../app/services/api'  // Import the logout function from your api.ts file
const menuItems = [
  { name: 'Analizador de Malezas', icon: LeafIcon, href: '/dashboard/analizador-malezas' },
  { name: 'Cobertura', icon: LayersIcon, href: '/dashboard/cobertura' },
  { name: 'Resultados', icon: BarChartIcon, href: '/dashboard/resultados' },
]

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async (event: React.MouseEvent) => {
    event.preventDefault()
    try {
      const response = await fetch('/logout', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        router.push('/')
      } else {
        const data = await response.json()
      }
    } catch (err) {
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden w-10 h-10 p-0">
          <MenuIcon className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <ScrollArea className="h-full px-4">
          <div className="py-4">
            <div className="flex items-center gap-2 px-2 mb-6">
              <img src="/mi-logo.png" alt="Logo" className="h-20 w-20" />
              <h1 className="text-xl font-bold text-green-800">VIBANO</h1>
            </div>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
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
                className="w-full justify-start px-3 py-2"
                onClick={handleLogout}
              >
                <LogOutIcon className="h-5 w-5 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}