'use client';

import { useActionState } from 'react';
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
          ? 'rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
          : 'rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60'
      }
    >
      {pending ? 'Un momento...' : texto}
    </button>
  );
}

/**
 * Boton de reservar o de liberar plaza. Ambos comparten el manejo de estado,
 * que es lo unico que necesita ser cliente en toda la pagina de detalle.
 */
export function ReservarBoton({
  accion,
  texto,
  campos,
  destructivo,
}: {
  accion: Accion;
  texto: string;
  campos: Record<string, string>;
  destructivo?: boolean;
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  return (
    <div>
      <form action={formAction}>
        {Object.entries(campos).map(([nombre, valor]) => (
          <input key={nombre} type="hidden" name={nombre} value={valor} />
        ))}
        <Boton texto={texto} destructivo={destructivo} />
      </form>

      {estado && 'error' in estado && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {estado.error}
        </p>
      )}

      {estado && 'ok' in estado && (
        <p
          role="status"
          className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        >
          {estado.mensaje ?? 'Hecho.'}
        </p>
      )}
    </div>
  );
}
