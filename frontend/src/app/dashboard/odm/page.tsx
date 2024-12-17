'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import ODMChatbot from './odm-chatbot'

const ODM_URL = 'http://localhost:8000' // URL de la interfaz ODM

export default function ODMProcessing() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkODMAvailability = async () => {
      try {
        const response = await fetch(ODM_URL, { method: 'HEAD' })
        if (!response.ok) {
          throw new Error('No se pudo conectar con el servidor ODM')
        }
      } catch (error) {
        console.error('Error al verificar la disponibilidad de ODM:', error)
        setError("No se pudo conectar con el servidor ODM. Por favor, verifique que esté en ejecución.")
      }
    }

    checkODMAvailability()
  }, [])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-green-800 mb-4">Procesamiento ODM</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <iframe
          src={ODM_URL}
          className="w-full h-[600px] border-none"
          title="NodeODM Interface"
        />
        <ODMChatbot />
      </div>
    </div>
  )
}

