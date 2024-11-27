import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { nombre } = req.query
  if (typeof nombre !== 'string') {
    return res.status(400).json({ error: 'Nombre de archivo inválido' })
  }

  const filePath = path.join(process.cwd(), 'tmp', nombre)

  try {
    const imageBuffer = fs.readFileSync(filePath)
    res.setHeader('Content-Type', 'image/jpeg')
    res.send(imageBuffer)
  } catch (error) {
    console.error('Error al leer la imagen:', error)
    res.status(404).json({ error: 'Imagen no encontrada' })
  }
}