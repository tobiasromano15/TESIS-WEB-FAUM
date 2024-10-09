'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LeafIcon, UploadIcon, Loader2, ZoomInIcon, ZoomOutIcon, DownloadIcon } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AnalizadorMalezas() {
  const [imagen, setImagen] = useState<string | null>(null)
  const [puntos, setPuntos] = useState<{ x: number; y: number }[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [analisisCompletado, setAnalisisCompletado] = useState(false)
  const [modoAnalisis, setModoAnalisis] = useState<'completo' | 'region'>('completo')
  const [resultadoAnalisis, setResultadoAnalisis] = useState<any>(null)
  const [imagenAnalizada, setImagenAnalizada] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [errorImagen, setErrorImagen] = useState<string | null>(null)
  const [escala, setEscala] = useState(1)
  const imagenAnalizadaRef = useRef<HTMLImageElement>(null)

  const manejarCargaImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (archivo) {
      const lector = new FileReader()
      lector.onload = (e) => {
        const resultado = e.target?.result
        if (typeof resultado === 'string') {
          setImagen(resultado)
          setPuntos([])
          setAnalisisCompletado(false)
          setResultadoAnalisis(null)
          setImagenAnalizada(null)
          setErrorImagen(null)
          setEscala(1)
        }
      }
      lector.readAsDataURL(archivo)
    }
  }

  useEffect(() => {
    if (imagen && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const img = new Image()
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          dibujarPuntos(ctx)
        }
        img.src = imagen
      }
    }
  }, [imagen, puntos])

  const manejarClicCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (modoAnalisis === 'region' && puntos.length < 4 && canvasRef.current) {
      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY
      setPuntos([...puntos, { x, y }])
    }
  }

  const dibujarPuntos = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 2
    puntos.forEach((punto, index) => {
      ctx.beginPath()
      ctx.arc(punto.x, punto.y, 5, 0, 2 * Math.PI)
      ctx.fill()
      if (index > 0) {
        const puntoAnterior = puntos[index - 1]
        ctx.beginPath()
        ctx.moveTo(puntoAnterior.x, puntoAnterior.y)
        ctx.lineTo(punto.x, punto.y)
        ctx.stroke()
      }
    })
    if (puntos.length === 4) {
      ctx.beginPath()
      ctx.moveTo(puntos[3].x, puntos[3].y)
      ctx.lineTo(puntos[0].x, puntos[0].y)
      ctx.stroke()
    }
  }

  const reiniciarSeleccion = () => {
    setPuntos([])
    setAnalisisCompletado(false)
    setResultadoAnalisis(null)
    setImagenAnalizada(null)
    setErrorImagen(null)
    setEscala(1)
    if (canvasRef.current && imagen) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
          ctx.drawImage(img, 0, 0)
        }
        img.src = imagen
      }
    }
  }

  const analizarImagen = async () => {
    if (modoAnalisis === 'region' && puntos.length !== 4) {
      alert('Por favor, seleccione 4 puntos para crear un rectángulo antes de analizar.')
      return
    }

    setCargando(true)
    setErrorImagen(null)

    try {
      let imagenData: string | ImageData

      if (modoAnalisis === 'completo') {
        imagenData = imagen!
      } else {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!
        const [minX, minY, maxX, maxY] = puntos.reduce(
          ([minX, minY, maxX, maxY], { x, y }) => [
            Math.min(minX, x),
            Math.min(minY, y),
            Math.max(maxX, x),
            Math.max(maxY, y),
          ],
          [Infinity, Infinity, -Infinity, -Infinity]
        )
        const width = maxX - minX
        const height = maxY - minY
        imagenData = ctx.getImageData(minX, minY, width, height)
      }

      const response = await fetch('/api/analizar-malezas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagen: imagenData,
          modo: modoAnalisis,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error en el análisis de la imagen: ${response.statusText}`)
      }

      const resultado = await response.json()
      console.log('Resultado del análisis:', resultado)
      setResultadoAnalisis(resultado)

      if (resultado.detalles && resultado.detalles.archivo_analizado) {
        const nombreArchivo = resultado.detalles.archivo_analizado.split('\\').pop().split('/').pop()
        const imagenUrl = `/api/imagen-analizada/${encodeURIComponent(nombreArchivo)}`
        console.log('URL de la imagen analizada:', imagenUrl)
        setImagenAnalizada(imagenUrl)
      } else {
        console.error('No se recibió la información de la imagen analizada:', resultado)
        throw new Error('No se recibió la información de la imagen analizada')
      }

      setAnalisisCompletado(true)
    } catch (error) {
      console.error('Error al analizar la imagen:', error)
      setResultadoAnalisis(null)
      setErrorImagen(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setCargando(false)
    }
  }

  const manejarZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const delta = e.deltaY
    setEscala(prevEscala => {
      const newEscala = prevEscala - delta * 0.001
      return Math.max(0.1, Math.min(newEscala, 5))
    })
  }

  const descargarImagen = () => {
    if (imagenAnalizada) {
      const link = document.createElement('a')
      link.href = imagenAnalizada
      link.download = 'imagen_analizada.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center">
          <LeafIcon className="mr-2 h-6 w-6 text-green-600" />
          Analizador de Malezas
        </CardTitle>
        <CardDescription>
          Cargue una imagen y analice la presencia de malezas en ella.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!imagen && (
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Haga clic para cargar</span> o arrastre y suelte</p>
                  <p className="text-xs text-gray-500">PNG, JPG o GIF (MAX. 800x400px)</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" onChange={manejarCargaImagen} accept="image/*" />
              </label>
            </div>
          )}
          {imagen && (
            <>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  onClick={manejarClicCanvas}
                  className="border border-gray-300 cursor-crosshair max-w-full h-auto"
                />
              </div>
              <RadioGroup defaultValue="completo" onValueChange={(value) => setModoAnalisis(value as 'completo' | 'region')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="completo" id="completo" />
                  <Label htmlFor="completo">Analizar imagen completa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="region" id="region" />
                  <Label htmlFor="region">Analizar región seleccionada</Label>
                </div>
              </RadioGroup>
              <div className="flex space-x-2">
                <Button onClick={reiniciarSeleccion} variant="destructive">
                  Reiniciar Selección
                </Button>
                <Button
                  onClick={analizarImagen}
                  variant="default"
                  disabled={modoAnalisis === 'region' && puntos.length !== 4 || cargando}
                >
                  {cargando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    `Analizar ${modoAnalisis === 'completo' ? 'Imagen Completa' : 'Región'}`
                  )}
                </Button>
              </div>
              {modoAnalisis === 'region' && (
                <p className="text-sm text-gray-600">
                  {puntos.length < 4
                    ? `Haz clic en 4 puntos para crear un rectángulo. Puntos seleccionados: ${puntos.length}`
                    : 'Rectángulo completado'}
                </p>
              )}
            </>
          )}
          {analisisCompletado && resultadoAnalisis && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Resultados del Análisis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 mb-4">{resultadoAnalisis.mensaje}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Detalles:</h4>
                    <ul className="list-disc list-inside">
                      <li>Modo: {resultadoAnalisis.detalles.modo}</li>
                      <li>Dimensiones: {resultadoAnalisis.detalles.dimensiones[0]} x {resultadoAnalisis.detalles.dimensiones[1]} px</li>
                      <li>Archivo guardado: {resultadoAnalisis.detalles.archivo_guardado}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Imagen Analizada:</h4>
                    {imagenAnalizada ? (
                      <div
                        className="relative overflow-hidden"
                        style={{ maxWidth: '100%', maxHeight: '400px' }}
                        onWheel={manejarZoom}
                      >
                        <img
                          ref={imagenAnalizadaRef}
                          src={imagenAnalizada}
                          alt="Imagen Analizada"
                          className="max-w-full h-auto rounded-lg shadow-lg transition-transform duration-200 ease-in-out"
                          style={{
                            transform: `scale(${escala})`,
                            transformOrigin: 'center center'
                          }}
                          onError={(e) => {
                            console.error('Error al cargar la imagen:', e)
                            setErrorImagen('Error al cargar la imagen analizada')
                          }}
                        />
                      </div>
                    ) : (
                      <p>Cargando imagen analizada...</p>
                    )}
                    <div className="mt-2 flex justify-between items-center">
                      <div>
                        <Button
                          onClick={() => setEscala(prev => Math.max(0.1, prev - 0.1))}
                          variant="outline"
                          size="icon"
                        >
                          <ZoomOutIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setEscala(prev => Math.min(5, prev + 0.1))}
                          variant="outline"
                          size="icon"

                          className="ml-2"
                        >
                          <ZoomInIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button onClick={descargarImagen} variant="outline">
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                </div>
                {errorImagen && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorImagen}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  )
}