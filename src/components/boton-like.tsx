'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Boton({ gustado, total }: { gustado: boolean; total: number }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={gustado}
      className={`focus-visible:ring-ring focus-visible:ring-offset-background inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60 ${
        gustado
          ? 'border-primary bg-primary/12 text-primary'
          : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
      }`}
    >
      <span aria-hidden>{gustado ? '♥' : '♡'}</span>
      {/* El numero va fuera del texto accesible del estado para que un lector
          de pantalla anuncie "Me gusta, pulsado" y despues la cuenta. */}
      <span>{gustado ? 'Te gusta' : 'Me gusta'}</span>
      <span className="text-muted-foreground tabular-nums">{total}</span>
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
        <Aviso tono="error" className="mt-3">
          {estado.error}
        </Aviso>
      )}
    </div>
  );
}
