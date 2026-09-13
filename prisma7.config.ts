import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Next.js carga `.env.local` por su cuenta, pero el CLI de Prisma no.
// Cargamos primero `.env.local` (valores reales, ignorado por git) y luego
// `.env` como respaldo; dotenv nunca sobrescribe lo ya definido.
loadEnv({ path: '.env.local' });
loadEnv();

// Las migraciones necesitan una conexion directa: el pooler de Neon trabaja
// en modo transaccion y no admite las sentencias que ejecuta el motor de
// migraciones. El runtime, en cambio, usa la pooled (ver src/lib/db.ts).
const directUrl = process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'];

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: directUrl,
  },
});
