import { NextResponse } from 'next/server'

import { clearRefreshCookie } from '@/lib/auth'

export async function POST(request) {
  const response = NextResponse.json({ message: 'Logout realizado com sucesso' })
  return clearRefreshCookie(response)
}
