'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import type { EstadoAccion } from '@/lib/acciones';
import { NOTA_MAXIMA, NOTA_MINIMA } from '@/modules/campaigns/politica';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Guardar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
    >
      {pending ? 'Guardando...' : 'Guardar nota'}
    </button>
  );
}

/**
 * Nota de donde quedo la sesion: niveles, vida, acontecimientos, localizacion.
 *
 * Sirve de recordatorio para la mesa y de plantilla para montar la siguiente
 * sesion. Solo la ven el GM y quienes jugaron.
 */
export function NotaSesion({
  gameId,
  accion,
  contenido,
}: {
  gameId: string;
  accion: Accion;
  contenido: string | null;
}) {
  const [abierto, setAbierto] = useState(contenido === null);
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  if (!abierto) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl border border-slate-200 p-4 text-sm whitespace-pre-line text-slate-700 dark:border-slate-800 dark:text-slate-300">
          {contenido}
        </p>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="text-sm text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
        >
          Editar la nota
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="gameId" value={gameId} />

      <label
        htmlFor={`nota-${gameId}`}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        ¿Dónde quedó la sesión?
      </label>
      <textarea
        id={`nota-${gameId}`}
        name="content"
        rows={6}
        required
        minLength={NOTA_MINIMA}
        maxLength={NOTA_MAXIMA}
        defaultValue={contenido ?? ''}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        placeholder="Niveles y puntos de vida, dónde se quedaron, qué pasó, qué tienen pendiente..."
      />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        La verán quienes jugaron esta sesión. No es pública: cuenta lo que hicieron sus
        personajes.
      </p>

      {estado && 'error' in estado && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {estado.error}
        </p>
      )}

      {estado && 'ok' in estado && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        >
          {estado.mensaje ?? 'Guardada.'}
        </p>
      )}

      <div className="flex gap-3">
        <Guardar />
        {contenido !== null && (
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="text-sm text-slate-500 hover:underline dark:text-slate-400"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
