import { SYSTEM_PROMPT } from '@/lib/constants'

/**
 * Serviço de IA via Ollama Cloud (API REST nativa do Ollama).
 * Usa fetch nativo do Node, sem SDK externo.
 *
 * Docs: https://docs.ollama.com/api/introduction
 *   POST https://ollama.com/api/chat
 *   Authorization: Bearer <OLLAMA_API_KEY>
 */

const OLLAMA_URL = process.env.OLLAMA_API_URL || 'https://ollama.com/api/chat'
const MODEL = process.env.OLLAMA_MODEL || 'gemma4:31b-cloud'

/** Verifica se o serviço está configurado. */
export function isConfigured() {
  return Boolean(process.env.OLLAMA_API_KEY)
}

/**
 * Gera uma resposta da IA.
 * @param {string} userMessage Mensagem do usuário
 * @param {Array} chatHistory Histórico [{role, content}]
 * @returns {Promise<string>} Resposta em JSON (string)
 */
export async function generateResponse(userMessage, chatHistory = []) {
  if (!isConfigured()) {
    throw new Error(
      '⚠️ API do Ollama Cloud não configurada. Adicione sua OLLAMA_API_KEY no arquivo .env. ' +
        'Obtenha sua chave em: https://ollama.com/settings/keys'
    )
  }

  const messages = [{ role: 'system', content: SYSTEM_PROMPT }]

  // Últimas 6 mensagens do histórico
  for (const message of chatHistory.slice(-6)) {
    if (message.role === 'user') {
      messages.push({ role: 'user', content: String(message.content) })
    } else if (message.role === 'assistant') {
      // O conteúdo salvo pode ser JSON stringificado
      messages.push({ role: 'assistant', content: String(message.content) })
    }
  }

  messages.push({ role: 'user', content: userMessage })

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      options: { temperature: 0.7, num_predict: 2048 },
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Erro na API do Ollama Cloud (${response.status}): ${detail}`)
  }

  const data = await response.json()
  const content = data?.message?.content
  if (!content) throw new Error('Resposta vazia da API do Ollama Cloud.')
  return content.trim()
}

/**
 * Extrai e valida um JSON de uma string (port de clean_json_response).
 * @param {string} text Texto que pode conter JSON
 * @returns {string|null} JSON válido ou null
 */
export function cleanJsonResponse(text) {
  if (typeof text !== 'string') return null

  let cleaned = text
  if (cleaned.includes('```json')) {
    cleaned = cleaned.split('```json')[1].trim()
  }
  if (cleaned.includes('```')) {
    cleaned = cleaned.split('```')[0].trim()
  }

  const start = cleaned.indexOf('{')
  if (start === -1) return null

  let openBraces = 0
  let endIndex = -1
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === '{') openBraces++
    else if (cleaned[i] === '}') {
      openBraces--
      if (openBraces === 0) {
        endIndex = i
        break
      }
    }
  }

  if (endIndex === -1) return null

  const candidate = cleaned.slice(start, endIndex + 1)
  try {
    JSON.parse(candidate) // valida
    return candidate
  } catch {
    return null
  }
}
