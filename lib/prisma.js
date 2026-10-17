import { PrismaClient } from '@prisma/client'

/**
 * Cliente Prisma compartilhado.
 * Em desenvolvimento o Next.js recarrega os módulos a cada mudança,
 * então guardamos a instância em globalThis para evitar esgotar
 * as conexões do banco.
 */
const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
