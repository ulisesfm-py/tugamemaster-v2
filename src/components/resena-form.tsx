'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button, CLASE_CONTROL } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';
import { COMENTARIO_MAXIMO, RATING_MAXIMO } from '@/modules/reviews/politica';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

const ESTRELLAS = Array.from({ length: RATING_MAXIMO }, (_, i) => i + 1);

/**
 * Selector de estrellas.
 *
 * Son radios de verdad, no botones: asi se navegan con las flechas, se envian
 * con el formulario sin JavaScript de por medio y un lector de pantalla lee
 * "3 estrellas" en vez de cinco simbolos sueltos.
 */
function SelectorEstrellas({ id, inicial }: { id: string; inicial: number }) {
  const [valor, setValor] = useState(inicial);

  return (
    <fieldset>
      <legend className="text-foreground text-sm font-medium">Tu valoración</legend>

      <div className="mt-1 flex gap-1">
        {ESTRELLAS.map((n) => (
          <label key={n} className="cursor-pointer">
            <input
              type="radio"
              name="rating"
              value={n}
              required
              checked={valor === n}
              onChange={() => setValor(n)}
              className="peer sr-only"
              aria-describedby={id}
            />
            <span
              aria-hidden
              className={`peer-focus-visible:outline-ring rounded text-2xl leading-none transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${
                n <= valor ? 'text-accent' : 'text-border'
              }`}
            >
              ★
            </span>
            <span className="sr-only">
              {n} {n === 1 ? 'estrella' : 'estrellas'}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Enviar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Enviando…' : texto}
    </Button>
  );
}

type Props = {
  accion: Accion;
  /** Nombre del game master, para que el jugador sepa a quien valora. */
  gmNombre: string;
  gmSlug: string;
  /** Campos ocultos: `bookingId` al crear, `reviewId` al corregir. */
  campos: Record<string, string>;
  /** Valores actuales cuando se esta corrigiendo una resena ya escrita. */
  inicial?: { rating: number; comment: string | null };
};

/** Formulario plegado para valorar al game master de una partida ya jugada. */
export function ResenaForm({ accion, gmNombre, gmSlug, campos, inicial }: Props) {
  const editando = inicial !== undefined;
  const [abierto, setAbierto] = useState(false);
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  const idAyuda = `ayuda-${Object.values(campos).join('-')}`;

  if (estado && 'ok' in estado) {
    return <Aviso tono="exito">{estado.mensaje ?? 'Valoración guardada.'}</Aviso>;
  }

  if (!abierto) {
    return (
      <Button
        type="button"
        variante="enlace"
        tamano="sm"
        onClick={() => setAbierto(true)}
      >
        {editando ? 'Corregir mi valoración' : `Valorar a ${gmNombre}`}
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {Object.entries(campos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}
      <input type="hidden" name="gmSlug" value={gmSlug} />

      <SelectorEstrellas id={idAyuda} inicial={inicial?.rating ?? 0} />

      <label
        htmlFor={`${idAyuda}-comentario`}
        className="text-foreground block text-sm font-medium"
      >
        Comentario <span className="text-muted-foreground font-normal">(opcional)</span>
      </label>
      <textarea
        id={`${idAyuda}-comentario`}
        name="comment"
        rows={3}
        maxLength={COMENTARIO_MAXIMO}
        defaultValue={inicial?.comment ?? ''}
        className={CLASE_CONTROL}
        placeholder="¿Cómo estuvo la partida? Lo verá quien se plantee reservar con este game master."
      />

      <p id={idAyuda} className="text-muted-foreground text-xs">
        Se publicará en el perfil de {gmNombre} con tu nombre. Si lo que pasó fue un
        problema serio, abre una incidencia en vez de valorar.
      </p>

      {estado && 'error' in estado && <Aviso tono="error">{estado.error}</Aviso>}

      <div className="flex flex-wrap items-center gap-3">
        <Enviar texto={editando ? 'Guardar cambios' : 'Publicar valoración'} />
        <Button type="button" variante="fantasma" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
