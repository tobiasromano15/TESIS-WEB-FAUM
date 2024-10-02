'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Tractor, Leaf, BarChart2, Cloud, Droplet, Sun, Wheat, Sprout } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const images = [
  "/imagen-1.jpg",
  "/imagen-2.jpg",
  "/imagen-3.jpg",
  "/imagen-4.jpg",
]

function useCarousel(images: string[], interval: number) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, interval)

    return () => clearInterval(timer)
  }, [images, interval])

  return currentIndex
}

export default function LandingPage() {
  const router = useRouter()
  const currentImageIndex = useCarousel(images, 5000) // Change image every 5 seconds

  const features = [
    { icon: Tractor, title: "Maquinaria Inteligente", description: "Optimiza tus operaciones con equipos de última generación." },
    { icon: Leaf, title: "Monitoreo de Cultivos", description: "Seguimiento en tiempo real del estado de tus plantaciones." },
    { icon: BarChart2, title: "Análisis de Datos", description: "Toma decisiones informadas basadas en datos precisos." },
    { icon: Cloud, title: "Pronóstico Climático", description: "Anticípate a las condiciones meteorológicas para proteger tus cultivos." },
    { icon: Droplet, title: "Riego Inteligente", description: "Optimiza el uso del agua con sistemas de riego automatizados." },
    { icon: Sun, title: "Gestión de Luz", description: "Controla la exposición solar para maximizar el crecimiento." },
    { icon: Wheat, title: "Control de Cosecha", description: "Planifica y ejecuta cosechas en el momento óptimo." },
    { icon: Sprout, title: "Salud del Suelo", description: "Monitorea y mejora la calidad del suelo para cultivos más saludables." }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4 fixed w-full z-10">
        <div className="container mx-auto flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Image
              src="/mi-logo.png"
              alt="Vibano Logo"
              width={150}
              height={150}
              className="rounded-full"
            />
            <span className="text-2xl font-bold text-amber-700">VIBANO</span>
          </div>
          <div className="space-x-4">
            <Button onClick={() => router.push('/login')} variant="outline" className="border-amber-500 text-amber-700 hover:bg-amber-50">Log In</Button>
            <Button onClick={() => router.push('/register')} className="bg-amber-600 hover:bg-amber-700 text-white">Registrarse</Button>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        <section className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/2 mb-10 md:mb-0">
                <motion.h1
                  className="text-5xl font-bold mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Revoluciona tu Agricultura con Precisión
                </motion.h1>
                <motion.p
                  className="text-xl mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Optimiza tus cultivos, maximiza tu rendimiento y cultiva el futuro con Vibano
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Button size="lg" onClick={() => router.push('/register')} className="bg-white text-amber-600 hover:bg-amber-100">
                    Comienza tu Transformación
                  </Button>
                </motion.div>
              </div>
              <div className="md:w-1/2 relative h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={images[currentImageIndex]}
                      alt={`Agricultura de Precisión ${currentImageIndex + 1}`}
                      fill
                      className="rounded-lg shadow-2xl object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Nuestras Características</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-50 rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <feature.icon className="mx-auto h-12 w-12 mb-4 text-amber-600" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-amber-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">¿Listo para Revolucionar tu Agricultura?</h2>
            <p className="text-xl mb-8 text-gray-600">Únete a Vibano hoy y lleva tu producción al siguiente nivel</p>
            <Button size="lg" onClick={() => router.push('/register')} className="bg-amber-600 hover:bg-amber-700 text-white text-lg px-8 py-4">
              Empieza Gratis
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Vibano. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}