'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button, CLASE_CONTROL } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';
import { COMENTARIO_MAXIMO } from '@/modules/blog/politica';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Enviar() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Publicando…' : 'Comentar'}
    </Button>
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
    <form ref={formRef} action={formAction} className="flex flex-col items-start gap-3">
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
        className={CLASE_CONTROL}
        placeholder="Escribe un comentario…"
      />

      {estado && 'error' in estado && (
        <Aviso tono="error" className="w-full">
          {estado.error}
        </Aviso>
      )}

      <Enviar />
    </form>
  );
}
