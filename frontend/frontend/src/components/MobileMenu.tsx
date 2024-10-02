'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {BarChartIcon, LayersIcon, LeafIcon, LogOutIcon, MenuIcon} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  { name: 'Analizador de Malezas', icon: LeafIcon, href: '/dashboard/analizador-malezas' },
  { name: 'Cobertura', icon: LayersIcon, href: '/dashboard/cobertura' },
  { name: 'Resultados', icon: BarChartIcon, href: '/dashboard/resultados' },
  { name: 'Cerrar sesión', icon: LogOutIcon, href: '/logout' },
]

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

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
              <img src="/mi-logo.png" alt="Logo" className="h-13 w-13" />
              <h1 className="text-xl font-bold text-green-800">AgriPrecision</h1>
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
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}