'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Boton({
  texto,
  destructivo,
  tamano,
  completo,
}: {
  texto: string;
  destructivo?: boolean;
  tamano: 'sm' | 'md' | 'lg';
  completo?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variante={destructivo ? 'peligro' : 'solido'}
      tamano={tamano}
      disabled={pending}
      className={completo ? 'w-full' : undefined}
    >
      {pending ? 'Un momento…' : texto}
    </Button>
  );
}

/**
 * Boton de reservar o de liberar plaza. Ambos comparten el manejo de estado,
 * que es lo unico que necesita ser cliente en toda la pagina de detalle.
 */
export function ReservarBoton({
  accion,
  texto,
  campos,
  destructivo,
  tamano = 'md',
  completo,
}: {
  accion: Accion;
  texto: string;
  campos: Record<string, string>;
  destructivo?: boolean;
  tamano?: 'sm' | 'md' | 'lg';
  /** Ocupa todo el ancho. Para el panel de reserva, no para una fila de botones. */
  completo?: boolean;
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  return (
    <div>
      <form action={formAction}>
        {Object.entries(campos).map(([nombre, valor]) => (
          <input key={nombre} type="hidden" name={nombre} value={valor} />
        ))}
        <Boton
          texto={texto}
          destructivo={destructivo}
          tamano={tamano}
          completo={completo}
        />
      </form>

      {estado && 'error' in estado && (
        <Aviso tono="error" className="mt-3">
          {estado.error}
        </Aviso>
      )}

      {estado && 'ok' in estado && (
        <Aviso tono="exito" className="mt-3">
          {estado.mensaje ?? 'Hecho.'}
        </Aviso>
      )}
    </div>
  );
}
