'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';

import type { EstadoAccion } from '@/lib/acciones';
import { COMENTARIO_MAXIMO } from '@/modules/blog/politica';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Enviar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
    >
      {pending ? 'Publicando...' : 'Comentar'}
    </button>
  );
}

export function ComentarForm({
  accion,
  postId,
  slug,
}: {
  accion: Accion;
  postId: string;
  slug: string;
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Vacia el campo cuando el comentario se ha publicado: dejarlo escrito
  // invita a enviarlo otra vez sin querer.
  useEffect(() => {
    if (estado && 'ok' in estado) formRef.current?.reset();
  }, [estado]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />

      <label htmlFor="comentario" className="sr-only">
        Tu comentario
      </label>
      <textarea
        id="comentario"
        name="body"
        rows={3}
        required
        maxLength={COMENTARIO_MAXIMO}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        placeholder="Escribe un comentario..."
      />

      {estado && 'error' in estado && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {estado.error}
        </p>
      )}

      <Enviar />
    </form>
  );
}
