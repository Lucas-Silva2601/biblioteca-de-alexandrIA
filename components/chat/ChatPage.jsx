'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

import BookCard from '@/components/books/BookCard'
import ChatMessage from '@/components/chat/ChatMessage'
import TypingIndicator from '@/components/chat/TypingIndicator'
import { chatService } from '@/lib/services/chatService'

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Modo teste - a autenticação está temporariamente desabilitada no backend
  const user = { email: 'leitor@alexandrIA.com' }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() && !file) return

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await chatService.sendMessage(input, file)

      const aiMessage = {
        role: 'assistant',
        ...response,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, aiMessage])
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch {
      const errorMessage = {
        role: 'assistant',
        type: 'text',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const clearFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="sticky top-0 z-50 border-b-2 border-gold bg-surface px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.3)] sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="truncate text-lg font-bold text-gold drop-shadow sm:text-xl">
            📚 Biblioteca de AlexandrIA
          </h1>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
            <Link
              href="/login"
              className="rounded-md border border-line px-4 py-2 text-sm text-muted transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-secondary"
            >
              Sair
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.length === 0 && (
            <div className="px-5 py-16 text-center text-muted">
              <h2 className="mb-3 text-3xl font-bold text-ink">
                Bem-vindo à Biblioteca de AlexandrIA! 📖
              </h2>
              <p>Converse sobre livros, peça recomendações ou envie imagens!</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index}>
              {message.type === 'book' ? (
                <BookCard book={message.content} />
              ) : (
                <ChatMessage message={message} />
              )}
            </div>
          ))}

          {loading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="border-t border-line bg-surface px-4 py-5 sm:px-6">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl flex-col gap-3">
          {file && (
            <div className="flex items-center gap-3 rounded-lg border border-line bg-background px-3 py-3">
              <span className="flex-1 truncate text-sm text-muted">{file.name}</span>
              <button
                type="button"
                onClick={clearFile}
                className="rounded bg-danger px-2 py-1 text-xs text-white transition-opacity duration-300 hover:opacity-80"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,audio/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Anexar arquivo"
              className="rounded-lg border border-line bg-background px-3 py-3 text-xl text-muted transition-all duration-300 hover:scale-110 hover:bg-line"
            >
              📎
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={loading}
              className="flex-1 rounded-lg border border-line bg-background px-4 py-3 text-base text-ink transition-shadow duration-300 outline-none focus:border-gold focus:shadow-[0_0_0_2px_rgba(212,175,55,0.2)] disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={loading || (!input.trim() && !file)}
              className="rounded-lg bg-gradient-to-br from-gold to-gold-dark px-5 py-3 text-xl font-bold text-secondary shadow-[0_2px_8px_rgba(212,175,55,0.3)] transition-all duration-300 hover:scale-105 hover:from-gold-bright hover:to-[#cd9a00] hover:shadow-[0_4px_12px_rgba(212,175,55,0.4)]"
            >
              {loading ? '⏳' : '🚀'}
            </button>
          </div>
        </form>
      </footer>
    </div>
  )
}
