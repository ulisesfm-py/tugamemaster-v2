import 'server-only';

import { createHmac } from 'node:crypto';

import { db } from '@/lib/db';
import { ipDelCliente } from '@/lib/ip';
import type { ResultadoTarea } from '@/modules/notifications/tareas';
import type { Prisma } from '@/generated/prisma/client';

import { CADUCIDAD_FILAS_SEG, veredicto, type Regla, type Veredicto } from './politica';

/**
 * Limite de intentos contra la base de datos.
 *
 * Sin servicios externos: un contador por clave en `RateLimit`, que se
 * actualiza con un unico `INSERT ... ON CONFLICT`. Esa sentencia es atomica,
 * asi que cien peticiones en paralelo suman cien intentos y no se pisan; si
 * se leyera el contador y luego se escribiera, todas verian el mismo numero y
 * el limite no limitaria nada.
 */

type Cliente = Prisma.TransactionClient | typeof db;

/**
 * La clave que se guarda: un HMAC del identificador, no el identificador.
 *
 * Asi la tabla no contiene correos ni IPs en claro, y como el HMAC lleva el
 * secreto de la aplicacion tampoco se pueden recuperar probando las 4.000
 * millones de IPv4 contra un hash sin clave.
 */
function claveDe(regla: Regla, identificador: string): string {
  const huella = createHmac('sha256', process.env['AUTH_SECRET'] ?? '')
    .update(identificador)
    .digest('hex');

  return `${regla.nombre}:${huella}`;
}

/**
 * Cuenta un intento y dice si cabia.
 *
 * Se llama *antes* de comprobar la contrasena, no despues de fallar: si se
 * contara solo el fallo, cien intentos en paralelo pasarian todos la
 * comprobacion antes de que el primero se anotara. Quien acierta reinicia el
 * contador con `reiniciar`.
 */
export async function consumirIntento(
  regla: Regla,
  identificador: string,
  cliente: Cliente = db,
): Promise<Veredicto> {
  const clave = claveDe(regla, identificador);

  // La hora la pone la base de datos, no el servidor de la aplicacion: asi
  // todas las instancias de Vercel miden con el mismo reloj. Las columnas son
  // `timestamp` sin zona, guardadas en UTC.
  const filas = await cliente.$queryRaw<{ count: number; restante: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${clave}, 1, timezone('UTC', now()))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" <= timezone('UTC', now()) - make_interval(secs => ${regla.ventanaSeg}::float8)
        THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimit"."windowStart" <= timezone('UTC', now()) - make_interval(secs => ${regla.ventanaSeg}::float8)
        THEN timezone('UTC', now())
        ELSE "RateLimit"."windowStart"
      END
    RETURNING
      "count",
      extract(epoch FROM (
        "windowStart" + make_interval(secs => ${regla.ventanaSeg}::float8) - timezone('UTC', now())
      ))::float8 AS "restante"
  `;

  const fila = filas[0];

  // El INSERT siempre devuelve una fila. Si no la hubiera, lo prudente es
  // cerrar la puerta, no dejarla abierta.
  if (!fila) return { permitido: false, reintentarEnSeg: regla.ventanaSeg };

  return veredicto(Number(fila.count), regla.max, Number(fila.restante));
}

/**
 * Lo mismo, con la IP de la peticion como identificador. Sin IP conocida
 * (desarrollo local) deja pasar: ver .
 */
export async function consumirIntentoDeIp(
  regla: Regla,
  cabeceras: Headers,
): Promise<Veredicto> {
  const ip = ipDelCliente(cabeceras);
  if (!ip) return { permitido: true, reintentarEnSeg: 0 };

  return consumirIntento(regla, ip);
}

/** Borra el contador de una clave: lo que hace un acierto. */
export async function reiniciar(
  regla: Regla,
  identificador: string,
  cliente: Cliente = db,
): Promise<void> {
  await cliente.rateLimit.deleteMany({ where: { key: claveDe(regla, identificador) } });
}

/** Tarea del cron: borra los contadores cuya ventana vencio hace tiempo. */
export async function limpiarLimites(): Promise<ResultadoTarea> {
  const resultado = await db.$executeRaw`
    DELETE FROM "RateLimit"
    WHERE "windowStart" < timezone('UTC', now()) - make_interval(secs => ${CADUCIDAD_FILAS_SEG}::float8)
  `;

  return { procesadas: resultado, detalles: [] };
}
