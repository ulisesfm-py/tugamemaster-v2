'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import type { EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Boton({ gustado, total }: { gustado: boolean; total: number }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={gustado}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition disabled:opacity-60 ${
        gustado
          ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300'
          : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      <span aria-hidden>{gustado ? '♥' : '♡'}</span>
      {/* El numero va fuera del texto accesible del estado para que un lector
          de pantalla anuncie "Me gusta, pulsado" y despues la cuenta. */}
      <span>{gustado ? 'Te gusta' : 'Me gusta'}</span>
      <span className="text-slate-500 dark:text-slate-400">{total}</span>
    </button>
  );
}

/** Da o quita el like de un artículo. */
export function BotonLike({
  accion,
  postId,
  slug,
  gustado,
  total,
}: {
  accion: Accion;
  postId: string;
  slug: string;
  gustado: boolean;
  total: number;
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="slug" value={slug} />
        <Boton gustado={gustado} total={total} />
      </form>

      {estado && 'error' in estado && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
          {estado.error}
        </p>
      )}
    </div>
  );
}
