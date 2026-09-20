'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button, CLASE_CONTROL } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Boton({ texto, destructivo }: { texto: string; destructivo?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variante={destructivo ? 'perfil' : 'solido'} disabled={pending}>
      {pending ? 'Un momento…' : texto}
    </Button>
  );
}

/**
 * Resolucion de una incidencia: una nota compartida y dos decisiones.
 *
 * La nota vive en estado del cliente para que las dos acciones la compartan:
 * quien escribe una explicacion y luego decide desestimar no deberia tener que
 * escribirla otra vez.
 */
export function ResolverIncidencia({
  incidentId,
  accionAprobar,
  accionRechazar,
}: {
  incidentId: string;
  accionAprobar: Accion;
  accionRechazar: Accion;
}) {
  const [nota, setNota] = useState('');
  const [estadoAprobar, aprobar] = useActionState<EstadoAccion, FormData>(
    accionAprobar,
    null,
  );
  const [estadoRechazar, rechazar] = useActionState<EstadoAccion, FormData>(
    accionRechazar,
    null,
  );

  const estado = estadoAprobar ?? estadoRechazar;

  return (
    <div className="border-border mt-5 flex flex-col gap-3 border-t pt-5">
      <label
        htmlFor={`nota-${incidentId}`}
        className="text-foreground block text-sm font-medium"
      >
        Nota de resolución
      </label>
      <textarea
        id={`nota-${incidentId}`}
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        rows={2}
        className={CLASE_CONTROL}
        placeholder="Obligatoria al desestimar: el jugador tiene derecho a saber por qué."
      />

      <div className="flex flex-wrap gap-3">
        <form action={aprobar}>
          <input type="hidden" name="incidentId" value={incidentId} />
          <input type="hidden" name="nota" value={nota} />
          <Boton texto="Aprobar y abonar el 100%" />
        </form>

        <form action={rechazar}>
          <input type="hidden" name="incidentId" value={incidentId} />
          <input type="hidden" name="nota" value={nota} />
          <Boton texto="Desestimar" destructivo />
        </form>
      </div>

      {estado && 'error' in estado && <Aviso tono="error">{estado.error}</Aviso>}
      {estado && 'ok' in estado && (
        <Aviso tono="exito">{estado.mensaje ?? 'Hecho.'}</Aviso>
      )}
    </div>
  );
}
