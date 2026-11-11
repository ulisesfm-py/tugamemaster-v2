'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button, Campo, CLASE_CONTROL } from '@/components/ui';
import { loEscrito, type EstadoAccion } from '@/lib/acciones';
import {
  CONTENIDO_MAXIMO,
  RESUMEN_MAXIMO,
  TITULO_MAXIMO,
  TITULO_MINIMO,
} from '@/modules/blog/politica';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

const FORMATO_DE_EJEMPLO = `## Título de sección
### Subtítulo

Un párrafo con **negrita** y un [enlace a la web](/partidas).
Un salto de línea simple se respeta.

- Elemento de lista
- Otro elemento

1. Primer paso
2. Segundo paso

> Consejo: un recuadro destacado (también Nota: y Ojo:)

---

![Texto alternativo](/blog/guia/reservar.webp "Pie de foto opcional")

@[video](https://youtu.be/XXXXXXXXXXX "Pie opcional")
@[video](/blog/guia/reservar.mp4)`;

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

  // Un articulo son parrafos, no un campo: perderlos por un titulo corto es
  // perder el trabajo de una tarde.
  const { texto } = loEscrito(estado);

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
          defaultValue={texto('title', valores?.title ?? '')}
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
          defaultValue={texto('excerpt', valores?.excerpt ?? '')}
          className={CLASE_CONTROL}
          placeholder="Lo que se lee en el listado. Si lo dejas en blanco, se usan las primeras líneas."
        />
      </Campo>

      <Campo
        id="content"
        etiqueta="Artículo"
        ayuda="Se respetan los saltos de línea. No se interpreta HTML ni Markdown: solo el formato de la guía de abajo."
      >
        <textarea
          id="content"
          name="content"
          rows={18}
          required
          maxLength={CONTENIDO_MAXIMO}
          defaultValue={texto('content', valores?.content ?? '')}
          className={`${CLASE_CONTROL} font-mono`}
        />
      </Campo>

      <details className="border-border bg-card rounded-sm border p-4 text-sm">
        <summary className="text-foreground cursor-pointer font-medium">
          Cómo dar formato al artículo
        </summary>
        <pre className="text-muted-foreground mt-3 overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {FORMATO_DE_EJEMPLO}
        </pre>
        <p className="text-muted-foreground mt-3 text-xs">
          Imágenes y clips van en la carpeta <code>public/blog/</code> del proyecto (sin
          puntos en el nombre salvo el de la extensión). Los vídeos de YouTube se pegan
          con su enlace normal. Cualquier otra dirección se rechaza al guardar.
        </p>
      </details>

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
