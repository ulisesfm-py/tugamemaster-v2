'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import type { EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Enviar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
    >
      {pending ? 'Enviando...' : 'Enviar incidencia'}
    </button>
  );
}

/** Formulario plegado para reclamar sobre una partida ya jugada. */
export function ReportarIncidencia({
  bookingId,
  accion,
}: {
  bookingId: string;
  accion: Accion;
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  if (estado && 'ok' in estado) {
    return (
      <p
        role="status"
        className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      >
        {estado.mensaje ?? 'Incidencia enviada.'}
      </p>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-sm text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
      >
        Algo fue mal con esta partida
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />

      <label
        htmlFor={`motivo-${bookingId}`}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        ¿Qué pasó?
      </label>
      <textarea
        id={`motivo-${bookingId}`}
        name="motivo"
        rows={3}
        required
        minLength={20}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        placeholder="Por ejemplo: el game master no apareció y la partida no llegó a jugarse."
      />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Lo revisará una persona. Mientras tanto, el pago al game master queda detenido.
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
        <Enviar />
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
