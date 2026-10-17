import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getBearerToken, verifyToken } from '@/lib/jwt'

export const REFRESH_COOKIE = 'alexandria_refresh'

/**
 * Resolve o usuário autenticado a partir do header Authorization.
 * @returns {Promise<object|null>} Usuário ou null
 */
export async function getSessionUser(request) {
  const token = getBearerToken(request)
  if (!token) return null

  const payload = await verifyToken(token, 'access')
  if (!payload?.sub) return null

  const user = await prisma.user.findUnique({
    where: { id: Number(payload.sub) },
    select: {
      id: true,
      email: true,
      profilePicUrl: true,
      planStatus: true,
    },
  })
  return user ?? null
}

/** Lê o refresh token do cookie httpOnly. */
export function getRefreshCookie(request) {
  const cookie = request.cookies?.get(REFRESH_COOKIE)?.value
  return cookie ?? null
}

/** Anexa o cookie httpOnly do refresh token a uma resposta. */
export function setRefreshCookie(response, token) {
  response.cookies.set(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  })
  return response
}

/** Limpa o cookie do refresh token. */
export function clearRefreshCookie(response) {
  response.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth',
    maxAge: 0,
  })
  return response
}

/** Formata a resposta pública de um usuário. */
export function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    profile_pic_url: user.profilePicUrl,
    plan_status: user.planStatus,
  }
}

/** Resposta de erro padronizada. */
export function errorResponse(message, status = 500) {
  return NextResponse.json({ error: message }, { status })
}
