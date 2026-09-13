import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/generated/prisma/client';

/**
 * Cliente de Prisma para el runtime de la aplicacion.
 *
 * Usa DATABASE_URL (la conexion *pooled* de Neon). Las migraciones no pasan
 * por aqui: el CLI usa DIRECT_URL, configurada en prisma7.config.ts.
 *
 * En desarrollo, Next.js recarga los modulos en caliente y cada recarga
 * crearia un cliente nuevo hasta agotar las conexiones de la base de datos.
 * Por eso se guarda una unica instancia en globalThis.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env['DATABASE_URL'];

  if (!url) {
    throw new Error(
      'Falta DATABASE_URL. Copia .env.example a .env.local y rellenala; ' +
        'ver docs/environment_setup.md.',
    );
  }

  // Prisma 7 se conecta siempre a traves de un driver adapter.
  const adapter = new PrismaPg({ connectionString: url });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
