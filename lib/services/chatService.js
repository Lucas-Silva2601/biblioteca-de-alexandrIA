import api from '@/lib/api'

/**
 * Serviço de chat no CLIENTE (axios).
 * Chama as rotas /api/* do próprio Next.js.
 *
 * Não confundir com a lógica de servidor em `@/lib/server/chat.js`.
 */
export const chatService = {
  /**
   * Envia uma mensagem (e um arquivo opcional) para a IA.
   * @param {string} message Texto da mensagem
   * @param {File|null} file Arquivo opcional (imagem/áudio)
   * @returns {Promise<{type: string, content: *}>} Resposta da IA
   */
  sendMessage: async (message, file = null) => {
    const formData = new FormData()
    formData.append('message', message)
    if (file) formData.append('file', file)

    // Content-Type é definido automaticamente pelo navegador (multipart)
    const response = await api.post('/chat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  /**
   * Busca recomendações de livros a partir do id da Open Library.
   * @param {string} bookId ID da Open Library (ex.: OL45804W)
   * @returns {Promise<{type: string, content: Array}>}
   */
  getRecommendations: async (bookId) => {
    const response = await api.get(`/recommendations/${encodeURIComponent(bookId)}`)
    return response.data
  },

  /**
   * Busca os detalhes de um livro pelo id da Open Library.
   * @param {string} bookId ID da Open Library
   * @returns {Promise<{type: string, content: object}>}
   */
  getBook: async (bookId) => {
    const response = await api.get(`/book/${encodeURIComponent(bookId)}`)
    return response.data
  },
}
