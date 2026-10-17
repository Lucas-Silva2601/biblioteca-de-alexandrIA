import { NextResponse } from 'next/server'

import { errorResponse, getSessionUser, serializeUser } from '@/lib/auth'

export async function GET(request) {
  try {
    const user = await getSessionUser(request)
    if (!user) return errorResponse('Não autenticado', 401)

    return NextResponse.json({ user: serializeUser(user) })
  } catch (error) {
    console.error('[auth/me]', error)
    return errorResponse('Erro ao buscar usuário', 500)
  }
}
