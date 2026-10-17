import { SignJWT, jwtVerify } from 'jose'

/**
 * Geração e verificação de tokens JWT usando `jose` (Web Crypto, sem nativos).
 */

const ACCESS_TOKEN_TTL = '1h'
const REFRESH_TOKEN_TTL = '30d'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error(
      'JWT_SECRET não configurado. Adicione JWT_SECRET no arquivo .env'
    )
  }
  return new TextEncoder().encode(secret)
}

/** Gera um access token (1 hora). */
export async function signAccessToken(userId) {
  return new SignJWT({ sub: String(userId), type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getSecret())
}

/** Gera um refresh token (30 dias). */
export async function signRefreshToken(userId) {
  return new SignJWT({ sub: String(userId), type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(getSecret())
}

/** Verifica um token. Retorna o payload ou null se inválido. */
export async function verifyToken(token, expectedType = 'access') {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (payload.type !== expectedType) return null
    return payload
  } catch {
    return null
  }
}

/** Extrai o token do header Authorization: Bearer <token>. */
export function getBearerToken(request) {
  const header = request.headers.get('authorization')
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token
}
