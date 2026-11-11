import { db } from '@/lib/db';
import { limpiarLimites } from '@/modules/limites/service';
import { pedirResenas, recordarPartidas } from '@/modules/notifications/tareas';
import { cerrarPartidas, pagarGms } from '@/modules/payments/payouts';
import { limpiarHilos } from '@/modules/threads/tareas';

/**
 * Tareas diarias.
 *
 * Un unico endpoint que ejecuta todas las tareas en orden. Se invoca por HTTP
 * con un secreto compartido y sin usar ninguna API propietaria del proveedor
 * de hosting: cambiar de disparador (cron de Vercel, GitHub Actions, QStash)
 * no debe requerir tocar nada de aqui.
 *
 * Cada tarea deja traza en `ScheduledJob`. El estado vive en la base de datos,
 * no en un fichero en disco como el celerybeat de la v1.
 */

/**
 * Tareas a ejecutar, en orden.
 *
 * Cerrar partidas va primero porque las demas dependen de ello: pagar al GM
 * exige la partida cerrada, y pedir resena exige la reserva en COMPLETED, que
 * es lo que pone el cierre. Pedir resena el mismo dia que se cierra la partida
 * es justo cuando el recuerdo esta fresco.
 */
const TAREAS = [
  { nombre: 'cerrar-partidas', ejecutar: cerrarPartidas },
  { nombre: 'pagar-gms', ejecutar: pagarGms },
  { nombre: 'recordar-partidas', ejecutar: recordarPartidas },
  { nombre: 'pedir-resenas', ejecutar: pedirResenas },
  // La ultima porque no la necesita nadie: solo recoge hilos que ya estaban
  // cerrados para sus mesas, asi que puede esperar a que pase lo que importa.
  { nombre: 'limpiar-hilos', ejecutar: limpiarHilos },
  // Contadores de intentos de acceso cuya ventana ya vencio. Sin prisa: solo
  // evitan que la tabla crezca.
  { nombre: 'limpiar-limites', ejecutar: limpiarLimites },
] as const;

async function ejecutarTareas(): Promise<Response> {
  const resumen: Record<string, unknown> = {};

  for (const tarea of TAREAS) {
    const registro = await db.scheduledJob.create({
      data: { name: tarea.nombre, status: 'RUNNING' },
      select: { id: true },
    });

    try {
      const resultado = await tarea.ejecutar();

      await db.scheduledJob.update({
        where: { id: registro.id },
        data: {
          status: 'SUCCEEDED',
          finishedAt: new Date(),
          itemsProcessed: resultado.procesadas,
        },
      });

      resumen[tarea.nombre] = resultado;
    } catch (error) {
      await db.scheduledJob.update({
        where: { id: registro.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          error: (error as Error).message.slice(0, 1000),
        },
      });

      // Una tarea que falla no debe impedir que corran las siguientes: son
      // independientes entre si.
      console.error(`Tarea ${tarea.nombre} fallo:`, error);
      resumen[tarea.nombre] = { error: (error as Error).message };
    }
  }

  return Response.json({ ok: true, resumen });
}

/**
 * Comprueba el secreto compartido.
 *
 * Sin el, cualquiera podria disparar las transferencias a los GMs.
 */
function autorizado(request: Request): boolean {
  const esperado = process.env['CRON_SECRET'];
  if (!esperado) return false;

  const cabecera = request.headers.get('authorization');
  return cabecera === `Bearer ${esperado}`;
}

export async function GET(request: Request): Promise<Response> {
  if (!process.env['CRON_SECRET']) {
    console.error('Cron invocado sin CRON_SECRET configurado');
    return new Response('Cron no configurado', { status: 500 });
  }

  if (!autorizado(request)) {
    return new Response('No autorizado', { status: 401 });
  }

  return ejecutarTareas();
}

// El cron de Vercel usa GET; se admite POST para cualquier otro disparador.
export const POST = GET;
