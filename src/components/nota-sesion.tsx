'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button, CLASE_CONTROL } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';
import { NOTA_MAXIMA, NOTA_MINIMA } from '@/modules/campaigns/politica';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Guardar() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar nota'}
    </Button>
  );
}

/**
 * Nota de donde quedo la sesion: niveles, vida, acontecimientos, localizacion.
 *
 * Sirve de recordatorio para la mesa y de plantilla para montar la siguiente
 * sesion. Solo la ven el GM y quienes jugaron.
 */
export function NotaSesion({
  gameId,
  accion,
  contenido,
}: {
  gameId: string;
  accion: Accion;
  contenido: string | null;
}) {
  const [abierto, setAbierto] = useState(contenido === null);
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  if (!abierto) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="border-border bg-card text-muted-foreground w-full rounded-sm border p-4 text-sm whitespace-pre-line">
          {contenido}
        </p>
        <Button
          type="button"
          variante="enlace"
          tamano="sm"
          onClick={() => setAbierto(true)}
        >
          Editar la nota
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="gameId" value={gameId} />

      <label
        htmlFor={`nota-${gameId}`}
        className="text-foreground block text-sm font-medium"
      >
        ¿Dónde quedó la sesión?
      </label>
      <textarea
        id={`nota-${gameId}`}
        name="content"
        rows={6}
        required
        minLength={NOTA_MINIMA}
        maxLength={NOTA_MAXIMA}
        defaultValue={contenido ?? ''}
        className={CLASE_CONTROL}
        placeholder="Niveles y puntos de vida, dónde se quedaron, qué pasó, qué tienen pendiente…"
      />
      <p className="text-muted-foreground text-xs">
        La verán quienes jugaron esta sesión. No es pública: cuenta lo que hicieron sus
        personajes.
      </p>

      {estado && 'error' in estado && <Aviso tono="error">{estado.error}</Aviso>}
      {estado && 'ok' in estado && (
        <Aviso tono="exito">{estado.mensaje ?? 'Guardada.'}</Aviso>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Guardar />
        {contenido !== null && (
          <Button type="button" variante="fantasma" onClick={() => setAbierto(false)}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
