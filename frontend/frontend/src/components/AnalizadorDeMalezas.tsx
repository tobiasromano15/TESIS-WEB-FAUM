'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LeafIcon, UploadIcon, Loader2, ZoomInIcon, ZoomOutIcon, DownloadIcon } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import UTIF from 'utif'

declare module 'utif' {
  export function decode(buffer: ArrayBuffer): any[]
  export function decodeImage(buffer: ArrayBuffer, img: any): void
  export function toRGBA8(img: any): Uint8Array
}

const clasesColores = [
  { nombre: "Clase 1", color: "#fe0201" },
  { nombre: "Clase 2", color: "#fe8101" },
  { nombre: "Clase 3", color: "#7c5200" },
  { nombre: "Clase 4", color: "#fefe00" },
  { nombre: "Clase 5", color: "#00fe00" },
  { nombre: "Clase 6", color: "#818001" },
  { nombre: "Clase 7", color: "#01a04c" },
  { nombre: "Clase 8", color: "#02fffc" },
  { nombre: "Clase 9", color: "#0080f8" },
  { nombre: "Clase 10", color: "#0001fc" },
  { nombre: "Clase 11", color: "#8001fe" },
  { nombre: "Clase 12", color: "#c701a0" },
  { nombre: "Clase 13", color: "#414141" },
  { nombre: "Clase 14", color: "#808080" },
  { nombre: "Clase 15", color: "#bfbfbf" },
  { nombre: "Clase 16", color: "#ffffff" },
]


export default function AnalizadorMalezas() {
  const [imagen, setImagen] = useState<string | null>(null)
  const [puntos, setPuntos] = useState<{ x: number; y: number }[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [analisisCompletado, setAnalisisCompletado] = useState(false)
  const [modoAnalisis, setModoAnalisis] = useState<'completo' | 'region'>('completo')
  const [resultadoAnalisis, setResultadoAnalisis] = useState<any>(null)
  const [imagenAnalizada, setImagenAnalizada] = useState<{
    original: string | null;
    conMascara: string | null;
  }>({ original: null, conMascara: null });
  const [cargando, setCargando] = useState(false)
  const [errorImagen, setErrorImagen] = useState<string | null>(null)
  const [escala, setEscala] = useState(1)
  const imagenAnalizadaRef = useRef<HTMLImageElement>(null)
  const imagenMascaraRef = useRef<HTMLImageElement>(null)
  const [minClusters, setMinClusters] = useState(2)
  const [maxClusters, setMaxClusters] = useState(10)
  const [transparencia, setTransparencia] = useState(500)
  const [mascarasActivas, setMascarasActivas] = useState<number[]>([])
  const [colorFondo, setColorFondo] = useState("#000000")

  const manejarCargaImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (archivo) {
      try {
        setCargando(true)
        let imagenURL: string

        if (archivo.name.toLowerCase().endsWith('.tif') || archivo.name.toLowerCase().endsWith('.tiff')) {
          const arrayBuffer = await archivo.arrayBuffer()
          const ifds = UTIF.decode(arrayBuffer)
          UTIF.decodeImage(arrayBuffer, ifds[0])
          const rgba = UTIF.toRGBA8(ifds[0])

          const canvas = document.createElement('canvas')
          canvas.width = ifds[0].width
          canvas.height = ifds[0].height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            const imageData = ctx.createImageData(canvas.width, canvas.height)
            imageData.data.set(rgba)
            ctx.putImageData(imageData, 0, 0)
            imagenURL = canvas.toDataURL()
          } else {
            throw new Error('No se pudo crear el contexto del canvas')
          }
        } else {
          imagenURL = await new Promise((resolve) => {
            const lector = new FileReader()
            lector.onload = (e) => resolve(e.target?.result as string)
            lector.readAsDataURL(archivo)
          })
        }

        setImagen(imagenURL)
        setPuntos([])
        setAnalisisCompletado(false)
        setResultadoAnalisis(null)
        setImagenAnalizada({ original: null, conMascara: null })
        setErrorImagen(null)
        setEscala(1)
      } catch (error) {
        console.error('Error al cargar la imagen:', error)
        setErrorImagen('Error al cargar la imagen. Por favor, intente con otra.')
      } finally {
        setCargando(false)
      }
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
    setImagenAnalizada({ original: null, conMascara: null })
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
          min: minClusters,
          max: maxClusters,
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
        const imagenUrl = `/api/imagen-analizada/${encodeURIComponent(nombreArchivo)}?t=${Date.now()}`
        console.log('URL de la imagen analizada:', imagenUrl)
        setImagenAnalizada(prev => ({ ...prev, original: imagenUrl }));
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

  const aplicarMascara = async () => {
    setCargando(true)
    setErrorImagen(null)
    console.log(mascarasActivas)
    try {
      const response = await fetch('/api/aplicar-mascara', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mascaras: mascarasActivas,
          color: colorFondo,
          transparencia: transparencia,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error al aplicar la máscara: ${response.statusText}`)
      }

      const resultado = await response.json()
      console.log('Resultado de aplicar máscara:', resultado)

      if (resultado.detalles && resultado.detalles.archivo_analizado) {
        const nombreArchivo = resultado.detalles.archivo_analizado.split('\\').pop().split('/').pop()
        const imagenUrl = `/api/aplicar-mascara/${encodeURIComponent(nombreArchivo)}?t=${Date.now()}`
        console.log('URL de la imagen con máscara:', imagenUrl);
        setImagenAnalizada(prev => ({ ...prev, conMascara: imagenUrl }));
      } else {
        throw new Error('No se recibió la URL de la imagen con máscara aplicada')
      }
      setAnalisisCompletado(true)
    } catch (error) {
      console.error('Error al aplicar la máscara:', error)
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
    if (imagenAnalizada.conMascara) {
      const link = document.createElement('a')
      link.href = imagenAnalizada.conMascara
      link.download = 'imagen_con_mascara.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
  const descargarImagenSinMascara = () => {
    if (imagenAnalizada.original) {
      const link = document.createElement('a')
      link.href = imagenAnalizada.original
      link.download = 'imagen_original.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
  const manejarMascaraActiva = (numero: number) => {
    setMascarasActivas(prev =>
      prev.includes(numero)
        ? prev.filter(n => n !== numero)
        : [...prev, numero]
    )
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
                  <p className="text-xs text-gray-500">PNG, JPG, GIF o    TIF</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" onChange={manejarCargaImagen} accept="image/*,.tif,.tiff" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-clusters">Cantidad mínima de clusters</Label>
                  <Input
                    id="min-clusters"
                    type="number"
                    value={minClusters}
                    onChange={(e) => setMinClusters(Number(e.target.value))}
                    min={2}
                    max={maxClusters}
                  />
                </div>
                <div>
                  <Label htmlFor="max-clusters">Cantidad máxima de clusters</Label>
                  <Input
                    id="max-clusters"
                    type="number"
                    value={maxClusters}
                    onChange={(e) => setMaxClusters(Number(e.target.value))}
                    min={minClusters}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={reiniciarSeleccion} variant="destructive">
                  Reiniciar Selección
                </Button>
                <Button
                  onClick={analizarImagen}
                  variant="default"
                  disabled={modoAnalisis === 'region' && puntos.length !== 4 || cargando}
                >
                  {cargando ?
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analizando...
                    </> :
                    `Analizar ${modoAnalisis === 'completo' ? 'Imagen Completa' : 'Región'}`
                  }
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
            <>
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
                      {imagenAnalizada.original ? (
                        <div
                          className="relative overflow-hidden"
                          style={{ maxWidth: '100%', maxHeight: '400px' }}
                          onWheel={manejarZoom}
                        >
                          <img
                            ref={imagenAnalizadaRef}
                            src={`${imagenAnalizada.original}`}
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
                        <Button onClick={descargarImagenSinMascara} variant="outline">
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
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Opciones Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="transparencia">Transparencia</Label>
                      <Slider
                        id="transparencia"
                        min={0}
                        max={1000}
                        step={1}
                        value={[transparencia]}
                        onValueChange={(value) => setTransparencia(value[0])}
                      />
                      <span className="text-sm text-gray-500">{transparencia}</span>
                    </div>
                    <div>
                      <Label htmlFor="mascaras-activas">Máscaras activas</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {clasesColores.map((clase, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Checkbox
                              id={`mascara-${index + 1}`}
                              checked={mascarasActivas.includes(index + 1)}
                              onCheckedChange={() => manejarMascaraActiva(index + 1)}
                            />
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded-sm"
                                style={{ backgroundColor: clase.color }}
                              ></div>
                              <Label htmlFor={`mascara-${index + 1}`}>{clase.nombre}</Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="color-fondo">Fondo</Label>
                      <Input
                        id="color-fondo"
                        type="color"
                        value={colorFondo}
                        onChange={(e) => setColorFondo(e.target.value)}
                        className="h-10 w-full"
                      />
                    </div>
                    <Button
                      onClick={aplicarMascara}
                      variant="default"
                      disabled={cargando}
                    >
                      {cargando ?
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Aplicando máscara...
                        </> :
                        'Aplicar Máscara'
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          {imagenAnalizada.conMascara && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Imagen con Máscara Aplicada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 mb-4">Máscara aplicada exitosamente</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Detalles:</h4>
                    <ul className="list-disc list-inside">
                      <li>Máscaras activas: {mascarasActivas.join(', ')}</li>
                      <li>Color de fondo: {colorFondo}</li>
                      <li>Transparencia: {transparencia}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Imagen con Máscara:</h4>
                    <div
                      className="relative overflow-hidden"
                      style={{ maxWidth: '100%', maxHeight: '400px' }}
                      onWheel={manejarZoom}
                    >
                      <img
                        ref={imagenMascaraRef}
                        src={imagenAnalizada.conMascara}
                        alt="Imagen con Máscara Aplicada"
                        className="max-w-full h-auto rounded-lg shadow-lg transition-transform duration-200 ease-in-out"
                        style={{
                          transform: `scale(${escala})`,
                          transformOrigin: 'center center'
                        }}
                        onError={(e) => {
                          console.error('Error al cargar la imagen con máscara:', e)
                          setErrorImagen('Error al cargar la imagen con máscara aplicada')
                        }}
                      />
                    </div>
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