'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

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
      <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Tu valoración
      </legend>

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
              className={`rounded text-2xl leading-none transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500 ${
                n <= valor ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700'
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
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
    >
      {pending ? 'Enviando...' : texto}
    </button>
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
    return (
      <p
        role="status"
        className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      >
        {estado.mensaje ?? 'Valoración guardada.'}
      </p>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-sm text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
      >
        {editando ? 'Corregir mi valoración' : `Valorar a ${gmNombre}`}
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {Object.entries(campos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}
      <input type="hidden" name="gmSlug" value={gmSlug} />

      <SelectorEstrellas id={idAyuda} inicial={inicial?.rating ?? 0} />

      <label
        htmlFor={`${idAyuda}-comentario`}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        Comentario <span className="font-normal text-slate-500">(opcional)</span>
      </label>
      <textarea
        id={`${idAyuda}-comentario`}
        name="comment"
        rows={3}
        maxLength={COMENTARIO_MAXIMO}
        defaultValue={inicial?.comment ?? ''}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        placeholder="¿Cómo estuvo la partida? Lo verá quien se plantee reservar con este game master."
      />

      <p id={idAyuda} className="text-xs text-slate-500 dark:text-slate-400">
        Se publicará en el perfil de {gmNombre} con tu nombre. Si lo que pasó fue un
        problema serio, abre una incidencia en vez de valorar.
      </p>

      {estado && 'error' in estado && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {estado.error}
        </p>
      )}

      <div className="flex gap-3">
        <Enviar texto={editando ? 'Guardar cambios' : 'Publicar valoración'} />
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-sm text-slate-500 hover:underline dark:text-slate-400"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
