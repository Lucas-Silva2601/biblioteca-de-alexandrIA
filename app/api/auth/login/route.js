import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/prisma'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { errorResponse, serializeUser, setRefreshCookie } from '@/lib/auth'

export async function POST(request) {
  try {
    const data = await request.json().catch(() => null)
    if (!data) return errorResponse('No data provided', 400)

    const email = String(data.email || '').trim().toLowerCase()
    const password = String(data.password || '')

    if (!email || !password) {
      return errorResponse('Email e senha são obrigatórios', 400)
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return errorResponse('Email ou senha inválidos', 401)
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return errorResponse('Email ou senha inválidos', 401)

    const token = await signAccessToken(user.id)
    const refreshToken = await signRefreshToken(user.id)

    const response = NextResponse.json({
      message: 'Login realizado com sucesso',
      token,
      user: serializeUser(user),
    })
    return setRefreshCookie(response, refreshToken)
  } catch (error) {
    console.error('[auth/login]', error)
    return errorResponse('Erro interno ao autenticar', 500)
  }
}
