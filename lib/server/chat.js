import { randomUUID } from 'node:crypto'

import { prisma } from '@/lib/prisma'
import { CHAT_HISTORY_LIMIT, MESSAGE_ROLE_ASSISTANT, MESSAGE_ROLE_USER } from '@/lib/constants'
import { validateAiResponse } from '@/lib/validations'
import {
  cleanJsonResponse,
  generateResponse as generateAiResponse,
} from '@/lib/services/aiService'
import { searchBook } from '@/lib/services/bookService'
import { transcribeAudio, AUDIO_UNAVAILABLE_MESSAGE } from '@/lib/services/speechService'

/**
 * Orquestra o fluxo do chat (port da lógica do ChatService do Flask).
 * Módulo de SERVIDOR: importa Prisma e só pode ser usado em app/api/*.
 */

/**
 * Obtém ou cria uma sessão de chat.
 * @param {object} options
 * @param {number} [options.userId] ID do usuário autenticado
 * @param {string} [options.sessionKey] Chave da sessão anônima
 */
export async function getOrCreateSession({ userId, sessionKey }) {
  if (userId) {
    const existing = await prisma.chatSession.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    if (existing) return existing
    return prisma.chatSession.create({ data: { userId } })
  }

  if (sessionKey) {
    const existing = await prisma.chatSession.findUnique({ where: { sessionKey } })
    if (existing) return existing
    return prisma.chatSession.create({ data: { sessionKey } })
  }

  // Cria sessão anônima nova
  return prisma.chatSession.create({ data: { sessionKey: randomUUID() } })
}

/**
 * Processa uma mensagem do usuário e retorna a resposta da IA.
 *
 * @param {object} params
 * @param {string} params.message Texto da mensagem
 * @param {{ buffer: Buffer, mimetype: string, size: number }|null} [params.file] Arquivo opcional
 * @param {number} [params.userId] ID do usuário (se autenticado)
 * @param {string} [params.sessionKey] Chave da sessão anônima
 * @returns {Promise<{response: object, sessionKey: string}>}
 */
export async function processMessage({ message, file = null, userId, sessionKey }) {
  const text = (message || '').trim()
  if (!text && !file) {
    const error = new Error('Mensagem ou arquivo vazio.')
    error.status = 400
    throw error
  }

  const session = await getOrCreateSession({ userId, sessionKey })

  let userMessage = text
  let hasImage = false

  if (file) {
    if (file.mimetype?.startsWith('audio/')) {
      // Transcrição indisponível neste build: responde com aviso amigável
      // em vez de chamar a IA.
      let transcript = null
      try {
        transcript = await transcribeAudio(file.buffer)
      } catch {
        transcript = null
      }

      if (!transcript) {
        return {
          response: { type: 'text', content: AUDIO_UNAVAILABLE_MESSAGE },
          sessionKey: session.sessionKey,
        }
      }

      userMessage = userMessage
        ? `Áudio transcrito: '${transcript}'.\n\n${userMessage}`
        : `Áudio transcrito: '${transcript}'.`
    } else if (
      file.mimetype?.startsWith('image/') ||
      file.mimetype?.startsWith('video/')
    ) {
      hasImage = true
    }
  }

  // Salva a mensagem do usuário
  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: MESSAGE_ROLE_USER, content: userMessage },
  })

  // Recupera o histórico
  const history = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'desc' },
    take: CHAT_HISTORY_LIMIT,
  })

  const formattedHistory = history
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }))

  // Nota a IA sobre a imagem (o app não envia os bytes da imagem ao modelo)
  const promptForAi = hasImage
    ? `${userMessage}\n\n[O usuário enviou uma imagem. Descreva o que você vê ou identifique o livro baseado na descrição fornecida.]`
    : userMessage

  const aiText = await generateAiResponse(promptForAi, formattedHistory)

  const jsonStr = cleanJsonResponse(aiText)
  if (!jsonStr) {
    const error = new Error('Problema ao formatar resposta da IA.')
    error.status = 502
    throw error
  }

  let parsed
  try {
    parsed = validateAiResponse(JSON.parse(jsonStr))
  } catch (err) {
    const error = new Error(`Erro ao validar resposta da IA: ${err.message}`)
    error.status = 502
    throw error
  }

  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: MESSAGE_ROLE_ASSISTANT,
      content: JSON.stringify(parsed),
    },
  })

  // Se identificou um livro, busca os detalhes na Open Library
  if (parsed.type === 'book' && parsed.content) {
    const bookTitle = parsed.content.title
    const bookAuthor = parsed.content.author || ''

    if (bookTitle) {
      const searchQuery = `${bookTitle} ${bookAuthor}`.trim()
      const bookDetails = await searchBook(searchQuery).catch(() => null)

      if (bookDetails) {
        const enriched = { type: 'book', content: bookDetails }
        await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: MESSAGE_ROLE_ASSISTANT,
            content: JSON.stringify(enriched),
          },
        })
        return { response: enriched, sessionKey: session.sessionKey }
      }

      const notFound = {
        type: 'text',
        content: `Pensei que fosse '${bookTitle}', mas não encontrei detalhes. Pode me dar mais informações?`,
      }
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: MESSAGE_ROLE_ASSISTANT,
          content: JSON.stringify(notFound),
        },
      })
      return { response: notFound, sessionKey: session.sessionKey }
    }
  }

  return { response: parsed, sessionKey: session.sessionKey }
}
