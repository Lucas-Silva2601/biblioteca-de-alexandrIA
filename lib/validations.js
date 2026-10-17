import { AI_RESPONSE_TYPES } from '@/lib/constants'

/**
 * Valida a estrutura da resposta da IA (port do schemas.py do Flask).
 * Lança Error com mensagem amigável quando inválida.
 */

function validateBookContent(content) {
  if (typeof content !== 'object' || content === null || Array.isArray(content)) {
    throw new Error('Content deve ser um objeto para tipo "book".')
  }
  if (typeof content.title !== 'string' || content.title.length < 1 || content.title.length > 300) {
    throw new Error('Content.title inválido para tipo "book".')
  }
  if (typeof content.author !== 'string' || content.author.length < 1 || content.author.length > 200) {
    throw new Error('Content.author inválido para tipo "book".')
  }
}

function validateRecommendations(content) {
  if (!Array.isArray(content)) {
    throw new Error('Content deve ser uma lista para tipo "recommendations".')
  }
  for (const item of content) {
    if (typeof item !== 'object' || item === null) {
      throw new Error('Item de recomendação inválido.')
    }
    if (typeof item.title !== 'string') {
      throw new Error('Recomendação precisa de "title".')
    }
    if (typeof item.author !== 'string') {
      throw new Error('Recomendação precisa de "author".')
    }
  }
}

/**
 * Valida a resposta da IA retornando o dado validado.
 * @param {unknown} data Objeto parseado do JSON da IA
 * @returns {object} Dado validado
 * @throws {Error} Se a estrutura for inválida
 */
export function validateAiResponse(data) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('Resposta da IA deve ser um objeto JSON.')
  }

  const { type, content } = data

  if (typeof type !== 'string' || !AI_RESPONSE_TYPES.includes(type)) {
    throw new Error(`Tipo de resposta inválido: ${type}`)
  }
  if (content === undefined || content === null) {
    throw new Error('Campo "content" é obrigatório.')
  }

  if (type === 'book') {
    validateBookContent(content)
  } else if (type === 'recommendations') {
    validateRecommendations(content)
  } else if (type === 'text') {
    if (typeof content !== 'string') {
      throw new Error('Content deve ser uma string para tipo "text".')
    }
  }

  return { type, content }
}
