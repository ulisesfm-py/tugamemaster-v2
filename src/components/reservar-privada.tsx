'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button, Campo, CLASE_CONTROL } from '@/components/ui';
import { loEscrito, type EstadoAccion } from '@/lib/acciones';
import { reservarAction } from '@/modules/bookings/actions';

function Boton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" tamano="lg" disabled={pending} className="w-full">
      {pending ? 'Un momento…' : 'Reservar plaza'}
    </Button>
  );
}

/**
 * Reservar en una partida privada: lo mismo que en una publica, con la
 * contrasena delante.
 *
 * La contrasena se comprueba en el servidor, al reservar. Aqui no se sabe cual
 * es: la pagina publica nunca la recibe.
 */
export function ReservarPrivada({ gameId, slug }: { gameId: string; slug: string }) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(
    reservarAction,
    null,
  );
  const { texto } = loEscrito(estado);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="slug" value={slug} />

      <Campo
        id="contrasena"
        etiqueta="Contraseña de la partida"
        ayuda="Es una partida privada. Te la da el game master."
      >
        <input
          id="contrasena"
          name="contrasena"
          type="text"
          autoComplete="off"
          spellCheck={false}
          defaultValue={texto('contrasena')}
          className={`${CLASE_CONTROL} font-mono`}
        />
      </Campo>

      <Boton />

      {estado && 'error' in estado && <Aviso tono="error">{estado.error}</Aviso>}
      {estado && 'ok' in estado && (
        <Aviso tono="exito">{estado.mensaje ?? 'Plaza confirmada.'}</Aviso>
      )}
    </form>
  );
}
