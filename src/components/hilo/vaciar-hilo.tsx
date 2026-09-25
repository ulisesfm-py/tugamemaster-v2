'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';
import { vaciarHiloAction } from '@/modules/threads/actions';

/**
 * El game master vacia el hilo.
 *
 * Va en dos pasos y aparte del resto, como las demas acciones que no se pueden
 * deshacer: borra lo que han escrito otros, y eso no puede quedar a un clic de
 * distancia del boton de enviar.
 *
 * Vaciar no es cerrar: si alguien vuelve a escribir, el hilo vuelve a existir.
 */
function Confirmar() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" tamano="sm" variante="peligro" disabled={pending}>
      {pending ? 'Vaciando…' : 'Sí, borrar todos los mensajes'}
    </Button>
  );
}

export function VaciarHilo({ gameId, slug }: { gameId: string; slug: string }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(
    vaciarHiloAction,
    null,
  );

  if (estado && 'ok' in estado) {
    return <Aviso tono="exito">{estado.mensaje ?? 'Hilo vaciado.'}</Aviso>;
  }

  return (
    <div className="border-destructive/30 rounded-sm border border-dashed p-4">
      <h2 className="text-foreground text-sm font-semibold">Vaciar el hilo</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Borra todos los mensajes, también los de los demás. No se puede deshacer.
      </p>

      {abierto ? (
        <form action={formAction} className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="gameId" value={gameId} />
          <input type="hidden" name="slug" value={slug} />
          <Confirmar />
          <Button
            type="button"
            tamano="sm"
            variante="perfil"
            onClick={() => setAbierto(false)}
          >
            Dejarlo como está
          </Button>
        </form>
      ) : (
        <Button
          type="button"
          tamano="sm"
          variante="peligro"
          className="mt-3"
          onClick={() => setAbierto(true)}
        >
          Vaciar el hilo
        </Button>
      )}

      {estado && 'error' in estado && (
        <Aviso tono="error" className="mt-3">
          {estado.error}
        </Aviso>
      )}
    </div>
  );
}
