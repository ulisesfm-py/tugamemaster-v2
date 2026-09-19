import { Pool } from 'pg';

/**
 * Acceso a la base de datos para las pruebas de extremo a extremo.
 *
 * Se usa SQL directo y no el cliente de Prisma por dos motivos. El generado
 * lleva `server-only`, que existe justamente para reventar si se importa fuera
 * de un componente de servidor; y el cargador de Playwright no sabe ejecutarlo
 * (lo compila a CommonJS y despues lo carga como modulo ES).
 *
 * El precio es tener las tablas escritas a mano aqui. Si alguna columna cambia
 * de nombre, estas pruebas fallan: es ruidoso, pero se ve enseguida.
 */

const connectionString = process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error(
    'Las pruebas E2E necesitan DIRECT_URL o DATABASE_URL. Revisa .env.local.',
  );
}

const pool = new Pool({ connectionString, max: 4 });

export async function consultar<T extends Record<string, unknown>>(
  sql: string,
  valores: unknown[] = [],
): Promise<T[]> {
  const resultado = await pool.query(sql, valores);
  return resultado.rows as T[];
}

/** Una sola fila, o error si no hay ninguna. */
export async function unaFila<T extends Record<string, unknown>>(
  sql: string,
  valores: unknown[] = [],
): Promise<T> {
  const filas = await consultar<T>(sql, valores);
  const fila = filas[0];

  if (!fila) throw new Error(`La consulta no devolvio ninguna fila: ${sql}`);

  return fila;
}

export async function cerrarConexiones(): Promise<void> {
  await pool.end();
}
