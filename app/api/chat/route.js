import { NextResponse } from 'next/server'

import { getSessionUser } from '@/lib/auth'
import { MAX_FILE_SIZE } from '@/lib/constants'
import { processMessage } from '@/lib/server/chat'

export const maxDuration = 60

const SESSION_COOKIE = 'alexandria_session'

export async function POST(request) {
  try {
    const formData = await request.formData().catch(() => null)
    if (!formData) return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })

    const message = formData.get('message') ?? ''
    const file = formData.get('file')

    let filePayload = null
    if (file && typeof file === 'object' && 'arrayBuffer' in file && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Arquivo muito grande (máximo 10MB).' },
          { status: 413 }
        )
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      filePayload = {
        buffer,
        mimetype: file.type || 'application/octet-stream',
        size: file.size,
      }
    }

    // Sessão: usuário autenticado ou anônima via cookie
    const user = await getSessionUser(request)
    const sessionKey = user ? null : (request.cookies?.get(SESSION_COOKIE)?.value ?? null)

    const { response, sessionKey: newSessionKey } = await processMessage({
      message: typeof message === 'string' ? message : '',
      file: filePayload,
      userId: user?.id,
      sessionKey,
    })

    const jsonResponse = NextResponse.json(response)

    // Persiste a sessão anônima em cookie httpOnly
    if (!user && newSessionKey) {
      jsonResponse.cookies.set(SESSION_COOKIE, newSessionKey, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 ano
      })
    }

    return jsonResponse
  } catch (error) {
    console.error('[chat]', error)
    const status = error.status || 500
    return NextResponse.json(
      { type: 'text', content: error.message || 'Erro ao processar sua mensagem.' },
      { status }
    )
  }
}
