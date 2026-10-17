import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/prisma'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import {
  errorResponse,
  serializeUser,
  setRefreshCookie,
} from '@/lib/auth'

export async function POST(request) {
  try {
    const data = await request.json().catch(() => null)
    if (!data) return errorResponse('No data provided', 400)

    const email = String(data.email || '').trim().toLowerCase()
    const password = String(data.password || '')

    if (!email || !password) {
      return errorResponse('Email e senha são obrigatórios', 400)
    }
    if (password.length < 6) {
      return errorResponse('A senha deve ter pelo menos 6 caracteres', 400)
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return errorResponse('Este email já está registrado', 409)

    const username = email.split('@')[0]
    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profilePicUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
      },
    })

    const token = await signAccessToken(user.id)
    const refreshToken = await signRefreshToken(user.id)

    const response = NextResponse.json(
      {
        message: 'Conta criada com sucesso',
        token,
        user: serializeUser(user),
      },
      { status: 201 }
    )
    return setRefreshCookie(response, refreshToken)
  } catch (error) {
    console.error('[auth/register]', error)
    return errorResponse('Erro interno ao registrar', 500)
  }
}
