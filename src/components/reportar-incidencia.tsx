'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button, CLASE_CONTROL } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Enviar() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Enviando…' : 'Enviar incidencia'}
    </Button>
  );
}

/** Formulario plegado para reclamar sobre una partida ya jugada. */
export function ReportarIncidencia({
  bookingId,
  accion,
}: {
  bookingId: string;
  accion: Accion;
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  if (estado && 'ok' in estado) {
    return <Aviso tono="exito">{estado.mensaje ?? 'Incidencia enviada.'}</Aviso>;
  }

  if (!abierto) {
    return (
      <Button
        type="button"
        variante="enlace"
        tamano="sm"
        onClick={() => setAbierto(true)}
      >
        Algo fue mal con esta partida
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="bookingId" value={bookingId} />

      <label
        htmlFor={`motivo-${bookingId}`}
        className="text-foreground block text-sm font-medium"
      >
        ¿Qué pasó?
      </label>
      <textarea
        id={`motivo-${bookingId}`}
        name="motivo"
        rows={3}
        required
        minLength={20}
        className={CLASE_CONTROL}
        placeholder="Por ejemplo: el game master no apareció y la partida no llegó a jugarse."
      />
      <p className="text-muted-foreground text-xs">
        Lo revisará una persona. Mientras tanto, el pago al game master queda detenido.
      </p>

      {estado && 'error' in estado && <Aviso tono="error">{estado.error}</Aviso>}

      <div className="flex flex-wrap items-center gap-3">
        <Enviar />
        <Button type="button" variante="fantasma" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
