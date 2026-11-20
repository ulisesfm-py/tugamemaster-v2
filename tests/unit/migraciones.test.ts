import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Las migraciones son SQL y nada mas.
 *
 * El 19/11/2026 una migracion generada con `prisma migrate diff > fichero`
 * llevo dentro dos lineas del registro de dotenv («◇ injected env…»), que
 * escribe en la misma salida que el SQL. En local nadie lo noto porque no se
 * aplico contra ninguna base; en produccion tumbo el despliegue (P3018).
 *
 * Esto no valida el SQL —eso solo lo sabe Postgres— pero si caza lo que no
 * puede estar en un fichero de migracion: registros de herramientas y
 * caracteres que no son de SQL fuera de un comentario.
 */

const CARPETA = join(process.cwd(), 'prisma', 'migrations');

const migraciones = readdirSync(CARPETA)
  .filter((nombre) => statSync(join(CARPETA, nombre)).isDirectory())
  .map((nombre) => ({
    nombre,
    sql: readFileSync(join(CARPETA, nombre, 'migration.sql'), 'utf-8'),
  }));

describe('migraciones', () => {
  it('hay migraciones que comprobar', () => {
    expect(migraciones.length).toBeGreaterThan(0);
  });

  it.each(migraciones)('$nombre no lleva registros de herramientas', ({ sql }) => {
    expect(sql).not.toMatch(/injected env|Loaded Prisma config|Prisma schema loaded/);
  });

  it.each(migraciones)(
    '$nombre no tiene símbolos raros fuera de los comentarios',
    ({ sql }) => {
      const codigo = sql
        .split('\n')
        .filter((linea) => !linea.trimStart().startsWith('--'))
        .join('\n');

      // Lo que no sea ASCII imprimible solo puede ir en un texto entre
      // comillas (un valor por defecto, un comentario de columna).
      const sinTextos = codigo.replace(/'(?:[^']|'')*'/g, "''");
      expect(sinTextos).toMatch(/^[\x20-\x7E\t\r\n]*$/);
    },
  );
});
