import 'server-only';

import { db } from '@/lib/db';
import type { ResultadoTarea } from '@/modules/notifications/tareas';

import { DIAS_DE_VIDA } from './politica';

/**
 * Limpieza de los hilos ya cerrados.
 *
 * Un hilo deja de estar abierto el dia que le toca, lo haya barrido ya el cron
 * o no: la puerta la cierra `politica.ts`, y esto solo recoge lo que queda
 * detras. Por eso da igual que el job corra a las cuatro o a las cinco, y da
 * igual que un dia no corra.
 *
 * Se borra de verdad, y no se marca: una conversacion privada que ya nadie
 * puede leer no tiene por que seguir guardada. Las marcas de lectura se van
 * con ella —son de ese hilo y de nadie mas.
 */

/** Tope por ejecucion, para no agotar el tiempo de la funcion. */
const LOTE = 200;

export async function limpiarHilos(ahora = new Date()): Promise<ResultadoTarea> {
  const limite = new Date(ahora.getTime() - DIAS_DE_VIDA * 86_400_000);

  const partidas = await db.game.findMany({
    where: {
      endsAt: { lt: limite },
      threadMessages: { some: {} },
    },
    take: LOTE,
    select: { id: true, title: true },
  });

  const detalles: string[] = [];

  for (const partida of partidas) {
    const { count } = await db.threadMessage.deleteMany({
      where: { gameId: partida.id },
    });
    await db.threadRead.deleteMany({ where: { gameId: partida.id } });

    detalles.push(`${partida.title}: ${count} mensajes`);
  }

  return { procesadas: partidas.length, detalles };
}
