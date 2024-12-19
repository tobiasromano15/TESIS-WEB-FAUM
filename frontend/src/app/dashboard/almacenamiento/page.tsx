'use client'

import { useState, useEffect } from 'react'
import { Database, File, Folder, MoreVertical, Plus, Upload, ChevronLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface StorageItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size: string;
  lastModified: string;
  path: string;
}

const API_URL = '/api'

export default function Almacenamiento() {
  const [searchTerm, setSearchTerm] = useState('')
  const [storageItems, setStorageItems] = useState<StorageItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchStorageItems(currentPath)
  }, [currentPath])

  const fetchStorageItems = async (path: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/storage?path=${encodeURIComponent(path)}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Failed to fetch storage items')
      }
      const data = await response.json()
      setStorageItems(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el almacenamiento. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('path', currentPath)
        const response = await fetch(`${API_URL}/storage/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        })
        if (!response.ok) {
          throw new Error('Failed to upload file')
        }
        toast({
          title: "Éxito",
          description: "Archivo subido correctamente.",
        })
        fetchStorageItems(currentPath)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo subir el archivo. Por favor, intente de nuevo.",
          variant: "destructive",
        })
      }
    }
  }

  const handleCreateFolder = async () => {
    const folderName = prompt("Ingrese el nombre de la nueva carpeta:")
    if (folderName) {
      try {
        const response = await fetch(`${API_URL}/storage/folder`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: folderName, path: currentPath })
        })
        if (!response.ok) {
          throw new Error('Failed to create folder')
        }
        toast({
          title: "Éxito",
          description: "Carpeta creada correctamente.",
        })
        fetchStorageItems(currentPath)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo crear la carpeta. Por favor, intente de nuevo.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (confirm("¿Está seguro de que desea eliminar este elemento?")) {
      try {
        const response = await fetch(`${API_URL}/storage/${itemId}`, {
          method: 'DELETE',
          credentials: 'include'
        })
        if (!response.ok) {
          throw new Error('Failed to delete item')
        }
        toast({
          title: "Éxito",
          description: "Elemento eliminado correctamente.",
        })
        fetchStorageItems(currentPath)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el elemento. Por favor, intente de nuevo.",
          variant: "destructive",
        })
      }
    }
  }

  const handleFolderClick = (folderPath: string) => {
    setCurrentPath(folderPath)
  }

  const handleBackClick = () => {
    const newPath = currentPath.split('/').slice(0, -1).join('/')
    setCurrentPath(newPath)
  }

  const filteredItems = storageItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-green-800">Almacenamiento</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Subir Archivo
          </Button>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleUploadFile}
          />
          <Button onClick={handleCreateFolder}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Carpeta
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {currentPath && (
          <Button variant="outline" onClick={handleBackClick}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>
        )}
        <Input
          placeholder="Buscar archivos y carpetas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="text-center">Cargando almacenamiento...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tamaño</TableHead>
              <TableHead>Última modificación</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.type === 'folder' ? (
                    <Button
                      variant="ghost"
                      className="p-0"
                      onClick={() => handleFolderClick(item.path)}
                    >
                      <Folder className="inline mr-2 h-4 w-4 text-blue-500" />
                      {item.name}
                    </Button>
                  ) : (
                    <>
                      <File className="inline mr-2 h-4 w-4 text-gray-500" />
                      {item.name}
                    </>
                  )}
                </TableCell>
                <TableCell>{item.type === 'folder' ? 'Carpeta' : 'Archivo'}</TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell>{item.lastModified}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Descargar</DropdownMenuItem>
                      <DropdownMenuItem>Renombrar</DropdownMenuItem>
                      <DropdownMenuItem>Mover</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteItem(item.id)} className="text-red-600">
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

