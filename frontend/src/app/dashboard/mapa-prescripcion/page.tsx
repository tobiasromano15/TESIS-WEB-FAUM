'use client'

import { useState } from 'react'
import { MapPin, CheckSquare, PlusCircle, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import './styles.css'

interface Todo {
  id: string
  text: string
  completed: boolean
}

export default function MapaPrescripcion() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')

  const addTodo = () => {
    if (newTodo.trim() !== '') {
      setTodos([...todos, { id: Date.now().toString(), text: newTodo, completed: false }])
      setNewTodo('')
    }
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  return (
    <div className="prescription-map-container">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-green-800">Mapa de Prescripción</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="col-span-1 map-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2" />
                Mapa
              </CardTitle>
              <CardDescription>Vista previa del mapa de prescripción</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Mapa de prescripción aquí</p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 todo-list-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckSquare className="mr-2" />
                Tareas Pendientes
              </CardTitle>
              <CardDescription>Gestiona tus tareas para el mapa de prescripción</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex mb-4">
                <Input
                  type="text"
                  placeholder="Nueva tarea..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  className="mr-2"
                />
                <Button onClick={addTodo} className="add-todo-button">
                  <PlusCircle className="mr-2 h-4 w-4" /> Agregar
                </Button>
              </div>
              <ul className="space-y-2">
                {todos.map(todo => (
                  <li key={todo.id} className="flex items-center justify-between bg-gray-100 p-2 rounded todo-item">
                    <div className="flex items-center">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo.id)}
                        className="mr-2"
                      />
                      <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                        {todo.text}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteTodo(todo.id)} className="delete-todo-button">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

