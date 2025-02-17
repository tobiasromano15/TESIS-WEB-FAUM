"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Loader2, LeafIcon, UploadIcon } from "lucide-react"

interface AnalysisResult {
  resultado: string
  imagenUrl: string
}

interface WeedEraserResult extends AnalysisResult {
  porcentajeMalezas: number
  areasCriticas?: Array<{ x: number; y: number; tamaño: number }>
}

interface FaumResult {
  imagen: string // Nombre del archivo resultante
  metadata: {
    fecha: string
    hora: string
    timestamp: string
    nombre_archivo: string
  }
  resultado?: string
}

interface FilterFormationsResult extends AnalysisResult {
  metadatos?: {
    porcentaje_modificado: number
    color_fondo_original: string
    umbral_utilizado: number
  }
}

const SimplifiedAnalizadorMalezas: React.FC = () => {
  const [imagenUrl, setImagenUrl] = useState<string | null>(null)
  const [archivoTemporal, setArchivoTemporal] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [errorImagen, setErrorImagen] = useState<string | null>(null)
  const [clasificacion, setClasificacion] = useState<string | null>(null)
  const [analizando, setAnalizando] = useState(false)
  const [resultadoWeedEraser, setResultadoWeedEraser] = useState<WeedEraserResult | null>(null)
  const [resultadoFaum, setResultadoFaum] = useState<FaumResult | null>(null)
  const [resultadoFilterFormations, setResultadoFilterFormations] = useState<FilterFormationsResult | null>(null)

  const manejarCargaImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (archivo) {
      try {
        setCargando(true)
        setErrorImagen(null)
        resetearResultados()

        const formData = new FormData()
        formData.append("imagen", archivo)

        const response = await fetch("/api/cargar-imagen-temporal", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Error al cargar la imagen")
        }

        const data = await response.json()
        actualizarImagenUrl(data.imagenUrl)
      } catch (error) {
        console.error("Error al cargar la imagen:", error)
        setErrorImagen("Error al cargar la imagen. Por favor, intente con otra.")
      } finally {
        setCargando(false)
      }
    }
  }

  const resetearResultados = () => {
    setClasificacion(null)
    setResultadoWeedEraser(null)
    setResultadoFaum(null)
    setResultadoFilterFormations(null)
  }

  const analizarImagen = async () => {
    if (!archivoTemporal) return

    try {
      setAnalizando(true)
      setErrorImagen(null)
      resetearResultados()

      // Usamos una variable local para ir actualizando el archivo a usar
      let currentArchivoTemporal = archivoTemporal

      // Paso 1: Clasificar cultivo
      const responseClasificacion = await fetch("/api/clasificar-cultivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archivoTemporal: currentArchivoTemporal }),
      })
      if (!responseClasificacion.ok) {
        throw new Error("Error en la clasificación del cultivo")
      }
      const dataClasificacion = await responseClasificacion.json()
      const esPostemergente = dataClasificacion.esPostemergente
      setClasificacion(esPostemergente ? "Postemergente" : "Preemergente")

      if (esPostemergente) {
        // Paso 2A: Análisis Weed Eraser para cultivos Postemergentes
        const responseWeedEraser = await fetch("/api/weed-eraser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archivoTemporal: currentArchivoTemporal }),
        })
        if (!responseWeedEraser.ok) {
          throw new Error("Error en el análisis de Weed Eraser")
        }
        const dataWeedEraser: WeedEraserResult = await responseWeedEraser.json()
        setResultadoWeedEraser(dataWeedEraser)
        currentArchivoTemporal = dataWeedEraser.imagenUrl
        actualizarImagenUrl(currentArchivoTemporal)

        // Paso 3A: Análisis FAUM
        const responseFaum = await fetch("/api/apply-faum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archivoTemporal: currentArchivoTemporal }),
        })
        if (!responseFaum.ok) {
          throw new Error("Error en el análisis de FAUM")
        }
        const dataFaum: FaumResult = await responseFaum.json()
        setResultadoFaum(dataFaum)
        currentArchivoTemporal = dataFaum.imagen
        actualizarImagenUrl(currentArchivoTemporal)
      } else {
        // Para cultivos Preemergentes, se hace primero FAUM y luego el filtrado de formaciones
        // Paso 2B: Análisis FAUM
        const responseFaum = await fetch("/api/apply-faum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archivoTemporal: currentArchivoTemporal }),
        })
        if (!responseFaum.ok) {
          throw new Error("Error en el análisis de FAUM")
        }
        const dataFaum: FaumResult = await responseFaum.json()
        setResultadoFaum(dataFaum)
        currentArchivoTemporal = dataFaum.imagen
        actualizarImagenUrl(currentArchivoTemporal)

        // Paso 3B: Filtrado de formaciones
        const responseFilterFormations = await fetch("/api/filter-formations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archivoTemporal: currentArchivoTemporal }),
        })
        if (!responseFilterFormations.ok) {
          throw new Error("Error en el filtrado de formaciones")
        }
        const dataFilterFormations: FilterFormationsResult = await responseFilterFormations.json()
        setResultadoFilterFormations(dataFilterFormations)
        currentArchivoTemporal = dataFilterFormations.imagenUrl
        actualizarImagenUrl(currentArchivoTemporal)
      }
    } catch (error) {
      console.error("Error al analizar la imagen:", error)
      setErrorImagen(`Error al analizar la imagen: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setAnalizando(false)
    }
  }

  // Función auxiliar para actualizar la URL de la imagen
  const actualizarImagenUrl = (url: string) => {
    if (url.startsWith("http")) {
      setImagenUrl(url)
    } else {
      setImagenUrl(`${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`)
    }
    setArchivoTemporal(url)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center">
          <LeafIcon className="mr-2 h-6 w-6 text-green-600" />
          Analizador de Malezas Avanzado
        </CardTitle>
        <CardDescription>Cargue una imagen para comenzar el análisis de malezas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!imagenUrl && (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Haga clic para cargar</span> o arrastre y suelte
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF o TIF</p>
                </div>
                <input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  onChange={manejarCargaImagen}
                  accept="image/*,.tif,.tiff"
                />
              </label>
            </div>
          )}
          {cargando && (
            <div className="flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando imagen...</span>
            </div>
          )}
          {imagenUrl && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Imagen Actual:</h3>
              <img
                src={imagenUrl || "/placeholder.svg"}
                alt="Imagen Actual"
                className="max-w-full h-auto rounded-lg shadow-lg"
                onError={(e) => {
                  console.error("Error loading image:", e)
                  setErrorImagen("Error al cargar la imagen. Por favor, intente de nuevo.")
                }}
              />
              <p className="mt-2 text-sm text-gray-500">URL de la imagen: {imagenUrl}</p>
              <div className="mt-4 space-x-4">
                <Button
                  onClick={() => {
                    setImagenUrl(null)
                    setArchivoTemporal(null)
                    resetearResultados()
                  }}
                  variant="outline"
                >
                  Cargar otra imagen
                </Button>
                <Button onClick={analizarImagen} disabled={analizando}>
                  {analizando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    "Analizar"
                  )}
                </Button>
              </div>
            </div>
          )}
          {clasificacion && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-2">Resultados del análisis {clasificacion}:</h3>
              {clasificacion === "Postemergente" ? (
                <>
                  {resultadoWeedEraser && (
                    <Alert variant="success" className="mt-4">
                      <AlertTitle>Weed Eraser</AlertTitle>
                      <AlertDescription>
                        <p>{resultadoWeedEraser.resultado}</p>
                        <p>Porcentaje de malezas: {resultadoWeedEraser.porcentajeMalezas.toFixed(2)}%</p>
                        {resultadoWeedEraser.areasCriticas && (
                          <p>Áreas críticas detectadas: {resultadoWeedEraser.areasCriticas.length}</p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  {resultadoFaum && (
                    <Alert variant="info" className="mt-4">
                      <AlertTitle>FAUM</AlertTitle>
                      <AlertDescription>
                        <p>{resultadoFaum.resultado || "No hay información adicional"}</p>
                        <p>
                          Imagen resultante: {resultadoFaum.metadata.nombre_archivo} <br />
                          Fecha: {resultadoFaum.metadata.fecha} - Hora: {resultadoFaum.metadata.hora}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <>
                  {resultadoFaum && (
                    <Alert variant="info" className="mt-4">
                      <AlertTitle>FAUM</AlertTitle>
                      <AlertDescription>
                        <p>{resultadoFaum.resultado}</p>
                        {/* Se omiten propiedades no retornadas */}
                      </AlertDescription>
                    </Alert>
                  )}
                  {resultadoFilterFormations && (
                    <Alert variant="success" className="mt-4">
                      <AlertTitle>Filtrado de Formaciones</AlertTitle>
                      <AlertDescription>
                        <p>{resultadoFilterFormations.resultado}</p>
                        {resultadoFilterFormations.metadatos && (
                          <>
                            <p>Porcentaje modificado: {resultadoFilterFormations.metadatos.porcentaje_modificado}%</p>
                            <p>Color de fondo: {resultadoFilterFormations.metadatos.color_fondo_original}</p>
                            <p>Umbral utilizado: {resultadoFilterFormations.metadatos.umbral_utilizado}</p>
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          )}
          {errorImagen && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorImagen}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default SimplifiedAnalizadorMalezas

