/**
 * Serviço de transcrição de áudio.
 *
 * A transcrição via Google Cloud Speech-to-Text foi removida do build
 * (dependência pesada e exige credenciais do Google Cloud, que não são
 * parte do projeto). Enviar áudio retorna uma mensagem amigável pedindo
 * para o usuário digitar.
 *
 * Para reativar: instale `@google-cloud/speech`, configure
 * GOOGLE_APPLICATION_CREDENTIALS e implemente `transcribeAudio` abaixo.
 */

/** Verifica se o serviço está configurado (neste build, nunca). */
export function isConfigured() {
  return false
}

/**
 * "Transcreve" áudio — indisponível neste build.
 * @param {Buffer} _audioBuffer Conteúdo bruto do áudio
 * @returns {Promise<null>} Sempre null (transcrição indisponível)
 */
export async function transcribeAudio(_audioBuffer) {
  return null
}

/** Mensagem amigável quando o usuário envia áudio. */
export const AUDIO_UNAVAILABLE_MESSAGE =
  'No momento não consigo transcrever áudio. Pode digitar sua mensagem? Assim consigo te ajudar a encontrar livros e recomendações. 📚'
