'use client'

import { useState } from 'react'

import { chatService } from '@/lib/services/chatService'

export default function BookCard({ book }) {
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)

  const handleGetRecommendations = async () => {
    if (recommendations.length > 0) {
      setShowRecommendations(!showRecommendations)
      return
    }

    setLoading(true)
    try {
      const response = await chatService.getRecommendations(book.id)
      setRecommendations(response.content || [])
      setShowRecommendations(true)
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReadNow = () => {
    // Abre o Goodreads ou busca no Google
    if (book.goodreads_id) {
      window.open(`https://www.goodreads.com/book/show/${book.goodreads_id}`, '_blank')
    } else if (book.isbn) {
      window.open(`https://www.google.com/search?q=isbn+${book.isbn}`, '_blank')
    } else {
      const searchQuery = encodeURIComponent(`${book.title} ${book.author} ler online`)
      window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank')
    }
  }

  return (
    <div className="animate-fade-in rounded-xl border border-line bg-surface p-5 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
      <div className="mb-5 flex gap-5 max-sm:flex-col">
        {book.cover_url && (
          <img
            src={book.cover_url}
            alt={book.title}
            className="h-[225px] w-[150px] rounded-lg border-2 border-gold object-cover shadow-[0_4px_12px_rgba(212,175,55,0.2)] max-sm:mx-auto max-sm:h-auto max-sm:max-w-[200px] max-sm:w-full"
          />
        )}

        <div className="flex flex-1 flex-col gap-2">
          <h3 className="text-2xl font-bold text-gold">{book.title}</h3>
          {book.author && <p className="text-lg italic text-muted">por {book.author}</p>}
          {book.year && <p className="text-sm text-muted">{book.year}</p>}
          {book.rating && (
            <span className="flex w-fit items-center gap-1.5 rounded-md border border-gold bg-gold/15 px-3 py-1.5 font-semibold text-gold">
              ⭐ {book.rating}
            </span>
          )}
        </div>
      </div>

      {book.description && (
        <p className="mb-4 leading-relaxed text-muted">{book.description}</p>
      )}

      {book.genres && (
        <div className="mb-5 flex flex-wrap gap-2">
          {book.genres.split(', ').map((genre, index) => (
            <span
              key={index}
              className="rounded-2xl border border-gold bg-background px-3 py-1.5 text-sm text-muted transition-colors duration-300 hover:bg-gold/10 hover:text-gold"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex gap-3 max-sm:flex-col">
        <button
          onClick={handleReadNow}
          className="flex-1 rounded-lg bg-gradient-to-br from-gold to-gold-dark px-5 py-3.5 font-bold text-secondary shadow-[0_2px_8px_rgba(212,175,55,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:from-gold-bright hover:to-[#cd9a00] hover:shadow-[0_6px_16px_rgba(212,175,55,0.4)]"
        >
          📖 Ler Agora
        </button>
        <button
          onClick={handleGetRecommendations}
          disabled={loading}
          className="flex-1 rounded-lg border-2 border-wood bg-wood/20 px-5 py-3.5 font-semibold text-ink backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-wood/30"
        >
          {loading
            ? '⏳ Carregando...'
            : showRecommendations
              ? '🔼 Ocultar'
              : '📚 Outras Recomendações'}
        </button>
      </div>

      {showRecommendations && recommendations.length > 0 && (
        <div className="mt-5 border-t border-line pt-5">
          <h4 className="mb-4 text-gold">Você também pode gostar:</h4>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4 max-[768px]:grid-cols-[repeat(auto-fill,minmax(100px,1fr))] max-[768px]:gap-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 transition-transform duration-300 hover:scale-105"
              >
                {rec.cover_url && (
                  <img
                    src={rec.cover_url}
                    alt={rec.title}
                    className="h-[180px] w-full rounded-lg border border-gold object-cover shadow-[0_2px_8px_rgba(0,0,0,0.3)] max-[768px]:h-[150px]"
                  />
                )}
                <div className="flex flex-col gap-1">
                  <h5 className="overflow-hidden text-sm text-ink line-clamp-2">{rec.title}</h5>
                  {rec.author && <span className="text-xs italic text-muted">{rec.author}</span>}
                  {rec.year && <span className="text-xs text-muted">{rec.year}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
