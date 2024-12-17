'use client'

import { useState } from 'react'
import { Send, Tractor, Wheat } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function ODMChatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch response')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu solicitud.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-2xl mx-auto border rounded-lg overflow-hidden bg-gradient-to-b from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
      <div className="bg-green-600 dark:bg-green-800 p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Tractor className="h-6 w-6" />
          Asistente de OPEN DRONE MAP
        </h2>
        <Wheat className="h-6 w-6 text-yellow-300" />
      </div>
      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-green-700 dark:text-green-300 p-4 bg-green-100 dark:bg-green-800/50 rounded-lg">
              ¡Bienvenido! Pregúntame sobre OpenDroneMap y su uso en agricultura de precisión.
            </div>
          )}
          {messages.map((m, index) => (
            <div
              key={index}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
            >
              <div
                className={`
                  rounded-lg px-4 py-2 max-w-[85%] shadow-sm
                  ${m.role === 'user' 
                    ? 'bg-green-600 text-white ml-12' 
                    : 'bg-white dark:bg-green-800 border border-green-200 dark:border-green-700 mr-12'
                  }
                `}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {m.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-green-200 dark:border-green-700 bg-white dark:bg-green-900/50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre ODM en agricultura de precisión..."
            className="flex-grow bg-green-50 dark:bg-green-800 border-green-300 dark:border-green-600"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  )
}
