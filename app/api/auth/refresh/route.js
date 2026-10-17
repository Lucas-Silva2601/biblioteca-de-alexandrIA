import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { signAccessToken, verifyToken } from '@/lib/jwt'
import { errorResponse, getRefreshCookie, setRefreshCookie } from '@/lib/auth'

export async function POST(request) {
  try {
    const refreshToken = getRefreshCookie(request)
    if (!refreshToken) return errorResponse('Refresh token ausente', 401)

    const payload = await verifyToken(refreshToken, 'refresh')
    if (!payload?.sub) return errorResponse('Refresh token inválido', 401)

    const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } })
    if (!user) return errorResponse('Usuário não encontrado', 401)

    const token = await signAccessToken(user.id)
    const response = NextResponse.json({ token })
    return setRefreshCookie(response, refreshToken)
  } catch (error) {
    console.error('[auth/refresh]', error)
    return errorResponse('Erro ao renovar token', 500)
  }
}
