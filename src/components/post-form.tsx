'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button, Campo, CLASE_CONTROL } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';
import {
  CONTENIDO_MAXIMO,
  RESUMEN_MAXIMO,
  TITULO_MAXIMO,
  TITULO_MINIMO,
} from '@/modules/blog/politica';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Guardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" tamano="lg" disabled={pending}>
      {pending ? 'Guardando…' : texto}
    </Button>
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
    <form action={formAction} className="flex flex-col gap-4">
      {valores && <input type="hidden" name="postId" value={valores.id} />}

      <Campo
        id="title"
        etiqueta="Título"
        ayuda={
          valores
            ? undefined
            : 'La dirección del artículo se genera del título y ya no cambia, así que los enlaces que compartas seguirán funcionando aunque lo retoques.'
        }
      >
        <input
          id="title"
          name="title"
          defaultValue={valores?.title ?? ''}
          required
          minLength={TITULO_MINIMO}
          maxLength={TITULO_MAXIMO}
          className={CLASE_CONTROL}
          placeholder="Cómo preparar tu primera partida como game master"
        />
      </Campo>

      <Campo id="excerpt" etiqueta="Resumen" opcional>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          maxLength={RESUMEN_MAXIMO}
          defaultValue={valores?.excerpt ?? ''}
          className={CLASE_CONTROL}
          placeholder="Lo que se lee en el listado. Si lo dejas en blanco, se usan las primeras líneas."
        />
      </Campo>

      <Campo
        id="content"
        etiqueta="Artículo"
        ayuda="Texto plano: se respetan los saltos de línea, pero no se interpreta ni HTML ni Markdown."
      >
        <textarea
          id="content"
          name="content"
          rows={18}
          required
          maxLength={CONTENIDO_MAXIMO}
          defaultValue={valores?.content ?? ''}
          className={`${CLASE_CONTROL} font-mono`}
        />
      </Campo>

      {estado && 'error' in estado && <Aviso tono="error">{estado.error}</Aviso>}
      {estado && 'ok' in estado && (
        <Aviso tono="exito">{estado.mensaje ?? 'Guardado.'}</Aviso>
      )}

      <div>
        <Guardar texto={textoBoton} />
      </div>
    </form>
  );
}
