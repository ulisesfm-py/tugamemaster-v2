/**
 * Compilacion en Vercel (`vercel-build` sustituye a `build` alli).
 *
 * Solo el despliegue de **produccion** aplica las migraciones. Un despliegue
 * de prueba (preview) compila y nada mas: nunca debe poder tocar la base de
 * datos real, ni siquiera si alguien le pone por error la cadena de conexion
 * de produccion.
 *
 * Las migraciones van antes de compilar. Si una falla, el despliegue se para
 * y sigue sirviendo la version anterior, que es lo que se quiere. El caso
 * contrario (migracion aplicada y compilacion fallida) deja la version
 * anterior corriendo sobre el esquema nuevo: por eso las migraciones tienen
 * que ser compatibles hacia atras (anadir antes que renombrar o borrar).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function ejecutar(orden) {
  console.log(`> ${orden}`);
  const { status } = spawnSync(orden, { stdio: 'inherit', shell: true });
  if (status !== 0) process.exit(status ?? 1);
}

const entorno = process.env.VERCEL_ENV;

if (entorno === 'production') {
  // El aviso legal es obligatorio (LSSI): no se publica a medio rellenar.
  if (readFileSync('src/lib/titular.ts', 'utf8').includes("'PENDIENTE'")) {
    console.error('Faltan datos del titular en src/lib/titular.ts (quedan PENDIENTE).');
    process.exit(1);
  }
  if (!process.env.DIRECT_URL) {
    console.error('Falta DIRECT_URL: las migraciones necesitan la conexion directa.');
    process.exit(1);
  }
  ejecutar('npx prisma migrate deploy');
} else {
  console.log(`Entorno ${entorno ?? 'desconocido'}: no se aplican migraciones.`);
}

ejecutar('npm run build');
