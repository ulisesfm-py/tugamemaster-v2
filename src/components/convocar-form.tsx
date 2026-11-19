'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button, Campo, CLASE_CONTROL } from '@/components/ui';
import { loEscrito, type EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Boton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creando la partida…' : 'Fijar la fecha'}
    </Button>
  );
}

/**
 * Fijar la fecha de una mesa flexible.
 *
 * Un solo campo. Lo demas (duracion, plazas, precio) ya esta en la mesa y se
 * copia a la partida. La antelacion minima la comprueba el servidor; el `min`
 * del campo solo evita elegir una fecha que se va a rechazar.
 */
export function ConvocarForm({
  accion,
  convocatoriaId,
  slug,
  fechaMinima,
  horasParaReservar,
}: {
  accion: Accion;
  convocatoriaId: string;
  slug: string;
  /** La primera fecha posible, ya en el formato de `datetime-local`. */
  fechaMinima: string;
  horasParaReservar: number;
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);
  const { texto } = loEscrito(estado);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="convocatoriaId" value={convocatoriaId} />
      <input type="hidden" name="slug" value={slug} />

      <Campo
        id="startsAt"
        etiqueta="Cuándo se juega"
        ayuda={`Se crea la partida y avisamos a quienes se pre-reservaron. Durante ${horasParaReservar} horas solo ellos pueden reservar; después, cualquiera.`}
      >
        <input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          min={fechaMinima}
          defaultValue={texto('startsAt', '')}
          required
          className={`${CLASE_CONTROL} max-w-xs`}
        />
      </Campo>

      {estado && 'error' in estado && <Aviso tono="error">{estado.error}</Aviso>}

      <div>
        <Boton />
      </div>
    </form>
  );
}
