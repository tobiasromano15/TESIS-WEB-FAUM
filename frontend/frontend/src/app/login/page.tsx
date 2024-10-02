'use client'

import LoginForm from '@/components/LoginForm'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-400 to-green-600 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl"
      >
        <div className="text-center">
          <motion.div
            className="w-40 h-40 mx-auto bg-transparent"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Image
              src="/mi-logo.png"
              alt="Vibano Logo"
              width={160}
              height={160}
              className="object-contain"
            />
          </motion.div>
          <motion.h2
            className="mt-6 text-3xl font-extrabold text-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            VIBANO
          </motion.h2>
          <motion.p
            className="mt-2 text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Inicia sesión en tu panel de agricultura de precisión
          </motion.p>
        </div>
        <LoginForm />
      </motion.div>
    </div>
  )
}