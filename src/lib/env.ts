import 'server-only';

import { z } from 'zod';

/**
 * Variables de entorno del servidor, validadas.
 *
 * La validacion es *perezosa*: se ejecuta la primera vez que se lee `env`, no
 * al importar el modulo. Asi `next build` no se cae en CI, donde no hay
 * secretos, pero cualquier uso real falla de inmediato y con un mensaje claro
 * en vez de propagar un `undefined`.
 */

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'Falta DATABASE_URL'),
  DIRECT_URL: z.string().min(1).optional(),

  AUTH_SECRET: z.string().min(1, 'Falta AUTH_SECRET (genera uno con `npx auth secret`)'),
  AUTH_URL: z.string().url().optional(),

  // Discord es opcional: sin estas dos variables la app arranca y funciona,
  // simplemente no se ofrece el boton de "entrar con Discord".
  AUTH_DISCORD_ID: z.string().min(1).optional(),
  AUTH_DISCORD_SECRET: z.string().min(1).optional(),
});

type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;

  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    const detalle = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');

    throw new Error(
      `Configuracion de entorno invalida:\n${detalle}\n\n` +
        'Copia .env.example a .env.local y rellenalo. ' +
        'Ver docs/environment_setup.md.',
    );
  }

  cached = parsed.data;
  return cached;
}

/** True si Discord esta configurado y se puede ofrecer como forma de entrar. */
export function discordEnabled(): boolean {
  return Boolean(process.env['AUTH_DISCORD_ID'] && process.env['AUTH_DISCORD_SECRET']);
}
