'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import type { EstadoAccion } from '@/lib/acciones';
import {
  CONTENIDO_MAXIMO,
  RESUMEN_MAXIMO,
  TITULO_MAXIMO,
  TITULO_MINIMO,
} from '@/modules/blog/politica';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

const campo =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900';

function Guardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Guardando...' : texto}
    </button>
  );
}

/** Formulario de artículo del blog. Solo lo usan los administradores. */
export function PostForm({
  accion,
  textoBoton,
  valores,
}: {
  accion: Accion;
  textoBoton: string;
  valores?: {
    id: string;
    title: string;
    excerpt: string | null;
    content: string;
  };
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  return (
    <form action={formAction} className="space-y-4">
      {valores && <input type="hidden" name="postId" value={valores.id} />}

      <div>
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Título
        </label>
        <input
          id="title"
          name="title"
          defaultValue={valores?.title ?? ''}
          required
          minLength={TITULO_MINIMO}
          maxLength={TITULO_MAXIMO}
          className={campo}
          placeholder="Cómo preparar tu primera partida como game master"
        />
        {!valores && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            La dirección del artículo se genera del título y ya no cambia, así que los
            enlaces que compartas seguirán funcionando aunque lo retoques.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="excerpt"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Resumen <span className="font-normal text-slate-500">(opcional)</span>
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          maxLength={RESUMEN_MAXIMO}
          defaultValue={valores?.excerpt ?? ''}
          className={campo}
          placeholder="Lo que se lee en el listado. Si lo dejas en blanco, se usan las primeras líneas."
        />
      </div>

      <div>
        <label
          htmlFor="content"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Artículo
        </label>
        <textarea
          id="content"
          name="content"
          rows={18}
          required
          maxLength={CONTENIDO_MAXIMO}
          defaultValue={valores?.content ?? ''}
          className={`${campo} font-mono text-sm`}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Texto plano: se respetan los saltos de línea, pero no se interpreta ni HTML ni
          Markdown.
        </p>
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
          {estado.mensaje ?? 'Guardado.'}
        </p>
      )}

      <Guardar texto={textoBoton} />
    </form>
  );
}
