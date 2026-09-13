'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import type { EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Boton({ texto, destructivo }: { texto: string; destructivo?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        destructivo
          ? 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
          : 'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60'
      }
    >
      {pending ? 'Un momento...' : texto}
    </button>
  );
}

/**
 * Resolucion de una incidencia: una nota compartida y dos decisiones.
 *
 * La nota vive en estado del cliente para que las dos acciones la compartan:
 * quien escribe una explicacion y luego decide desestimar no deberia tener que
 * escribirla otra vez.
 */
export function ResolverIncidencia({
  incidentId,
  accionAprobar,
  accionRechazar,
}: {
  incidentId: string;
  accionAprobar: Accion;
  accionRechazar: Accion;
}) {
  const [nota, setNota] = useState('');
  const [estadoAprobar, aprobar] = useActionState<EstadoAccion, FormData>(
    accionAprobar,
    null,
  );
  const [estadoRechazar, rechazar] = useActionState<EstadoAccion, FormData>(
    accionRechazar,
    null,
  );

  const estado = estadoAprobar ?? estadoRechazar;

  return (
    <div className="mt-5 space-y-3">
      <label
        htmlFor={`nota-${incidentId}`}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        Nota de resolución
      </label>
      <textarea
        id={`nota-${incidentId}`}
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        placeholder="Obligatoria al desestimar: el jugador tiene derecho a saber por qué."
      />

      <div className="flex flex-wrap gap-3">
        <form action={aprobar}>
          <input type="hidden" name="incidentId" value={incidentId} />
          <input type="hidden" name="nota" value={nota} />
          <Boton texto="Aprobar y abonar el 100%" />
        </form>

        <form action={rechazar}>
          <input type="hidden" name="incidentId" value={incidentId} />
          <input type="hidden" name="nota" value={nota} />
          <Boton texto="Desestimar" destructivo />
        </form>
      </div>

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
          {estado.mensaje ?? 'Hecho.'}
        </p>
      )}
    </div>
  );
}
