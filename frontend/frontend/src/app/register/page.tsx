'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { register } from '../services/api'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      const response = await register(username, password, email)
      console.log('Registro exitoso', response)
      router.push('/dashboard')
    } catch (err) {
      setError('Error en el registro. Por favor, inténtalo de nuevo.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Image
            src="/mi-logo.png"
            alt="Vibano Logo"
            width={100}
            height={100}
            className="mx-auto rounded-full"
          />
          <h1 className="text-3xl font-bold mt-4 text-amber-700">Únete a Vibano</h1>
          <p className="text-gray-600 mt-2">Crea tu cuenta y comienza tu transformación agrícola</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-gray-700">Nombre de Usuario</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1"
              placeholder="Tu nombre de usuario"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-gray-700">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-gray-700">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              placeholder="••••••••"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-gray-700">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
            Crear Cuenta
          </Button>
        </form>
        <p className="mt-4 text-sm text-gray-600 text-center">
          ¿Ya tienes una cuenta? <Link href="/login" className="text-amber-600 hover:underline">Inicia sesión</Link>
        </p>
      </motion.div>
    </div>
  )
}