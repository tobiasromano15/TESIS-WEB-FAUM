'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { LeafIcon, LayersIcon, BarChartIcon } from 'lucide-react'

export default function Dashboard() {
  const [activeCard, setActiveCard] = useState<string | null>(null)

  const handleCardClick = (cardTitle: string) => {
    setActiveCard(cardTitle === activeCard ? null : cardTitle)
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Análisis de Cultivos"
          description="Últimos resultados del análisis de cultivos"
          icon={<LeafIcon className="h-6 w-6 text-green-600" />}
          isActive={activeCard === "Análisis de Cultivos"}
          onClick={() => handleCardClick("Análisis de Cultivos")}
        />
        <DashboardCard
          title="Cobertura del Terreno"
          description="Mapa de cobertura actualizado"
          icon={<LayersIcon className="h-6 w-6 text-brown-600" />}
          isActive={activeCard === "Cobertura del Terreno"}
          onClick={() => handleCardClick("Cobertura del Terreno")}
        />
        <DashboardCard
          title="Estadísticas de Rendimiento"
          description="Resumen del rendimiento de cultivos"
          icon={<BarChartIcon className="h-6 w-6 text-blue-600" />}
          isActive={activeCard === "Estadísticas de Rendimiento"}
          onClick={() => handleCardClick("Estadísticas de Rendimiento")}
        />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-4 text-green-800">Actividad Reciente</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <ul className="space-y-4">
            <ActivityItem
              title="Análisis de malezas completado"
              description="Campo Norte - 15 hectáreas"
              time="Hace 2 horas"
            />
            <ActivityItem
              title="Actualización de cobertura"
              description="Campo Sur - 20 hectáreas"
              time="Ayer"
            />
            <ActivityItem
              title="Nuevo informe de rendimiento"
              description="Temporada Primavera 2024"
              time="Hace 2 días"
            />
          </ul>
        </div>
      </div>
    </div>
  )
}

interface DashboardCardProps {
  title: string
  description: string
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
}

function DashboardCard({ title, description, icon, isActive, onClick }: DashboardCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow p-6 flex flex-col transition-all duration-300 ${
        isActive ? 'ring-2 ring-green-500 transform scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center mb-4">
        <div className="bg-green-100 rounded-full p-3 mr-4">{icon}</div>
        <h3 className="text-lg font-semibold text-green-800">{title}</h3>
      </div>
      <p className="text-gray-600 flex-grow">{description}</p>
      <Button variant="outline" className="mt-4 w-full">
        {isActive ? 'Ocultar Detalles' : 'Ver Detalles'}
      </Button>
    </div>
  )
}

interface ActivityItemProps {
  title: string
  description: string
  time: string
}

function ActivityItem({ title, description, time }: ActivityItemProps) {
  return (
    <li className="flex items-center">
      <div className="bg-green-100 rounded-full p-2 mr-4">
        <LeafIcon className="h-4 w-4 text-green-600" />
      </div>
      <div className="flex-grow">
        <h4 className="text-sm font-semibold text-green-800">{title}</h4>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
      <span className="text-xs text-gray-500">{time}</span>
    </li>
  )
}