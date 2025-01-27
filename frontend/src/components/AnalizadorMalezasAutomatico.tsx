import type React from "react"
import { useState } from "react"
import { Button, Alert, AlertTitle, AlertDescription } from "@chakra-ui/react"
import { Loader2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@chakra-ui/react"
import { LeafIcon, UploadIcon } from "./icons"

interface FaumResponse {
  imagen: Blob
  metadata: { [key: string]: any }
}

const manejarCargaImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const archivo = e.target.files?.[0]
  if (archivo) {
    try {
      setCargando(true)
      setErrorImagen(null)
      setClasificacion(null)

      const imagenURL = await new Promise<string>((resolve) => {
        const lector = new FileReader()
        lector.onload = (e) => resolve(e.target?.result as string)
        lector.readAsDataURL(archivo)
      })

      setImagen(imagenURL)
    } catch (error) {
      console.error("Error al cargar la imagen:", error)
      setErrorImagen("Error al cargar la imagen. Por favor, intente con otra.")
    } finally {
      setCargando(false)
    }
  }
}

const analizarImagen = async () => {
  if (!imagen) return

  try {
    setAnalizando(true)
    setErrorImagen(null)
    setClasificacion(null)

    const response = await fetch("/api/clasificar-cultivo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imagen: imagen }),
    })

    if (!response.ok) {
      throw new Error("Error en la clasificación del cultivo")
    }

    const data = await response.json()
    console.log("API Response:", data)
    setClasificacion(data.esPostemergente === false ? "Preemergente" : "Postemergente")
    console.log("Classification:", clasificacion)
  } catch (error) {
    console.error("Error al analizar la imagen:", error)
    setErrorImagen("Error al analizar la imagen. Por favor, intente de nuevo.")
  } finally {
    setAnalizando(false)
  }
}

const App = () => {
  const [imagen, setImagen] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [errorImagen, setErrorImagen] = useState<string | null>(null)
  const [clasificacion, setClasificacion] = useState<string | null>(null)
  const [analizando, setAnalizando] = useState(false)

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center">
          <LeafIcon className="mr-2 h-6 w-6 text-green-600" />
          Analizador de Malezas Simplificado
        </CardTitle>
        <CardDescription>Cargue una imagen para comenzar el análisis de malezas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!imagen && (
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
          {imagen && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Imagen Cargada:</h3>
              <img
                src={imagen || "/placeholder.svg"}
                alt="Imagen Cargada"
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
              <div className="mt-4 space-x-4">
                <Button onClick={() => setImagen(null)} variant="outline">
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
            <Alert variant={clasificacion === "Preemergente" ? "info" : "success"} className="mt-4">
              <AlertTitle>Resultado del Análisis</AlertTitle>
              <AlertDescription>
                El cultivo ha sido clasificado como: <strong>{clasificacion}</strong>
              </AlertDescription>
            </Alert>
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

export default App

